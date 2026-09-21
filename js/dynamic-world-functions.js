/**
 * 动态世界功能模块
 * 包含：动态世界生成、显示、配置管理、变量合并等
 * 从 game.html 中提取的动态世界相关功能模块
 */

// ==================== 动态世界相关函数 ====================

// 切换Tab
function switchTab(tabName) {
    // 移除所有active类
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // 添加active类到选中的tab
    if (tabName === 'status') {
        document.querySelector('[onclick*="switchTab(\'status\')"]').classList.add('active');
        document.getElementById('statusTab').classList.add('active');
    } else if (tabName === 'baiyi') {
        document.querySelector('[onclick*="switchTab(\'baiyi\')"]').classList.add('active');
        document.getElementById('baiyiTab').classList.add('active');
        // 更新百艺材料列表
        updateBaiyiMaterialsList();
    } else if (tabName === 'dynamicWorld') {
        document.querySelector('[onclick*="switchTab(\'dynamicWorld\')"]').classList.add('active');
        document.getElementById('dynamicWorldTab').classList.add('active');
        // 更新动态世界显示
        displayDynamicWorldHistory();
    }
}

// 切换动态世界配置字段
function toggleDynamicWorldFields() {
    const enabled = document.getElementById('enableDynamicWorld').checked;
    const fieldsDiv = document.getElementById('dynamicWorldFields');
    
    if (enabled) {
        fieldsDiv.style.display = 'block';
        gameState.dynamicWorld.enabled = true;
    } else {
        fieldsDiv.style.display = 'none';
        gameState.dynamicWorld.enabled = false;
    }
}

// 保存动态世界设置
function saveDynamicWorldSettings() {
    const enabled = document.getElementById('enableDynamicWorld').checked;
    const historyDepth = document.getElementById('dynamicWorldHistoryDepth').value;
    const minWords = document.getElementById('dynamicWorldMinWords').value;
    const messageInterval = document.getElementById('dynamicWorldInterval').value;
    const showReasoning = document.getElementById('dynamicWorldShowReasoning').checked;
    const enableKnowledge = document.getElementById('dynamicWorldEnableKnowledge').checked;
    const prompt = document.getElementById('dynamicWorldPrompt').value;

    // 获取现有配置
    const saved = localStorage.getItem('gameConfig');
    const config = saved ? JSON.parse(saved) : {};

    // 更新动态世界配置
    config.dynamicWorld = {
        enabled: enabled,
        historyDepth: parseInt(historyDepth),
        minWords: parseInt(minWords),
        messageInterval: parseInt(messageInterval),
        showReasoning: showReasoning,
        enableKnowledge: enableKnowledge,
        prompt: prompt
    };

    // 保存到localStorage
    localStorage.setItem('gameConfig', JSON.stringify(config));

    // 更新gameState
    gameState.dynamicWorld.enabled = enabled;
    gameState.dynamicWorld.messageInterval = parseInt(messageInterval);

    // 立即更新显示
    displayDynamicWorldHistory();

    alert('动态世界设置已保存！\n启用状态: ' + (enabled ? '已启用' : '未启用') + 
          '\n历史层数: ' + historyDepth + '\n最小字数: ' + minWords + 
          '\n生成间隔: 每 ' + messageInterval + ' 次用户消息');
}

// 🔧 兼容性检查：获取extraApiConfig（兼容全局和局部变量）
function getExtraApiConfig() {
    // 如果是BHZ环境，使用全局变量
    if (window.extraApiConfig) {
        return window.extraApiConfig;
    }
    // 如果是原版环境，使用局部变量（需要通过window传递）
    if (typeof extraApiConfig !== 'undefined') {
        return extraApiConfig;
    }
    // 都不存在则返回空对象
    return { enabled: false, key: '' };
}

// 显示动态世界历史
function displayDynamicWorldHistory() {
    const container = document.getElementById('dynamicWorldContainer');

    // 如果容器不存在（状态面板还未加载），则跳过
    if (!container) {
        console.warn('[动态世界] dynamicWorldContainer 元素不存在，跳过显示');
        return;
    }

    // 🔧 调试：检查extraApiConfig的实际值
    const extraApiConfig = getExtraApiConfig();
    console.log('[动态世界] 🔧 调试信息:');
    console.log('- extraApiConfig 存在:', !!extraApiConfig);
    console.log('- extraApiConfig 值:', extraApiConfig);
    console.log('- enabled:', extraApiConfig?.enabled);
    console.log('- hasKey:', !!extraApiConfig?.key);
    console.log('- key长度:', extraApiConfig?.key?.length || 0);

    if (!gameState.dynamicWorld.enabled) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
                <div style="font-size: 16px; margin-bottom: 10px;">动态世界未启用</div>
                <div style="font-size: 12px; margin-bottom: 15px;">请在设置中启用动态世界功能</div>
                <button onclick="openConfigModal(); setTimeout(() => { toggleSection('dynamicWorldSettings'); document.getElementById('dynamicWorldSettings').scrollIntoView(); }, 100);" 
                    style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    前往设置
                </button>
            </div>
        `;
        return;
    }

    // 检查额外API配置
    if (!extraApiConfig.enabled || !extraApiConfig.key) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                <div style="font-size: 16px; margin-bottom: 10px; color: #e67e22;">额外API未配置</div>
                <div style="font-size: 12px; margin-bottom: 15px;">动态世界需要使用第二API<br>请先配置并保存额外API</div>
                <button onclick="openConfigModal(); setTimeout(() => { toggleSection('extraApiSection'); document.getElementById('extraApiSection').scrollIntoView(); }, 100);" 
                    style="padding: 10px 20px; background: #e67e22; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    配置额外API
                </button>
            </div>
        `;
        return;
    }

    if (gameState.dynamicWorld.history.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
                <div style="font-size: 16px; margin-bottom: 10px;">暂无动态世界内容</div>
                <div style="font-size: 12px;">✅ 动态世界已启用<br>✅ 额外API已配置<br><br>开始游戏后将自动生成</div>
            </div>
        `;
        return;
    }

    // 显示所有动态世界历史（倒序，最新的在上面）
    let html = '';
    for (let i = gameState.dynamicWorld.history.length - 1; i >= 0; i--) {
        const entry = gameState.dynamicWorld.history[i];
        const floor = i + 1;
        
        html += `
            <div class="dynamic-world-entry">
                <div class="dynamic-world-header">
                    <span class="dynamic-world-floor">🏛️ 第 ${floor} 层</span>
                    <span class="dynamic-world-time">${new Date(entry.timestamp).toLocaleString('zh-CN')}</span>
                </div>
                ${entry.reasoning && entry.showReasoning ? createDynamicWorldReasoningDisplay(entry.reasoning) : ''}
                <div class="dynamic-world-content">${entry.story}</div>
                <div class="dynamic-world-controls">
                    <button class="regenerate-btn" onclick="regenerateDynamicWorld(${i})">重试</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// 创建动态世界思维链显示
function createDynamicWorldReasoningDisplay(reasoning) {
    let html = `
        <div class="reasoning-container" style="margin-bottom: 10px;">
            <div class="reasoning-header" style="cursor: pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                <span>🧠 动态世界思维链</span>
                <span class="reasoning-toggle">点击展开/折叠</span>
            </div>
            <div class="reasoning-content" style="display: none;">
    `;

    if (reasoning.worldState) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">🌐 世界状态分析</div>
                <div class="reasoning-text">${reasoning.worldState}</div>
            </div>
        `;
    }

    if (reasoning.timeframe) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">⏰ 时间范围</div>
                <div class="reasoning-text">${reasoning.timeframe}</div>
            </div>
        `;
    }

    if (reasoning.keyEvents && Array.isArray(reasoning.keyEvents)) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">📌 关键事件</div>
                <ul class="reasoning-chain">
                    ${reasoning.keyEvents.map(event => `<li>${event}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    if (reasoning.npcActions) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">👥 NPC行动</div>
                <div class="reasoning-text">${reasoning.npcActions}</div>
            </div>
        `;
    }

    if (reasoning.impact) {
        html += `
            <div style="margin-bottom: 8px;">
                <div class="reasoning-header" style="font-size: 12px;">💫 潜在影响</div>
                <div class="reasoning-text">${reasoning.impact}</div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// 生成动态世界内容
async function generateDynamicWorld() {
    console.log('[动态世界] 触发生成函数');
    console.log('[动态世界] 启用状态:', gameState.dynamicWorld.enabled);
    
    const extraApiConfig = getExtraApiConfig();
    console.log('[动态世界] 额外API配置:', {
        enabled: extraApiConfig.enabled,
        hasKey: !!extraApiConfig.key,
        hasEndpoint: !!extraApiConfig.endpoint,
        hasModel: !!extraApiConfig.model
    });

    // 检查是否启用动态世界
    if (!gameState.dynamicWorld.enabled) {
        console.log('[动态世界] 未启用，跳过生成');
        return;
    }

    // 🆕 增加消息计数器并检查是否达到生成间隔
    gameState.dynamicWorld.messageCounter = (gameState.dynamicWorld.messageCounter || 0) + 1;
    const interval = gameState.dynamicWorld.messageInterval || 5;
    
    if (gameState.dynamicWorld.messageCounter < interval) {
        console.log(`[动态世界] 未达到生成间隔（${gameState.dynamicWorld.messageCounter}/${interval}），跳过本次生成`);
        return;
    }
    
    // 达到间隔，重置计数器
    console.log('[动态世界] 达到生成间隔，重置计数器并开始生成');
    gameState.dynamicWorld.messageCounter = 0;

    // 检查额外API是否配置
    if (!extraApiConfig.enabled || !extraApiConfig.key) {
        console.warn('[动态世界] 额外API未配置！');
        console.warn('[动态世界] 请在【设置 → 额外API设置】中配置并保存第二API');
        return;
    }

    // 避免重复请求
    if (gameState.dynamicWorld.isProcessing) {
        console.warn('[动态世界] 正在处理中，跳过本次生成');
        console.warn('[动态世界] 如果卡住了，请在控制台执行: gameState.dynamicWorld.isProcessing = false');
        return;
    }

    console.log('[动态世界] 开始生成...');
    gameState.dynamicWorld.isProcessing = true;

    // 显示加载提示
    const historyDiv = document.getElementById('gameHistory');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.id = 'dynamic-world-loading';
    loadingDiv.innerHTML = `
        <div class="message-header">
            <span>🌍 动态世界</span>
        </div>
        <div class="message-content">
            <span class="loading"></span> AI正在生成动态世界内容...
        </div>
    `;
    historyDiv.appendChild(loadingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        // 获取动态世界配置
        const saved = localStorage.getItem('gameConfig');
        const config = saved ? JSON.parse(saved) : {};
        const dwConfig = config.dynamicWorld || {};

        const historyDepth = dwConfig.historyDepth || 5;
        const minWords = dwConfig.minWords || 300;
        const showReasoning = dwConfig.showReasoning !== undefined ? dwConfig.showReasoning : true;
        // 🔧 强制使用白虎宗的动态世界提示词（优先级调整）
        let systemPrompt;
        console.log('[动态世界-调试] 🔍 检查提示词来源...');
        console.log('[动态世界-调试] 🔍 window对象:', window);
        console.log('[动态世界-调试] 🔍 window.BaihuSectGameConfig:', window.BaihuSectGameConfig);
        console.log('[动态世界-调试] 🔍 window.XiuxianGameConfig:', window.XiuxianGameConfig);
        console.log('[动态世界-调试] 🔍 dwConfig.prompt存在?', !!(dwConfig && dwConfig.prompt && dwConfig.prompt.trim()));
        console.log('[动态世界-调试] 🔍 window.BaihuSectGameConfig存在?', !!(typeof window.BaihuSectGameConfig !== 'undefined'));
        if (window.BaihuSectGameConfig) {
            console.log('[动态世界-调试] 🔍 BaihuSectGameConfig.defaultDynamicWorldPrompt长度:', window.BaihuSectGameConfig.defaultDynamicWorldPrompt?.length);
            console.log('[动态世界-调试] 🔍 BaihuSectGameConfig.defaultDynamicWorldPrompt开头:', window.BaihuSectGameConfig.defaultDynamicWorldPrompt?.substring(0, 200));
        }
        console.log('[动态世界-调试] 🔍 HTML动态世界提示词存在?', !!(document.getElementById('dynamicWorldPrompt') && document.getElementById('dynamicWorldPrompt').value.trim()));
        
        // 🔧 临时禁用用户自定义提示词，强制使用白虎宗配置
        if (false && dwConfig.prompt && dwConfig.prompt.trim()) {
            systemPrompt = dwConfig.prompt;
            console.log('[动态世界] 📝 使用用户自定义动态世界提示词');
            console.log('[动态世界-调试] 🔍 用户自定义提示词长度:', dwConfig.prompt.length);
            console.log('[动态世界-调试] 🔍 用户自定义提示词开头:', dwConfig.prompt.substring(0, 200));
            console.log('[动态世界-调试] 🔍 用户自定义提示词是否包含白虎宗:', dwConfig.prompt.includes('白虎宗'));
            console.log('[动态世界-调试] 🔍 用户自定义提示词是否包含R18:', dwConfig.prompt.includes('R18') || dwConfig.prompt.includes('师姐妹'));
        } else if (typeof window.BaihuSectGameConfig !== 'undefined' && window.BaihuSectGameConfig.defaultDynamicWorldPrompt) {
            // 🐅 白虎宗配置优先级提高到第二位
            systemPrompt = window.BaihuSectGameConfig.defaultDynamicWorldPrompt;
            console.log('[动态世界] 🐅 使用白虎宗默认动态世界提示词');
        } else if (document.getElementById('dynamicWorldPrompt') && document.getElementById('dynamicWorldPrompt').value.trim()) {
            systemPrompt = document.getElementById('dynamicWorldPrompt').value;
            console.log('[动态世界] 📝 使用HTML中的动态世界提示词');
        } else {
            systemPrompt = '你是一个白虎宗修仙世界的动态世界生成器。根据当前主角状态和位置，生成远方事件、势力动态、环境变化等背景信息。生成的世界事件应该符合白虎宗的世界观设定，体现修仙世界的特色和白虎宗的独特文化，包含适当的修仙元素：境界突破、法宝争夺、宗门争斗等。以第三人称叙述，语言风格古典雅致，每段50-100字，生成3-5个不同的背景事件。';
            console.log('[动态世界] 🐅 使用硬编码白虎宗动态世界提示词');
        }

        // 🆕 先获取当前变量状态
        const currentLocation = gameState.variables.location || '未知';
        const currentNPCs = gameState.variables.relationships.map(r => r.name).join('、') || '无';
        const currentTime = gameState.variables.currentDateTime || '未知';

        // 构建消息
        let messages = [];

        // 🆕 集成知识库检索功能
        let knowledgeContext = '';
        const enableKnowledge = dwConfig.enableKnowledge !== undefined ? dwConfig.enableKnowledge : true;
        if (window.contextVectorManager && 
            document.getElementById('enableVectorRetrieval')?.checked && 
            enableKnowledge) {
            try {
                console.log('[动态世界] 开始知识库检索...');
                
                // 构建检索查询（基于当前游戏状态）
                const queryText = `动态世界生成 ${currentLocation} ${currentTime} 远方事件 势力动态`;
                
                // 🔧 修改：使用通用提示词进行知识库检索，避免覆盖白虎宗提示词
                const genericPrompt = '你是一个修仙世界的动态世界生成器。根据当前主角状态和位置，生成远方事件、势力动态、环境变化等背景信息。';
                const optimizedMessages = await window.contextVectorManager.buildOptimizedMessages(
                    genericPrompt, // 使用通用提示词进行检索
                    gameState.variables,
                    queryText,
                    0, // 不需要对话历史
                    [], // 空的完整对话历史
                    queryText // 传入检索查询
                );
                
                // 提取知识库相关的系统消息（排除第一个系统消息，因为它是通用提示词）
                const knowledgeMessages = optimizedMessages.filter(msg => 
                    msg.role === 'system' && (
                        msg.content.includes('【相关历史回忆】') ||
                        msg.content.includes('【相关知识库】') ||
                        msg.content.includes('【⭐ 重点常驻知识】') ||
                        msg.content.includes('【📌 次重点常驻知识】') ||
                        msg.content.includes('【常驻知识库】')
                    )
                );
                
                if (knowledgeMessages.length > 0) {
                    // 🆕 优化知识库内容格式，添加删除标记
                    knowledgeContext = '\n\n【🌍 动态世界知识库参考 - 可通过设置关闭】\n' + 
                        knowledgeMessages.map((msg, index) => {
                            let content = msg.content;
                            // 为每个知识库块添加标记，便于识别和管理
                            if (content.includes('【相关历史回忆】')) {
                                content = '📜 [历史记忆] ' + content;
                            } else if (content.includes('【相关知识库】')) {
                                content = '📚 [相关知识] ' + content;
                            } else if (content.includes('【⭐ 重点常驻知识】')) {
                                content = '⭐ [重点知识] ' + content;
                            } else if (content.includes('【📌 次重点常驻知识】')) {
                                content = '📌 [次重点知识] ' + content;
                            } else if (content.includes('【常驻知识库】')) {
                                content = '📖 [常驻知识] ' + content;
                            }
                            return content;
                        }).join('\n\n');
                    console.log(`[动态世界] 已集成 ${knowledgeMessages.length} 条知识库内容`);
                }
                
            } catch (error) {
                console.warn('[动态世界] 知识库检索失败:', error);
            }
        } else if (!enableKnowledge) {
            console.log('[动态世界] 知识库检索已通过设置关闭');
        }

        // 添加系统提示词（包含知识库内容）
        const finalSystemPrompt = systemPrompt + knowledgeContext;
        
        // 🔍 调试日志：显示实际使用的提示词
        console.log('[动态世界-调试] 📝 原始systemPrompt长度:', systemPrompt.length);
        console.log('[动态世界-调试] 📝 原始systemPrompt开头:', systemPrompt.substring(0, 200));
        console.log('[动态世界-调试] 📝 知识库内容长度:', knowledgeContext.length);
        console.log('[动态世界-调试] 📝 知识库内容开头:', knowledgeContext.substring(0, 200));
        console.log('[动态世界-调试] 📝 最终提示词长度:', finalSystemPrompt.length);
        console.log('[动态世界-调试] 📝 最终提示词开头:', finalSystemPrompt.substring(0, 300));
        console.log('[动态世界-调试] 📝 是否包含白虎宗关键词:', finalSystemPrompt.includes('白虎宗'));
        console.log('[动态世界-调试] 📝 是否包含R18关键词:', finalSystemPrompt.includes('R18') || finalSystemPrompt.includes('师姐妹'));
        console.log('[动态世界-调试] 📝 知识库是否包含"修仙世界的动态世界生成器":', knowledgeContext.includes('修仙世界的动态世界生成器'));
        
        messages.push({
            role: 'system',
            content: finalSystemPrompt
        });

        // 添加当前变量状态和限制信息
        const variableContext = `
【当前主角状态】（仅供参考，禁止修改）
- 当前时间：${currentTime}
- 当前位置：${currentLocation}
- 身边的NPC：${currentNPCs}

【严格要求】
-  禁止推进时间！描述的是"此时此刻"（${currentTime}）其他地方发生的事
-  禁止涉及主角当前位置"${currentLocation}"的任何事件！
-  禁止涉及以下NPC：${currentNPCs}（他们可能在主角身边）
-  禁止描述主角在做什么！
-  正确做法：描述完全不同地点的远方传闻、势力动态
-  可以添加新的远方NPC到variables.relationships（但必须是不在主角身边的npc）
- 字数要求：至少${minWords}字
- 叙事风格：使用"据说"、"传言"、"有修士目击"等远观视角
        `.trim();

        messages.push({
            role: 'user',
            content: variableContext
        });

        // 添加动态世界历史
        if (historyDepth > 0 && gameState.dynamicWorld.history.length > 0) {
            const recentHistory = gameState.dynamicWorld.history.slice(-historyDepth);
            for (const entry of recentHistory) {
                messages.push({
                    role: 'assistant',
                    content: JSON.stringify({ story: entry.story, reasoning: entry.reasoning })
                });
            }
        }

        // 添加生成请求
        messages.push({
            role: 'user',
            content: '请生成新的动态世界内容。\n\n【极其重要】必须输出完整的JSON结构，所有字段都必须完整，不能在中途截断！确保所有花括号、方括号、引号都正确闭合！'
        });

        // 调用API
        const response = await callExtraAPI(messages);

        // 🔍 调试输出（帮助诊断第三方 API 截断问题）
        console.log('[动态世界-生成] API 原始响应长度:', response.length, '字符');
        console.log('[动态世界-生成] API 响应开头:', response.substring(0, 200));
        console.log('[动态世界-生成] API 响应结尾:', response.substring(Math.max(0, response.length - 200)));
        if (response.length < 500) {
            console.warn('[动态世界-生成] ⚠️ 响应过短，可能被截断！完整内容:', response);
        }

        // 解析响应
        const data = parseAIResponse(response);

        // 🔍 调试输出：显示动态世界完整数据
        if (debugMode || document.getElementById('debugMode')?.checked) {
            console.log('[动态世界-调试] 📦 完整AI响应数据:');
            console.log('[动态世界-调试] - 原始响应长度:', response.length);
            console.log('[动态世界-调试] - 解析后的story:', data.story?.substring(0, 200));
            console.log('[动态世界-调试] - variables字段:', data.variables);
            console.log('[动态世界-调试] - variableUpdate字段:', data.variableUpdate);
            console.log('[动态世界-调试] - relationships:', data.variables?.relationships);
            
            // 在调试面板显示完整内容
            const debugContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 动态世界生成 - 完整输出
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【原始AI响应】(${response.length}字符)
${response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【解析后的数据】
${JSON.stringify(data, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【变量表单 (variables)】
${data.variables ? JSON.stringify(data.variables, null, 2) : '无'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【变量更新指令 (variableUpdate)】
${data.variableUpdate || '无'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【人际关系 (从variables提取)】
${data.variables?.relationships ? JSON.stringify(data.variables.relationships, null, 2) : '无'}
`;
            showDebugOutput(debugContent);
        }

        // 保存到动态世界历史
        const entry = {
            floor: gameState.dynamicWorld.floor + 1,
            timestamp: Date.now(),
            story: data.story,
            reasoning: data.reasoning,
            variables: data.variables || {},
            variableUpdate: data.variableUpdate || null, // 🆕 保存v3.1格式的指令
            showReasoning: showReasoning
        };

        gameState.dynamicWorld.history.push(entry);
        gameState.dynamicWorld.floor++;

        // 合并变量（支持两种格式）
        console.log('[动态世界] 准备合并变量...');
        console.log('[动态世界] - data.variables:', data.variables);
        console.log('[动态世界] - data.variableUpdate:', data.variableUpdate);
        
        if (data.variableUpdate) {
            // v3.1 指令格式
            console.log('[动态世界] 🎯 检测到 variableUpdate 格式（v3.1指令）');
            try {
                // 初始化 v3.1 解析器
                if (!window.v31Parser) {
                    console.log('[动态世界] 初始化 v3.1 解析器...');
                    window.v31Parser = new VariableInstructionParserV31(gameState, {
                        debug: true,
                        enableRollback: false
                    });
                }
                
                // 解析并执行变量更新
                const result = window.v31Parser.execute(data.variableUpdate);
                console.log('[动态世界] ✅ v3.1 变量更新结果:', result);
                console.log('[动态世界] 更新后的主变量表单 relationships 数量:', gameState.variables.relationships?.length);
                
                // 更新UI
                updateStatusPanel();
            } catch (error) {
                console.error('[动态世界] ❌ v3.1 变量更新失败:', error);
                console.error('[动态世界] 错误详情:', error.message);
            }
        } else if (data.variables) {
            // 完整变量表单格式
            console.log('[动态世界] 📋 检测到 variables 格式（完整表单）');
            console.log('[动态世界] 开始合并变量到主变量表单...');
            mergeDynamicWorldVariables(data.variables);
            console.log('[动态世界] ✅ 变量合并完成');
            console.log('[动态世界] 合并后的主变量表单 relationships 数量:', gameState.variables.relationships?.length);
        } else {
            console.warn('[动态世界] ⚠️ AI响应中既没有variables字段，也没有variableUpdate字段！');
            console.warn('[动态世界] 完整的data对象:', data);
        }

        // 添加到向量库（用于后续检索）
        if (window.contextVectorManager && document.getElementById('enableVectorRetrieval')?.checked) {
            // 使用负数作为动态世界的turnIndex，避免与主对话冲突
            // 主对话使用正数（1, 2, 3...），动态世界使用负数（-1, -2, -3...）
            const dynamicWorldTurnIndex = -gameState.dynamicWorld.floor;
            
            await window.contextVectorManager.addConversation(
                '[动态世界] ' + data.story.substring(0, 100),
                data.story,
                dynamicWorldTurnIndex,
                data.story
            );
            // 保存向量库到IndexedDB
            await window.contextVectorManager.saveToIndexedDB();
            console.log(`[动态世界] 向量库已保存到IndexedDB（turnIndex: ${dynamicWorldTurnIndex}）`);
        }

        // 移除加载提示
        const loading = document.getElementById('dynamic-world-loading');
        if (loading) loading.remove();

        // 更新显示
        displayDynamicWorldHistory();

        console.log('[动态世界] 生成成功，楼层：' + entry.floor);

        // 🆕 自动保存游戏（包含动态世界数据）
        await saveGameHistory();
        console.log('[动态世界] 已自动保存到存档');
        console.log('[动态世界] 当前历史记录数:', gameState.dynamicWorld.history.length);

    } catch (error) {
        console.error('[动态世界] 生成失败:', error);
        
        // 移除加载提示
        const loading = document.getElementById('dynamic-world-loading');
        if (loading) loading.remove();
    } finally {
        gameState.dynamicWorld.isProcessing = false;
    }
}

// 合并动态世界生成的变量到主变量
function mergeDynamicWorldVariables(dynamicVariables) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[动态世界-变量合并] 开始处理');
    console.log('[动态世界-变量合并] 动态变量内容:', dynamicVariables);
    
    if (!dynamicVariables) {
        console.warn('[动态世界-变量合并] ⚠️ dynamicVariables为空，跳过合并');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }

    let hasChanges = false;
    
    // 📊 显示合并前的状态
    console.log('[动态世界-变量合并] 📊 合并前主变量表单 relationships 数量:', gameState.variables.relationships?.length);

    // 合并relationships
    if (dynamicVariables.relationships && Array.isArray(dynamicVariables.relationships)) {
        console.log(`[动态世界-变量合并] 👥 处理 ${dynamicVariables.relationships.length} 个人际关系`);
        
        for (const newRel of dynamicVariables.relationships) {
            console.log(`[动态世界-变量合并] 🔍 处理角色: ${newRel.name}`);
            
            // 查找是否已存在
            const existingIndex = gameState.variables.relationships.findIndex(
                r => r.name === newRel.name
            );

            if (existingIndex >= 0) {
                console.log(`[动态世界-变量合并]   - 已存在，索引: ${existingIndex}`);
                
                // 更新现有关系（合并history，但要去重）
                const existing = gameState.variables.relationships[existingIndex];
                const existingHistory = existing.history || [];
                const newHistory = newRel.history || [];
                
                console.log(`[动态世界-变量合并]   - 现有历史记录: ${existingHistory.length} 条`);
                console.log(`[动态世界-变量合并]   - 新增历史记录: ${newHistory.length} 条`);
                
                // 去重合并：只添加不重复的历史记录
                const mergedHistory = [...existingHistory];
                let addedCount = 0;
                
                newHistory.forEach(newItem => {
                    // 检查是否已存在相同内容（去除首尾空格后比较）
                    const trimmedNew = newItem.trim();
                    const isDuplicate = mergedHistory.some(existing => existing.trim() === trimmedNew);
                    
                    if (!isDuplicate && trimmedNew) {
                        mergedHistory.push(newItem);
                        addedCount++;
                        console.log(`[动态世界-变量合并]   - ✅ 添加历史: ${newItem.substring(0, 50)}...`);
                    } else if (isDuplicate) {
                        console.log(`[动态世界-变量合并]   - ⏭️ 跳过重复: ${newItem.substring(0, 50)}...`);
                    }
                });
                
                // 只有在有实际更新时才合并
                if (addedCount > 0 || existing.favor !== newRel.favor || existing.opinion !== newRel.opinion) {
                    gameState.variables.relationships[existingIndex] = {
                        ...existing,
                        favor: newRel.favor !== undefined ? newRel.favor : existing.favor,
                        opinion: newRel.opinion !== undefined ? newRel.opinion : existing.opinion,
                        personality: newRel.personality !== undefined ? newRel.personality : existing.personality,
                        history: mergedHistory
                    };
                    
                    hasChanges = true;
                    console.log(`[动态世界-变量合并]   - ✅ 更新完成：${newRel.name}，历史记录：${existingHistory.length} → ${mergedHistory.length}（新增${addedCount}条）`);
                    console.log(`[动态世界-变量合并]   - favor: ${existing.favor} → ${newRel.favor}`);
                    console.log(`[动态世界-变量合并]   - opinion: ${existing.opinion} → ${newRel.opinion}`);
                } else {
                    console.log(`[动态世界-变量合并]   - ⏭️ 跳过（无新内容）`);
                }
            } else {
                console.log(`[动态世界-变量合并]   - 🆕 新角色，添加到列表`);
                
                // 添加新关系
                gameState.variables.relationships.push(newRel);
                hasChanges = true;
                console.log(`[动态世界-变量合并]   - ✅ 新增关系：${newRel.name}`);
                console.log(`[动态世界-变量合并]   - favor: ${newRel.favor}`);
                console.log(`[动态世界-变量合并]   - opinion: ${newRel.opinion}`);
                console.log(`[动态世界-变量合并]   - 历史记录: ${newRel.history?.length || 0} 条`);
            }
        }

        // 📊 显示合并后的状态
        console.log('[动态世界-变量合并] 📊 合并后主变量表单 relationships 数量:', gameState.variables.relationships?.length);
        console.log('[动态世界-变量合并] 📊 合并后完整的 relationships 列表:', 
            gameState.variables.relationships.map(r => `${r.name}(${r.history?.length || 0}条历史)`).join(', '));

        // 只有在有实际变化时才更新显示
        if (hasChanges) {
            updateStatusPanel();
            console.log('[动态世界-变量合并] ✅ 变量已合并并更新UI（有更新）');
        } else {
            console.log('[动态世界-变量合并] ⏭️ 变量已检查（无更新，未刷新UI）');
        }
    } else {
        console.warn('[动态世界-变量合并] ⚠️ dynamicVariables.relationships 不存在或不是数组');
        console.log('[动态世界-变量合并] dynamicVariables.relationships:', dynamicVariables.relationships);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 重新生成动态世界内容
async function regenerateDynamicWorld(index) {
    if (gameState.dynamicWorld.isProcessing) {
        alert('正在处理中，请稍候...');
        return;
    }

    if (!confirm('确定要重新生成这条动态世界内容吗？')) {
        return;
    }

    gameState.dynamicWorld.isProcessing = true;

    // 在动态世界容器内显示加载提示
    const dynamicWorldContainer = document.getElementById('dynamicWorldContainer');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'dynamic-world-regenerate-loading';
    loadingDiv.style.cssText = 'text-align: center; padding: 40px; background: #f8f9ff; border-radius: 12px; margin: 20px;';
    loadingDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">🌍</div>
        <div style="font-size: 16px; color: #667eea; margin-bottom: 10px;">
            <span class="loading"></span> AI正在重新生成动态世界内容...
        </div>
        <div style="font-size: 12px; color: #999;">请稍候...</div>
    `;
    dynamicWorldContainer.insertBefore(loadingDiv, dynamicWorldContainer.firstChild);

    try {
        // 获取配置
        const saved = localStorage.getItem('gameConfig');
        const config = saved ? JSON.parse(saved) : {};
        const dwConfig = config.dynamicWorld || {};

        const minWords = dwConfig.minWords || 300;
        const showReasoning = dwConfig.showReasoning !== undefined ? dwConfig.showReasoning : true;
        // 🔧 强制使用白虎宗的动态世界提示词
        let systemPrompt;
        if (dwConfig.prompt && dwConfig.prompt.trim()) {
            systemPrompt = dwConfig.prompt;
            console.log('[动态世界-重生成] 📝 使用用户自定义动态世界提示词');
        } else if (document.getElementById('dynamicWorldPrompt') && document.getElementById('dynamicWorldPrompt').value.trim()) {
            systemPrompt = document.getElementById('dynamicWorldPrompt').value;
            console.log('[动态世界-重生成] 📝 使用HTML中的动态世界提示词');
        } else if (typeof window.BaihuSectGameConfig !== 'undefined' && window.BaihuSectGameConfig.defaultDynamicWorldPrompt) {
            systemPrompt = window.BaihuSectGameConfig.defaultDynamicWorldPrompt;
            console.log('[动态世界-重生成] 🐅 使用白虎宗默认动态世界提示词');
        } else {
            systemPrompt = '你是一个白虎宗修仙世界的动态世界生成器。根据当前主角状态和位置，生成远方事件、势力动态、环境变化等背景信息。生成的世界事件应该符合白虎宗的世界观设定，体现修仙世界的特色和白虎宗的独特文化，包含适当的修仙元素：境界突破、法宝争夺、宗门争斗等。以第三人称叙述，语言风格古典雅致，每段50-100字，生成3-5个不同的背景事件。';
            console.log('[动态世界-重生成] 🐅 使用硬编码白虎宗动态世界提示词');
        }

        // 🆕 先获取当前变量状态
        const currentLocation = gameState.variables.location || '未知';
        const currentNPCs = gameState.variables.relationships.map(r => r.name).join('、') || '无';
        const currentTime = gameState.variables.currentDateTime || '未知';

        // 构建消息（只用当前变量，不用历史）
        let messages = [];

        // 🆕 集成知识库检索功能
        let knowledgeContext = '';
        const enableKnowledge = dwConfig.enableKnowledge !== undefined ? dwConfig.enableKnowledge : true;
        if (window.contextVectorManager && 
            document.getElementById('enableVectorRetrieval')?.checked && 
            enableKnowledge) {
            try {
                console.log('[动态世界-重生成] 开始知识库检索...');
                
                // 构建检索查询（基于当前游戏状态）
                const queryText = `动态世界重新生成 ${currentLocation} ${currentTime} 远方事件 势力动态`;
                
                // 使用buildOptimizedMessages获取知识库内容
                const optimizedMessages = await window.contextVectorManager.buildOptimizedMessages(
                    systemPrompt,
                    gameState.variables,
                    queryText,
                    0, // 不需要对话历史
                    [], // 空的完整对话历史
                    queryText // 传入检索查询
                );
                
                // 提取知识库相关的系统消息
                const knowledgeMessages = optimizedMessages.filter(msg => 
                    msg.role === 'system' && (
                        msg.content.includes('【相关历史回忆】') ||
                        msg.content.includes('【相关知识库】') ||
                        msg.content.includes('【⭐ 重点常驻知识】') ||
                        msg.content.includes('【📌 次重点常驻知识】') ||
                        msg.content.includes('【常驻知识库】')
                    )
                );
                
                if (knowledgeMessages.length > 0) {
                    // 🆕 优化知识库内容格式，添加删除标记
                    knowledgeContext = '\n\n【🌍 动态世界知识库参考 - 可通过设置关闭】\n' + 
                        knowledgeMessages.map((msg, index) => {
                            let content = msg.content;
                            // 为每个知识库块添加标记，便于识别和管理
                            if (content.includes('【相关历史回忆】')) {
                                content = '📜 [历史记忆] ' + content;
                            } else if (content.includes('【相关知识库】')) {
                                content = '📚 [相关知识] ' + content;
                            } else if (content.includes('【⭐ 重点常驻知识】')) {
                                content = '⭐ [重点知识] ' + content;
                            } else if (content.includes('【📌 次重点常驻知识】')) {
                                content = '📌 [次重点知识] ' + content;
                            } else if (content.includes('【常驻知识库】')) {
                                content = '📖 [常驻知识] ' + content;
                            }
                            return content;
                        }).join('\n\n');
                    console.log(`[动态世界-重生成] 已集成 ${knowledgeMessages.length} 条知识库内容`);
                }
                
            } catch (error) {
                console.warn('[动态世界-重生成] 知识库检索失败:', error);
            }
        } else if (!enableKnowledge) {
            console.log('[动态世界-重生成] 知识库检索已通过设置关闭');
        }

        // 添加系统提示词（包含知识库内容）
        const finalSystemPrompt = systemPrompt + knowledgeContext;
        messages.push({
            role: 'system',
            content: finalSystemPrompt
        });
        
        const variableContext = `
【当前主角状态】（仅供参考，禁止修改）
- 当前时间：${currentTime}
- 当前位置：${currentLocation}
- 身边的NPC：${currentNPCs}

【严格要求】
- 重新生成远离主角的世界事件（其他地方、其他人物）
-  禁止推进时间！描述的是"此时此刻"（${currentTime}）其他地方发生的事
-  禁止涉及主角当前位置"${currentLocation}"的任何事件！
-  禁止涉及以下NPC：${currentNPCs}（他们可能在主角身边）
-  禁止描述主角在做什么！
-  正确做法：描述完全不同地点的远方传闻、势力动态
-  可以添加新的远方NPC到variables.relationships（但必须是主角不认识的、远方传闻中的人物）
-  不要修改已存在的NPC数据（系统会自动去重合并history）
- 字数要求：至少${minWords}字
- 提供不同的视角和事件（远方传闻）
        `.trim();

        messages.push({
            role: 'user',
            content: variableContext
        });

        messages.push({
            role: 'user',
            content: '请生成新的动态世界内容。\n\n【极其重要】必须输出完整的JSON结构，所有字段都必须完整，不能在中途截断！确保所有花括号、方括号、引号都正确闭合！'
        });

        // 调用API
        const response = await callExtraAPI(messages);

        // 🔍 调试输出
        console.log('[动态世界-重生成] API 原始响应长度:', response.length, '字符');
        console.log('[动态世界-重生成] API 响应结尾:', response.substring(Math.max(0, response.length - 200)));

        // 解析响应
        const data = parseAIResponse(response);

        // 🔍 调试输出：显示动态世界完整数据
        if (debugMode || document.getElementById('debugMode')?.checked) {
            console.log('[动态世界-重生成-调试] 📦 完整AI响应数据:');
            console.log('[动态世界-重生成-调试] - 原始响应长度:', response.length);
            console.log('[动态世界-重生成-调试] - 解析后的story:', data.story?.substring(0, 200));
            console.log('[动态世界-重生成-调试] - variables字段:', data.variables);
            console.log('[动态世界-重生成-调试] - variableUpdate字段:', data.variableUpdate);
            console.log('[动态世界-重生成-调试] - relationships:', data.variables?.relationships);
            
            // 在调试面板显示完整内容
            const debugContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 动态世界重新生成 - 完整输出
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【原始AI响应】(${response.length}字符)
${response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【解析后的数据】
${JSON.stringify(data, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【变量表单 (variables)】
${data.variables ? JSON.stringify(data.variables, null, 2) : '无'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【变量更新指令 (variableUpdate)】
${data.variableUpdate || '无'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【人际关系 (从variables提取)】
${data.variables?.relationships ? JSON.stringify(data.variables.relationships, null, 2) : '无'}
`;
            showDebugOutput(debugContent);
        }

        // 🔧 安全检查：确保data.story存在
        if (!data || !data.story) {
            console.error('[动态世界] 解析失败：data.story不存在');
            throw new Error('AI响应解析失败，未能提取到故事内容。请检查API响应格式。');
        }

        // 更新历史记录
        gameState.dynamicWorld.history[index] = {
            ...gameState.dynamicWorld.history[index],
            story: data.story,
            reasoning: data.reasoning,
            variables: data.variables || {},
            variableUpdate: data.variableUpdate || null, // 🆕 保存v3.1格式的指令
            timestamp: Date.now()
        };

        // 合并变量（支持两种格式）
        console.log('[动态世界-重生成] 准备合并变量...');
        console.log('[动态世界-重生成] - data.variables:', data.variables);
        console.log('[动态世界-重生成] - data.variableUpdate:', data.variableUpdate);
        
        if (data.variableUpdate) {
            // v3.1 指令格式
            console.log('[动态世界-重生成] 🎯 检测到 variableUpdate 格式（v3.1指令）');
            try {
                // 初始化 v3.1 解析器
                if (!window.v31Parser) {
                    console.log('[动态世界-重生成] 初始化 v3.1 解析器...');
                    window.v31Parser = new VariableInstructionParserV31(gameState, {
                        debug: true,
                        enableRollback: false
                    });
                }
                
                // 解析并执行变量更新
                const result = window.v31Parser.execute(data.variableUpdate);
                console.log('[动态世界-重生成] ✅ v3.1 变量更新结果:', result);
                console.log('[动态世界-重生成] 更新后的主变量表单 relationships 数量:', gameState.variables.relationships?.length);
                
                // 更新UI
                updateStatusPanel();
            } catch (error) {
                console.error('[动态世界-重生成] ❌ v3.1 变量更新失败:', error);
                console.error('[动态世界-重生成] 错误详情:', error.message);
            }
        } else if (data.variables) {
            // 完整变量表单格式
            console.log('[动态世界-重生成] 📋 检测到 variables 格式（完整表单）');
            console.log('[动态世界-重生成] 开始合并变量到主变量表单...');
            mergeDynamicWorldVariables(data.variables);
            console.log('[动态世界-重生成] ✅ 变量合并完成');
            console.log('[动态世界-重生成] 合并后的主变量表单 relationships 数量:', gameState.variables.relationships?.length);
        } else {
            console.warn('[动态世界-重生成] ⚠️ AI响应中既没有variables字段，也没有variableUpdate字段！');
            console.warn('[动态世界-重生成] 完整的data对象:', data);
        }

        // 🆕 添加到向量库（用于后续检索）
        if (window.contextVectorManager && document.getElementById('enableVectorRetrieval')?.checked) {
            const floor = gameState.dynamicWorld.history[index].floor;
            // 使用负数作为动态世界的turnIndex，避免与主对话冲突
            const dynamicWorldTurnIndex = -floor;
            
            // 🔧 安全地截取story（防止故事太短）
            const storyPreview = data.story.length > 100 ? data.story.substring(0, 100) : data.story;
            
            await window.contextVectorManager.addConversation(
                '[动态世界-重生成] ' + storyPreview,
                data.story,
                dynamicWorldTurnIndex,
                data.story
            );
            // 保存向量库到IndexedDB
            await window.contextVectorManager.saveToIndexedDB();
            console.log(`[动态世界] 已向量化重新生成的内容（楼层${floor}，turnIndex: ${dynamicWorldTurnIndex}）并保存到IndexedDB`);
        }

        // 移除加载提示
        const loading = document.getElementById('dynamic-world-regenerate-loading');
        if (loading) loading.remove();

        // 更新动态世界标签页显示
        displayDynamicWorldHistory();

        console.log('[动态世界] 重新生成成功');

        // 自动保存游戏（包含动态世界数据）
        await saveGameHistory();
        console.log('[动态世界] 已自动保存到存档');
        console.log('[动态世界] 当前历史记录数:', gameState.dynamicWorld.history.length);

    } catch (error) {
        console.error('[动态世界] 重新生成失败:', error);
        
        // 🔧 提供更详细的错误信息和解决建议
        let errorMsg = '重新生成失败：' + error.message;
        if (error.message.includes('AI响应解析失败')) {
            errorMsg += '\n\n可能的解决方案：\n';
            errorMsg += '1. 检查API配置，确保模型支持JSON格式输出\n';
            errorMsg += '2. 降低"动态世界最小字数"设置（建议150-200字）\n';
            errorMsg += '3. 增加API的max_tokens限制\n';
            errorMsg += '4. 尝试使用不同的AI模型';
        }
        
        alert(errorMsg);
    } finally {
        gameState.dynamicWorld.isProcessing = false;
    }
}

// 在游戏历史中显示动态世界消息
function displayDynamicWorldMessage(story, reasoning = null, showReasoning = true, isRegenerate = false) {
    const historyDiv = document.getElementById('gameHistory');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.setAttribute('data-message-index', historyDiv.children.length);

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    // 添加复选框（仅在删除模式下显示）
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'message-checkbox';
    checkbox.style.display = gameState.deleteMode ? 'inline-block' : 'none';
    checkbox.onclick = (e) => {
        e.stopPropagation();
        handleMessageCheck(messageDiv);
    };

    headerDiv.innerHTML = `
        <span>🌍 动态世界${isRegenerate ? '（重新生成）' : ''}</span>
    `;
    headerDiv.insertBefore(checkbox, headerDiv.firstChild);

    messageDiv.appendChild(headerDiv);

    // 添加思维链显示（如果有且启用了显示）
    if (reasoning && showReasoning) {
        const reasoningHtml = createDynamicWorldReasoningDisplay(reasoning);
        // 将HTML字符串转换为DOM元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = reasoningHtml;
        const reasoningDiv = tempDiv.firstElementChild;
        if (reasoningDiv) {
            messageDiv.appendChild(reasoningDiv);
        }
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = story;

    messageDiv.appendChild(contentDiv);

    historyDiv.appendChild(messageDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// 📨 触发好友自动消息（在动态世界生成后或独立触发）
function triggerAutoFriendMessage() {
    if (typeof window.generateAutoFriendMessage === 'function') {
        window.generateAutoFriendMessage().catch(err => {
            console.error('[📨好友自动消息] 生成异常:', err);
        });
    }
}

// 在动态世界生成完成后的钩子中添加好友消息触发
// 由于动态世界和好友消息都需要在主对话后触发，我们统一处理
window.triggerPostMessageHooks = function() {
    // 触发动态世界
    if (typeof generateDynamicWorld === 'function') {
        generateDynamicWorld().catch(err => console.error('[动态世界] 生成异常:', err));
    }
    
    // 触发好友自动消息
    triggerAutoFriendMessage();
};

console.log('[动态世界函数] 模块已加载（含好友自动消息触发钩子）');
