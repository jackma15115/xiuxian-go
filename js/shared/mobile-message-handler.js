/**
 * 📱 手机消息处理器 - 共享模块
 * 处理手机通讯和论坛的AI请求，支持酒馆预设模式
 * 所有游戏版本共享此模块
 */

(function() {
    'use strict';
    
    console.log('[📱手机消息处理器] 模块加载中...');
    
    /**
     * 初始化手机消息监听器
     * 监听来自手机iframe的 MOBILE_AI_REQUEST 和 MOBILE_FORUM_REQUEST 消息
     */
    function initMobileMessageHandler() {
        window.addEventListener('message', async function(event) {
            
            // ═══════════════════════════════════════════════════════════
            // 📱 手机通讯请求处理
            // ═══════════════════════════════════════════════════════════
            if (event.data && event.data.type === 'MOBILE_AI_REQUEST') {
                console.log('[📱手机通讯] 收到AI请求');
                
                const { userMessage, chatContext, chatId, chatType, chatHistory, loadingId, isBatchMessage } = event.data;
                const mobileFrame = document.getElementById('mobileFrame');
                
                try {
                    // 检查手机API是否配置
                    if (!window.mobileApiConfig || !window.mobileApiConfig.enabled) {
                        throw new Error('手机API未启用，请在设置中配置');
                    }
                    
                    if (!window.mobileApiConfig.endpoint || !window.mobileApiConfig.key || !window.mobileApiConfig.model) {
                        throw new Error('手机API配置不完整，请检查设置');
                    }
                    
                    const showDetails = window.mobilePhoneSettings?.showBuildDetails !== false;
                    
                    if (showDetails) {
                        console.log('\n' + '='.repeat(60));
                        console.log('📱 手机通讯 - 开始构建上下文');
                        console.log('='.repeat(60));
                        console.log('🤖 使用模型:', window.mobileApiConfig.model);
                        console.log('📤 合并发送模式:', isBatchMessage ? '是' : '否');
                        console.log('💬 聊天对象:', chatContext);
                        console.log('🆔 聊天ID:', chatId);
                        console.log('📜 聊天历史条数:', chatHistory ? chatHistory.length : 0);
                    }
                    
                    // 构建消息数组
                    let messages = [];
                    
                    // 构建通讯专用提示词
                    let commPrompt = '';
                    if (isBatchMessage) {
                        const isGroupChat = chatType === 'group' || (chatId && chatId.includes('group'));
                        
                        commPrompt = isGroupChat ? 
`你是一个游戏中的虚拟手机通讯系统。用户在群聊中发消息。
当前群聊: ${chatContext}

【消息格式规范】
用户发送的消息采用JSON格式，包含messages数组。

【回复格式要求】
你必须严格按照以下JSON格式回复，不要有任何其他文字：
{
  "replies": [
    {
      "direction": "incoming",
      "chatType": "group",
      "target": { "name": "我", "id": "self" },
      "sender": { "name": "群成员真实姓名", "id": "member_id" },
      "msgType": "text",
      "content": "回复内容"
    }
  ]
}

【重要规则-群聊】
1. sender.name必须是具体的群成员姓名（如"张三"、"李四"），不能是群名"${chatContext}"
2. 可以有多个不同的群成员回复，每条消息的sender.name都要是具体的人名
3. 根据游戏背景和上下文，合理设定群成员的身份和性格
4. 回复内容要符合该群成员的性格特点
5. 只返回JSON，不要有任何解释或额外文字` :
`你是一个游戏中的虚拟手机通讯系统。用户通过手机APP与游戏中的NPC进行私聊。
当前聊天对象: ${chatContext}

【消息格式规范】
用户发送的消息采用JSON格式，包含messages数组。

【回复格式要求】
你必须严格按照以下JSON格式回复，不要有任何其他文字：
{
  "replies": [
    {
      "direction": "incoming",
      "chatType": "private",
      "target": { "name": "我", "id": "self" },
      "sender": { "name": "${chatContext}", "id": "${chatId}" },
      "msgType": "text",
      "content": "回复内容"
    }
  ]
}

【重要规则-私聊】
1. sender使用当前聊天对象的信息
2. 可以返回多条连续消息
3. 回复内容要符合角色性格和游戏背景
4. 只返回JSON，不要有任何解释或额外文字
5. 根据聊天历史保持对话连贯性`;
                    }
                    
                    // 检查是否使用酒馆预设模式（默认开启）
                    const useTavernMode = window.mobilePhoneSettings?.useTavernPresetMode !== false && 
                                          window.contextVectorManager?.buildMobileOptimizedMessages;
                    
                    if (useTavernMode && isBatchMessage) {
                        // 🎭 酒馆预设模式
                        if (showDetails) {
                            console.log('\n🎭 使用酒馆预设模式构建上下文...');
                        }
                        messages = await buildMobileAIMessages(userMessage, chatContext, commPrompt, { enableNSFW: true });
                        
                        // 添加聊天历史
                        if (chatHistory && chatHistory.length > 0) {
                            const userMsgIndex = messages.findIndex(m => m.role === 'user' && m.content === userMessage);
                            if (userMsgIndex > 0) {
                                const historyMsgs = chatHistory.map(h => ({ role: h.role, content: h.content }));
                                messages.splice(userMsgIndex, 0, ...historyMsgs);
                                if (showDetails) {
                                    console.log(`\n📜 插入聊天历史: ${historyMsgs.length} 条`);
                                }
                            }
                        }
                    } else {
                        // 传统模式
                        if (isBatchMessage) {
                            messages.push({ role: 'system', content: commPrompt });
                            
                            if (chatHistory && chatHistory.length > 0) {
                                chatHistory.forEach(h => {
                                    messages.push({ role: h.role, content: h.content });
                                });
                            }
                        }
                        
                        if (showDetails) {
                            console.log('\n🔍 构建游戏上下文（传统模式）...');
                        }
                        const contextMessages = await buildMobileAIMessages(userMessage, chatContext);
                        
                        if (isBatchMessage) {
                            contextMessages.forEach(msg => {
                                if (msg.role !== 'system') {
                                    messages.push(msg);
                                } else {
                                    const contextInfo = msg.content.replace(/^你是一个游戏中的虚拟手机助手。以下是相关的上下文信息：\n\n/, '').replace(/\n\n请根据这些信息回答用户的问题。$/, '');
                                    if (contextInfo.trim()) {
                                        messages.push({ role: 'user', content: '【游戏背景参考】\n' + contextInfo + '\n\n【当前消息】\n' + userMessage });
                                    } else {
                                        messages.push({ role: 'user', content: userMessage });
                                    }
                                }
                            });
                        } else {
                            messages = contextMessages;
                        }
                    }
                    
                    if (showDetails) {
                        console.log('\n' + '='.repeat(60));
                        console.log('📱 上下文构建完成');
                        console.log('='.repeat(60));
                        console.log('📊 总消息数:', messages.length);
                        console.log('='.repeat(60) + '\n');
                    }
                    
                    // 调用API
                    const aiReply = await callMobileAPI(messages);
                    console.log('[📱手机通讯] AI回复成功');
                    
                    // 发送响应回iframe
                    if (mobileFrame && mobileFrame.contentWindow) {
                        mobileFrame.contentWindow.postMessage({
                            type: 'MOBILE_AI_RESPONSE',
                            loadingId: loadingId,
                            success: true,
                            reply: aiReply
                        }, '*');
                    }
                    
                } catch (error) {
                    console.error('[📱手机通讯] AI调用失败:', error);
                    
                    if (mobileFrame && mobileFrame.contentWindow) {
                        mobileFrame.contentWindow.postMessage({
                            type: 'MOBILE_AI_RESPONSE',
                            loadingId: loadingId,
                            success: false,
                            error: error.message
                        }, '*');
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 📰 论坛请求处理
            // ═══════════════════════════════════════════════════════════
            if (event.data && event.data.type === 'MOBILE_FORUM_REQUEST') {
                console.log('[📰论坛] 收到请求:', event.data.action);
                
                const { action, userMessage, loadingId } = event.data;
                const mobileFrame = document.getElementById('mobileFrame');
                
                try {
                    // 检查手机API是否配置
                    if (!window.mobileApiConfig || !window.mobileApiConfig.enabled) {
                        throw new Error('手机API未启用，请在设置中配置');
                    }
                    
                    if (!window.mobileApiConfig.endpoint || !window.mobileApiConfig.key || !window.mobileApiConfig.model) {
                        throw new Error('手机API配置不完整，请检查设置');
                    }
                    
                    const showDetails = window.mobilePhoneSettings?.showBuildDetails !== false;
                    
                    if (showDetails) {
                        console.log('\n' + '='.repeat(60));
                        console.log('📰 论坛 - 开始构建上下文');
                        console.log('='.repeat(60));
                        console.log('🤖 使用模型:', window.mobileApiConfig.model);
                        console.log('📝 操作类型:', action);
                    }
                    
                    // 构建消息数组
                    let messages = [];
                    
                    // 论坛系统提示词
                    const forumPrompt = `你是一个游戏世界的论坛系统。用户通过手机APP浏览和参与论坛讨论。
- 帖子内容要与游戏世界观和剧情相关
- 允许成人内容

【帖子分类标签】
- HOT: 热门话题
- GOSSIP: 八卦消息
- GUIDE: 攻略指南
- TRADE: 交易信息
- ASK: 求助提问
- NEWS: 新闻资讯
- SHOW: 晒图炫耀

【回复格式 - 浏览帖子列表】
当action为browse或refresh时，返回帖子列表（每个帖子必须包含3-4条评论）：
{
  "type": "postList",
  "posts": [
    {
      "id": "帖子唯一ID（如P8X92）",
      "tag": "HOT|GOSSIP|GUIDE|TRADE|ASK|NEWS|SHOW",
      "title": "帖子标题",
      "author": { "name": "作者名", "id": "作者ID", "realm": "等级/境界" },
      "content": "帖子完整正文内容",
      "stats": { "replies": 999, "views": 10200 },
      "time": "发布时间描述（如1h ago）",
      "isHot": true或false,
      "preview": "内容预览（前50字）",
      "comments": [
        {
          "id": "评论ID",
          "author": { "name": "评论者", "id": "ID", "realm": "等级" },
          "content": "评论内容",
          "time": "评论时间",
          "likes": 12,
          "floor": 1
        }
      ]
    }
  ]
}

【回复格式 - 查看帖子详情】
当action为view时，返回帖子详情和评论

【回复格式 - 发帖结果】
当action为post时，返回发帖成功信息

【回复格式 - 评论结果】
当action为comment时，必须返回其他网友对玩家评论的反应（reactions数组，2-3条）

【重要规则】
1. 帖子内容要与游戏世界相关
2. 评论要有趣、多样化
3. 帖子ID格式：P+4位字母数字
4. 评论ID格式：C+6位数字
5. 只返回JSON，不要有任何解释或额外文字
6. 浏览时返回5-8个帖子
7. 每个帖子必须生成3-4条评论
8. 评论时必须生成2-3条网友反应`;
                    
                    // 检查是否使用酒馆预设模式（默认开启）
                    const useForumTavernMode = window.mobilePhoneSettings?.useTavernPresetMode !== false && 
                                               window.contextVectorManager?.buildMobileOptimizedMessages;
                    
                    if (useForumTavernMode) {
                        // 🎭 酒馆预设模式
                        if (showDetails) {
                            console.log('\n🎭 使用酒馆预设模式构建论坛上下文...');
                        }
                        messages = await buildMobileAIMessages(userMessage, '论坛', forumPrompt, { enableNSFW: true });
                    } else {
                        // 传统模式
                        messages.push({ role: 'system', content: forumPrompt });
                        
                        if (showDetails) {
                            console.log('\n🔍 构建游戏上下文（传统模式）...');
                        }
                        const contextMessages = await buildMobileAIMessages(userMessage, '论坛');
                        
                        contextMessages.forEach(msg => {
                            if (msg.role !== 'system') {
                                messages.push(msg);
                            } else if (msg.content && !msg.content.includes('虚拟手机助手')) {
                                const contextInfo = msg.content.replace(/^你是一个游戏中的虚拟手机助手。以下是相关的上下文信息：\n\n/, '').replace(/\n\n请根据这些信息回答用户的问题。$/, '');
                                if (contextInfo.trim()) {
                                    messages.push({ role: 'user', content: '【游戏背景参考】\n' + contextInfo + '\n\n【用户请求】\n' + userMessage });
                                } else {
                                    messages.push({ role: 'user', content: userMessage });
                                }
                            }
                        });
                        
                        if (!messages.some(m => m.role === 'user')) {
                            messages.push({ role: 'user', content: userMessage });
                        }
                    }
                    
                    if (showDetails) {
                        console.log('\n' + '='.repeat(60));
                        console.log('📰 论坛上下文构建完成');
                        console.log('='.repeat(60));
                        console.log('📊 总消息数:', messages.length);
                        console.log('='.repeat(60) + '\n');
                    }
                    
                    // 调用API
                    const aiReply = await callMobileAPI(messages);
                    console.log('[📰论坛] AI回复成功');
                    
                    // 发送响应回iframe
                    if (mobileFrame && mobileFrame.contentWindow) {
                        mobileFrame.contentWindow.postMessage({
                            type: 'MOBILE_FORUM_RESPONSE',
                            loadingId: loadingId,
                            success: true,
                            reply: aiReply
                        }, '*');
                    }
                    
                } catch (error) {
                    console.error('[📰论坛] AI调用失败:', error);
                    
                    if (mobileFrame && mobileFrame.contentWindow) {
                        mobileFrame.contentWindow.postMessage({
                            type: 'MOBILE_FORUM_RESPONSE',
                            loadingId: loadingId,
                            success: false,
                            error: error.message
                        }, '*');
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 📱 手机数据同步
            // ═══════════════════════════════════════════════════════════
            if (event.data && event.data.type === 'MOBILE_DATA_CHANGED') {
                console.log('[📱手机] 收到数据变更通知:', event.data.action);
                
                if (event.data.action === 'save' && event.data.data) {
                    try {
                        localStorage.setItem('mobileChatData', JSON.stringify(event.data.data));
                        console.log('[📱手机] localStorage已同步');
                    } catch (e) {
                        console.warn('[📱手机] localStorage同步失败:', e);
                    }
                    
                    if (typeof saveGameHistory === 'function') {
                        saveGameHistory().then(() => {
                            console.log('[📱手机] IndexedDB已同步保存');
                        }).catch(err => {
                            console.error('[📱手机] IndexedDB同步失败:', err);
                        });
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 📰 论坛数据同步
            // ═══════════════════════════════════════════════════════════
            if (event.data && event.data.type === 'MOBILE_FORUM_DATA_CHANGED') {
                console.log('[📰论坛] 收到数据变更通知:', event.data.action);
                
                if (event.data.action === 'save' && event.data.data) {
                    try {
                        localStorage.setItem('mobileForumData', JSON.stringify(event.data.data));
                        console.log('[📰论坛] localStorage已同步');
                    } catch (e) {
                        console.warn('[📰论坛] localStorage同步失败:', e);
                    }
                    
                    if (typeof saveGameHistory === 'function') {
                        saveGameHistory().then(() => {
                            console.log('[📰论坛] IndexedDB已同步保存');
                        }).catch(err => {
                            console.error('[📰论坛] IndexedDB同步失败:', err);
                        });
                    }
                }
            }
            
            // ═══════════════════════════════════════════════════════════
            // 🗑️ 清除数据
            // ═══════════════════════════════════════════════════════════
            if (event.data && event.data.type === 'MOBILE_FORUM_CLEAR') {
                console.log('[📰论坛] 收到清除数据指令');
                // 转发给论坛iframe
                const mobileFrame = document.getElementById('mobileFrame');
                if (mobileFrame && mobileFrame.contentWindow) {
                    mobileFrame.contentWindow.postMessage(event.data, '*');
                }
            }
        });
        
        console.log('[📱手机消息处理器] ✅ 初始化完成');
    }
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMessageHandler);
    } else {
        initMobileMessageHandler();
    }
    
    // 导出初始化函数
    window.initMobileMessageHandler = initMobileMessageHandler;
    
})();
