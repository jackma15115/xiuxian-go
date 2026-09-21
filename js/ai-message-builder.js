// AI消息构建相关函数

// 构建增强提示词
function buildEnhancedPrompt(userMessage, options = {}) {
    // 获取配置
    const saved = localStorage.getItem('gameConfig');
    const config = saved ? JSON.parse(saved) : {};

    // 🆕 明确标识这是用户的要求
    let enhancedPrompt = `【后续情节】${userMessage}`;

    // 1. 根据机缘值和天谴值添加提示
    if (gameState.variables.karmaFortune >= 80) {
        enhancedPrompt += '\n\n[机缘高→好剧情]';
    } else if (gameState.variables.karmaPunishment >= 80) {
        enhancedPrompt += '\n\n[天谴高→坏剧情]';
    }

    // 2. 获取最小字数要求
    const minWordCount = config.minWordCount || 0;

    // 3. 如果是选项模式，添加属性判定结果
    if (options.attributeCheck) {
        const { requirement, checkResult } = options.attributeCheck;
        if (requirement.hasRequirement) {
            if (checkResult.met) {
                enhancedPrompt += `\n\n[判定通过：${checkResult.attributeName}${checkResult.currentValue}${requirement.operator}${checkResult.requiredValue}→成功剧情]`;
            } else {
                enhancedPrompt += `\n\n[判定失败：${checkResult.attributeName}${checkResult.currentValue}不足${checkResult.requiredValue}→失败剧情]`;
            }
        }
    }

    // 4. 强制要求更新变量和生成选项
    enhancedPrompt += '\n\n[必须返回4选项(含属性判定)，顺序：1.对话 2.离开 3.行动 4.R18]';

    // 5. 添加最小字数要求
    if (minWordCount > 0) {
        enhancedPrompt += `\n\n[story≥${minWordCount}字]`;
    }

    // 6. 性爱场景描写要求
    enhancedPrompt += '\n\n[R18场景详写过程，语言动作表情多方面描写，不准主动结束性爱场景，需要玩家主动结束]';

    // 8. 人际关系提醒（v3.1格式）
    enhancedPrompt += '\n\n[NPC互动在variableUpdate中更新：relationships.NPC名字={favor:数值,opinion:"评价",history:["事件"]}。R18必更新：isVirgin/firstSex/lastSex/sexualPreference/appearance]';

    // 9. 变量更新说明（v3.1格式）
    enhancedPrompt += '\n\n[使用variableUpdate字段，格式：{"属性路径":值}。例：{"hp":100,"items.灵石":50,"relationships.柳如烟.favor":80}]';

    // 10. 历史记录要求
    enhancedPrompt += '\n\n[history返回1条≥40字。]';

    // 12. 炼丹炼器等级提示
    const alchemyLevel = gameState.variables.alchemyLevel || "未入门";
    const craftingLevel = gameState.variables.craftingLevel || "未入门";

    // 炼丹等级提示
    if (alchemyLevel !== "未入门") {
        enhancedPrompt += `\n\n[当前炼丹等级：${alchemyLevel}，根据等级判断成功率和丹药品质]`;
    }

    // 炼器等级提示
    if (craftingLevel !== "未入门") {
        enhancedPrompt += `\n\n[当前炼器等级：${craftingLevel}，根据等级判断成功率和法宝品质]`;
    }

    // 13. 添加本地操作摘要（如果有的话）
    const hasLocalOps = gameState.localOps && (
        (gameState.localOps.items && gameState.localOps.items.length > 0) ||
        (gameState.localOps.attrs && gameState.localOps.attrs.length > 0) ||
        (gameState.localOps.equip && gameState.localOps.equip.length > 0)
    );
    
    if (hasLocalOps) {
        const localOpsSummary = {
            items: gameState.localOps.items || [],
            attrs: gameState.localOps.attrs || [],
            equip: gameState.localOps.equip || []
        };
        enhancedPrompt += '\n\n[本地操作记录]' + JSON.stringify(localOpsSummary);
    }

    return enhancedPrompt;
}

// 构建发送给AI的消息
async function buildAndSendAIMessage(materialsDesc, craftingType) {
    const userMessage = `我拿${materialsDesc}${craftingType}`;

    // 清空选择
    baiyiState.selectedMaterials = {};
    updateBaiyiMaterialsList();

    // 切换到游戏面板
    if (window.innerWidth <= 992) {
        switchMobileTab('game');
    }

    // 添加用户消息到历史
    gameState.conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    // 显示用户消息
    const historyDiv = document.getElementById('gameHistory');
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.innerHTML = `
        <div class="message-header">
            <span>🧙 你</span>
        </div>
        <div class="message-content">${userMessage}</div>
    `;
    historyDiv.appendChild(userMessageDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    // 显示加载提示
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI思考中...</div>';
    loadingDiv.id = 'loading-message';
    historyDiv.appendChild(loadingDiv);
    historyDiv.scrollTop = historyDiv.scrollHeight;

    try {
        // 🎯 使用统一函数构建增强提示
        const enhancedInput = buildEnhancedPrompt(userMessage);

        // 🆕 在控制台显示完整的增强提示
        console.log('📤 [百艺-原始用户消息]', userMessage);
        console.log('🤖 [百艺-发送给AI的完整Prompt]', enhancedInput);

        // 🔧 传入原始用户输入（用于向量检索）
        const response = await callAI(enhancedInput, false, userMessage);

        // 移除加载提示
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        handleAIResponse(response);

        // 触发动态世界生成（异步，不阻塞主流程）
        generateDynamicWorld().catch(err => console.error('[动态世界] 生成异常:', err));

        // 📨 触发好友自动消息（异步，不阻塞主流程）
        if (typeof window.generateAutoFriendMessage === 'function') {
            window.generateAutoFriendMessage().catch(err => console.error('[📨好友自动消息] 生成异常:', err));
        }

    } catch (error) {
        // 移除加载提示
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();

        console.error('百艺操作失败:', error);
        alert('百艺操作失败: ' + error.message);
    }
}

// 🆕 生成操作缓存的摘要文本
function getPendingActionsSummary() {
    const parts = [];

    // 处理丹药服用
    const pillNames = Object.keys(gameState.pendingActions.pills);
    if (pillNames.length > 0) {
        const pillParts = pillNames.map(name => {
            const count = gameState.pendingActions.pills[name];
            return count > 1 ? `${name}×${count}` : name;
        });
        parts.push(`我服用了${pillParts.join('、')}`);
    }

    // 处理装备更换
    if (gameState.pendingActions.equipment) {
        parts.push(`我装备了${gameState.pendingActions.equipment}`);
    }

    return parts.length > 0 ? parts.join('，') + '。' : '';
}

// 🆕 清空操作缓存
function clearPendingActions() {
    gameState.pendingActions.pills = {};
    gameState.pendingActions.equipment = null;
}
