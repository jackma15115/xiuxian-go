/**
 * 📨 好友自动消息功能模块
 * 类似动态世界，每隔N层楼自动触发，随机选择好友发送消息
 */

// 消息计数器（用于判断是否达到触发间隔）
window.autoFriendMessageCounter = 0;

// 是否正在处理中
window.autoFriendMessageProcessing = false;

/**
 * 生成好友自动消息
 * @param {boolean} forceGenerate - 是否强制生成（忽略间隔计数）
 */
async function generateAutoFriendMessage(forceGenerate = false) {
    console.log('[📨好友自动消息] 触发生成函数');
    
    // 获取设置
    const settings = window.mobilePhoneSettings || {};
    
    // 检查是否启用
    if (!settings.enableAutoFriendMessage) {
        console.log('[📨好友自动消息] 功能未启用，跳过');
        return;
    }
    
    // 检查手机API是否配置（服务端模式自动代理并回退走主API）
    const isServer = window.serverConfig && window.serverConfig.serverMode;
    const mobileApiConfig = window.mobileApiConfig || {};
    if (!isServer && (!mobileApiConfig.enabled || !mobileApiConfig.key)) {
        console.warn('[📨好友自动消息] 手机API未配置，跳过');
        return;
    }
    
    // 增加计数器并检查间隔
    if (!forceGenerate) {
        window.autoFriendMessageCounter = (window.autoFriendMessageCounter || 0) + 1;
        const interval = settings.autoFriendMessageInterval || 3;
        
        if (window.autoFriendMessageCounter < interval) {
            console.log(`[📨好友自动消息] 未达到间隔（${window.autoFriendMessageCounter}/${interval}），跳过`);
            return;
        }
        
        // 达到间隔，重置计数器
        console.log('[📨好友自动消息] 达到生成间隔，开始生成');
        window.autoFriendMessageCounter = 0;
    } else {
        console.log('[📨好友自动消息] 强制触发生成');
    }
    
    // 避免重复处理
    if (window.autoFriendMessageProcessing) {
        console.warn('[📨好友自动消息] 正在处理中，跳过');
        return;
    }
    
    window.autoFriendMessageProcessing = true;
    
    try {
        // 1. 获取好友列表
        const contacts = getAvailableContacts();
        if (contacts.length === 0) {
            console.log('[📨好友自动消息] 没有可用的好友联系人');
            window.autoFriendMessageProcessing = false;
            return;
        }
        
        // 2. 随机选择一位好友
        const randomFriend = contacts[Math.floor(Math.random() * contacts.length)];
        console.log('[📨好友自动消息] 随机选中好友:', randomFriend.name);
        
        // 3. 收集上下文信息
        const contextData = await collectContextData(randomFriend, settings);
        
        // 4. 构建API请求
        const messageCount = {
            min: settings.autoFriendMessageMinCount || 3,
            max: settings.autoFriendMessageMaxCount || 5
        };
        
        const systemPrompt = window.MobilePrompts?.autoFriendMessage?.buildSystemPrompt(
            randomFriend.name, 
            messageCount
        );
        
        const userMessage = window.MobilePrompts?.autoFriendMessage?.buildUserMessage({
            friendInfo: contextData.friendInfo,
            chatHistory: contextData.chatHistory,
            gameContext: contextData.gameContext,
            vectorMatches: contextData.vectorMatches,
            historyRecords: contextData.historyRecords
        });
        
        console.log('[📨好友自动消息] 发送API请求...');
        console.log('[📨好友自动消息] 系统提示词长度:', systemPrompt?.length || 0);
        console.log('[📨好友自动消息] 用户消息长度:', userMessage?.length || 0);
        
        // 检查消息是否正确构建
        if (!systemPrompt || !userMessage) {
            console.error('[📨好友自动消息] 消息构建失败！');
            console.error('  - systemPrompt:', systemPrompt);
            console.error('  - userMessage:', userMessage);
            window.autoFriendMessageProcessing = false;
            return;
        }
        
        // 5. 调用手机API
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ];
        
        console.log('[📨好友自动消息] 发送消息预览:', JSON.stringify(messages).substring(0, 500) + '...');
        
        const response = await callMobileAPIForAutoMessage(messages);
        
        console.log('[📨好友自动消息] API响应:', response?.substring(0, 500) || '(空响应)');
        
        // 6. 解析回复
        const replies = window.MobilePrompts?.autoFriendMessage?.parseAIReply(response);
        
        if (!replies || replies.length === 0) {
            console.warn('[📨好友自动消息] AI未返回有效消息');
            window.autoFriendMessageProcessing = false;
            return;
        }
        
        console.log(`[📨好友自动消息] 收到 ${replies.length} 条消息`);
        
        // 7. 保存消息到聊天记录
        await saveAutoMessages(randomFriend, replies);
        
        // 8. 显示通知
        showAutoMessageNotification(randomFriend, replies.length);
        
        // 9. 🔧 触发自动存档，确保消息持久化到IndexedDB
        if (typeof saveGameHistory === 'function') {
            saveGameHistory().then(() => {
                console.log('[📨好友自动消息] 已自动保存到存档');
            }).catch(err => {
                console.warn('[📨好友自动消息] 自动存档失败:', err);
            });
        }
        
        console.log('[📨好友自动消息] 生成完成');
        
    } catch (error) {
        console.error('[📨好友自动消息] 生成失败:', error);
    } finally {
        window.autoFriendMessageProcessing = false;
    }
}

/**
 * 获取可用的好友联系人列表
 */
function getAvailableContacts() {
    let contacts = [];
    
    // 从 localStorage 获取手机聊天数据
    try {
        const saved = localStorage.getItem('mobileChatData');
        if (saved) {
            const data = JSON.parse(saved);
            contacts = data.contacts || [];
        }
    } catch (e) {
        console.warn('[📨好友自动消息] 读取联系人失败:', e);
    }
    
    // 过滤掉群聊，只保留私聊好友
    return contacts.filter(c => c.type === 'private');
}

/**
 * 收集上下文数据
 */
async function collectContextData(friend, settings) {
    const contextData = {
        friendInfo: null,
        chatHistory: [],
        gameContext: null,
        vectorMatches: [],
        historyRecords: []
    };
    
    // 1. 获取人物图谱信息
    if (settings.autoFriendUseCharacterGraph) {
        contextData.friendInfo = getCharacterGraphInfo(friend.name);
        if (!contextData.friendInfo) {
            // 如果图谱中没有，尝试从 relationships 获取
            contextData.friendInfo = getRelationshipInfo(friend.name);
        }
        if (!contextData.friendInfo) {
            // 最后使用基本信息
            contextData.friendInfo = { name: friend.name };
        }
        console.log('[📨好友自动消息] 人物图谱:', contextData.friendInfo?.name || '无');
    }
    
    // 2. 获取聊天历史
    if (settings.autoFriendUseChatHistory) {
        const chatId = `chat_${friend.id}`;
        contextData.chatHistory = getChatHistory(chatId);
        console.log('[📨好友自动消息] 聊天历史:', contextData.chatHistory.length, '条');
    }
    
    // 3. 获取主线剧情上下文
    const historyDepth = settings.autoFriendMainHistoryDepth || 5;
    if (historyDepth > 0) {
        contextData.gameContext = getGameContext(historyDepth);
        console.log('[📨好友自动消息] 游戏上下文:', contextData.gameContext ? '有' : '无');
    }
    
    // 4. 向量匹配主线正文
    if (settings.autoFriendUseVectorSearch && window.contextVectorManager) {
        const vectorCount = settings.autoFriendVectorCount || 3;
        const queryText = `${friend.name} ${contextData.friendInfo?.relation || ''} ${contextData.friendInfo?.personality || ''}`;
        
        try {
            // 使用正确的API: retrieveRelevant
            const results = await window.contextVectorManager.retrieveRelevant(queryText, vectorCount, 'conversation');
            contextData.vectorMatches = results || [];
            console.log('[📨好友自动消息] 向量匹配:', contextData.vectorMatches.length, '条');
        } catch (e) {
            console.warn('[📨好友自动消息] 向量匹配失败:', e);
        }
    }
    
    // 5. 获取 History 记录
    if (settings.autoFriendUseHistory && window.gameState?.history) {
        contextData.historyRecords = window.gameState.history.slice(-20) || [];
        console.log('[📨好友自动消息] History记录:', contextData.historyRecords.length, '条');
    }
    
    return contextData;
}

/**
 * 从人物图谱获取角色信息
 */
function getCharacterGraphInfo(name) {
    if (!window.characterGraphManager) return null;
    
    try {
        const characters = window.characterGraphManager.getAllCharacters?.() || [];
        return characters.find(c => c.name === name);
    } catch (e) {
        console.warn('[📨好友自动消息] 读取人物图谱失败:', e);
        return null;
    }
}

/**
 * 从 relationships 获取角色信息
 */
function getRelationshipInfo(name) {
    if (!window.gameState?.variables?.relationships) return null;
    
    return window.gameState.variables.relationships.find(r => r.name === name);
}

/**
 * 获取聊天历史
 */
function getChatHistory(chatId) {
    try {
        const saved = localStorage.getItem('mobileChatData');
        if (saved) {
            const data = JSON.parse(saved);
            const chat = data.chatStorage?.[chatId];
            return chat?.history || [];
        }
    } catch (e) {
        console.warn('[📨好友自动消息] 读取聊天历史失败:', e);
    }
    return [];
}

/**
 * 获取游戏上下文
 */
function getGameContext(depth) {
    if (!window.gameState?.conversationHistory) return null;
    
    const history = window.gameState.conversationHistory;
    const recentMessages = history.slice(-depth * 2);
    
    if (recentMessages.length === 0) return null;
    
    let context = '';
    recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? '【玩家行动】' : '【剧情发展】';
        const content = msg.content?.length > 300 ? msg.content.substring(0, 300) + '...' : msg.content;
        context += `${role}: ${content}\n\n`;
    });
    
    return context;
}

/**
 * 调用手机API（用于自动消息）
 */
async function callMobileAPIForAutoMessage(messages) {
    const sCfg = window.serverConfig || (typeof checkServerConfig === 'function' ? await checkServerConfig() : null);
    if (sCfg && sCfg.serverMode) {
        return await callMobileAPI(messages);
    }

    const config = window.mobileApiConfig;
    
    if (!config || !config.key || !config.endpoint) {
        throw new Error('手机API未配置');
    }
    
    const apiType = config.type || 'openai';
    
    let url, headers, body;
    
    if (apiType === 'gemini') {
        // Gemini API
        url = `${config.endpoint}/v1beta/models/${config.model}:generateContent?key=${config.key}`;
        headers = { 'Content-Type': 'application/json' };
        body = {
            contents: messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : msg.role === 'system' ? 'user' : msg.role,
                parts: [{ text: msg.content }]
            })),
            generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.8
            }
        };
    } else {
        // OpenAI 兼容 API
        url = `${config.endpoint}/chat/completions`;
        headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.key}`
        };
        body = {
            model: config.model,
            messages: messages,
            max_tokens: 8192,
            temperature: 0.8
        };
    }
    
    console.log('[📨好友自动消息] 调用API:', url);
    console.log('[📨好友自动消息] API类型:', apiType);
    console.log('[📨好友自动消息] 请求体大小:', JSON.stringify(body).length, '字符');
    
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[📨好友自动消息] API原始响应:', JSON.stringify(data).substring(0, 1000));
    
    // 提取回复内容
    let content = '';
    if (apiType === 'gemini') {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
        content = data.choices?.[0]?.message?.content || '';
    }
    
    // 如果OpenAI格式没有内容，尝试Gemini格式（某些代理API可能混合格式）
    if (!content && data.candidates) {
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('[📨好友自动消息] 使用Gemini格式解析');
    }
    
    console.log('[📨好友自动消息] 提取的内容长度:', content?.length || 0);
    return content;
}

/**
 * 保存自动消息到聊天记录
 */
async function saveAutoMessages(friend, replies) {
    const chatId = `chat_${friend.id}`;
    
    try {
        // 读取现有数据
        const saved = localStorage.getItem('mobileChatData');
        const data = saved ? JSON.parse(saved) : { chatStorage: {}, contacts: [] };
        
        // 确保聊天记录存在
        if (!data.chatStorage[chatId]) {
            data.chatStorage[chatId] = {
                info: { name: friend.name, id: chatId, type: 'private' },
                messages: [],
                history: []
            };
        }
        
        // 添加消息
        replies.forEach(reply => {
            const message = {
                direction: 'incoming',
                chatType: 'private',
                target: { name: '我', id: 'self' },
                sender: { name: friend.name, id: friend.id },
                msgType: 'text',
                content: reply.content,
                timestamp: Date.now(),
                isAutoGenerated: true  // 标记为自动生成
            };
            
            data.chatStorage[chatId].messages.push(message);
            data.chatStorage[chatId].history.push({
                role: 'assistant',
                content: reply.content,
                sender: { name: friend.name }
            });
        });
        
        // 限制历史记录长度
        if (data.chatStorage[chatId].history.length > 50) {
            data.chatStorage[chatId].history = data.chatStorage[chatId].history.slice(-50);
        }
        
        // 保存回 localStorage
        localStorage.setItem('mobileChatData', JSON.stringify(data));
        
        console.log(`[📨好友自动消息] 已保存 ${replies.length} 条消息到 ${friend.name} 的聊天记录`);
        
        // 通知手机 iframe 刷新数据（如果存在）
        try {
            const mobileFrame = document.getElementById('mobileFrame');
            if (mobileFrame && mobileFrame.contentWindow) {
                mobileFrame.contentWindow.postMessage({
                    type: 'MOBILE_DATA_REFRESH',
                    chatId: chatId
                }, '*');
            }
        } catch (e) {
            // iframe 可能不存在或跨域
        }
        
    } catch (e) {
        console.error('[📨好友自动消息] 保存消息失败:', e);
    }
}

/**
 * 显示自动消息通知
 */
function showAutoMessageNotification(friend, messageCount) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'auto-friend-message-notification';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📱</span>
            <div>
                <div style="font-weight: bold;">${friend.name} 发来了消息</div>
                <div style="font-size: 12px; opacity: 0.8;">收到 ${messageCount} 条新消息</div>
            </div>
        </div>
    `;
    
    // 样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #bf00ff 0%, #00f3ff 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(191, 0, 255, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        cursor: pointer;
    `;
    
    // 添加动画样式
    if (!document.getElementById('auto-friend-notification-style')) {
        const style = document.createElement('style');
        style.id = 'auto-friend-notification-style';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 点击关闭
    notification.onclick = () => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    };
    
    document.body.appendChild(notification);
    
    // 5秒后自动消失
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// 暴露全局函数
window.generateAutoFriendMessage = generateAutoFriendMessage;

console.log('[📨好友自动消息] 模块已加载');
