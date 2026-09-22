# 🤖 AGENT.md: 新游戏/新DLC接入与静态改造实施指引

> **适用对象**：后续接手此项目的 AI Agent 或开发者。  
> **核心使命**：当用户提出“新增一个子游戏/DLC/独立剧本”或“将新的纯静态修仙网页合并接入”时，严格按照本指引进行工程化改造，确保零跨域、零前端Key暴露（去BYOK）、全链路SSE保活传输以及一键独立二进制内嵌打包。

---

## 一、系统架构与演进背景

### 1. 架构演进前（纯静态时代）
* **运行方式**：纯 HTML + CSS + JS 网页，部署在 Nginx、GitHub Pages 或本地双击运行。
* **痛点**：
  1. **CORS 跨域阻断**：浏览器直接 `fetch()` 调用 OpenAI、DeepSeek、Gemini 等 API 必然触发 CORS 报错；
  2. **安全风险 (BYOK)**：用户必须在前端输入 API Key，保存在 `localStorage` 中，容易泄露；
  3. **连接超时**：非流式大模型生成长文本时超过 100 秒易被 Cloudflare 524 中断或浏览器丢弃；
  4. **碎片化**：每个子游戏/DLC各自为政，配置不互通。

### 2. 当前架构（Go Web + 静态嵌入）
```
                       +----------------------------------------+
                       |             用户浏览器                  |
                       |  - 页面 UI / 剧情推进 / 本地存档        |
                       |  - 统一调用同源 /api/* 端点             |
                       |  - 统一监听 SSE 传输 (忽略保活注释)    |
                       +-------------------+--------------------+
                                           | HTTP / 同源请求 (无 CORS)
                                           v
+-----------------------------------------------------------------------------------+
|                        Go 独立 Web 二进制服务 (xiuxian / xiuxian.exe)               |
|                                                                                   |
|  [静态资源托管]                                                                     |
|   - //go:embed all:dist 内嵌前端 HTML/CSS/JS                                      |
|   - 自动回退本地文件 (开发模式)                                                    |
|                                                                                   |
|  [API 反向代理网关]                                                                |
|   - /api/config     -> 暴露模型、流式模式、向量状态 (屏蔽 Key)                    |
|   - /api/chat       -> 主剧情对话 (全链路 SSE + 25s keep-alive 保活)              |
|   - /api/extra      -> 辅助 AI (世界事件/传音/DLC，未配置自动回退主 API)           |
|   - /api/mobile     -> 手机模块专用 AI 对话                                       |
|   - /api/embeddings -> 向量模型代理 (未配置返回 404，引导前端本地计算)            |
|   - /api/models     -> 模型列表查询代理                                           |
|                                                                                   |
|  [环境与协议适配器]                                                               |
|   - .env / 环境变量自动解析 (URL, APIKEY, MODEL, FORCE_STREAM, EXTRA_*, EMBEDDING_*)|
|   - OpenAI / DeepSeek / Gemini / Responses API 多格式响应解析                     |
+------------------------------------------+----------------------------------------+
                                           | 上游 API 请求
                                           v
                       +----------------------------------------+
                       |      上游大模型提供商 (OpenAI / 等)     |
                       +----------------------------------------+
```

---

## 二、历史改造变更回顾与剖析 (JS / HTML)

接手新游戏前，必须熟知已有文件做了哪些关键更变，避免重复踩坑：

### 1. `game.html` / `game-bhz.html` / `mfszy/game-mfszy.html` / `xiandai/game-xiandai.html`
* **变更点**：改造 `startGame()`。
* **原有代码**：
  ```javascript
  if (!apiConfig.endpoint || !apiConfig.key) {
      alert('请先配置API连接');
      return;
  }
  ```
* **改造后代码**：
  ```javascript
  const sCfg = window.serverConfig || (typeof checkServerConfig === 'function' ? await checkServerConfig() : null);
  if (!sCfg?.serverMode && (!apiConfig.endpoint || !apiConfig.key)) {
      alert('请先配置API连接');
      return;
  }
  ```
* **目的**：在 Go 服务端模式下，由于 Key 已在服务端 `.env` 托管，用户无需在前端配置即可直接启动游戏。

---

### 2. `js/api-calling-functions.js` (核心网络层)
* **变更点 1：引入 `checkServerConfig()`**
  * 自动请求同源 `GET /api/config`，缓存到 `window.serverConfig`。
  * 包含字段：`serverMode: true`, `hasMain: bool`, `hasExtra: bool`, `hasEmbedding: bool`, `mainModel: string`, `mainStreamMode: string` 等。
* **变更点 2：实现 `callServerSSE(endpoint, payload)`**
  * 前端统一通过 `fetch(endpoint, { headers: { 'Accept': 'text/event-stream' } })` 接收数据流；
  * **心跳过滤**：针对服务端每 25 秒发送的 `: keep-alive\n\n`，自动忽略以 `:` 开头的注释行；
  * **流式拼接**：按行处理 `data: ` 内容，提取 `choices[0].delta.content`、`choices[0].message.content`、`content` 或 `output_text`，处理 `[DONE]` 结束标记。
* **变更点 3：路由重定向**
  * `callAI()`：检测到服务端已配置主模型时，直接将请求委托给 `callServerSSE('/api/chat', ...)`；
  * `callExtraAPI()` / `callExtraAI()`：委托给 `callServerSSE('/api/extra', ...)`，服务端若未配置 `EXTRA_*` 会自动无缝回退走主 API；
  * `callMobileAPI()`：委托给 `callServerSSE('/api/mobile', ...)`。

---

### 3. `js/config-modal.html` & `js/config-modal.js` (设置面板与去 BYOK)
* **变更点 1：去除前端输入框 (BYOK)**
  * 删除了主 API、额外 API、手机 API 的前端端点（Endpoint）和密钥（API Key）明文输入框与保存按钮；
  * 避免玩家误以为还需要在前端填 Key，同时防止密钥明文存入 localStorage。
* **变更点 2：增加服务端状态展示面板 (`#serverApiSection`)**
  * 通过 `updateServerStatusUI()` 动态将服务端的运行状态展示给用户：
    * 主模型：`sCfg.mainModel (sCfg.mainType)`
    * 辅助模型：未配置时显示“默认走主API”，配置后显示对应模型名
    * 向量接口：显示“服务端代理”或“浏览器本地计算 (Transformers.js / 关键词)”
    * 数据流与保活：“全链路 SSE + 25s 心跳保活 (杜绝 Cloudflare 524)”
* **变更点 3：保留合法客户端控制项**
  * 完整保留提示词工程编辑、Temperature、Max Tokens、外置手机开关、人物关系图谱以及知识库向量模式选择。

---

### 4. `supply.js` (向量数据库与 Embedding 系统)
* **变更点 1：用户偏好优先原则**
  * `initServerEmbeddingConfig()` 中优先尊重用户在界面显式选择的本地模式（`transformers` 或 `keyword`）；
* **变更点 2：服务端代理与本地降级自动切换**
  * 若用户选择 API 向量模式：
    1. 优先调用服务端的 `POST /api/embeddings`；
    2. 若服务端未在 `.env` 中配置 `EMBEDDING_MODEL` 或 `EMBEDDING_URL`（服务端返回 404），自动降级为浏览器本地 Transformers.js 模型；
    3. 若 Transformers.js 加载失败，最终自动降级为纯本地关键词倒排检索算法。

---

### 5. `js/dynamic-world-functions.js` & `js/auto-friend-message.js`
* **变更点**：解除了纯前端对 `extraApiConfig.key` 和 `mobileApiConfig.key` 的阻断校验。
* **目的**：在服务端模式下，动态世界、世界传音和好友短信自动走服务端的 `/api/extra` 和 `/api/mobile`，服务端会自动回退走主模型，无需在前端强行要求额外 Key。

---

## 三、接入新游戏 / 新剧本的标准操作流程 (Playbook)

当未来需要引入新的游戏模式（例如新 HTML、新主题或新 DLC）时，**必须严格按以下 6 个步骤执行**：

```
[步骤 1] 规划目录与资源路径
       │
[步骤 2] 检查并改造 HTML 启动入口 (解除 API 拦截)
       │
[步骤 3] 接入统一 API 调用管道 (对接 /api/* 与 SSE)
       │
[步骤 4] 检查设置弹窗与去 BYOK 适配
       │
[步骤 5] 更新 Webpack 资源复制规则 (webpack.config.js)
       │
[步骤 6] 编译测试与全架构校验 (npm run build + go build)
```

---

### 步骤 1：规划目录与资源路径

1. **单文件小剧本 / DLC**：
   * 可直接放置于根目录，如 `game-newworld.html`、`newworld-config.js`。
2. **独立大型子游戏 / 模块**：
   * 建立子目录，如 `newgame/game-newgame.html`、`newgame/newgame-config.js`、`newgame/css/`。
3. **关键注意（相对路径规则）**：
   * 子目录中的 HTML 引用公共脚本时，注意层级关系：
     * `<script src="../supply.js"></script>`
     * `<script src="../js/api-calling-functions.js"></script>`
     * `<script src="../js/config-modal.js"></script>`

---

### 步骤 2：检查并改造 HTML 启动入口 (解除 API 拦截)

在新的 HTML 中搜索 `function startGame` 或负责开始游戏的按钮事件。

**改造模板**：
```javascript
async function startGame() {
    if (gameState.isProcessing) return;

    // 🌟 统一改造：检测 Go 服务端模式，服务端模式下免除前端 Key 拦截
    const sCfg = window.serverConfig || (typeof checkServerConfig === 'function' ? await checkServerConfig() : null);
    if (!sCfg?.serverMode && (!apiConfig.endpoint || !apiConfig.key)) {
        alert('请先配置API连接（或使用 Go 服务端在 .env 中统一配置）');
        return;
    }

    // ... 原始的初始化与启动逻辑 ...
}
```

---

### 步骤 3：接入统一 API 调用管道

检查新游戏代码中的网络请求逻辑：
1. **如果直接复用全局函数**：
   * 确保页面已引入 `<script src="js/api-calling-functions.js"></script>`（或 `../js/...`）；
   * 新游戏的主逻辑直接调用 `callAI(prompt, isTest, originalInput)` 即可，它会自动走 `/api/chat` 并享受全链路 SSE + 25s 心跳。
2. **如果新游戏包含独立的特殊 API 调用**：
   * **严禁在前端直接 `fetch(apiEndpoint)`**（这会导致 CORS 失败且暴露密钥）；
   * 应调用现有的 `callServerSSE('/api/chat', payload)` 或 `callServerSSE('/api/extra', payload)`；
   * 若新游戏需要全新的特定后端接口，请在 `internal/handler/handler.go` 中注册相应端点，不要让前端直连外网！

---

### 步骤 4：检查设置弹窗与去 BYOK 适配

1. 检查新游戏界面是否调用了 `loadConfigModal()`。
2. 如果调用了共享的 `loadConfigModal()`，它已经自带 `#serverApiSection` 状态面板，无需额外处理。
3. 如果新游戏自定义了一套独立的配置弹窗：
   * 将所有的 API Key / Endpoint 输入框移除或替换为只读状态提示；
   * 添加对 `checkServerConfig()` 的调用，展示当前运行的主模型；
   * 保留提示词设定、立绘选择、文字速度、音量等与玩家体验直接相关的设置项。

---

### 步骤 5：更新 Webpack 资源复制规则 (`webpack.config.js`)

Go 二进制使用的是 `//go:embed all:dist`，所有前端文件必须被 Webpack 输出到 `dist/` 目录！

打开 [`webpack.config.js`](file:///D:/workspace/xiuxian-go/webpack.config.js)，在 `CopyPlugin.patterns` 中确认新目录或新文件已被包含：

```javascript
plugins: [
  new CopyPlugin({
    patterns: [
      { from: '*.html', to: '[name][ext]' },
      { 
        from: '*.js', 
        to: '[name][ext]', 
        globOptions: { ignore: ['**/webpack.config.js'] } 
      },
      { from: 'css', to: 'css', noErrorOnMissing: true },
      { from: 'js', to: 'js', noErrorOnMissing: true },
      { from: 'img', to: 'img', noErrorOnMissing: true },
      { from: 'mobile', to: 'mobile', noErrorOnMissing: true },
      { from: 'mfszy', to: 'mfszy', noErrorOnMissing: true },
      { from: 'xiandai', to: 'xiandai', noErrorOnMissing: true },
      // 🌟 新增子游戏目录时，务必在此注册一行：
      { from: 'newgame', to: 'newgame', noErrorOnMissing: true },
    ],
  }),
],
```

---

### 步骤 6：Go 后端路由与静态服务校验

1. 在 [`internal/handler/handler.go`](file:///D:/workspace/xiuxian-go/internal/handler/handler.go) 中：
   * 静态文件托管通过 `fileServer := http.FileServer(http.FS(h.staticFS))` 处理；
   * 任何打包到 `dist/` 里的新路径（例如 `dist/newgame/game-newgame.html`）**都会被 Go 自动递归托管**，访问地址为：
     `http://localhost:8080/newgame/game-newgame.html`。
2. 如果需要在主页 [`index.html`](file:///D:/workspace/xiuxian-go/index.html) 或导航菜单中增加新游戏入口，直接添加超链接即可：
   ```html
   <a href="newgame/game-newgame.html" class="game-card">进入新剧本</a>
   ```

---

## 四、核心规范与避坑指南 (Checklist & FAQs)

| 序号 | 常见错误 / 踩坑场景 | 正确做法 |
| :--- | :--- | :--- |
| 1 | **页面弹出“请先配置API连接”** | 检查该页面的 `startGame()` 是否移除了硬编码的 `!apiConfig.key` 拦截，并加入了 `sCfg?.serverMode` 判断。 |
| 2 | **控制台报 CORS 跨域错误** | 绝对是前端代码里残留了原生直连 `fetch(apiEndpoint)`。搜索代码中的 `fetch`，统一改为调用 `callServerSSE` 或请求同源 `/api/*`。 |
| 3 | **大模型文本前偶发冒号或乱码** | SSE 心跳包格式为 `: keep-alive\n\n`。前端 SSE 解析必须加上 `if (line.startsWith(':')) continue;` 忽略所有注释行。 |
| 4 | **打包后访问新页面 404** | 忘记在 `webpack.config.js` 的 `CopyPlugin` 中添加新目录，导致文件没有被复制到 `dist/`，Go embed 自然找不到。 |
| 5 | **本地运行正常，一到子目录资源丢失** | 检查子目录中 CSS / JS 引用的相对路径是 `../js/` 还是 `js/`，确保路径能正确命中。 |
| 6 | **用户改了前端向量设置却不生效** | 检查 `supply.js` 中 `initServerEmbeddingConfig()` 的优先级判断，必须允许玩家选定纯前端模式（`transformers` 或 `keyword`）。 |

---

## 五、验收与发布验证命令

完成新游戏接入后，运行以下三步验收流程：

### 1. 前端编译验证
```bash
npm run build
```
*检查 `dist/` 目录下是否包含新游戏的所有 HTML、JS、CSS 和图片。*

### 2. Go 本地独立打包验证
```bash
# Windows
go build -ldflags="-s -w" -o xiuxian.exe .

# Linux / macOS
go build -ldflags="-s -w" -o xiuxian .
```
*运行生成的可执行文件，浏览器访问相应路径，测试完整对话和流式推进。*

### 3. CI/CD 自动发布确认
* 提交并推送到 GitHub 后：
  * GitHub Action `Docker Build & Publish` 会自动使用矩阵并行构建 `amd64` 和 `arm64` 镜像并推送到 GHCR；
  * GitHub Action `Release Go Binaries` 会自动完成 Linux、Windows、macOS 全平台架构的交叉编译打包并发布至 GitHub Releases。
