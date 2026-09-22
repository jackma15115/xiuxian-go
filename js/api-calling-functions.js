/**
 * API调用函数模块
 * 包含：AI调用、额外API调用、OpenAI格式调用、Gemini格式调用等
 * 从 game.html 中提取的API调用功能模块
 */

// ==================== 服务端配置与代理状态 ====================
window.serverConfig = window.serverConfig || null;

async function checkServerConfig() {
    if (window.serverConfig) return window.serverConfig;
    try {
        const res = await fetch('/api/config');
        if (res.ok) {
            window.serverConfig = await res.json();
            console.log('[Server Config] Go服务端配置已加载:', window.serverConfig);
            return window.serverConfig;
        }
    } catch (e) {
        // 非Go服务端模式运行
    }
    window.serverConfig = { serverMode: false, hasMain: false, hasExtra: false, hasEmbedding: false };
    return window.serverConfig;
}

// 自动预查服务端配置
checkServerConfig();

/**
 * 通过 SSE (Server-Sent Events) 调用服务端 API
 * 无论服务端配置是流式还是非流式，均统一通过 SSE 传输，并在等待上游响应时接收 keep-alive 保活心跳
 * 彻底防止 Cloudflare 524 超时及中间网关超时问题
 *
 * @param {string} url - API 端点 (如 /api/chat, /api/extra, /api/mobile)
 * @param {object} payload - 请求载荷 ({ messages, max_tokens, temperature })
 * @returns {Promise<string>} - 组装后的完整回复
 */
async function callServerSSE(url, payload) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errDetail = '';
        try {
            const errJson = await response.json();
            errDetail = errJson.error?.message || JSON.stringify(errJson);
        } catch (_) {
            errDetail = await response.text();
        }
        throw new Error(`请求服务端失败 (${response.status}): ${errDetail}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
        const data = await response.json();
        return data.content || data.choices?.[0]?.message?.content || '';
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullContent = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // 未完成的行放回 buffer

            for (const line of lines) {
                const trimmed = line.trim();
                // 忽略空行以及 SSE 注释行（如 : keep-alive 保活心跳）
                if (!trimmed || trimmed.startsWith(':')) {
                    continue;
                }

                if (trimmed.startsWith('data:')) {
                    const dataStr = trimmed.slice(5).trim();
                    if (dataStr === '[DONE]') {
                        continue;
                    }

                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.error) {
                            throw new Error(parsed.error.message || 'Stream error');
                        }

                        // 1. 标准流式 delta: choices[0].delta.content
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                            fullContent += delta;
                            continue;
                        }

                        // 2. 完整响应 message: choices[0].message.content
                        const msgContent = parsed.choices?.[0]?.message?.content;
                        if (msgContent) {
                            fullContent = msgContent;
                            continue;
                        }

                        // 3. 顶层 content
                        if (parsed.content) {
                            fullContent = parsed.content;
                            continue;
                        }

                        // 4. OpenAI Responses API 兼容: output_text
                        if (parsed.output_text) {
                            fullContent = parsed.output_text;
                            continue;
                        }
                    } catch (e) {
                        if (e.message && e.message.includes('Stream error')) {
                            throw e;
                        }
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    return fullContent;
}

// 调用额外API
async function callExtraAPI(messages) {
    const sCfg = await checkServerConfig();
    // 优先使用服务端代理（若额外API未配置，服务端自动回退走主API）
    if (sCfg && sCfg.serverMode && (sCfg.hasExtra || sCfg.hasMain)) {
        const savedConfig = localStorage.getItem('gameConfig');
        const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 16384) : 16384;
        return await callServerSSE('/api/extra', {
            messages: messages,
            max_tokens: userMaxTokens,
            temperature: 0.9
        });
    }

    const endpoint = extraApiConfig.type === 'gemini' 
        ? `${extraApiConfig.endpoint}/models/${extraApiConfig.model}:generateContent?key=${extraApiConfig.key}`
        : `${extraApiConfig.endpoint}/chat/completions`;

    let requestBody;
    let headers = { 'Content-Type': 'application/json' };

    if (extraApiConfig.type === 'gemini') {
        // Gemini格式
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const systemInstruction = messages.find(m => m.role === 'system')?.content || '';

        requestBody = {
            contents: contents,
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192
            }
        };
    } else {
        // OpenAI格式（包括 Claude API 和第三方 API）
        headers['Authorization'] = `Bearer ${extraApiConfig.key}`;
        
        // 🔧 获取用户配置的 max_tokens（优先）或使用默认值
        const savedConfig = localStorage.getItem('gameConfig');
        const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 16384) : 16384;
        
        requestBody = {
            model: extraApiConfig.model,
            messages: messages,
            temperature: 0.9,
            max_tokens: userMaxTokens  // 使用用户配置的值
        };
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // 提取内容
    if (extraApiConfig.type === 'gemini') {
        return data.candidates[0].content.parts[0].text;
    } else {
        return data.choices[0].message.content;
    }
}

// 调用AI
async function callAI(userMessage, isTest = false, originalUserInput = null) {
    const sCfg = await checkServerConfig();

    let messages = [];
    if (!isTest) {
        // 🔧 传入原始用户输入（用于向量检索）
        messages = await buildAIMessages(userMessage, originalUserInput);
    } else {
        messages = [
            { role: 'user', content: '你好' }
        ];
    }

    // 优先通过Go服务端代理（无跨域，支持ENV主配置，统一走SSE与心跳）
    if (sCfg && sCfg.serverMode && sCfg.hasMain) {
        try {
            const savedConfig = localStorage.getItem('gameConfig');
            const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 16384) : 16384;
            return await callServerSSE('/api/chat', {
                messages: messages,
                max_tokens: userMaxTokens,
                temperature: 0.8
            });
        } catch (error) {
            console.error('服务端AI调用错误:', error);
            throw error;
        }
    }

    // 确保配置已加载（纯前端回退）
    if (!apiConfig.endpoint || !apiConfig.key || !apiConfig.model) {
        throw new Error('请先配置并保存API连接');
    }

    try {
        if (apiConfig.type === 'gemini') {
            return await callGemini(messages);
        } else {
            return await callOpenAI(messages);
        }
    } catch (error) {
        console.error('AI调用错误:', error);
        throw error;
    }
}

// 调用额外API（供其他用途使用）
async function callExtraAI(messages, systemPrompt = null) {
    // 如果提供了系统提示词，添加到消息开头
    if (systemPrompt) {
        messages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];
    }

    const sCfg = await checkServerConfig();
    // 优先走服务端代理（如果未配置额外API，服务端默认回退走主API）
    if (sCfg && sCfg.serverMode && (sCfg.hasExtra || sCfg.hasMain)) {
        return await callExtraAPI(messages);
    }

    // 确保额外API已启用并配置（前端直连回退）
    if (!extraApiConfig.enabled) {
        throw new Error('额外API未启用');
    }
    
    if (!extraApiConfig.endpoint || !extraApiConfig.key || !extraApiConfig.model) {
        throw new Error('请先配置并保存额外API连接');
    }

    try {
        if (extraApiConfig.type === 'gemini') {
            return await callExtraGemini(messages);
        } else {
            return await callExtraOpenAI(messages);
        }
    } catch (error) {
        console.error('额外API调用错误:', error);
        throw error;
    }
}

// 使用额外API的OpenAI格式调用
async function callExtraOpenAI(messages) {
    const fullEndpoint = getFullEndpoint(extraApiConfig.endpoint, extraApiConfig.type);

    // 🔧 获取用户配置的 max_tokens
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 16384) : 16384;

    const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${extraApiConfig.key}`
        },
        body: JSON.stringify({
            model: extraApiConfig.model,
            messages: messages,
            temperature: 0.8,
            max_tokens: userMaxTokens  // 使用用户配置的值
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`额外API错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// 使用额外API的Gemini格式调用
async function callExtraGemini(messages) {
    // 1. 分离系统提示和对话历史
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 2. 转换对话历史为Gemini格式
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 3. 构建 Gemini 端点
    let baseEndpoint = extraApiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + extraApiConfig.model + ':generateContent?key=' + extraApiConfig.key;

    // 4. 构建请求体
    const requestBody = {
        contents: contents,
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`额外Gemini API错误: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`额外Gemini API错误: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        return "(额外API)请求被模型阻止，可能触发了安全设置。";
    }

    return data.candidates[0].content.parts[0].text;
}

// OpenAI格式调用
async function callOpenAI(messages) {
    // 获取完整的聊天端点
    const fullEndpoint = getFullEndpoint(apiConfig.endpoint, apiConfig.type);

    // 🔧 获取用户配置的 max_tokens
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 16384) : 16384;

    const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiConfig.key}`
        },
        body: JSON.stringify({
            model: apiConfig.model,
            messages: messages,
            temperature: 0.8,
            max_tokens: userMaxTokens  // 使用用户配置的值
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Gemini格式调用
async function callGemini(messages) {
    // 1. 分离系统提示和对话历史
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 2. 转换对话历史为Gemini格式
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 3. 构建 Gemini 端点
    let baseEndpoint = apiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + apiConfig.model + ':generateContent?key=' + apiConfig.key;

    // 4. 构建请求体
    const requestBody = {
        contents: contents,
        // 仅在有系统提示时才添加
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192 // 根据需要调整
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            // 尝试解析为JSON以获取更详细的错误信息
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`Gemini API错误: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            // 如果解析失败，则返回原始文本
            throw new Error(`Gemini API错误: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();
    
    // 检查是否有候选内容返回
    if (!data.candidates || data.candidates.length === 0) {
        // 如果因为安全设置等原因被阻止，通常 candidates 数组为空
        return "请求被模型阻止，可能触发了安全设置。请尝试修改输入内容。";
    }
    
    return data.candidates[0].content.parts[0].text;
}

// ==================== 📱 手机API调用函数 ====================

/**
 * 调用手机API（第三个API）
 * @param {Array} messages - 消息数组
 * @returns {Promise<string>} - AI回复内容
 */
async function callMobileAPI(messages) {
    const sCfg = await checkServerConfig();
    // 优先走Go服务端代理（统一走SSE与心跳）
    if (sCfg && sCfg.serverMode && (sCfg.hasExtra || sCfg.hasMain)) {
        const savedConfig = localStorage.getItem('gameConfig');
        const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 16384) : 16384;
        return await callServerSSE('/api/mobile', {
            messages: messages,
            max_tokens: userMaxTokens,
            temperature: 0.8
        });
    }

    // 确保手机API已配置（纯前端回退）
    if (!window.mobileApiConfig || !window.mobileApiConfig.enabled) {
        throw new Error('手机API未启用');
    }
    
    if (!window.mobileApiConfig.endpoint || !window.mobileApiConfig.key || !window.mobileApiConfig.model) {
        throw new Error('请先配置并保存手机API连接');
    }

    try {
        if (window.mobileApiConfig.type === 'gemini') {
            return await callMobileGemini(messages);
        } else {
            return await callMobileOpenAI(messages);
        }
    } catch (error) {
        console.error('[手机API] 调用错误:', error);
        throw error;
    }
}

/**
 * 使用手机API的OpenAI格式调用
 */
async function callMobileOpenAI(messages) {
    const fullEndpoint = getFullEndpoint(window.mobileApiConfig.endpoint, window.mobileApiConfig.type);

    // 获取用户配置的 max_tokens
    const savedConfig = localStorage.getItem('gameConfig');
    const userMaxTokens = savedConfig ? (JSON.parse(savedConfig).maxTokens || 16384) : 16384;

    const response = await fetch(fullEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.mobileApiConfig.key}`
        },
        body: JSON.stringify({
            model: window.mobileApiConfig.model,
            messages: messages,
            temperature: 0.8,
            max_tokens: userMaxTokens
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`手机API错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * 使用手机API的Gemini格式调用
 */
async function callMobileGemini(messages) {
    // 分离系统提示和对话历史
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const historyMessages = messages.filter(m => m.role !== 'system');

    // 转换对话历史为Gemini格式
    const contents = historyMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 构建 Gemini 端点
    let baseEndpoint = window.mobileApiConfig.endpoint.trim().replace(/\/+$/, '');
    const endpoint = baseEndpoint + '/models/' + window.mobileApiConfig.model + ':generateContent?key=' + window.mobileApiConfig.key;

    // 构建请求体
    const requestBody = {
        contents: contents,
        ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            const detailedMessage = errorJson.error?.message || errorBody;
            throw new Error(`手机Gemini API错误: ${response.status} - ${detailedMessage}`);
        } catch (e) {
            throw new Error(`手机Gemini API错误: ${response.status} - ${errorBody}`);
        }
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
        return "(手机API)请求被模型阻止，可能触发了安全设置。";
    }

    return data.candidates[0].content.parts[0].text;
}

/**
 * 为手机构建完整的AI消息上下文
 * 支持知识库、向量检索、人物图谱、History矩阵等功能
 * @param {string} userMessage - 用户消息
 * @param {string} chatContext - 聊天对象上下文（如聊天对象名称）
 * @returns {Promise<Array>} - 构建好的messages数组
 */
async function buildMobileAIMessages(userMessage, chatContext = '') {
    const settings = window.mobilePhoneSettings || {};
    const showDetails = settings.showBuildDetails !== false;
    
    if (showDetails) {
        console.log('[📱手机上下文构建] ==== 开始构建 ====');
        console.log('[📱手机上下文构建] 用户消息:', userMessage);
        console.log('[📱手机上下文构建] 聊天上下文:', chatContext);
    }
    
    let contextParts = [];
    
    // 1. 知识库检索
    if (settings.useKnowledgeBase && window.contextManager && window.contextManager.staticKnowledgeBase) {
        try {
            const kbResults = await window.contextManager.retrieveFromStaticKB(userMessage);
            if (kbResults && kbResults.length > 0) {
                const kbContent = kbResults.map(r => `【${r.title}】\n${r.content}`).join('\n\n');
                contextParts.push(`【知识库参考】\n${kbContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 知识库检索结果:', kbResults.length, '条');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 知识库检索失败:', e);
        }
    }
    
    // 2. 向量检索历史
    if (settings.useVectorRetrieval && window.contextManager) {
        try {
            const vectorResults = await window.contextManager.retrieveRelevantHistory(userMessage);
            if (vectorResults && vectorResults.length > 0) {
                const vectorContent = vectorResults.map(r => r.summary || `用户:${r.userMessage}\nAI:${r.aiResponse?.substring(0, 200)}...`).join('\n---\n');
                contextParts.push(`【相关历史记忆】\n${vectorContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 向量检索结果:', vectorResults.length, '条');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 向量检索失败:', e);
        }
    }
    
    // 3. 人物图谱检索
    if (settings.useCharacterGraph && window.characterGraphManager) {
        try {
            const charResults = await window.characterGraphManager.searchByText(userMessage + ' ' + chatContext);
            if (charResults && charResults.length > 0) {
                const charContent = charResults.map(c => {
                    let info = `【${c.name}】`;
                    if (c.relation) info += ` 关系:${c.relation}`;
                    if (c.personality) info += ` 性格:${c.personality}`;
                    if (c.appearance) info += ` 外貌:${c.appearance}`;
                    if (c.history && c.history.length > 0) {
                        info += `\n  历史互动: ${c.history.slice(-3).join('; ')}`;
                    }
                    return info;
                }).join('\n');
                contextParts.push(`【相关人物信息】\n${charContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 人物图谱检索结果:', charResults.length, '人');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 人物图谱检索失败:', e);
        }
    }
    
    // 4. History矩阵检索
    if (settings.useHistoryMatrix && window.matrixManager && window.matrixManager.historyMatrix) {
        try {
            const matrixResults = window.matrixManager.historyMatrix.searchByMatrix(userMessage, 10);
            if (matrixResults && matrixResults.length > 0) {
                const matrixContent = matrixResults.map(h => h.aiResponse || h.content || h.text || h).join('\n---\n');
                contextParts.push(`【历史事件矩阵】\n${matrixContent}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] History矩阵检索结果:', matrixResults.length, '条');
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] History矩阵检索失败:', e);
        }
    }
    
    // 5. 📖 读取主API最近正文层数
    const mainApiHistoryDepth = settings.mainApiHistoryDepth ?? 5;
    // 兼容两种历史记录字段名：gameHistory（主要）和 conversationHistory（备用）
    const mainHistory = window.gameState?.gameHistory || window.gameState?.conversationHistory;
    if (mainApiHistoryDepth > 0 && mainHistory && mainHistory.length > 0) {
        try {
            const history = mainHistory;
            // conversationHistory 格式: [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}, ...]
            // 需要配对提取，每2条为1层
            const totalPairs = Math.floor(history.length / 2);
            const startPair = Math.max(0, totalPairs - mainApiHistoryDepth);
            
            if (totalPairs > 0) {
                let recentContent = '';
                let floorNum = startPair + 1;
                
                for (let i = startPair * 2; i < history.length - 1; i += 2) {
                    const userEntry = history[i];
                    const aiEntry = history[i + 1];
                    
                    // 确保是 user-assistant 配对
                    if (userEntry?.role === 'user' && aiEntry?.role === 'assistant') {
                        const userMsg = userEntry.content || '';
                        const aiMsg = aiEntry.content || '';
                        
                        // 发送完整内容，不截取
                        recentContent += `[第${floorNum}层]\n玩家: ${userMsg}\nAI: ${aiMsg}\n\n`;
                        floorNum++;
                    }
                }
                
                if (recentContent) {
                    const mainApiContext = `【主线剧情（最近${floorNum - startPair - 1}层）】\n${recentContent.trim()}`;
                    contextParts.push(mainApiContext);
                    if (showDetails) {
                        console.log('[📱手机上下文构建] 📖 读取主API正文:', floorNum - startPair - 1, '层');
                        console.log('[📱手机上下文构建] 📖 内容预览:', mainApiContext.substring(0, 200) + '...');
                    }
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 读取主API正文失败:', e);
        }
    }
    
    // 6. 🔍 向量检索远处正文（匹配主对话的相关内容）
    if (settings.useMainVectorSearch && window.contextVectorManager) {
        try {
            const vectorSearchCount = settings.vectorSearchCount || 3;
            const farResults = await window.contextVectorManager.retrieveRelevant(userMessage, vectorSearchCount, 'conversation');
            
            if (farResults && farResults.length > 0) {
                let farContent = '';
                farResults.forEach((item, index) => {
                    const userMsg = item.userMessage || '';
                    const aiMsg = item.aiResponse || '';
                    
                    // 截取合理长度
                    const userPreview = userMsg.substring(0, 80) + (userMsg.length > 80 ? '...' : '');
                    const aiPreview = aiMsg.substring(0, 250) + (aiMsg.length > 250 ? '...' : '');
                    
                    farContent += `[匹配${index + 1}] 相似度:${(item.similarity * 100).toFixed(1)}%\n玩家: ${userPreview}\nAI: ${aiPreview}\n\n`;
                });
                
                contextParts.push(`【相关远处剧情（向量匹配）】\n${farContent.trim()}`);
                if (showDetails) {
                    console.log('[📱手机上下文构建] 🔍 向量检索远处正文:', farResults.length, '条');
                    farResults.forEach((item, i) => {
                        console.log(`   [${i+1}] 相似度: ${(item.similarity * 100).toFixed(1)}%`);
                    });
                }
            }
        } catch (e) {
            console.warn('[📱手机上下文构建] 向量检索远处正文失败:', e);
        }
    }
    
    // 7. 获取当前游戏状态摘要
    let gameStateSummary = '';
    if (window.gameState && window.gameState.variables) {
        const v = window.gameState.variables;
        gameStateSummary = `【当前状态】
角色: ${v.name || '未知'} | ${v.gender || ''} | ${v.age || ''}岁
身份: ${v.identity || '无'}
位置: ${v.location || '未知'}
时间: ${v.currentDateTime || '未知'}`;
        if (showDetails) {
            console.log('[📱手机上下文构建] 游戏状态已添加');
        }
    }
    
    // 构建最终上下文
    const fullContext = [gameStateSummary, ...contextParts].filter(Boolean).join('\n\n');
    
    if (showDetails) {
        console.log('[📱手机上下文构建] ==== 构建完成 ====');
        console.log('[📱手机上下文构建] 上下文总长度:', fullContext.length, '字符');
    }
    
    // 构建messages数组（不包含系统提示词，后续由调用方添加）
    const messages = [];
    
    // 添加上下文作为系统消息的一部分
    if (fullContext) {
        messages.push({
            role: 'system',
            content: `你是一个游戏中的虚拟手机助手。以下是相关的上下文信息：\n\n${fullContext}\n\n请根据这些信息回答用户的问题。`
        });
    }
    
    // 添加用户消息
    messages.push({
        role: 'user',
        content: userMessage
    });
    
    return messages;
}
