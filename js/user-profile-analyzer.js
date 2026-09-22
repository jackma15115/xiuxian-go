// ==================== 用户输入分析及用户画像系统 ====================
// 此模块负责分析用户输入，构建用户画像，并为主API提供增强提示

// 用户画像存储
let userProfileData = {
    // 用户偏好
    preferences: [],
    // 用户不喜欢的内容
    dislikes: [],
    // 偏好的文风
    writingStyle: '未确定',
    // 内容偏好
    contentPreference: '未确定',
    // 文学素养
    literacyLevel: '未确定',
    // 交互模式
    interactionPattern: '未确定',
    // 其他观察
    notes: [],
    // 分析历史（最近10次）
    analysisHistory: [],
    // 统计数据
    stats: {
        totalInputs: 0,
        r18Inputs: 0,
        combatInputs: 0,
        socialInputs: 0,
        explorationInputs: 0,
        lastUpdated: null
    }
};

// 用户画像配置
let userProfileConfig = {
    enabled: false,
    analysisPrompt: '',
    showAnalysis: true,
    analysisHistoryDepth: 3,   // 分析时读取的正文层数
    matrixHistoryDepth: 5      // 分析时读取的历史矩阵层数
};

/**
 * 🔧 兼容性函数：获取额外API配置（兼容全局和局部变量）
 */
function getExtraApiConfigForProfile() {
    // 优先使用全局的 getExtraApiConfig 函数（如果存在）
    if (typeof window.getExtraApiConfig === 'function') {
        return window.getExtraApiConfig();
    }
    // 尝试全局变量
    if (window.extraApiConfig) {
        return window.extraApiConfig;
    }
    // 尝试局部变量（在某些HTML文件中定义的）
    if (typeof extraApiConfig !== 'undefined') {
        return extraApiConfig;
    }
    // 都不存在则返回空配置
    return { enabled: false, key: '', endpoint: '', model: '' };
}

/**
 * 初始化用户画像系统
 */
async function initUserProfileSystem() {
    // 从localStorage加载配置
    loadUserProfileConfig();
    // 从localStorage加载用户画像（自动积累的）
    loadUserProfile();
    
    // 从IndexedDB加载确认的问卷画像
    try {
        await loadUserProfileFromIndexedDB();
        if (confirmedUserProfile) {
            console.log('[🎭用户画像] 已加载问卷画像:', confirmedUserProfile.result?.summary || '已存在');
        }
    } catch (e) {
        console.warn('[🎭用户画像] 加载问卷画像失败:', e);
    }
    
    // 调试：检查额外API配置
    const extraConfig = getExtraApiConfigForProfile();
    console.log('[🎭用户画像] 系统初始化完成');
    console.log('[🎭用户画像] 功能状态:', userProfileConfig.enabled ? '已启用' : '未启用');
    console.log('[🎭用户画像] 额外API状态:', extraConfig.enabled ? '已启用' : '未启用');
    console.log('[🎭用户画像] 问卷画像:', confirmedUserProfile ? '已存在' : '未创建');
}

/**
 * 加载用户画像配置
 */
function loadUserProfileConfig() {
    const saved = localStorage.getItem('userProfileConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            userProfileConfig = { ...userProfileConfig, ...config };
        } catch (e) {
            console.warn('[🎭用户画像] 加载配置失败:', e);
        }
    }
}

/**
 * 保存用户画像配置
 */
function saveUserProfileConfig() {
    localStorage.setItem('userProfileConfig', JSON.stringify(userProfileConfig));
}

/**
 * 加载用户画像数据
 */
function loadUserProfile() {
    const saved = localStorage.getItem('userProfileData');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            userProfileData = { ...userProfileData, ...data };
        } catch (e) {
            console.warn('[🎭用户画像] 加载画像数据失败:', e);
        }
    }
}

/**
 * 保存用户画像数据
 */
function saveUserProfile() {
    userProfileData.stats.lastUpdated = new Date().toISOString();
    localStorage.setItem('userProfileData', JSON.stringify(userProfileData));
}

/**
 * 分析用户输入
 * @param {string} userInput - 用户原始输入
 * @param {object} gameContext - 游戏上下文（可选）
 * @returns {Promise<object>} 分析结果
 */
async function analyzeUserInput(userInput, gameContext = null) {
    if (!userProfileConfig.enabled) {
        return null;
    }

    // 检查额外API是否可用（兼容全局和局部变量）
    const extraConfig = getExtraApiConfigForProfile();
    if (!extraConfig || !extraConfig.enabled) {
        console.warn('[🎭用户画像] 额外API未启用，跳过分析');
        return null;
    }

    if (userProfileConfig.showAnalysis) {
        console.log('[🎭用户画像] 开始分析用户输入:', userInput);
    }

    try {
        // 构建分析消息
        const messages = buildAnalysisMessages(userInput, gameContext);
        
        // 调用额外API进行分析
        console.log('[🎭用户画像] 正在调用额外API...');
        console.log('[🎭用户画像] 发送的消息:', JSON.stringify(messages).substring(0, 10000) + '...');
        
        const response = await callExtraAI(messages);
        
        console.log('[🎭用户画像] 额外API响应成功，长度:', response?.length || 0);
        
        // 解析分析结果
        const analysisResult = parseAnalysisResponse(response);
        
        if (analysisResult) {
            // 更新用户画像（如果API返回了）
            if (analysisResult.userProfile) {
                updateUserProfile(analysisResult.userProfile);
            }
            
            // 添加到分析历史
            addToAnalysisHistory(userInput, analysisResult);
            
            // 保存用户画像
            saveUserProfile();
            
            // 🆕 显示分析思维链（不进存档）
            if (userProfileConfig.showAnalysis) {
                console.log('[🎭用户画像] 分析完成:', analysisResult);
                displayAnalysisReasoning(userInput, analysisResult);
            }
            
            return analysisResult;
        } else {
            console.warn('[🎭用户画像] 解析结果为空，原始响应:', response?.substring(0, 200));
        }
    } catch (error) {
        console.error('[🎭用户画像] 分析失败:', error);
        console.error('[🎭用户画像] 错误详情:', error.message);
    }
    
    return null;
}

/**
 * 构建分析消息
 */
function buildAnalysisMessages(userInput, gameContext) {
    const systemPrompt = userProfileConfig.analysisPrompt || getDefaultAnalysisPrompt();
    
    // 构建上下文信息
    let contextInfo = '';
    if (gameContext) {
        contextInfo = `\n\n【当前游戏状态】\n位置：${gameContext.currentLocation || '未知'}\n角色：${gameContext.characterName || '未知'}\n境界：${gameContext.realm || '凡人'}`;
    }
    
    // 🆕 获取最近几层AI正文作为剧情上下文（不包含用户输入）
    let recentStoryContext = '';
    const historyDepth = userProfileConfig.analysisHistoryDepth || 3; // 默认3层
    
    if (window.gameState && window.gameState.conversationHistory) {
        const history = window.gameState.conversationHistory;
        const recentStories = [];
        
        // 从后往前遍历，只收集AI的剧情正文
        let layerCount = 0;
        for (let i = history.length - 1; i >= 0 && layerCount < historyDepth; i--) {
            const msg = history[i];
            if (msg.role === 'assistant' && msg.content) {
                // 提取AI回复中的story部分（如果是JSON格式）
                let storyContent = msg.content;
                try {
                    // 尝试解析JSON提取story
                    const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        if (parsed.story) {
                            storyContent = parsed.story;
                        }
                    }
                } catch (e) {
                    // 解析失败就用原始内容
                }
                // 截取前500字符避免过长
                recentStories.unshift(storyContent.substring(0, 500) + (storyContent.length > 500 ? '...' : ''));
                layerCount++;
            }
        }
        
        if (recentStories.length > 0) {
            recentStoryContext = '\n\n【最近剧情发展】（最近' + recentStories.length + '层AI正文）\n';
            recentStories.forEach((story, idx) => {
                recentStoryContext += `[第${idx + 1}层] ${story}\n\n`;
            });
        }
    }
    
    // 🆕 获取历史矩阵层内容（帮助分析更早的剧情线索）
    let matrixHistoryContext = '';
    const matrixDepth = userProfileConfig.matrixHistoryDepth || 5;
    
    if (window.matrixManager && window.matrixManager.historyMatrix && window.matrixManager.historyMatrix.layers) {
        const layers = window.matrixManager.historyMatrix.layers;
        
        if (layers.length > 0) {
            // 获取最近的几个层
            const recentLayers = layers.slice(-matrixDepth);
            
            matrixHistoryContext = '\n\n【⭐ 历史记忆矩阵（更早的剧情线索）】\n';
            matrixHistoryContext += `共${layers.length}个话题层，显示最近${recentLayers.length}层：\n`;
            
            recentLayers.forEach((layer, idx) => {
                matrixHistoryContext += `\n📂 话题${layer.id}：${layer.topic}（${layer.vectors.length}条记录）\n`;
                
                // 从每层取最近2条记录的摘要
                const recentVectors = layer.vectors.slice(-2);
                recentVectors.forEach(v => {
                    const content = v.aiResponse || v.content || '';
                    if (content) {
                        // 提取前150字符作为摘要
                        const summary = content.substring(0, 150).replace(/\n/g, ' ');
                        matrixHistoryContext += `  └ ${summary}${content.length > 150 ? '...' : ''}\n`;
                    }
                });
            });
            
            matrixHistoryContext += '\n⚠️ 这些是更早的历史记忆，主AI能看到完整内容。请从中提取可能相关的关键词和伏笔线索！\n';
        }
    }
    
    // 添加用户画像历史（自动积累的）
    let profileHistory = '';
    if (userProfileData.stats.totalInputs > 0) {
        profileHistory = `\n\n【自动积累的用户画像】\n${JSON.stringify({
            preferences: userProfileData.preferences,
            dislikes: userProfileData.dislikes,
            writingStyle: userProfileData.writingStyle,
            contentPreference: userProfileData.contentPreference,
            literacyLevel: userProfileData.literacyLevel,
            interactionPattern: userProfileData.interactionPattern,
            notes: userProfileData.notes.slice(-5), // 最近5条观察
            stats: userProfileData.stats
        }, null, 2)}`;
    }
    
    // 🆕 添加用户确认的问卷画像（最重要的参考）
    let confirmedProfileInfo = '';
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        confirmedProfileInfo = `\n\n【⭐ 用户确认的偏好画像（重要参考！）】
📌 用户特点：${cp.summary || '未指定'}

【剧情风格】
📖 剧情类型：${cp.storyPreference || '未指定'}
🎭 故事基调：${cp.storyTone || '未指定'}
📐 剧情结构：${cp.storyStructure || '未指定'}
⏱️ 节奏偏好：${cp.pacing || '未指定'}
🔄 反转偏好：${cp.plotTwistPreference || '未指定'}
⚡ 冲突类型：${Array.isArray(cp.conflictTypes) ? cp.conflictTypes.join('、') : cp.conflictTypes || '未指定'}

【文风描写】
✍️ 文风偏好：${cp.writingStyle || '未指定'}
📚 喜欢的作品：${cp.favoriteWorks || '未填写'}
📝 文风详细要求：${cp.writingStyleDetails || '无'}
💬 对话风格：${cp.dialogueStyle || '未指定'}
📏 回复详细度：${cp.detailLevel || '未指定'}
🔍 描写重点：${Array.isArray(cp.descriptionFocus) ? cp.descriptionFocus.join('、') : cp.descriptionFocus || '未指定'}
📜 叙事手法：${Array.isArray(cp.narrativeStyle) ? cp.narrativeStyle.join('、') : cp.narrativeStyle || '未指定'}
🗣️ 用词风格：${cp.languageStyle || '未指定'}

【角色互动】
🦸 主角类型：${cp.protagonistType || '未指定'}
🎭 主角性格：${Array.isArray(cp.protagonistPersonality) ? cp.protagonistPersonality.join('、') : cp.protagonistPersonality || '未指定'}
� 主角背景：${Array.isArray(cp.protagonistBackground) ? cp.protagonistBackground.join('、') : cp.protagonistBackground || '未指定'}
� 喜欢角色：${Array.isArray(cp.favoriteCharacters) ? cp.favoriteCharacters.join('、') : cp.favoriteCharacters || '未指定'}
💞 关系类型：${Array.isArray(cp.relationshipTypes) ? cp.relationshipTypes.join('、') : cp.relationshipTypes || '未指定'}
💑 关系深度：${cp.relationshipDepth || '未指定'}
� 感情线：${cp.haremPreference || '未指定'}
� NPC风格：${cp.npcStyle || '未指定'}
🔔 NPC互动频率：${cp.interactionFrequency || '未指定'}

【战斗与挑战】
⚔️ 难度偏好：${cp.difficulty || '未指定'}
🗡️ 战斗风格：${cp.combatStyle || '未指定'}
⚡ 战斗元素：${Array.isArray(cp.combatElements) ? cp.combatElements.join('、') : cp.combatElements || '未指定'}
💪 爽感需求：${cp.powerFantasy || '未指定'}
👹 敌人类型：${Array.isArray(cp.enemyTypes) ? cp.enemyTypes.join('、') : cp.enemyTypes || '未指定'}
📈 成长速度：${cp.growthSpeed || '未指定'}
💔 失败后果：${cp.consequenceLevel || '未指定'}

【世界与内容】
🌍 世界观兴趣：${cp.worldBuilding || '未指定'}
🏔️ 世界元素：${Array.isArray(cp.worldElements) ? cp.worldElements.join('、') : cp.worldElements || '未指定'}
⚖️ 道德选择：${cp.moralChoices || '未指定'}
🔞 R18偏好：${cp.r18Preference || '未指定'}
🎬 结局偏好：${cp.endingPreference || '未指定'}

【特殊偏好】
🎯 叙事人称：${cp.immersionStyle || '未指定'}
🎲 AI创作自由度：${cp.aiCreativity || '未指定'}
😄 幽默风格：${Array.isArray(cp.humorStyle) ? cp.humorStyle.join('、') : cp.humorStyle || '未指定'}
⏭️ 时间跳跃：${cp.timeSkipPreference || '未指定'}
🎮 系统融入：${cp.systemIntegration || '未指定'}

❤️ 喜欢：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || '未指定'}
🚫 不喜欢：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || '未指定'}
📝 特别注意：${cp.specialNotes || '无'}

【🤖 AI创作指南（务必遵守！）】
${cp.aiGuidelines || '按照用户偏好生成内容'}`;
        
        console.log('[🎭用户画像] 已将问卷画像加入分析上下文');
    }
    
    const messages = [
        {
            role: 'system',
            content: systemPrompt + confirmedProfileInfo + profileHistory
        },
        {
            role: 'user',
            content: `请分析以下用户输入：\n\n"${userInput}"${contextInfo}${recentStoryContext}${matrixHistoryContext}\n\n【重要】\n1. 请参考用户确认的偏好画像来规划剧情走向\n2. 根据「历史记忆矩阵」中的线索，提取相关关键词和伏笔到memorySearch中\n3. 剧情规划要承接上文和历史记忆中的内容\n\n请按照指定的JSON格式输出分析结果。`
        }
    ];
    
    return messages;
}

/**
 * 获取默认分析提示词
 */
function getDefaultAnalysisPrompt() {
    return `你是用户输入分析师。任务：分析意图→从历史矩阵提取关键词→规划三步剧情。输出务必精简！

【输出格式（JSON）】
{
  "analysis": {
    "intent": "用户意图（20字内）",
    "emotionalTone": "情感基调（5字内）"
  },
  "memorySearch": {
    "keywords": ["从历史矩阵中提取的关键词：角色名、地点、物品、事件"],
    "unresolvedPlots": ["从历史矩阵中发现的伏笔/悬念"],
    "searchHint": "告诉主AI需要回顾什么（结合历史矩阵内容）"
  },
  "plotPlanning": {
    "step1": "剧情第一步（10字内，承接历史）",
    "step2": "剧情第二步（10字内）",
    "step3": "剧情第三步/高潮（10字内）",
    "reasoning": "为什么这样规划（与历史的关联）"
  }
}

【分析原则】
1. 保持用户原意，不要过度解读
2. 剧情规划每步10字内，简明扼要
3. ⭐ 必须参考「历史记忆矩阵」来规划剧情走向！

【记忆搜索原则 - 最重要！】
⭐ 你能看到「历史记忆矩阵」的摘要，主AI能看到完整内容！
1. 从历史矩阵的话题和内容中提取关键词（角色名、地点、物品、事件）
2. 识别历史矩阵中的伏笔回收点（之前的承诺、未完成任务、埋下的悬念）
3. searchHint要明确告诉主AI："请回顾历史中关于XXX的记忆"
4. 剧情规划要承接历史矩阵中的内容，保持故事连贯性`;
}

/**
 * 解析分析响应
 */
function parseAnalysisResponse(response) {
    if (!response) return null;
    
    try {
        // 尝试直接解析JSON
        let jsonStr = response;
        
        // 如果响应包含markdown代码块，提取JSON
        const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        
        // 尝试找到JSON对象
        const startIndex = jsonStr.indexOf('{');
        const endIndex = jsonStr.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonStr = jsonStr.substring(startIndex, endIndex + 1);
        }
        
        const result = JSON.parse(jsonStr);
        return result;
    } catch (e) {
        console.warn('[🎭用户画像] 解析分析结果失败:', e);
        console.log('[🎭用户画像] 原始响应:', response);
        return null;
    }
}

/**
 * 更新用户画像
 */
function updateUserProfile(newProfile) {
    if (!newProfile) return;
    
    // 更新统计
    userProfileData.stats.totalInputs++;
    
    // 合并偏好（去重）
    if (newProfile.preferences && Array.isArray(newProfile.preferences)) {
        newProfile.preferences.forEach(pref => {
            if (pref && !userProfileData.preferences.includes(pref)) {
                userProfileData.preferences.push(pref);
            }
        });
        // 只保留最近20个偏好
        if (userProfileData.preferences.length > 20) {
            userProfileData.preferences = userProfileData.preferences.slice(-20);
        }
    }
    
    // 合并不喜欢的内容（去重）
    if (newProfile.dislikes && Array.isArray(newProfile.dislikes)) {
        newProfile.dislikes.forEach(dislike => {
            if (dislike && !userProfileData.dislikes.includes(dislike)) {
                userProfileData.dislikes.push(dislike);
            }
        });
        // 只保留最近10个
        if (userProfileData.dislikes.length > 10) {
            userProfileData.dislikes = userProfileData.dislikes.slice(-10);
        }
    }
    
    // 更新其他属性（如果有新值）
    if (newProfile.writingStyle && newProfile.writingStyle !== '未确定') {
        userProfileData.writingStyle = newProfile.writingStyle;
    }
    if (newProfile.contentPreference && newProfile.contentPreference !== '未确定') {
        userProfileData.contentPreference = newProfile.contentPreference;
        // 更新内容类型统计
        const pref = newProfile.contentPreference.toLowerCase();
        if (pref.includes('r18') || pref.includes('色情')) {
            userProfileData.stats.r18Inputs++;
        } else if (pref.includes('战斗') || pref.includes('战争')) {
            userProfileData.stats.combatInputs++;
        } else if (pref.includes('社交') || pref.includes('对话')) {
            userProfileData.stats.socialInputs++;
        } else if (pref.includes('探索') || pref.includes('冒险')) {
            userProfileData.stats.explorationInputs++;
        }
    }
    if (newProfile.literacyLevel && newProfile.literacyLevel !== '未确定') {
        userProfileData.literacyLevel = newProfile.literacyLevel;
    }
    if (newProfile.interactionPattern && newProfile.interactionPattern !== '未确定') {
        userProfileData.interactionPattern = newProfile.interactionPattern;
    }
    
    // 添加观察笔记
    if (newProfile.notes && newProfile.notes.length > 0) {
        const noteStr = typeof newProfile.notes === 'string' ? newProfile.notes : JSON.stringify(newProfile.notes);
        if (!userProfileData.notes.includes(noteStr)) {
            userProfileData.notes.push(noteStr);
        }
        // 只保留最近20条笔记
        if (userProfileData.notes.length > 20) {
            userProfileData.notes = userProfileData.notes.slice(-20);
        }
    }
}

/**
 * 添加到分析历史
 */
function addToAnalysisHistory(userInput, analysisResult) {
    userProfileData.analysisHistory.push({
        timestamp: new Date().toISOString(),
        input: userInput,
        result: analysisResult
    });
    
    // 只保留最近10次分析
    if (userProfileData.analysisHistory.length > 10) {
        userProfileData.analysisHistory = userProfileData.analysisHistory.slice(-10);
    }
}

/**
 * 获取用于主API的增强提示词（精简版）
 * @param {object} analysisResult - 分析结果
 * @returns {string} 增强提示词
 */
function getEnhancedPromptForMainAPI(analysisResult) {
    if (!analysisResult) return '';
    
    let prompt = '';
    
    // 1. 记忆搜索提示（最重要！让主API知道需要回顾哪些历史）
    if (analysisResult.memorySearch) {
        const ms = analysisResult.memorySearch;
        if (ms.searchHint) {
            prompt += `【⭐记忆回顾】${ms.searchHint}\n`;
        }
        if (ms.keywords && ms.keywords.length > 0 && ms.keywords[0] !== '需要在历史记忆中搜索的关键词：角色名、地点、物品、事件、势力等') {
            prompt += `关键词：${ms.keywords.join('、')}\n`;
        }
        if (ms.unresolvedPlots && ms.unresolvedPlots.length > 0 && ms.unresolvedPlots[0] !== '可能涉及的未解决伏笔或悬念') {
            prompt += `伏笔：${ms.unresolvedPlots.join('；')}\n`;
        }
    }
    
    // 2. 简洁的剧情规划（三步走向）
    if (analysisResult.plotPlanning) {
        const pp = analysisResult.plotPlanning;
        prompt += `【剧情走向】`;
        prompt += `①${pp.step1 || ''} `;
        prompt += `②${pp.step2 || ''} `;
        prompt += `③${pp.step3 || ''}\n`;
    }
    
    // 3. 核心意图（一句话）
    if (analysisResult.analysis && analysisResult.analysis.intent) {
        prompt += `【意图】${analysisResult.analysis.intent}\n`;
    }
    
    // 4. 情感基调
    if (analysisResult.analysis && analysisResult.analysis.emotionalTone) {
        prompt += `【基调】${analysisResult.analysis.emotionalTone}\n`;
    }
    
    // 5. 用户画像关键点（精简版，只在有问卷画像时添加）
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        let profileHints = [];
        if (cp.writingStyle) profileHints.push(`文风:${cp.writingStyle}`);
        if (cp.storyTone) profileHints.push(`基调:${cp.storyTone}`);
        if (cp.detailLevel) profileHints.push(`字数:${cp.detailLevel}`);
        if (profileHints.length > 0) {
            prompt += `【偏好】${profileHints.join('｜')}\n`;
        }
        // 喜欢/不喜欢的精简版
        if (cp.likes && Array.isArray(cp.likes) && cp.likes.length > 0) {
            prompt += `【要】${cp.likes.slice(0, 3).join('、')}\n`;
        }
        if (cp.dislikes && Array.isArray(cp.dislikes) && cp.dislikes.length > 0) {
            prompt += `【避】${cp.dislikes.slice(0, 3).join('、')}\n`;
        }
    }
    
    return prompt;
}

/**
 * 获取用户画像的格式化文本
 */
function getFormattedUserProfile() {
    const profile = userProfileData;
    
    let text = `═══════════════════════════════════════\n`;
    text += `              🎭 用户画像报告\n`;
    text += `═══════════════════════════════════════\n\n`;
    
    // 🆕 优先显示问卷画像
    if (confirmedUserProfile && confirmedUserProfile.result) {
        const cp = confirmedUserProfile.result;
        text += `📋 问卷画像（⭐ 主要参考）\n`;
        text += `────────────────────────────────────────\n`;
        text += `📌 用户特点：${cp.summary || '未指定'}\n\n`;
        
        text += `【剧情偏好】\n`;
        text += `📖 剧情类型：${cp.storyPreference || '未指定'}\n`;
        text += `🎭 故事基调：${cp.storyTone || '未指定'}\n`;
        text += `📐 剧情结构：${cp.storyStructure || '未指定'}\n`;
        text += `⏱️ 节奏偏好：${cp.pacing || '未指定'}\n`;
        text += `🔄 反转偏好：${cp.plotTwistPreference || '未指定'}\n`;
        if (cp.conflictTypes) {
            text += `⚡ 冲突类型：${Array.isArray(cp.conflictTypes) ? cp.conflictTypes.join('、') : cp.conflictTypes}\n`;
        }
        text += `\n`;
        
        text += `【文风描写】\n`;
        text += `✍️ 文风偏好：${cp.writingStyle || '未指定'}\n`;
        if (cp.favoriteWorks) {
            text += `📚 喜欢的作品：${cp.favoriteWorks}\n`;
        }
        if (cp.writingStyleDetails) {
            text += `📝 文风详细要求：${cp.writingStyleDetails}\n`;
        }
        text += `💬 对话风格：${cp.dialogueStyle || '未指定'}\n`;
        text += `� 回复详细度：${cp.detailLevel || '未指定'}\n`;
        text += `�� 描写重点：${Array.isArray(cp.descriptionFocus) ? cp.descriptionFocus.join('、') : cp.descriptionFocus || '未指定'}\n`;
        if (cp.narrativeStyle) {
            text += `� 叙事手法：${Array.isArray(cp.narrativeStyle) ? cp.narrativeStyle.join('、') : cp.narrativeStyle}\n`;
        }
        if (cp.languageStyle) {
            text += `🗣️ 用词风格：${cp.languageStyle}\n`;
        }
        text += `\n`;
        
        text += `【角色互动】\n`;
        text += `🦸 主角类型：${cp.protagonistType || '未指定'}\n`;
        if (cp.protagonistPersonality) {
            text += `🎭 主角性格：${Array.isArray(cp.protagonistPersonality) ? cp.protagonistPersonality.join('、') : cp.protagonistPersonality}\n`;
        }
        if (cp.protagonistBackground) {
            text += `📜 主角背景：${Array.isArray(cp.protagonistBackground) ? cp.protagonistBackground.join('、') : cp.protagonistBackground}\n`;
        }
        text += `💕 喜欢角色：${Array.isArray(cp.favoriteCharacters) ? cp.favoriteCharacters.join('、') : cp.favoriteCharacters || '未指定'}\n`;
        if (cp.relationshipTypes) {
            text += `💞 关系类型：${Array.isArray(cp.relationshipTypes) ? cp.relationshipTypes.join('、') : cp.relationshipTypes}\n`;
        }
        text += `💑 关系深度：${cp.relationshipDepth || '未指定'}\n`;
        text += `💘 感情线：${cp.haremPreference || '未指定'}\n`;
        text += `👥 NPC风格：${cp.npcStyle || '未指定'}\n`;
        if (cp.interactionFrequency) {
            text += `🔔 NPC互动频率：${cp.interactionFrequency}\n`;
        }
        text += `\n`;
        
        text += `【战斗冒险】\n`;
        text += `⚔️ 难度偏好：${cp.difficulty || '未指定'}\n`;
        text += `🗡️ 战斗风格：${cp.combatStyle || '未指定'}\n`;
        if (cp.combatElements) {
            text += `⚡ 战斗元素：${Array.isArray(cp.combatElements) ? cp.combatElements.join('、') : cp.combatElements}\n`;
        }
        text += `💪 爽感需求：${cp.powerFantasy || '未指定'}\n`;
        if (cp.enemyTypes) {
            text += `👹 敌人类型：${Array.isArray(cp.enemyTypes) ? cp.enemyTypes.join('、') : cp.enemyTypes}\n`;
        }
        if (cp.powerSystem) {
            text += `⚡ 力量体系：${Array.isArray(cp.powerSystem) ? cp.powerSystem.join('、') : cp.powerSystem}\n`;
        }
        text += `📈 成长速度：${cp.growthSpeed || '未指定'}\n`;
        text += `💔 失败后果：${cp.consequenceLevel || '未指定'}\n\n`;
        
        text += `【世界与内容】\n`;
        text += `🌍 世界观兴趣：${cp.worldBuilding || '未指定'}\n`;
        if (cp.worldElements) {
            text += `🏔️ 世界元素：${Array.isArray(cp.worldElements) ? cp.worldElements.join('、') : cp.worldElements}\n`;
        }
        text += `⚖️ 道德选择：${cp.moralChoices || '未指定'}\n`;
        text += `🔞 R18偏好：${cp.r18Preference || '未指定'}\n`;
        if (cp.r18Elements && !cp.r18Elements.includes('不需要此类内容')) {
            text += `💕 R18类型：${Array.isArray(cp.r18Elements) ? cp.r18Elements.join('、') : cp.r18Elements}\n`;
        }
        text += `🎬 结局偏好：${cp.endingPreference || '未指定'}\n\n`;
        
        text += `【特殊偏好】\n`;
        text += `🎯 叙事人称：${cp.immersionStyle || '未指定'}\n`;
        text += `🎁 惊喜偏好：${cp.surprisePreference || '未指定'}\n`;
        text += `🎲 AI创作自由度：${cp.aiCreativity || '未指定'}\n`;
        if (cp.humorStyle) {
            text += `😄 幽默风格：${Array.isArray(cp.humorStyle) ? cp.humorStyle.join('、') : cp.humorStyle}\n`;
        }
        text += `⏭️ 时间跳跃：${cp.timeSkipPreference || '未指定'}\n`;
        text += `🎮 系统融入：${cp.systemIntegration || '未指定'}\n\n`;
        
        text += `❤️ 喜欢：${Array.isArray(cp.likes) ? cp.likes.join('、') : cp.likes || '无'}\n`;
        text += `🚫 不喜欢：${Array.isArray(cp.dislikes) ? cp.dislikes.join('、') : cp.dislikes || '无'}\n`;
        text += `📝 特别注意：${cp.specialNotes || '无'}\n`;
        text += `创建时间：${new Date(confirmedUserProfile.createdAt).toLocaleString()}\n\n`;
        
        text += `🤖 AI创作指南\n`;
        text += `────────────────────────────────────────\n`;
        text += `${cp.aiGuidelines || '按照用户偏好生成内容'}\n\n`;
        
        text += `═══════════════════════════════════════\n\n`;
    }
    
    return text;
}

// ==================== UI 交互函数 ====================

/**
 * 切换用户画像字段显示
 */
function toggleUserProfileFields() {
    const enabled = document.getElementById('enableUserProfileAnalysis').checked;
    const fields = document.getElementById('userProfileFields');
    
    if (fields) {
        fields.style.display = enabled ? 'block' : 'none';
    }
    
    userProfileConfig.enabled = enabled;
}

/**
 * 保存用户画像设置
 */
function saveUserProfileSettings() {
    const enabledEl = document.getElementById('enableUserProfileAnalysis');
    const promptEl = document.getElementById('userProfileAnalysisPrompt');
    const showAnalysisEl = document.getElementById('userProfileShowAnalysis');
    const historyDepthEl = document.getElementById('userProfileHistoryDepth');
    const matrixDepthEl = document.getElementById('userProfileMatrixDepth');
    
    if (enabledEl) userProfileConfig.enabled = enabledEl.checked;
    if (promptEl) userProfileConfig.analysisPrompt = promptEl.value;
    if (showAnalysisEl) userProfileConfig.showAnalysis = showAnalysisEl.checked;
    if (historyDepthEl) userProfileConfig.analysisHistoryDepth = parseInt(historyDepthEl.value) || 3;
    if (matrixDepthEl) userProfileConfig.matrixHistoryDepth = parseInt(matrixDepthEl.value) || 5;
    
    // 检查额外API是否启用
    if (userProfileConfig.enabled && (!window.extraApiConfig || !window.extraApiConfig.enabled)) {
        alert('⚠️ 警告：用户输入分析功能需要启用并配置额外API！\n\n请在"API"标签页的"额外API设置"中配置额外API。');
    }
    
    saveUserProfileConfig();
    
    alert('✅ 用户画像设置已保存！\n\n' + 
          '状态：' + (userProfileConfig.enabled ? '已启用' : '已禁用') + '\n' +
          '正文层数：' + userProfileConfig.analysisHistoryDepth + ' 层\n' +
          '矩阵层数：' + userProfileConfig.matrixHistoryDepth + ' 层\n' +
          '分析思维链：' + (userProfileConfig.showAnalysis ? '显示' : '隐藏'));
}

/**
 * 查看用户画像（弹窗）
 */
function viewUserProfile() {
    const profileText = getFormattedUserProfile();
    
    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'userProfileViewModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 15px;
        padding: 25px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        color: #fff;
        font-family: 'Courier New', monospace;
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
        border: 2px solid #667eea;
    `;
    
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #667eea;">🎭 用户画像</h2>
            <button onclick="document.getElementById('userProfileViewModal').remove()" 
                    style="background: #dc3545; border: none; color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer;">
                ✕ 关闭
            </button>
        </div>
        <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 13px; line-height: 1.6; color: #e0e0e0;">${profileText}</pre>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

/**
 * 清空用户画像
 */
function clearUserProfile() {
    if (!confirm('⚠️ 确定要清空用户画像吗？\n\n这将删除所有积累的用户偏好和分析数据，此操作不可撤销！')) {
        return;
    }
    
    userProfileData = {
        preferences: [],
        dislikes: [],
        writingStyle: '未确定',
        contentPreference: '未确定',
        literacyLevel: '未确定',
        interactionPattern: '未确定',
        notes: [],
        analysisHistory: [],
        stats: {
            totalInputs: 0,
            r18Inputs: 0,
            combatInputs: 0,
            socialInputs: 0,
            explorationInputs: 0,
            lastUpdated: null
        }
    };
    
    saveUserProfile();
    
    // 更新UI显示
    const profileTextarea = document.getElementById('currentUserProfile');
    if (profileTextarea) {
        profileTextarea.value = '用户画像已清空。开始游戏并启用此功能后会自动积累。';
    }
    
    alert('✅ 用户画像已清空！');
}

/**
 * 加载设置到UI
 */
function loadUserProfileSettingsToUI() {
    loadUserProfileConfig();
    loadUserProfile();
    
    const enabledEl = document.getElementById('enableUserProfileAnalysis');
    const promptEl = document.getElementById('userProfileAnalysisPrompt');
    const showAnalysisEl = document.getElementById('userProfileShowAnalysis');
    const historyDepthEl = document.getElementById('userProfileHistoryDepth');
    const matrixDepthEl = document.getElementById('userProfileMatrixDepth');
    const profileTextarea = document.getElementById('currentUserProfile');
    const fieldsEl = document.getElementById('userProfileFields');
    
    if (enabledEl) enabledEl.checked = userProfileConfig.enabled;
    if (promptEl && userProfileConfig.analysisPrompt) promptEl.value = userProfileConfig.analysisPrompt;
    if (showAnalysisEl) showAnalysisEl.checked = userProfileConfig.showAnalysis;
    if (historyDepthEl) historyDepthEl.value = userProfileConfig.analysisHistoryDepth || 3;
    if (matrixDepthEl) matrixDepthEl.value = userProfileConfig.matrixHistoryDepth || 5;
    if (fieldsEl) fieldsEl.style.display = userProfileConfig.enabled ? 'block' : 'none';
    
    // 显示当前用户画像摘要（优先显示问卷画像）
    if (profileTextarea) {
        if (confirmedUserProfile && confirmedUserProfile.result) {
            // 显示问卷画像
            const p = confirmedUserProfile.result;
            profileTextarea.value = `📋 【问卷画像】\n` +
                `📌 ${p.summary || '用户画像已生成'}\n\n` +
                `剧情偏好：${p.storyPreference || '未指定'}\n` +
                `文风偏好：${p.writingStyle || '未指定'}\n` +
                `节奏偏好：${p.pacing || '未指定'}\n` +
                `难度偏好：${p.difficulty || '未指定'}\n` +
                `喜欢：${Array.isArray(p.likes) ? p.likes.join('、') : p.likes || '无'}\n` +
                `不喜欢：${Array.isArray(p.dislikes) ? p.dislikes.join('、') : p.dislikes || '无'}\n\n` +
                `创建时间：${new Date(confirmedUserProfile.createdAt).toLocaleString()}\n` +
                `点击"查看完整画像"获取AI创作指南`;
        } else if (userProfileData.stats.totalInputs > 0) {
            // 显示自动积累的画像
            profileTextarea.value = `📊 【自动积累画像】\n` +
                `总分析次数：${userProfileData.stats.totalInputs}\n` +
                `文风偏好：${userProfileData.writingStyle}\n` +
                `内容偏好：${userProfileData.contentPreference}\n` +
                `文学素养：${userProfileData.literacyLevel}\n` +
                `交互模式：${userProfileData.interactionPattern}\n` +
                `喜欢：${userProfileData.preferences.slice(-5).join('、') || '无'}\n` +
                `不喜欢：${userProfileData.dislikes.slice(-3).join('、') || '无'}\n\n` +
                `💡 建议填写问卷获取更准确的画像`;
        } else {
            profileTextarea.value = '尚未生成用户画像。\n\n💡 点击上方"开始用户分析问卷调查"按钮，填写问卷获取专属画像！';
        }
    }
}

// ==================== 分析思维链显示 ====================

/**
 * 显示用户输入分析的思维链（不进存档）
 */
function displayAnalysisReasoning(userInput, analysisResult) {
    const historyDiv = document.getElementById('gameHistory');
    if (!historyDiv) return;
    
    // 创建分析思维链容器
    const container = document.createElement('div');
    container.className = 'user-analysis-reasoning';
    container.style.cssText = `
        background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
        border: 2px solid #667eea;
        border-radius: 12px;
        margin: 10px 0;
        padding: 0;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    `;
    
    // 头部（可折叠）
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 15px;
        border-radius: 10px 10px 0 0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <span>🎭 用户输入分析</span>
        <span style="font-size: 11px; opacity: 0.8;">点击展开/折叠</span>
    `;
    
    // 内容区（默认折叠）
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 15px;
        display: none;
        color: #333;
    `;
    
    // 构建内容HTML
    let html = '';
    
    // 原始输入
    html += `<div style="margin-bottom: 12px;">
        <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">📝 用户输入</div>
        <div style="background: #f8f9fa; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #667eea;">${userInput}</div>
    </div>`;
    
    // 意图分析
    if (analysisResult.analysis) {
        const a = analysisResult.analysis;
        html += `<div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #667eea; margin-bottom: 5px;">🔍 意图分析</div>
            <div style="background: #f8f9fa; padding: 10px 12px; border-radius: 6px;">
                <div style="margin-bottom: 5px;"><strong>真实意图：</strong>${a.intent || '未识别'}</div>
                <div style="margin-bottom: 5px;"><strong>情感基调：</strong>${a.emotionalTone || '未识别'}</div>
                ${a.expandedContent ? `<div><strong>扩展内容：</strong>${a.expandedContent}</div>` : ''}
            </div>
        </div>`;
    }
    
    // 剧情规划
    if (analysisResult.plotPlanning) {
        const p = analysisResult.plotPlanning;
        html += `<div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #764ba2; margin-bottom: 5px;">📖 剧情规划</div>
            <div style="background: #f8f9fa; padding: 10px 12px; border-radius: 6px;">
                <div style="margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #28a745;">
                    <strong>第一步：</strong>${p.step1 || '未规划'}
                </div>
                <div style="margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #ffc107;">
                    <strong>第二步：</strong>${p.step2 || '未规划'}
                </div>
                <div style="margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #dc3545;">
                    <strong>第三步：</strong>${p.step3 || '未规划'}
                </div>
                ${p.reasoning ? `<div style="margin-top: 8px; font-size: 12px; color: #666; font-style: italic;">💡 ${p.reasoning}</div>` : ''}
            </div>
        </div>`;
    }
    
    // 增强提示词
    if (analysisResult.enhancedPrompt) {
        html += `<div style="margin-bottom: 5px;">
            <div style="font-weight: bold; color: #17a2b8; margin-bottom: 5px;">✨ 增强提示词</div>
            <div style="background: #e7f3ff; padding: 10px 12px; border-radius: 6px; font-size: 12px; line-height: 1.5;">
                ${analysisResult.enhancedPrompt}
            </div>
        </div>`;
    }
    
    content.innerHTML = html;
    
    // 点击头部折叠/展开
    header.onclick = () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    };
    
    container.appendChild(header);
    container.appendChild(content);
    
    // 插入到游戏历史的末尾
    historyDiv.appendChild(container);
    
    // 滚动到底部
    historyDiv.scrollTop = historyDiv.scrollHeight;
    
    // 标记这个元素不需要保存（用于区分）
    container.dataset.noSave = 'true';
}

// ==================== 问卷调查系统 ====================

// 问卷问题定义（分组显示）
const questionnaireQuestions = [
    // ===== 第一部分：剧情偏好 =====
    {
        id: 'section1',
        type: 'section',
        title: '📖 第一部分：剧情偏好'
    },
    {
        id: 'storyPreference',
        question: '你更喜欢什么类型的剧情？',
        type: 'radio',
        options: ['剧情向（注重故事发展和人物塑造）', '战斗向（注重战斗描写和升级打怪）', '社交向（注重人际关系和对话互动）', 'R18向（注重亲密场景和情感描写）', '冒险探索向（探索未知、解谜寻宝）', '经营养成向（发展势力、培养角色）', '悬疑推理向（解开谜团、揭露真相）', '混合型（以上都喜欢，根据情境切换）']
    },
    {
        id: 'storyTone',
        question: '你喜欢什么样的故事基调？',
        type: 'radio',
        options: ['轻松愉快（欢乐向，偶尔有小挫折）', '热血励志（主角不断突破，逆境翻盘）', '深沉厚重（复杂的世界观和人物动机）', '黑暗残酷（现实向，有牺牲和代价）', '荒诞幽默（无厘头，打破常规）', '治愈温馨（温暖人心的日常）', '史诗宏大（波澜壮阔的大格局）', '悬疑紧张（充满未知和惊悚）', '浪漫唯美（注重情感氛围）']
    },
    {
        id: 'plotTwist',
        question: '你对剧情反转的接受程度？',
        type: 'radio',
        options: ['喜欢反转（越意想不到越好）', '适度反转（偶尔来一次）', '最好剧情稳定（不要太多意外）', '反转可以但要合理铺垫', '喜欢伏笔回收的惊喜', '喜欢细思极恐的暗线']
    },
    {
        id: 'pacing',
        question: '你喜欢什么样的剧情节奏？',
        type: 'radio',
        options: ['慢节奏（享受日常和细节）', '中等节奏（平衡日常和主线）', '快节奏（剧情紧凑，快速推进）', '根据场景调整（战斗快、日常慢）', '张弛有度（高潮与舒缓交替）', '一波三折（不断起伏推进）']
    },
    {
        id: 'storyStructure',
        question: '你喜欢什么样的剧情结构？',
        type: 'radio',
        options: ['线性推进（一条主线到底）', '多线并行（多条剧情线交织）', '开放探索（自由选择方向）', '任务驱动（通过任务推进）', '角色驱动（围绕角色关系展开）', '事件驱动（重大事件推动剧情）']
    },
    {
        id: 'conflictType',
        question: '你喜欢什么类型的冲突？（可多选）',
        type: 'checkbox',
        options: ['正邪对立', '势力争斗', '个人恩怨', '理念冲突', '命运抗争', '内心挣扎', '误会矛盾', '利益博弈', '情感纠葛', '生存挑战']
    },
    
    // ===== 第二部分：文风与描写 =====
    {
        id: 'section2',
        type: 'section',
        title: '✍️ 第二部分：文风与描写'
    },
    {
        id: 'writingStyle',
        question: '你偏好什么样的文风？',
        type: 'radio',
        options: ['细腻华丽（注重环境和心理描写）', '简洁明快（重点突出，节奏紧凑）', '轻松幽默（有趣的对话和吐槽）', '严肃深沉（成熟的叙事风格）', '日式轻小说（轻松日常+热血战斗）', '武侠仙侠古风（古典雅致）', '网文爽文风（爽快直接、节奏快）', '文青风（意象丰富、富有诗意）', '硬核写实（注重逻辑和细节真实）', '通俗易懂（平实流畅好读）']
    },
    {
        id: 'favoriteWorks',
        question: '请填写你喜欢的小说/作品（选填，用于参考文风）',
        type: 'textarea',
        placeholder: '例如：\n• 修仙：《凡人修仙传》《遮天》《一念永恒》《仙逆》《我欲封天》\n• 玄幻：《斗破苍穹》《武动乾坤》《完美世界》《大主宰》\n• 奇幻：《诛仙》《择天记》《雪中悍刀行》《将夜》\n• 都市：《龙王传说》《全职高手》《大王饶命》\n• 悬疑：《盗墓笔记》《鬼吹灯》《道诡异仙》\n• 轻小说：《刀剑神域》《无职转生》《Re:从零开始》《overlord》\n• 武侠：《天龙八部》《笑傲江湖》《射雕英雄传》\n• 其他：可以填写任何你喜欢的作品，AI会参考其文风特点'
    },
    {
        id: 'dialogueStyle',
        question: '你喜欢什么样的对话风格？',
        type: 'radio',
        options: ['简洁有力（直奔主题）', '机智幽默（吐槽和玩梗）', '文艺抒情（有深度和韵味）', '日常口语化（自然真实）', '古风雅致（文言半白）', '中二热血（燃系台词）', '腹黑阴险（话中有话）', '萌系可爱（软萌撒娇）', '根据角色性格变化']
    },
    {
        id: 'descriptionFocus',
        question: '你希望重点描写什么？（可多选）',
        type: 'checkbox',
        options: ['环境氛围', '人物外貌', '心理活动', '动作细节', '对话交锋', '情感变化', '战斗过程', '感官体验', '服饰装扮', '表情神态', '肢体语言', '内心独白', '回忆闪回', '气势渲染']
    },
    {
        id: 'detailLevel',
        question: '你希望每次AI回复的详细程度？',
        type: 'radio',
        options: ['极简（200-300字）', '简短精炼（300-500字）', '适中篇幅（500-800字）', '详细描写（800-1200字）', '长篇大论（1200-1800字）', '超长篇（1800字以上）', '根据场景自动调整']
    },
    {
        id: 'narrativeStyle',
        question: '你喜欢什么样的叙事手法？（可多选）',
        type: 'checkbox',
        options: ['顺叙（按时间顺序）', '倒叙（从结果开始）', '插叙（穿插回忆）', '多视角切换', '内心独白', '旁白解说', '环境烘托', '对比手法', '伏笔暗示', '蒙太奇跳跃']
    },
    {
        id: 'languagePreference',
        question: '你对用词的偏好？',
        type: 'radio',
        options: ['现代白话（通俗易懂）', '半文言半白话（古风韵味）', '网络流行语（接地气）', '专业术语多（显得专业）', '诗词引用（文采飞扬）', '根据场景自动调整']
    },
    
    // ===== 第三部分：角色与互动 =====
    {
        id: 'section3',
        type: 'section',
        title: '👥 第三部分：角色与互动'
    },
    {
        id: 'protagonistRole',
        question: '你希望主角是什么类型？',
        type: 'radio',
        options: ['主导型（主角主动推动剧情）', '探索型（发现世界的秘密）', '成长型（从弱小变强大）', '社交型（结交朋友和盟友）', '反派型（可以做坏事）', '普通人视角（卷入大事件）', '天才型（天赋异禀）', '隐藏型（扮猪吃虎）', '复仇型（有明确目标）', '逍遥型（享受过程）', '领袖型（号召众人）']
    },
    {
        id: 'protagonistPersonality',
        question: '你希望主角展现什么性格？（可多选）',
        type: 'checkbox',
        options: ['正义热血', '冷静理智', '腹黑狡诈', '温柔善良', '桀骜不驯', '幽默风趣', '沉默寡言', '随性洒脱', '霸气侧漏', '谨慎稳重', '机智狡黠', '重情重义', '心狠手辣', '外冷内热', '玩世不恭', '坚韧不拔']
    },
    {
        id: 'protagonistBackground',
        question: '你喜欢什么样的主角背景？（可多选）',
        type: 'checkbox',
        options: ['穿越重生', '废材逆袭', '隐世家族', '孤儿出身', '平凡普通', '天选之人', '落魄贵族', '神秘来历', '异世界人', '转世轮回', '记忆缺失']
    },
    {
        id: 'npcInteraction',
        question: '你希望NPC如何与主角互动？（可多选）',
        type: 'checkbox',
        options: ['友好支持型', '有自己的想法和目标', '可攻略/发展感情', '可能背叛或有隐藏目的', '提供任务和信息', '有独特的性格魅力', '会主动找主角互动', '成为主角的对手', '有神秘背景待揭露', '会成长变化', '有自己的感情线', '偶尔拖后腿搞笑']
    },
    {
        id: 'favoriteNpcTypes',
        question: '你喜欢什么类型的角色？（可多选）',
        type: 'checkbox',
        options: ['傲娇', '温柔', '御姐/大叔', '萝莉/正太', '病娇', '天然呆', '高冷', '腹黑', '热血', '可靠前辈', '神秘人物', '毒舌吐槽', '忠犬型', '女王型', '清冷仙子', '活泼元气', '妖艳魅惑', '知性优雅', '反差萌', '中二病', '闷骚型']
    },
    {
        id: 'relationshipType',
        question: '你喜欢什么样的角色关系？（可多选）',
        type: 'checkbox',
        options: ['青梅竹马', '师徒关系', '主仆关系', '宿敌化友', '欢喜冤家', '一见钟情', '日久生情', '命中注定', '禁忌之恋', '兄妹/姐弟', '同门师兄妹', '后宫群芳', '专一真爱', '暧昧不明']
    },
    {
        id: 'relationshipDepth',
        question: '你希望角色关系发展到什么程度？',
        type: 'radio',
        options: ['点到为止（暗示即可）', '情感描写（心动、告白）', '亲密互动（牵手、拥抱、亲吻）', '深入发展（R18场景）', '根据剧情自然发展', '慢热细腻（感情逐步升温）', '速成甜蜜（快速进入状态）']
    },
    {
        id: 'haremPreference',
        question: '你对后宫/多角色关系的态度？',
        type: 'radio',
        options: ['专一路线（只攻略一个）', '小后宫（2-3个）', '大后宫（多多益善）', '不限定（看缘分）', '不需要感情线', '百合/耽美向']
    },
    
    // ===== 第四部分：战斗与冒险 =====
    {
        id: 'section4',
        type: 'section',
        title: '⚔️ 第四部分：战斗与冒险'
    },
    {
        id: 'difficulty',
        question: '你希望游戏有多大挑战性？',
        type: 'radio',
        options: ['轻松愉快（主角顺风顺水）', '适度挑战（偶尔遇到困难）', '高难度（经常面临危机）', '硬核模式（随时可能失败）', '波动型（时而顺利时而困难）', '阶段性挑战（每个阶段有boss）']
    },
    {
        id: 'combatStyle',
        question: '你喜欢什么样的战斗描写？',
        type: 'radio',
        options: ['策略对决（斗智斗勇）', '热血激战（招式对轰）', '一招制敌（简洁利落）', '详细拆解（每一招都有描写）', '氛围渲染（重气势轻细节）', '血腥暴力（真实残酷）', '飘逸写意（如诗如画）', '内力对拼（境界碾压）', '团队配合（多人协作）']
    },
    {
        id: 'combatElements',
        question: '你喜欢战斗中包含哪些元素？（可多选）',
        type: 'checkbox',
        options: ['法术技能', '武器对决', '肉搏格斗', '阵法布置', '丹药辅助', '召唤兽/宠物', '机关陷阱', '心理博弈', '口舌交锋', '借力打力', '以弱胜强', '境界碾压', '秘技绝招', '爆发变身']
    },
    {
        id: 'powerFantasy',
        question: '你对"爽感"的需求程度？',
        type: 'radio',
        options: ['非常需要（主角要强，装逼打脸）', '适度即可（有高光时刻就行）', '不太需要（更喜欢真实感）', '反向也行（主角可以吃瘪）', '先抑后扬（先挫折后爽）', '稳步推进（循序渐进的强大）']
    },
    {
        id: 'enemyTypes',
        question: '你喜欢什么类型的敌人/反派？（可多选）',
        type: 'checkbox',
        options: ['狂妄跋扈（等着被打脸）', '城府深沉（阴险狡诈）', '实力强大（强敌挑战）', '亦正亦邪（立场复杂）', '有悲惨过去（可以洗白）', '纯粹邪恶（不可救药）', '搞笑反派（蠢萌可爱）', '宿命对手（相爱相杀）', '组织势力', '天灾妖兽']
    },
    {
        id: 'consequenceLevel',
        question: '战斗失败后你希望有什么后果？',
        type: 'radio',
        options: ['基本无后果（重新来过）', '轻微后果（损失财物或时间）', '中等后果（受伤需要恢复）', '严重后果（可能被俘或死亡）', '剧情分支（失败也是故事的一部分）', '贵人相救（有人来帮忙）']
    },
    {
        id: 'powerSystem',
        question: '你喜欢什么样的力量体系？（可多选）',
        type: 'checkbox',
        options: ['修仙境界', '武道修炼', '魔法体系', '斗气等级', '血脉觉醒', '契约召唤', '科技装备', '异能变异', '神魔附体', '规则领悟', '综合体系']
    },
    {
        id: 'growthSpeed',
        question: '你希望主角的成长速度如何？',
        type: 'radio',
        options: ['快速升级（一路开挂）', '稳步提升（循序渐进）', '厚积薄发（积累后爆发）', '瓶颈突破（有卡关有突破）', '机遇驱动（靠奇遇变强）', '实战成长（越打越强）']
    },
    
    // ===== 第五部分：内容偏好 =====
    {
        id: 'section5',
        type: 'section',
        title: '🎯 第五部分：内容偏好'
    },
    {
        id: 'contentPreferences',
        question: '你希望剧情中包含哪些元素？（可多选）',
        type: 'checkbox',
        options: ['浪漫/恋爱', '战斗/冒险', '悬疑/推理', '幽默/搞笑', '政治/阴谋', '修炼/升级', '探索/发现', '日常生活', '商业/经营', '亲密场景(R18)', '宗门势力', '寻宝历险', '复仇雪恨', '拜师学艺', '比武大会', '秘境探险', '炼丹炼器', '交友结义', '建立势力']
    },
    {
        id: 'worldBuilding',
        question: '你对世界观设定的兴趣？',
        type: 'radio',
        options: ['非常感兴趣（喜欢详细设定）', '适度了解（够用就行）', '不太在意（重点在人物和剧情）', '自己探索（不要直接说明）', '边玩边了解（逐步揭露）', '喜欢宏大世界观']
    },
    {
        id: 'worldElements',
        question: '你喜欢世界中包含哪些元素？（可多选）',
        type: 'checkbox',
        options: ['仙山福地', '魔域秘境', '远古遗迹', '妖兽横行', '门派林立', '王朝更替', '天地异象', '上古传说', '平行世界', '时间穿越', '科技与修真', '末法时代', '诸天万界', '灵气复苏']
    },
    {
        id: 'moralChoices',
        question: '你对道德选择的态度？',
        type: 'radio',
        options: ['正义优先（做好人好事）', '利益优先（怎么有利怎么来）', '随心所欲（想怎样就怎样）', '根据角色性格决定', '喜欢灰色地带的抉择', '情境决定（具体问题具体分析）', '反派路线（可以做坏事）']
    },
    {
        id: 'r18Preference',
        question: '关于R18内容的偏好？',
        type: 'radio',
        options: ['不需要R18内容', '偶尔有一些调情暗示', '适度的亲密描写', '详细的R18场景', '重口味内容也可以', '纯爱向（甜蜜为主）', '根据剧情需要']
    },
    {
        id: 'r18Elements',
        question: '如果有R18内容，你喜欢什么类型？（可多选，不需要可跳过）',
        type: 'checkbox',
        options: ['纯爱甜蜜', '霸道强势', '温柔体贴', '欲拒还迎', '角色扮演', '制服诱惑', '户外刺激', '多人场景', '双修增益', '不需要此类内容']
    },
    {
        id: 'avoidContent',
        question: '你希望避免哪些内容？（可多选）',
        type: 'checkbox',
        options: ['过于血腥暴力', '主角被虐/NTR', '悲剧结局', '过多日常描写', '复杂的人际关系', '强制剧情（无法选择）', '恐怖惊悚', '虐心剧情', '圣母白莲花', '无脑后宫', '主角降智', '开金手指太多', '剧情拖沓', '无（什么都能接受）']
    },
    {
        id: 'endingPreference',
        question: '你喜欢什么样的结局？',
        type: 'radio',
        options: ['大团圆（皆大欢喜）', '开放式（留有想象空间）', '意味深长（回味无穷）', '悲剧也可以（虐心但深刻）', '史诗终章（波澜壮阔）', '日常继续（没有结局）']
    },
    
    // ===== 第六部分：特殊偏好 =====
    {
        id: 'section6',
        type: 'section',
        title: '💫 第六部分：特殊偏好'
    },
    {
        id: 'immersionLevel',
        question: '你希望AI如何称呼主角？',
        type: 'radio',
        options: ['用"你"（第二人称）', '用主角名字（第三人称）', '用"我"（第一人称）', '根据场景切换', '第三人称但内心用第一人称']
    },
    {
        id: 'surpriseEvents',
        question: '你希望AI主动制造什么样的惊喜？（可多选）',
        type: 'checkbox',
        options: ['随机事件（突发状况）', '新角色登场', '隐藏剧情触发', '意外的道具/机遇', '角色主动表白/示好', '突然的危机', '意外的相遇', '剧情反转', '身世揭秘', '奇遇降临', '不需要惊喜（按我的选择走）']
    },
    {
        id: 'aiCreativity',
        question: '你希望AI有多大的创作自由度？',
        type: 'radio',
        options: ['完全按我的选择（不要自作主张）', '小范围发挥（在我的方向上扩展）', '适度创作（可以添加有趣的细节）', '大胆创作（经常给我惊喜）', '自由发挥（放手让AI创作）']
    },
    {
        id: 'metaElements',
        question: '你对打破第四面墙的接受度？',
        type: 'radio',
        options: ['喜欢（角色知道这是游戏）', '偶尔玩梗可以', '不喜欢（保持沉浸感）', '系统提示可以但角色不要']
    },
    {
        id: 'humorStyle',
        question: '你喜欢什么样的幽默风格？（可多选）',
        type: 'checkbox',
        options: ['吐槽型（犀利点评）', '冷笑话', '无厘头', '玩梗（网络/二次元梗）', '黑色幽默', '反差萌', '谐音梗', '自嘲型', '正经搞笑', '不需要幽默（认真严肃）']
    },
    {
        id: 'interactionFrequency',
        question: '你希望NPC多频繁主动互动？',
        type: 'radio',
        options: ['经常（感觉世界很活跃）', '适度（有需要时出现）', '很少（我主动时才回应）', '根据关系亲密度决定']
    },
    {
        id: 'timeSkip',
        question: '你对时间跳跃的偏好？',
        type: 'radio',
        options: ['不要跳（每天都要描写）', '可以跳过无聊时间', '适度跳跃（日常可略过）', '大胆跳跃（可以跳过较长时间）', '根据剧情需要']
    },
    {
        id: 'flashbackStyle',
        question: '你对回忆/闪回的偏好？',
        type: 'radio',
        options: ['喜欢（丰富角色背景）', '适度使用', '不太喜欢（打断剧情）', '只在重要时刻使用']
    },
    {
        id: 'systemIntegration',
        question: '你希望游戏系统如何融入剧情？',
        type: 'radio',
        options: ['完全隐藏（纯剧情体验）', '适度显示（关键数据）', '详细展示（数值面板）', '游戏化（有明确的系统提示）']
    },
    {
        id: 'additionalNotes',
        question: '还有什么特别的偏好想告诉AI？（选填）',
        type: 'textarea',
        placeholder: '例如：\n• 喜欢的具体角色类型（如：傲娇双马尾、温柔大姐姐、冷艳御姐）\n• 特定的剧情偏好（如：师徒恋、青梅竹马、宿敌变恋人）\n• 想要的特殊元素（如：宠物伙伴、穿越要素、系统金手指）\n• 讨厌的剧情桥段（如：误会分离、强行降智）\n• 喜欢的台词/对话风格示例\n• 特殊的XP或癖好（会严格保密）\n• 任何其他你想让AI知道的偏好...'
    }
];

// 用户确认的画像（来自问卷）
let confirmedUserProfile = null;

/**
 * 打开用户画像问卷调查弹窗
 */
function openUserProfileQuestionnaire() {
    // 检查额外API
    const extraConfig = getExtraApiConfigForProfile();
    if (!extraConfig || !extraConfig.enabled) {
        alert('⚠️ 请先在API设置中启用并配置额外API！\n问卷结果需要发送给额外API进行分析。');
        return;
    }
    
    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'questionnaireModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10001;
        display: flex; justify-content: center; align-items: center;
    `;
    
    let questionNumber = 0;
    let questionsHTML = questionnaireQuestions.map((q, idx) => {
        // 分组标题
        if (q.type === 'section') {
            return `
                <div style="margin: 25px 0 15px 0; padding: 12px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="font-size: 16px; font-weight: bold; color: white;">${q.title}</div>
                </div>
            `;
        }
        
        questionNumber++;
        let inputHTML = '';
        if (q.type === 'radio') {
            inputHTML = q.options.map((opt, i) => `
                <label style="display: block; padding: 8px 12px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 5px; cursor: pointer; transition: background 0.2s;"
                       onmouseover="this.style.background='rgba(102,126,234,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    <input type="radio" name="q_${q.id}" value="${opt}" style="margin-right: 10px;"> ${opt}
                </label>
            `).join('');
        } else if (q.type === 'checkbox') {
            inputHTML = `<div style="display: flex; flex-wrap: wrap; gap: 5px;">` + q.options.map((opt, i) => `
                <label style="display: inline-flex; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.1); border-radius: 20px; cursor: pointer; transition: background 0.2s; font-size: 13px;"
                       onmouseover="this.style.background='rgba(102,126,234,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                    <input type="checkbox" name="q_${q.id}" value="${opt}" style="margin-right: 6px;"> ${opt}
                </label>
            `).join('') + `</div>`;
        } else if (q.type === 'textarea') {
            inputHTML = `<textarea id="q_${q.id}" placeholder="${q.placeholder || ''}" 
                style="width: 100%; min-height: 100px; padding: 12px; border-radius: 8px; border: none; background: rgba(255,255,255,0.9); resize: vertical; font-size: 14px; color: #333;"></textarea>`;
        }
        
        return `
            <div style="margin-bottom: 18px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 10px;">
                <div style="font-weight: bold; color: #a0c4ff; margin-bottom: 10px; font-size: 14px;">${questionNumber}. ${q.question}</div>
                <div>${inputHTML}</div>
            </div>
        `;
    }).join('');
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 15px; 
                    max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; padding: 25px; color: white;">
            <h2 style="text-align: center; margin-bottom: 20px; color: #667eea;">📋 用户偏好问卷调查</h2>
            <p style="text-align: center; color: #aaa; margin-bottom: 25px; font-size: 14px;">
                填写以下问卷，帮助AI了解你的偏好，生成更符合你口味的剧情！
            </p>
            
            <form id="questionnaireForm">
                ${questionsHTML}
            </form>
            
            <div style="display: flex; gap: 15px; margin-top: 25px;">
                <button onclick="closeQuestionnaireModal()" 
                    style="flex: 1; padding: 15px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ❌ 取消
                </button>
                <button onclick="submitQuestionnaire()" 
                    style="flex: 2; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    🚀 提交并分析
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * 关闭问卷弹窗
 */
function closeQuestionnaireModal() {
    const modal = document.getElementById('questionnaireModal');
    if (modal) modal.remove();
}

/**
 * 提交问卷并调用API分析
 */
async function submitQuestionnaire() {
    const form = document.getElementById('questionnaireForm');
    if (!form) return;
    
    // 收集答案（跳过section类型）
    const answers = {};
    questionnaireQuestions.forEach(q => {
        if (q.type === 'section') return; // 跳过分组标题
        
        if (q.type === 'radio') {
            const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
            answers[q.id] = selected ? selected.value : '未选择';
        } else if (q.type === 'checkbox') {
            const checked = form.querySelectorAll(`input[name="q_${q.id}"]:checked`);
            answers[q.id] = Array.from(checked).map(c => c.value);
        } else if (q.type === 'textarea') {
            const textarea = document.getElementById(`q_${q.id}`);
            answers[q.id] = textarea ? textarea.value : '';
        }
    });
    
    console.log('[🎭用户画像] 问卷答案:', answers);
    
    // 显示加载状态
    const submitBtn = document.querySelector('#questionnaireModal button:last-child');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> 正在分析中...';
    }
    
    try {
        // 构建分析请求
        const analysisPrompt = `你是一个用户画像分析专家。根据以下用户问卷结果，生成一份详细的用户画像报告。

【用户问卷答案】
${Object.entries(answers).map(([key, value]) => {
    const q = questionnaireQuestions.find(q => q.id === key);
    if (!q) return null;
    const answer = Array.isArray(value) ? value.join('、') : value;
    return `${q.question}\n答：${answer}`;
}).filter(Boolean).join('\n\n')}

【请输出JSON格式的用户画像】
{
    "summary": "一句话概括这位用户的偏好特点（性格化、生动的描述）",
    
    "storyPreference": "剧情类型偏好（综合用户选择描述）",
    "storyTone": "故事基调偏好",
    "storyStructure": "剧情结构偏好",
    "plotTwistPreference": "剧情反转偏好",
    "conflictTypes": ["喜欢的冲突类型"],
    "pacing": "节奏偏好",
    
    "writingStyle": "文风偏好描述",
    "favoriteWorks": "用户喜欢的作品列表（原样记录）",
    "writingStyleDetails": "【重要】根据用户喜欢的作品和文风选择，详细分析并输出文风要求（150-250字）。包括：这些作品的共同文风特点、叙事特色、对话风格、描写手法、节奏把控、用词风格等。如果用户没有填写喜欢的作品，则根据用户选择的文风偏好生成详细指南。",
    "dialogueStyle": "对话风格偏好",
    "narrativeStyle": ["叙事手法偏好"],
    "languageStyle": "用词风格偏好",
    "descriptionFocus": ["重点描写的内容"],
    "detailLevel": "回复详细程度偏好（字数范围）",
    
    "protagonistType": "希望的主角类型",
    "protagonistPersonality": ["主角性格特点"],
    "protagonistBackground": ["主角背景偏好"],
    "favoriteCharacters": ["喜欢的角色类型"],
    "relationshipTypes": ["喜欢的角色关系类型"],
    "relationshipDepth": "角色关系发展程度偏好",
    "haremPreference": "后宫/感情线偏好",
    "npcStyle": "NPC互动风格偏好",
    
    "difficulty": "难度偏好",
    "combatStyle": "战斗描写风格偏好",
    "combatElements": ["喜欢的战斗元素"],
    "powerFantasy": "爽感需求程度",
    "enemyTypes": ["喜欢的敌人/反派类型"],
    "powerSystem": ["喜欢的力量体系"],
    "growthSpeed": "主角成长速度偏好",
    "consequenceLevel": "失败后果偏好",
    
    "worldBuilding": "世界观兴趣程度",
    "worldElements": ["喜欢的世界元素"],
    "moralChoices": "道德选择态度",
    "r18Preference": "R18内容偏好",
    "r18Elements": ["R18内容类型偏好"],
    "endingPreference": "结局偏好",
    
    "likes": ["喜欢的所有元素（综合整理）"],
    "dislikes": ["不喜欢/要避免的所有元素（综合整理）"],
    
    "immersionStyle": "叙事人称偏好",
    "surprisePreference": "对惊喜事件的偏好",
    "aiCreativity": "AI创作自由度偏好",
    "humorStyle": ["幽默风格偏好"],
    "interactionFrequency": "NPC互动频率偏好",
    "timeSkipPreference": "时间跳跃偏好",
    "systemIntegration": "系统融入偏好",
    
    "specialNotes": "其他特别注意事项（综合用户填写的所有备注和特殊偏好）",
    "aiGuidelines": "给AI的详细创作指南（400-500字，基于以上所有分析，重点参考用户喜欢的作品文风，全面具体地告诉AI应该如何创作内容，包括：详细的文风要求和示例、剧情走向建议、角色塑造要点、互动方式、对话风格示例、描写手法、战斗描写要点、R18内容处理方式、应该做什么、绝对不要做什么等）"
}`;

        const messages = [
            { role: 'system', content: '你是一个专业的用户画像分析师，擅长从问卷答案中提取用户偏好。请输出JSON格式的分析结果。' },
            { role: 'user', content: analysisPrompt }
        ];
        
        // 调用额外API
        const response = await callExtraAI(messages);
        console.log('[🎭用户画像] API分析结果:', response);
        
        // 解析结果
        let profileResult;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                profileResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('未找到JSON格式的结果');
            }
        } catch (e) {
            console.error('[🎭用户画像] 解析失败:', e);
            profileResult = { 
                summary: '问卷分析完成', 
                rawResponse: response,
                aiGuidelines: response 
            };
        }
        
        // 显示结果让用户确认
        showProfileConfirmation(profileResult, answers);
        
    } catch (error) {
        console.error('[🎭用户画像] 分析失败:', error);
        alert('分析失败：' + error.message + '\n请检查额外API配置是否正确。');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 提交并分析';
        }
    }
}

/**
 * 显示画像确认弹窗
 */
function showProfileConfirmation(profileResult, originalAnswers) {
    closeQuestionnaireModal();
    
    const modal = document.createElement('div');
    modal.id = 'profileConfirmModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); z-index: 10001;
        display: flex; justify-content: center; align-items: center;
    `;
    
    const profileDisplay = `
<strong>📌 用户画像摘要</strong>
${profileResult.summary || '暂无'}

<strong>═══ 剧情偏好 ═══</strong>
📖 剧情类型：${profileResult.storyPreference || '未指定'}
🎭 故事基调：${profileResult.storyTone || '未指定'}
📐 剧情结构：${profileResult.storyStructure || '未指定'}
⏱️ 节奏偏好：${profileResult.pacing || '未指定'}
🔄 反转偏好：${profileResult.plotTwistPreference || '未指定'}

<strong>═══ 文风描写 ═══</strong>
✍️ 文风偏好：${profileResult.writingStyle || '未指定'}
📚 喜欢作品：${profileResult.favoriteWorks || '未填写'}
💬 对话风格：${profileResult.dialogueStyle || '未指定'}
📏 详细程度：${profileResult.detailLevel || '未指定'}
🔍 描写重点：${Array.isArray(profileResult.descriptionFocus) ? profileResult.descriptionFocus.join('、') : profileResult.descriptionFocus || '未指定'}

<strong>═══ 角色互动 ═══</strong>
🦸 主角类型：${profileResult.protagonistType || '未指定'}
💕 喜欢角色：${Array.isArray(profileResult.favoriteCharacters) ? profileResult.favoriteCharacters.join('、') : profileResult.favoriteCharacters || '未指定'}
💑 关系深度：${profileResult.relationshipDepth || '未指定'}
💞 感情线：${profileResult.haremPreference || '未指定'}
👥 NPC风格：${profileResult.npcStyle || '未指定'}

<strong>═══ 战斗冒险 ═══</strong>
⚔️ 难度偏好：${profileResult.difficulty || '未指定'}
🗡️ 战斗风格：${profileResult.combatStyle || '未指定'}
💪 爽感需求：${profileResult.powerFantasy || '未指定'}
📈 成长速度：${profileResult.growthSpeed || '未指定'}

<strong>═══ 内容偏好 ═══</strong>
🌍 世界观兴趣：${profileResult.worldBuilding || '未指定'}
🔞 R18偏好：${profileResult.r18Preference || '未指定'}
🎬 结局偏好：${profileResult.endingPreference || '未指定'}

<strong>═══ 特殊偏好 ═══</strong>
🎯 叙事人称：${profileResult.immersionStyle || '未指定'}
🎲 AI创作自由度：${profileResult.aiCreativity || '未指定'}
😄 幽默风格：${Array.isArray(profileResult.humorStyle) ? profileResult.humorStyle.join('、') : profileResult.humorStyle || '未指定'}

<strong>❤️ 喜欢的元素</strong>
${Array.isArray(profileResult.likes) ? profileResult.likes.join('、') : profileResult.likes || '未指定'}

<strong>� 不喜欢/避免的元素</strong>
${Array.isArray(profileResult.dislikes) ? profileResult.dislikes.join('、') : profileResult.dislikes || '未指定'}

<strong>📝 特别注意</strong>
${profileResult.specialNotes || '无'}

<strong>🤖 AI创作指南</strong>
${profileResult.aiGuidelines || '无'}
    `.trim();
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 15px; 
                    max-width: 700px; width: 90%; max-height: 85vh; overflow-y: auto; padding: 25px; color: white;">
            <h2 style="text-align: center; margin-bottom: 20px; color: #4CAF50;">✅ 用户画像分析完成</h2>
            <p style="text-align: center; color: #aaa; margin-bottom: 20px; font-size: 14px;">
                请确认以下分析结果，确认后将保存为你的专属用户画像
            </p>
            
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; 
                        white-space: pre-wrap; line-height: 1.8; font-size: 14px; max-height: 400px; overflow-y: auto;">
${profileDisplay}
            </div>
            
            <div style="display: flex; gap: 15px; margin-top: 25px;">
                <button onclick="closeProfileConfirmModal()" 
                    style="flex: 1; padding: 15px; background: #555; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ❌ 取消
                </button>
                <button onclick="confirmAndSaveProfile()" 
                    style="flex: 2; padding: 15px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px;">
                    ✅ 确认并保存画像
                </button>
            </div>
        </div>
    `;
    
    // 临时存储待确认的画像
    window._pendingUserProfile = {
        result: profileResult,
        answers: originalAnswers,
        createdAt: new Date().toISOString()
    };
    
    document.body.appendChild(modal);
}

/**
 * 关闭画像确认弹窗
 */
function closeProfileConfirmModal() {
    const modal = document.getElementById('profileConfirmModal');
    if (modal) modal.remove();
    window._pendingUserProfile = null;
}

/**
 * 确认并保存用户画像到IndexedDB
 */
async function confirmAndSaveProfile() {
    if (!window._pendingUserProfile) {
        alert('没有待保存的用户画像');
        return;
    }
    
    confirmedUserProfile = window._pendingUserProfile;
    
    // 保存到IndexedDB
    try {
        await saveUserProfileToIndexedDB(confirmedUserProfile);
        console.log('[🎭用户画像] 已保存到IndexedDB');
        
        // 更新UI显示
        updateProfileDisplay();
        
        closeProfileConfirmModal();
        alert('✅ 用户画像已保存！\n\nAI将根据你的画像定制剧情走向。\n画像会随存档一起备份和导入导出。');
        
    } catch (error) {
        console.error('[🎭用户画像] 保存失败:', error);
        alert('保存失败：' + error.message);
    }
}

/**
 * 更新画像显示
 */
function updateProfileDisplay() {
    const textarea = document.getElementById('currentUserProfile');
    if (textarea && confirmedUserProfile) {
        const p = confirmedUserProfile.result;
        textarea.value = `📌 ${p.summary || '用户画像已生成'}\n\n` +
            `剧情偏好：${p.storyPreference || '未指定'}\n` +
            `文风偏好：${p.writingStyle || '未指定'}\n` +
            `节奏偏好：${p.pacing || '未指定'}\n` +
            `难度偏好：${p.difficulty || '未指定'}\n` +
            `喜欢：${Array.isArray(p.likes) ? p.likes.join('、') : p.likes || '无'}\n` +
            `不喜欢：${Array.isArray(p.dislikes) ? p.dislikes.join('、') : p.dislikes || '无'}\n\n` +
            `创建时间：${new Date(confirmedUserProfile.createdAt).toLocaleString()}\n` +
            `点击"查看完整画像"获取AI创作指南`;
    }
}

// ==================== IndexedDB 用户画像存储 ====================

const USER_PROFILE_DB_NAME = 'UserProfileDB';
const USER_PROFILE_STORE_NAME = 'userProfile';

/**
 * 打开IndexedDB
 */
function openUserProfileDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(USER_PROFILE_DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(USER_PROFILE_STORE_NAME)) {
                db.createObjectStore(USER_PROFILE_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

/**
 * 保存用户画像到IndexedDB
 */
async function saveUserProfileToIndexedDB(profile) {
    const db = await openUserProfileDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(USER_PROFILE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(USER_PROFILE_STORE_NAME);
        store.put({ id: 'main', ...profile });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

/**
 * 从IndexedDB加载用户画像
 */
async function loadUserProfileFromIndexedDB() {
    try {
        const db = await openUserProfileDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_PROFILE_STORE_NAME, 'readonly');
            const store = tx.objectStore(USER_PROFILE_STORE_NAME);
            const request = store.get('main');
            request.onsuccess = () => { 
                db.close(); 
                if (request.result) {
                    confirmedUserProfile = request.result;
                    console.log('[🎭用户画像] 从IndexedDB加载画像成功');
                }
                resolve(request.result); 
            };
            request.onerror = () => { db.close(); reject(request.error); };
        });
    } catch (e) {
        console.warn('[🎭用户画像] IndexedDB加载失败:', e);
        return null;
    }
}

/**
 * 导出用户画像（用于备份）
 */
function exportUserProfile() {
    return confirmedUserProfile ? JSON.stringify(confirmedUserProfile) : null;
}

/**
 * 导入用户画像（用于恢复备份）
 */
async function importUserProfile(profileJson) {
    try {
        const profile = typeof profileJson === 'string' ? JSON.parse(profileJson) : profileJson;
        confirmedUserProfile = profile;
        await saveUserProfileToIndexedDB(profile);
        updateProfileDisplay();
        console.log('[🎭用户画像] 导入成功');
        return true;
    } catch (e) {
        console.error('[🎭用户画像] 导入失败:', e);
        return false;
    }
}

/**
 * 获取AI创作指南（供分析API使用）
 */
function getAIGuidelines() {
    if (!confirmedUserProfile || !confirmedUserProfile.result) {
        return null;
    }
    return confirmedUserProfile.result.aiGuidelines || null;
}

/**
 * 获取完整确认画像
 */
function getConfirmedProfile() {
    return confirmedUserProfile;
}

// ==================== 导出到全局 ====================

// 挂载到window对象供其他模块调用
window.userProfileAnalyzer = {
    init: initUserProfileSystem,
    analyze: analyzeUserInput,
    analyzeUserInput: analyzeUserInput,  // 别名，兼容两种调用方式
    getEnhancedPrompt: getEnhancedPromptForMainAPI,
    getProfile: () => userProfileData,
    getConfig: () => userProfileConfig,
    isEnabled: () => userProfileConfig.enabled,
    loadSettingsToUI: loadUserProfileSettingsToUI,
    // 新增：问卷相关
    getConfirmedProfile: getConfirmedProfile,
    getAIGuidelines: getAIGuidelines,
    exportProfile: exportUserProfile,
    importProfile: importUserProfile,
    loadFromDB: loadUserProfileFromIndexedDB
};

// 导出UI函数到全局（供onclick调用）
window.toggleUserProfileFields = toggleUserProfileFields;
window.saveUserProfileSettings = saveUserProfileSettings;
window.viewUserProfile = viewUserProfile;
window.clearUserProfile = clearUserProfile;
window.openUserProfileQuestionnaire = openUserProfileQuestionnaire;
window.closeQuestionnaireModal = closeQuestionnaireModal;
window.submitQuestionnaire = submitQuestionnaire;
window.closeProfileConfirmModal = closeProfileConfirmModal;
window.confirmAndSaveProfile = confirmAndSaveProfile;

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserProfileSystem);
} else {
    initUserProfileSystem();
}

console.log('[🎭用户画像] 模块已加载');
