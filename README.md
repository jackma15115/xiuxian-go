# 修仙 AI Web 游戏 (Golang Web 版)

[![Docker Build & Publish](https://github.com/jackma15115/xiuxian-go/actions/workflows/docker.yml/badge.svg)](https://github.com/jackma15115/xiuxian-go/actions/workflows/docker.yml)
[![Release Go Binaries](https://github.com/jackma15115/xiuxian-go/actions/workflows/release.yml/badge.svg)](https://github.com/jackma15115/xiuxian-go/actions/workflows/release.yml)
[![GHCR Container](https://img.shields.io/badge/GHCR-image-blue?logo=docker)](https://github.com/jackma15115/xiuxian-go/pkgs/container/xiuxian-go)

本项目已从原版纯静态网页程序重构改造为 **Golang Web 独立运行程序**：
- **专为内置前端服务**：Go 后端专为内嵌网页游戏提供静态资产服务及同源 API 代理，不作为外部通用网关。
- **全静态内嵌打包**：使用 Webpack 打包静态资源至 `dist/`，并通过 Go 1.16+ 的 `//go:embed` 直接编译进单一二进制文件，彻底告别零散静态文件部署。
- **服务端 AI 代理**：所有对 AI 与 Embedding 的调用全部由服务端代发，**彻底消除 CORS 跨域限制与移动端/浏览器安全策略阻断**，保护客户端 API Key 安全。
- **全链路 SSE 与保活机制**：无论上游模型是否为流式，前端与 Go 后端通信统一采用 SSE 传输。在等待上游返回时，后端每 25 秒自动发送 `: keep-alive\n\n` 心跳，**杜绝 Cloudflare 524 超时及网关非流式断连**。
- **多架构容器与原生二进制**：提供 `amd64` / `arm64` 双架构 Docker 镜像，以及全平台免安装预编译二进制包。

---

## 部署教程（按推荐优先级）

### 方式一：Docker 部署（最推荐 ⭐️⭐️⭐️）

适合家庭服务器、云主机、NAS（群晖/威联通/极空间/Unraid）以及树莓派。自动拉取官方已构建的多架构镜像（原生支持 `linux/amd64` 与 `linux/arm64`），无需配置编译环境。

#### 1. 一键命令行启动 (Docker Run)

```bash
docker run -d \
  --name xiuxian-web \
  --restart unless-stopped \
  -p 8080:8080 \
  -e URL=https://api.openai.com/v1 \
  -e APIKEY=sk-your-api-key-here \
  -e MODEL=gpt-4o-mini \
  -e API_TYPE=openai \
  ghcr.io/jackma15115/xiuxian-go:latest
```

启动完成后，在浏览器访问：[http://localhost:8080](http://localhost:8080) 即可开始修仙。

#### 2. Docker Compose 部署（推荐生产/日常使用）

在工作目录创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  xiuxian:
    image: ghcr.io/jackma15115/xiuxian-go:latest
    container_name: xiuxian-web
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - URL=https://api.openai.com/v1
      - APIKEY=sk-your-api-key-here
      - MODEL=gpt-4o-mini
      - API_TYPE=openai
      # 可选参数配置：
      # - FORCE_STREAM=true            # 强制流式 (true/false，不填自适应)
      # - EXTRA_URL=                   # 额外 API (不填自动走主 API)
      # - EXTRA_APIKEY=
      # - EXTRA_MODEL=
      # - EMBEDDING_MODEL=text-embedding-3-small # 服务端向量接口 (不填降级为浏览器本地计算)
    # 若希望使用外部 .env 文件，可解开下行注释并创建同级 .env 文件：
    # env_file:
    #   - .env
```

启动容器：
```bash
docker compose up -d
```

更新镜像：
```bash
docker compose pull
docker compose up -d
```

---

### 方式二：GitHub Releases 预编译包运行（次推荐 ⭐️⭐️）

适合个人电脑（Windows / Mac / Linux 桌面）直接双击或命令行运行，**免安装 Docker、Node.js 或 Go 编译器**，开箱即用。

#### 1. 下载对应系统的压缩包

前往 [GitHub Releases](https://github.com/jackma15115/xiuxian-go/releases) 下载适合您系统架构的最新压缩包：

| 操作系统 | 架构 | 文件名 | 说明 |
| :--- | :--- | :--- | :--- |
| **Windows** | x86_64 (64位) | `xiuxian-windows-amd64.zip` | 绝大多数 Windows PC / 笔记本 |
| **Windows** | ARM64 | `xiuxian-windows-arm64.zip` | 骁龙 / ARM 架构 Windows PC |
| **Linux** | x86_64 (amd64) | `xiuxian-linux-amd64.tar.gz` | 大多数 Linux VPS、Ubuntu、CentOS |
| **Linux** | ARM64 (aarch64) | `xiuxian-linux-arm64.tar.gz` | 树莓派 64位、ARM 云服务器 |
| **Linux** | ARMv7 (32位) | `xiuxian-linux-armv7.tar.gz` | 老旧 32位 ARM 设备 / 树莓派 32位 |
| **macOS** | Apple Silicon | `xiuxian-darwin-arm64.tar.gz` | Mac M1 / M2 / M3 / M4 芯片系列 |
| **macOS** | Intel 芯片 | `xiuxian-darwin-amd64.tar.gz` | 早期 Intel 处理器的 Mac 机型 |

#### 2. 配置与运行步骤

1. **解压压缩包**至任意目录；
2. 将目录中的 `.env.example` 复制或重命名为 `.env`；
3. 打开 `.env`，填入你的 API Key、URL 与 Model：
   ```ini
   PORT=8080
   URL=https://api.openai.com/v1
   APIKEY=sk-your-key-here
   MODEL=gpt-4o-mini
   API_TYPE=openai
   ```
4. **启动程序**：
   - **Windows**：双击运行 `xiuxian.exe`；
   - **Linux / macOS**：
     ```bash
     chmod +x xiuxian
     ./xiuxian
     ```
5. 打开浏览器访问：[http://localhost:8080](http://localhost:8080) 开始游戏。

---

### 方式三：从源码克隆并自行构建（开发者 ⭐️）

适合需要修改游戏逻辑、二开前端界面或调试 Go 服务的开发者。

#### 1. 环境准备
- [Node.js](https://nodejs.org/) (推荐 18 或 20 LTS) 与 npm
- [Go](https://go.dev/) (版本 1.22 或更高)
- Git

#### 2. 克隆项目与安装依赖
```bash
git clone https://github.com/jackma15115/xiuxian-go.git
cd xiuxian-go

# 安装前端依赖
npm install
```

#### 3. 一键编译命令

- **Windows 用户**：
  ```cmd
  build.bat
  ```
- **Linux / macOS 用户**：
  ```bash
  chmod +x build.sh
  ./build.sh
  ```

脚本将自动执行 Webpack 编译并将静态资产打入 `dist/`，接着使用 Go 编译出包含内嵌前端的独立可执行文件 `xiuxian` (`xiuxian.exe`)。

#### 4. 手动分布构建（可选）
```bash
# 步骤 1: 打包前端页面和资源到 dist/ 目录
npm run build

# 步骤 2: 编译 Go 二进制 (包含全部嵌入式静态资源)
go build -ldflags="-s -w" -o xiuxian .

# 步骤 3: 运行程序
./xiuxian
```

---

## 环境变量配置说明

程序启动时会自动读取工作目录下的 `.env` 文件或系统环境变量。支持以下配置项：

| 变量名 | 默认值 | 是否必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `PORT` | `8080` | 否 | Web 服务监听的端口号 |
| `URL` | `https://api.openai.com/v1` | **是** | 主 AI 接口基础地址 (Base URL) |
| `APIKEY` | 无 | **是** | 主 AI 接口 API 密钥 (Key) |
| `MODEL` | `gpt-4o-mini` | **是** | 主 AI 对话模型名称 |
| `API_TYPE` | `openai` | 否 | API 协议类型，支持 `openai`、`deepseek`、`gemini` |
| `FORCE_STREAM` | 原生自适应 | 否 | 流式强制策略：`true` 强制所有请求走流式；`false` 强制非流式；未设置时按前端请求原生模式处理 |
| `EXTRA_URL` | 继承 `URL` | 否 | 额外模型接口地址（未设置自动回退走主 API） |
| `EXTRA_APIKEY` | 继承 `APIKEY` | 否 | 额外模型密钥（未设置自动回退走主 API） |
| `EXTRA_MODEL` | 继承 `MODEL` | 否 | 额外模型名称（未设置自动回退走主 API） |
| `EXTRA_API_TYPE` | 继承 `API_TYPE` | 否 | 额外模型协议类型（未设置自动回退走主 API） |
| `EMBEDDING_URL` | 继承 `URL` | 否 | 向量模型接口地址 |
| `EMBEDDING_APIKEY` | 继承 `APIKEY` | 否 | 向量模型密钥 |
| `EMBEDDING_MODEL` | 无 | 否 | 向量模型名称（若留空，前端将自动降级为浏览器本地 Transformers.js 或关键词检索） |

---

## 服务端 API 接口列表

仅面向内嵌网页游戏前端开放的 API：

| 方法 | 端点 | 功能说明 |
| :--- | :--- | :--- |
| `GET` | `/api/config` | 查询当前服务端配置状态（主模型、流式策略、向量服务状态，绝不泄露 API Key） |
| `POST` | `/api/chat` | 主 AI 剧情推进与对话转发（消除 CORS，统一全链路 SSE 传输） |
| `POST` | `/api/extra` | 额外 AI 转发（如世界事件、传音等，未配置自动回退走主 API） |
| `POST` | `/api/mobile` | 游戏内手机/通信录等特殊 AI 逻辑转发 |
| `POST` | `/api/embeddings` | 服务端向量嵌入计算代理（未配置时返回 404 引导前端本地计算） |
| `GET` | `/api/models` | 获取上游模型列表代理 |
| `GET` | `/*` | 托管内嵌静态前端网页及资源文件 |

---

## 许可证

本项目遵循开源许可协议。欢迎提交 PR 与 Issue！
