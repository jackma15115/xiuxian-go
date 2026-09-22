/**
 * 游戏初始化和核心逻辑模块
 * 包含游戏启动、配置加载、API连接、响应解析等功能
 */

// ========== 游戏主逻辑 ==========

// 初始化
document.addEventListener('DOMContentLoaded', async function () {
    // 🎮 初始化游戏配置（必须在最开始执行）
    console.log('[游戏初始化] 检查配置对象:', {
        hasConfig: !!window.XiuxianGameConfig,
        hasOnInit: !!(window.XiuxianGameConfig && window.XiuxianGameConfig.onInit)
    });

    // 🔧 强制加载配置确保extraApiConfig可用
    if (typeof loadConfig === 'function') {
        console.log('[游戏初始化] 强制加载配置...');
        loadConfig();
        
        // 确认配置加载结果
        setTimeout(() => {
            console.log('[游戏初始化] 配置加载后检查:', {
                extraApiConfig: window.extraApiConfig,
                enabled: window.extraApiConfig?.enabled,
                hasKey: !!window.extraApiConfig?.key
            });
        }, 100);
    }

    if (window.XiuxianGameConfig && window.XiuxianGameConfig.onInit) {
        console.log('[游戏初始化] 准备调用 onInit()');
        window.XiuxianGameConfig.onInit();
        console.log('[游戏初始化] ✅ 配置文件已初始化');
    } else {
        console.error('[游戏初始化] ❌ 配置对象或 onInit 方法不存在！');
    }

    // 初始化 IndexedDB
    try {
        await initDB();
        // 尝试加载历史数据
        const savedHistory = await loadGameHistory();
        if (savedHistory && savedHistory.isGameStarted && savedHistory.variables && savedHistory.variables.name) {
            // 恢复游戏状态（只有在有角色名称时才恢复）
            console.log('[恢复存档] 从IndexedDB恢复的variables:', savedHistory.variables);
            console.log('[恢复存档] 柳如烟关系数据:', savedHistory.variables.relationships?.find(r => r.name === '柳如烟'));
            
            gameState.variables = savedHistory.variables;
            gameState.conversationHistory = savedHistory.conversationHistory;
            gameState.variableSnapshots = savedHistory.variableSnapshots || [];
            gameState.isGameStarted = savedHistory.isGameStarted;
            
            // 🆕 向后兼容：确保功法法术数组存在（旧存档可能没有）
            if (!gameState.variables.techniques) {
                gameState.variables.techniques = [];
                console.log('[兼容性] 已初始化 techniques 数组');
            }
            if (!gameState.variables.spells) {
                gameState.variables.spells = [];
                console.log('[兼容性] 已初始化 spells 数组');
            }

            // 🌍 恢复动态世界数据
            if (savedHistory.dynamicWorld) {
                gameState.dynamicWorld = savedHistory.dynamicWorld;
                // 🆕 强制重置处理状态（避免卡在处理中）
                gameState.dynamicWorld.isProcessing = false;
                // 🆕 兼容旧存档，添加新字段
                if (!gameState.dynamicWorld.messageInterval) {
                    gameState.dynamicWorld.messageInterval = 1;
                }
                if (!gameState.dynamicWorld.messageCounter) {
                    gameState.dynamicWorld.messageCounter = 0;
                }
                console.log(`[动态世界] ✅ 已从自动存档恢复 ${savedHistory.dynamicWorld.history?.length || 0} 条记录`);
                console.log('[动态世界] 恢复的数据:', {
                    enabled: gameState.dynamicWorld.enabled,
                    floor: gameState.dynamicWorld.floor,
                    historyLength: gameState.dynamicWorld.history?.length
                });
            } else {
                // 旧版存档，初始化动态世界
                gameState.dynamicWorld = {
                    enabled: false,
                    history: [],
                    floor: 0,
                    isProcessing: false,
                    messageInterval: 1,
                    messageCounter: 0
                };
                console.warn('[动态世界] 旧版自动存档，动态世界数据已初始化');
            }

            // 更新UI
            updateStatusPanel();

            // 恢复对话历史显示
            restoreConversationHistory();

            // 隐藏开始按钮
            document.getElementById('startGame').classList.add('hidden');

            console.log('已恢复游戏历史');
        } else {
            // 没有完整的游戏数据，显示主菜单
            console.log('未发现游戏数据，显示主菜单');
            showMainMenu();
        }
    } catch (error) {
        console.error('加载历史数据失败:', error);
        showMainMenu();
    }

    // loadConfig() 现在在配置弹窗加载完成后自动执行
    updateConnectionStatus(false);
    updateExtraConnectionStatus(false);
    
    // 【新增】加载向量库
    if (window.contextVectorManager) {
        window.contextVectorManager.loadFromIndexedDB().catch(err => {
            console.error('向量库加载失败:', err);
        });
        
        // 🆕 自动加载静态知识库（优先从IndexedDB，如果为空则从配置的文件路径）
        window.contextVectorManager.loadStaticKBFromIndexedDB().then(async () => {
            const kbSize = window.contextVectorManager.staticKnowledgeBase.length;
            
            if (kbSize > 0) {
                // IndexedDB中有数据，直接使用
                console.log(`[初始化] ✅ 已从IndexedDB加载 ${kbSize} 条静态知识`);
                
                // 🆕 立即确保系统提示词存在
                if (typeof ensureSystemPromptInKB === 'function') {
                    await ensureSystemPromptInKB();
                } else {
                    console.warn('[初始化] ⚠️ ensureSystemPromptInKB 函数未找到，跳过系统提示词检查');
                }
                
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #28a745;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 9999;
                    font-size: 14px;
                `;
                notification.innerHTML = `✅ 已加载 ${window.contextVectorManager.staticKnowledgeBase.length} 条静态知识（IndexedDB）`;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 3000);
            } else {
                // IndexedDB为空，尝试从文件加载
                console.log(`[初始化] IndexedDB中无知识库数据，尝试从文件加载...`);
                
                // 先创建系统提示词
                if (typeof ensureSystemPromptInKB === 'function') {
                    await ensureSystemPromptInKB();
                } else {
                    console.warn('[初始化] ⚠️ ensureSystemPromptInKB 函数未找到，跳过系统提示词创建');
                }
                
                // 再尝试从文件加载其他知识
                if (typeof window.contextVectorManager.autoLoadStaticKB === 'function') {
                    const result = await window.contextVectorManager.autoLoadStaticKB();
                    if (result && result.totalLoaded > 0) {
                        console.log(`[初始化] ✅ 已从文件加载 ${result.totalLoaded} 条静态知识`);
                        
                        const notification = document.createElement('div');
                        notification.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: #28a745;
                            color: white;
                            padding: 15px 20px;
                            border-radius: 10px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                            z-index: 9999;
                            font-size: 14px;
                        `;
                        notification.innerHTML = `✅ 已加载 ${result.totalLoaded} 条静态知识（文件）`;
                        document.body.appendChild(notification);
                        
                        setTimeout(() => notification.remove(), 3000);
                    } else {
                        console.log('[初始化] 没有配置知识库文件路径，只创建了系统提示词');
                    }
                } else {
                    console.warn('[初始化] autoLoadStaticKB函数不存在（可能是旧版supply.js）');
                }
            }
            
        }).catch(err => {
            console.error('静态知识库加载失败:', err);
            // 即使加载失败，也尝试创建系统提示词
            if (typeof ensureSystemPromptInKB === 'function') {
                ensureSystemPromptInKB().catch(e => console.error('系统提示词创建失败:', e));
            } else {
                console.warn('[初始化] ⚠️ ensureSystemPromptInKB 函数未找到，无法创建系统提示词');
            }
        });
    }

    // 添加输入框回车发送功能
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserInput();
            }
        });
    }

    // API类型切换时更新默认端点
    document.getElementById('apiType').addEventListener('change', function (e) {
        const type = e.target.value;
        const endpointInput = document.getElementById('apiEndpoint');

        // 重置模型选择
        document.getElementById('modelSelectGroup').style.display = 'none';
        document.getElementById('saveConnectionBtn').style.display = 'none';

        if (type === 'openai') {
            endpointInput.value = 'https://api.openai.com/v1';
            endpointInput.placeholder = 'https://api.openai.com/v1';
        } else if (type === 'gemini') {
            endpointInput.value = 'https://generativelanguage.googleapis.com/v1beta';
            endpointInput.placeholder = 'https://generativelanguage.googleapis.com/v1beta';
        } else if (type === 'custom') {
            endpointInput.value = '';
            endpointInput.placeholder = 'https://your-api.com/v1';
        }
    });

    // 额外API类型切换时更新默认端点
    document.getElementById('extraApiType').addEventListener('change', function (e) {
        const type = e.target.value;
        const endpointInput = document.getElementById('extraApiEndpoint');

        // 重置模型选择
        document.getElementById('extraModelSelectGroup').style.display = 'none';
        document.getElementById('saveExtraConnectionBtn').style.display = 'none';

        if (type === 'openai') {
            endpointInput.value = 'https://api.openai.com/v1';
            endpointInput.placeholder = 'https://api.openai.com/v1';
        } else if (type === 'gemini') {
            endpointInput.value = 'https://generativelanguage.googleapis.com/v1beta';
            endpointInput.placeholder = 'https://generativelanguage.googleapis.com/v1beta';
        } else if (type === 'custom') {
            endpointInput.value = '';
            endpointInput.placeholder = 'https://your-api.com/v1';
        }
    });
});

// 窗口大小改变时重新绘制雷达图（响应式设计）
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        if (gameState.isGameStarted) {
            drawRadarChart();
        }
    }, 200); // 防抖处理，避免频繁重绘
});

// 加载配置
function loadConfig() {
    const saved = localStorage.getItem('gameConfig');
    if (saved) {
        const config = JSON.parse(saved);
        
        // 检查配置弹窗元素是否存在
        const apiTypeElement = document.getElementById('apiType');
        if (apiTypeElement) {
            apiTypeElement.value = config.type || 'openai';
            document.getElementById('apiEndpoint').value = config.endpoint || '';
            document.getElementById('apiKey').value = config.key || '';

            apiConfig.type = config.type;
            apiConfig.endpoint = config.endpoint;
            apiConfig.key = config.key;
            apiConfig.model = config.model;
            apiConfig.availableModels = config.availableModels || [];

            // 加载历史层数和最小字数设置
            if (config.historyDepth !== undefined) {
                document.getElementById('historyDepth').value = config.historyDepth;
            }
            if (config.minWordCount !== undefined) {
                document.getElementById('minWordCount').value = config.minWordCount;
            }
            if (config.maxTokens !== undefined) {
                document.getElementById('maxTokens').value = config.maxTokens;
            }
            
            // 加载向量检索设置
            if (config.enableVectorRetrieval !== undefined) {
                document.getElementById('enableVectorRetrieval').checked = config.enableVectorRetrieval;
                if (config.enableVectorRetrieval) {
                    document.getElementById('vectorRetrievalSettings').style.display = 'block';
                }
            }
            if (config.vectorMethod !== undefined) {
                document.getElementById('vectorMethod').value = config.vectorMethod;
                if (window.contextVectorManager) {
                    window.contextVectorManager.setEmbeddingMethod(config.vectorMethod);
                }
            }
            if (config.maxRetrieveCount !== undefined) {
                document.getElementById('maxRetrieveCount').value = config.maxRetrieveCount;
                if (window.contextVectorManager) {
                    window.contextVectorManager.maxRetrieveCount = config.maxRetrieveCount;
                }
            }
            if (config.similarityThreshold !== undefined) {
                document.getElementById('similarityThreshold').value = config.similarityThreshold;
                if (window.contextVectorManager) {
                    window.contextVectorManager.minSimilarityThreshold = config.similarityThreshold;
                }
            }
            if (config.minTurnGap !== undefined) {
                document.getElementById('minTurnGap').value = config.minTurnGap;
                if (window.contextVectorManager) {
                    window.contextVectorManager.minTurnGap = config.minTurnGap;
                }
            }
            if (config.includeRecentAIReplies !== undefined) {
                document.getElementById('includeRecentAIReplies').value = config.includeRecentAIReplies;
                if (window.contextVectorManager) {
                    window.contextVectorManager.includeRecentAIRepliesInQuery = config.includeRecentAIReplies;
                }
            }
            // 🆕 加载History矩阵设置
            if (config.recentHistoryCount !== undefined && document.getElementById('recentHistoryCount')) {
                document.getElementById('recentHistoryCount').value = config.recentHistoryCount;
                if (window.contextVectorManager) {
                    window.contextVectorManager.recentHistoryCount = config.recentHistoryCount;
                }
            }
            if (config.matrixHistoryCount !== undefined && document.getElementById('matrixHistoryCount')) {
                document.getElementById('matrixHistoryCount').value = config.matrixHistoryCount;
                if (window.contextVectorManager) {
                    window.contextVectorManager.matrixHistoryCount = config.matrixHistoryCount;
                }
            }
        }
        
        // 加载叙事视角设置
        if (config.narrativePerspective !== undefined && document.getElementById('narrativePerspective')) {
            document.getElementById('narrativePerspective').value = config.narrativePerspective;
        }
        
        // 🔧 系统提示词：不从localStorage恢复，由各游戏配置的onInit负责设置
        // 这样 xiuxian 游戏和 bhz 游戏可以各自设置自己的提示词
        if (config.systemPrompt !== undefined && document.getElementById('systemPrompt')) {
            console.log('[系统提示词] 跳过恢复，等待游戏配置onInit设置默认提示词');
        }

        // 加载额外API配置
        if (config.extraApi && document.getElementById('enableExtraApi')) {
            extraApiConfig.enabled = config.extraApi.enabled || false;
            extraApiConfig.type = config.extraApi.type || 'openai';
            extraApiConfig.endpoint = config.extraApi.endpoint || '';
            extraApiConfig.key = config.extraApi.key || '';
            extraApiConfig.model = config.extraApi.model || 'gpt-4o-mini';
            extraApiConfig.availableModels = config.extraApi.availableModels || [];

            document.getElementById('enableExtraApi').checked = extraApiConfig.enabled;
            document.getElementById('extraApiType').value = extraApiConfig.type;
            document.getElementById('extraApiEndpoint').value = extraApiConfig.endpoint;
            document.getElementById('extraApiKey').value = extraApiConfig.key;

            if (extraApiConfig.enabled && document.getElementById('extraApiFields')) {
                document.getElementById('extraApiFields').style.display = 'block';

                if (extraApiConfig.model && extraApiConfig.endpoint && extraApiConfig.key) {
                    updateExtraConnectionStatus(true);
                    if (document.getElementById('extraModelSelectGroup')) {
                        document.getElementById('extraModelSelectGroup').style.display = 'flex';
                    }
                    if (document.getElementById('saveExtraConnectionBtn')) {
                        document.getElementById('saveExtraConnectionBtn').style.display = 'block';
                    }
                    
                    // 显示已保存的模型（在模型列表中选中）
                    const extraModelSelect = document.getElementById('extraModelSelect');
                    if (extraModelSelect) {
                        const option = document.createElement('option');
                        option.value = extraApiConfig.model;
                        option.textContent = extraApiConfig.model;
                        option.selected = true;
                        extraModelSelect.innerHTML = '';
                        extraModelSelect.appendChild(option);
                    }
                    
                    const fetchExtraModelsBtn = document.getElementById('fetchExtraModelsBtn');
                    if (fetchExtraModelsBtn) {
                        fetchExtraModelsBtn.innerHTML = '<span class="status-indicator status-connected"></span> 已连接 - ' + extraApiConfig.model.substring(0, 20);
                    }
                }
            }
        }

        // 加载动态世界配置
        if (config.dynamicWorld) {
            const dwConfig = config.dynamicWorld;
            
            // 🆕 只更新enabled状态，不覆盖整个dynamicWorld对象（避免丢失history数据）
            if (gameState.dynamicWorld) {
                gameState.dynamicWorld.enabled = dwConfig.enabled || false;
                gameState.dynamicWorld.messageInterval = dwConfig.messageInterval || 1;
                console.log('[动态世界] loadConfig - 更新enabled状态:', dwConfig.enabled);
                console.log('[动态世界] loadConfig - 保留历史记录数:', gameState.dynamicWorld.history?.length || 0);
            } else {
                // 如果dynamicWorld未初始化（新游戏），才完整初始化
                gameState.dynamicWorld = {
                    enabled: dwConfig.enabled || false,
                    history: [],
                    floor: 0,
                    isProcessing: false,
                    messageInterval: dwConfig.messageInterval || 1,
                    messageCounter: 0
                };
                console.log('[动态世界] loadConfig - 首次初始化动态世界');
            }
            
            // 检查动态世界配置元素是否存在
            if (document.getElementById('enableDynamicWorld')) {
                document.getElementById('enableDynamicWorld').checked = dwConfig.enabled || false;
                document.getElementById('dynamicWorldHistoryDepth').value = dwConfig.historyDepth || 5;
                document.getElementById('dynamicWorldMinWords').value = dwConfig.minWords || 300;
                document.getElementById('dynamicWorldInterval').value = dwConfig.messageInterval || 1;
                document.getElementById('dynamicWorldShowReasoning').checked = dwConfig.showReasoning !== undefined ? dwConfig.showReasoning : true;
                document.getElementById('dynamicWorldEnableKnowledge').checked = dwConfig.enableKnowledge !== undefined ? dwConfig.enableKnowledge : true;
                
                // 🔧 动态世界提示词：不从localStorage恢复，由各游戏配置的onInit负责设置
                // 这样 xiuxian 游戏和 bhz 游戏可以各自设置自己的提示词
                if (dwConfig.prompt && document.getElementById('dynamicWorldPrompt')) {
                    console.log('[动态世界提示词] 跳过恢复，等待游戏配置onInit设置默认提示词');
                }
                
                if (dwConfig.enabled && document.getElementById('dynamicWorldFields')) {
                    document.getElementById('dynamicWorldFields').style.display = 'block';
                }
            }
        }

        // 如果已有配置，显示已连接状态
        if (config.model && config.endpoint && config.key && document.getElementById('modelSelectGroup')) {
            updateConnectionStatus(true);
            document.getElementById('modelSelectGroup').style.display = 'flex';
            if (document.getElementById('saveConnectionBtn')) {
                document.getElementById('saveConnectionBtn').style.display = 'block';
            }

            // 显示已保存的模型（在模型列表中选中）
            const modelSelect = document.getElementById('modelSelect');
            if (modelSelect) {
                const option = document.createElement('option');
                option.value = config.model;
                option.textContent = config.model;
                option.selected = true;
                modelSelect.innerHTML = '';
                modelSelect.appendChild(option);
                
                const fetchModelsBtn = document.getElementById('fetchModelsBtn');
                if (fetchModelsBtn) {
                    fetchModelsBtn.innerHTML = '<span class="status-indicator status-connected"></span> 已连接 - ' + config.model.substring(0, 20);
                }
            }
        }
    }
    
    // 🎭 加载用户画像设置
    if (window.userProfileAnalyzer && typeof window.userProfileAnalyzer.loadSettingsToUI === 'function') {
        window.userProfileAnalyzer.loadSettingsToUI();
        console.log('[用户画像] ✅ 已加载用户画像设置到UI');
    }
}

// 获取完整端点
function getFullEndpoint(baseEndpoint, apiType) {
    let endpoint = baseEndpoint.trim();

    // 移除末尾的斜杠
    endpoint = endpoint.replace(/\/+$/, '');

    if (apiType === 'openai' || apiType === 'custom') {
        // 如果端点不包含 /chat/completions，自动添加
        if (!endpoint.includes('/chat/completions')) {
            endpoint = endpoint + '/chat/completions';
        }
    }

    return endpoint;
}

// 获取模型列表端点
function getModelsEndpoint(baseEndpoint, apiType) {
    let endpoint = baseEndpoint.trim();
    endpoint = endpoint.replace(/\/+$/, '');

    if (apiType === 'gemini') {
        return endpoint + '/models?key=';
    } else {
        // OpenAI 和第三方使用 /models
        if (endpoint.endsWith('/chat/completions')) {
            endpoint = endpoint.replace('/chat/completions', '');
        }
        return endpoint + '/models';
    }
}

// 获取模型列表
async function fetchModels() {
    const apiType = document.getElementById('apiType').value;
    const baseEndpoint = document.getElementById('apiEndpoint').value;
    const apiKey = document.getElementById('apiKey').value;

    const sCfg = window.serverConfig || (typeof checkServerConfig === 'function' ? await checkServerConfig() : null);
    if (sCfg && sCfg.serverMode && sCfg.hasMain && (!baseEndpoint || !apiKey)) {
        const btn = document.getElementById('fetchModelsBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 连接服务端中...';
        }
        try {
            const res = await fetch('/api/models');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const models = data.models || [];
            if (models.length > 0) {
                apiConfig.availableModels = models;
                displayModels(models);
                updateConnectionStatus(true);
                const msgGroup = document.getElementById('modelSelectGroup');
                const saveBtn = document.getElementById('saveConnectionBtn');
                if (msgGroup) msgGroup.style.display = 'flex';
                if (saveBtn) saveBtn.style.display = 'block';
                if (btn) {
                    btn.innerHTML = '<span class="status-indicator status-connected"></span> 服务端连接成功';
                    btn.disabled = false;
                }
                return;
            }
        } catch (err) {
            console.warn('从服务端获取模型列表失败:', err);
        }
        if (btn) btn.disabled = false;
    }

    if (!baseEndpoint || !apiKey) {
        alert('请先填写API端点和密钥（或在.env环境变量中配置URL与APIKEY）');
        return;
    }

    const btn = document.getElementById('fetchModelsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> 连接中...';

    try {
        let models = [];

        const fetchPromise = apiType === 'gemini'
            ? fetchGeminiModels(baseEndpoint, apiKey)
            : fetchOpenAIModels(baseEndpoint, apiKey);

        models = await fetchPromise;

        if (models.length > 0) {
            apiConfig.availableModels = models;
            displayModels(models);
            updateConnectionStatus(true);

            // 显示模型选择和保存按钮
            document.getElementById('modelSelectGroup').style.display = 'flex';
            document.getElementById('saveConnectionBtn').style.display = 'block';

            btn.innerHTML = '<span class="status-indicator status-connected"></span> 连接成功';
        } else {
            throw new Error('未获取到模型列表');
        }
    } catch (error) {
        updateConnectionStatus(false);

        // 显示详细错误信息
        let errorMsg = '获取模型列表失败';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMsg = '⚠️ 网络请求被阻止\n\n可能原因：\n1. 移动浏览器安全策略限制\n2. CORS跨域问题\n3. HTTP/HTTPS混合内容阻止\n4. 网络连接问题\n5. API端点地址不正确';
        } else {
            errorMsg = error.message || errorMsg;
        }
        
        console.error('获取模型失败详情:', error);
        alert(errorMsg + '\n\n请检查：\n1. API端点和密钥是否正确\n2. 网络连接是否正常\n3. API服务是否支持模型列表查询');
        
        btn.innerHTML = '<span class="status-indicator status-disconnected"></span> 连接失败，请重试';
    }

    btn.disabled = false;
}

// 获取 OpenAI 格式的模型列表
async function fetchOpenAIModels(baseEndpoint, apiKey) {
    const modelsEndpoint = getModelsEndpoint(baseEndpoint, document.getElementById('apiType').value);

    console.log('正在请求OpenAI模型列表:', modelsEndpoint);

    const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    console.log('OpenAI响应状态:', response.status);

    if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI错误响应:', error);
        throw new Error(`获取模型失败: ${response.status} - ${error.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('OpenAI返回数据:', data);

    // OpenAI 返回格式: { data: [{id: "model-name"}, ...] }
    if (data.data && Array.isArray(data.data)) {
        return data.data.map(model => model.id).sort();
    }

    return [];
}

// 获取 Gemini 模型列表
async function fetchGeminiModels(baseEndpoint, apiKey) {
    const modelsEndpoint = getModelsEndpoint(baseEndpoint, 'gemini') + apiKey;

    console.log('正在请求Gemini模型列表:', modelsEndpoint);

    const response = await fetch(modelsEndpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    console.log('Gemini响应状态:', response.status);

    if (!response.ok) {
        const error = await response.text();
        console.error('Gemini错误响应:', error);
        throw new Error(`获取Gemini模型失败: ${response.status} - ${error.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('Gemini返回数据:', data);

    // Gemini 返回格式: { models: [{name: "models/gemini-pro"}, ...] }
    if (data.models && Array.isArray(data.models)) {
        return data.models.map(model => {
            // 提取模型名称，去掉 "models/" 前缀
            return model.name.replace('models/', '');
        }).sort();
    }

    return [];
}

// 显示模型列表
function displayModels(models) {
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML = '';

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });

    // 默认选中第一个
    if (models.length > 0) {
        modelSelect.selectedIndex = 0;
    }
}

// ==================== API配置系统 ====================
// saveConnection, updateConnectionStatus, updateExtraConnectionStatus,
// toggleExtraApiFields, saveExtraApiEnabled 已迁移到 game-core-systems.js

// 获取额外API模型列表
async function fetchExtraModels() {
    const apiType = document.getElementById('extraApiType').value;
    const baseEndpoint = document.getElementById('extraApiEndpoint').value;
    const apiKey = document.getElementById('extraApiKey').value;

    const sCfg = window.serverConfig || (typeof checkServerConfig === 'function' ? await checkServerConfig() : null);
    if (sCfg && sCfg.serverMode && (sCfg.hasExtra || sCfg.hasMain) && (!baseEndpoint || !apiKey)) {
        const btn = document.getElementById('fetchExtraModelsBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 连接服务端中...';
        }
        try {
            const res = await fetch('/api/models?type=extra');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const models = data.models || [];
            if (models.length > 0) {
                extraApiConfig.availableModels = models;
                displayExtraModels(models);
                updateExtraConnectionStatus(true);
                const extraGroup = document.getElementById('extraModelSelectGroup');
                const extraSaveBtn = document.getElementById('saveExtraConnectionBtn');
                if (extraGroup) extraGroup.style.display = 'block';
                if (extraSaveBtn) extraSaveBtn.style.display = 'block';
                if (btn) {
                    btn.innerHTML = '<span class="status-indicator status-connected"></span> 服务端连接成功';
                    btn.disabled = false;
                }
                return;
            }
        } catch (err) {
            console.warn('从服务端获取额外模型列表失败:', err);
        }
        if (btn) btn.disabled = false;
    }

    if (!baseEndpoint || !apiKey) {
        alert('请先填写额外API端点和密钥（或在.env中配置EXTRA_URL与EXTRA_APIKEY，未配置默认走主API）');
        return;
    }

    const btn = document.getElementById('fetchExtraModelsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> 连接中...';

    try {
        let models = [];

        const fetchPromise = apiType === 'gemini'
            ? fetchGeminiModels(baseEndpoint, apiKey)
            : fetchOpenAIModels(baseEndpoint, apiKey);

        models = await fetchPromise;

        if (models.length > 0) {
            extraApiConfig.availableModels = models;
            displayExtraModels(models);
            updateExtraConnectionStatus(true);

            document.getElementById('extraModelSelectGroup').style.display = 'flex';
            document.getElementById('saveExtraConnectionBtn').style.display = 'block';

            btn.innerHTML = '<span class="status-indicator status-connected"></span> 连接成功';
        } else {
            throw new Error('未获取到模型列表');
        }
    } catch (error) {
        updateExtraConnectionStatus(false);

        let errorMsg = '获取模型列表失败';
        
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            errorMsg = '⚠️ 网络请求被阻止\n\n可能原因：\n1. 移动浏览器安全策略限制\n2. CORS跨域问题\n3. HTTP/HTTPS混合内容阻止\n4. 网络连接问题\n5. API端点地址不正确';
        } else {
            errorMsg = error.message || errorMsg;
        }
        
        console.error('获取额外API模型失败详情:', error);
        alert(errorMsg + '\n\n请检查：\n1. API端点和密钥是否正确\n2. 网络连接是否正常\n3. API服务是否支持模型列表查询');
        
        btn.innerHTML = '<span class="status-indicator status-disconnected"></span> 连接失败，请重试';
    }

    btn.disabled = false;
}

// 显示额外API模型列表
function displayExtraModels(models) {
    const modelSelect = document.getElementById('extraModelSelect');
    modelSelect.innerHTML = '';

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });

    if (models.length > 0) {
        modelSelect.selectedIndex = 0;
    }
}

// 保存额外API连接配置
function saveExtraConnection() {
    const modelSelect = document.getElementById('extraModelSelect');
    const selectedModel = modelSelect.value;

    if (!selectedModel) {
        alert('请先从列表中选择一个模型');
        return;
    }

    extraApiConfig.type = document.getElementById('extraApiType').value;
    extraApiConfig.endpoint = document.getElementById('extraApiEndpoint').value;
    extraApiConfig.key = document.getElementById('extraApiKey').value;
    extraApiConfig.model = selectedModel;

    // 获取现有配置
    const saved = localStorage.getItem('gameConfig');
    let config = saved ? JSON.parse(saved) : {};

    // 更新额外API配置
    config.extraApi = {
        enabled: extraApiConfig.enabled,
        type: extraApiConfig.type,
        endpoint: extraApiConfig.endpoint,
        key: extraApiConfig.key,
        model: extraApiConfig.model,
        availableModels: extraApiConfig.availableModels
    };

    localStorage.setItem('gameConfig', JSON.stringify(config));

    alert('额外API配置已保存！\n模型: ' + selectedModel);
    updateExtraConnectionStatus(true);

    document.getElementById('fetchExtraModelsBtn').innerHTML = '<span class="status-indicator status-connected"></span> 已连接 - ' + selectedModel.substring(0, 20);
}

// ==================== 游戏设置系统 ====================
// saveGameSettings, toggleVectorRetrieval, changeVectorMethod, toggleSection
// 已迁移到 game-core-systems.js

// openConfigModal, closeConfigModal 已迁移到 game-core-systems.js

// 解析AI响应
function parseAIResponse(response) {
    console.log('🔍 开始解析AI响应，原始长度:', response.length);
    console.log('📝 原始响应前500字符:', response.substring(0, 500));
    
    // 🔧 自动修复常见JSON格式错误
    function autoFixJSON(jsonStr) {
        console.log('🔧 开始自动修复JSON，输入长度:', jsonStr.length);
        console.log('📝 修复前前100字符:', jsonStr.substring(0, 100));
        let fixed = jsonStr.trim();
        
        // 修复0: 智能处理中文引号
        // 🔧 策略：使用Unicode代码点明确指定中文引号，避免编码混淆
        // U+201C: " (LEFT DOUBLE QUOTATION MARK)
        // U+201D: " (RIGHT DOUBLE QUOTATION MARK)  
        // U+2018: ' (LEFT SINGLE QUOTATION MARK)
        // U+2019: ' (RIGHT SINGLE QUOTATION MARK)
        // U+300C-U+300F: 「」『』 (CJK括号)
        // U+301D-U+301E: 〝〞 (双引号变体)
        // U+FF02: ＂ (全角引号)
        // 注意：不能用单引号替换，因为修复8会把单引号替换为双引号
        const chineseDoubleQuotesRegex = /[\u201C\u201D\u301D\u301E\uFF02\u300C\u300D\u300E\u300F]/g;
        const chineseSingleQuotesRegex = /[\u2018\u2019]/g;
        let chineseDoubleQuoteCount = (fixed.match(chineseDoubleQuotesRegex) || []).length;
        let chineseSingleQuoteCount = (fixed.match(chineseSingleQuotesRegex) || []).length;
        if (chineseDoubleQuoteCount > 0 || chineseSingleQuoteCount > 0) {
            console.log('🔧 检测到中文引号数量: 双引号=' + chineseDoubleQuoteCount + ', 单引号=' + chineseSingleQuoteCount);
            // 将中文双引号替换为反引号（不会被修复8影响）
            fixed = fixed.replace(chineseDoubleQuotesRegex, '`');
            // 将中文单引号替换为反引号
            fixed = fixed.replace(chineseSingleQuotesRegex, '`');
        }
        console.log('🔧 已处理字符串内的中文双引号');
        
        // 修复1: 移除开头的 "json 标记（包括引号）
        if (fixed.startsWith('"json')) {
            console.log('🔧 移除开头的"json标记');
            fixed = fixed.replace(/^"json\s*/, '');
        } else if (fixed.startsWith('json')) {
            console.log('🔧 移除开头的json标记');
            fixed = fixed.replace(/^json\s*/, '');
        }
        
        // 修复1.5: 处理开头多余的双引号
        if (fixed.startsWith('"') && !fixed.startsWith('"{')) {
            console.log('🔧 移除开头的多余引号');
            fixed = fixed.substring(1);
        }
        
        // 修复2: 处理字符串中的未转义换行符
        const originalNewlines = fixed.match(/\n/g) || [];
        console.log('🔧 检测到未转义换行符数量:', originalNewlines.length);
        
        // 🔧 重要：先保护文本内容，避免修复时误伤
        const textBlocks = [];
        let tempFixed = fixed;
        
        // 提取并保护所有JSON字符串值（使用更精确的正则）
        // 🔧 改进：处理包含转义引号的情况
        tempFixed = tempFixed.replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
            const placeholder = `__TEXT_BLOCK_${textBlocks.length}__`;
            textBlocks.push(content);
            return '"' + placeholder + '"';
        });
        
        // 更安全的换行符修复方法 - 只在占位符中修复
        tempFixed = tempFixed.replace(/"([^"]*)"/g, (match, placeholder) => {
            if (placeholder.includes('__TEXT_BLOCK_')) {
                const index = parseInt(placeholder.match(/__TEXT_BLOCK_(\d+)__/)[1]);
                const originalContent = textBlocks[index];
                const escapedContent = originalContent.replace(/\n/g, '\\n');
                return '"' + escapedContent + '"';
            }
            return match;
        });
        
        fixed = tempFixed;
        
        // 修复3: 修复截断的JSON - 尝试补全缺失的括号
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        const missingBraces = openBraces - closeBraces;
        
        if (missingBraces > 0) {
            console.warn(`🔧 检测到JSON缺少${missingBraces}个闭合括号，尝试自动补全`);
            fixed += '}'.repeat(missingBraces);
        }
        
        // 修复4: 处理数组截断
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        const missingBrackets = openBrackets - closeBrackets;
        
        if (missingBrackets > 0) {
            console.warn(`🔧 检测到JSON缺少${missingBrackets}个闭合中括号，尝试自动补全`);
            fixed += ']'.repeat(missingBrackets);
        }
        
        // 修复5: 处理末尾多余的逗号
        const hasTrailingComma = fixed.match(/,\s*([}\]])/);
        if (hasTrailingComma) {
            console.log('🔧 移除末尾多余的逗号');
            fixed = fixed.replace(/,\s*([}\]])/g, '$1');
        }
        
        // 修复6: 处理引号不匹配的情况
        const quotes = (fixed.match(/"/g) || []).length;
        if (quotes % 2 !== 0) {
            console.warn('🔧 检测到引号不匹配，尝试修复');
            fixed += '"';
        }
        
        // 修复7: 处理属性名缺少引号的情况 - 更精确的匹配
        // 只修复真正的JSON属性名，避免误伤文本内容
        // 使用更严格的模式：前面必须是换行+空格/制表符，且不在字符串内部
        fixed = fixed.replace(/(\n[\t ]*)(\w+)([\t ]*):/g, (match, indent, word, space) => {
            // 只匹配JSON格式的缩进属性名
            return indent + '"' + word + '"' + space + ':';
        });
        
        // 修复8: 处理单引号包围的字符串
        fixed = fixed.replace(/'([^']*)'/g, '"$1"');
        
        console.log('🔧 修复完成，输出长度:', fixed.length);
        console.log('📝 修复后前100字符:', fixed.substring(0, 100));
        
        // 🔧 测试修复后的JSON是否有效
        try {
            JSON.parse(fixed);
            console.log('✅ 修复后的JSON语法正确');
        } catch (testError) {
            console.log('❌ 修复后的JSON仍有问题:', testError.message);
            console.log('📄 问题位置附近:', fixed.substring(Math.max(0, testError.message.match(/position (\d+)/)?.[1] - 50), parseInt(testError.message.match(/position (\d+)/)?.[1] || 0) + 50));
        }
        
        return fixed;
    }
    
    try {
        // 尝试直接解析JSON
        console.log('🔍 尝试直接解析JSON...');
        const parsed = JSON.parse(response);
        console.log('✅ 直接解析成功！');
        return parsed;
    } catch (e) {
        console.log('❌ 直接解析失败:', e.message);
        
        // 🔧 特殊处理：检查是否是 "json 开头的问题
        if (response.trim().startsWith('"json')) {
            console.log('🔧 检测到特殊的"json开头问题，应用专门修复...');
            let specialFixed = response.trim();
            
            // 移除开头的 "json
            specialFixed = specialFixed.replace(/^"json\s*/, '');
            
            // 如果开头还有引号，也移除
            if (specialFixed.startsWith('"') && !specialFixed.startsWith('"{')) {
                specialFixed = specialFixed.substring(1);
            }
            
            console.log('🔧 专门修复后的内容前200字符:', specialFixed.substring(0, 200));
            
            try {
                const parsed = JSON.parse(specialFixed);
                console.log('✅ 专门修复成功！');
                return parsed;
            } catch (specialError) {
                console.log('❌ 专门修复失败:', specialError.message);
            }
        }
        
        console.log('🔧 开始通用自动修复流程...');
        
        // 尝试提取JSON代码块并修复
        const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            let jsonStr = jsonMatch[1].trim();
            console.log('📝 提取到JSON代码块，长度:', jsonStr.length);
            console.log('📝 JSON代码块前200字符:', jsonStr.substring(0, 200));
            
            // 应用自动修复
            const fixedJson = autoFixJSON(jsonStr);
            
            try {
                const parsed = JSON.parse(fixedJson);
                console.log('✅ JSON代码块修复成功！');
                return parsed;
            } catch (e2) {
                console.error('❌ 修复后解析仍然失败:', e2.message);
                console.error('📄 修复后的JSON预览:', fixedJson.substring(0, 500));
                console.error('📄 修复后的JSON末尾:', fixedJson.substring(Math.max(0, fixedJson.length - 200)));
            }
        } else {
            console.log('📝 未找到JSON代码块标记');
        }

        // 如果代码块修复失败，尝试修复整个响应
        console.log('🔧 尝试修复整个响应...');
        const fixedResponse = autoFixJSON(response);
        
        try {
            const parsed = JSON.parse(fixedResponse);
            console.log('✅ 整个响应修复成功！');
            return parsed;
        } catch (e3) {
            console.error('❌ 整个响应修复失败:', e3.message);
        }

        // 如果都失败了，尝试查找花括号包裹的内容并修复
        const braceMatch = response.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            console.log('🔧 尝试修复花括号内容...');
            console.log('📝 花括号内容长度:', braceMatch[0].length);
            const fixedBraceContent = autoFixJSON(braceMatch[0]);
            
            try {
                const parsed = JSON.parse(fixedBraceContent);
                console.log('✅ 花括号内容修复成功！');
                return parsed;
            } catch (e4) {
                console.error('❌ 花括号内容修复失败:', e4.message);
                console.error('📄 提取的内容长度:', braceMatch[0].length);
                
                // 🔍 检测是否是截断导致的
                const jsonStr = braceMatch[0].trim();
                if (!jsonStr.endsWith('}')) {
                    console.error('⚠️ JSON 被截断！末尾缺少闭合括号');
                    console.error('💡 建议：降低"动态世界最小字数"设置到 150-200 字');
                }
            }
        }

        // 最后尝试：暴力提取所有可能的JSON内容
        console.log('🔧 尝试暴力提取JSON内容...');
        const allBraces = response.match(/\{[\s\S]*?\}/g);
        if (allBraces && allBraces.length > 0) {
            console.log(`📝 找到${allBraces.length}个JSON块`);
            // 尝试最大的那个JSON块
            const largestJson = allBraces.reduce((a, b) => a.length > b.length ? a : b);
            console.log('📝 最大JSON块长度:', largestJson.length);
            const fixedLargest = autoFixJSON(largestJson);
            
            try {
                const parsed = JSON.parse(fixedLargest);
                console.log('✅ 暴力提取修复成功！');
                
                // 🔧 检查是否包含必要的字段
                if (!parsed.story) {
                    console.warn('⚠️ 提取的JSON缺少story字段，尝试从原始响应中提取');
                    // 尝试从原始响应中提取纯文本作为story
                    const textMatch = response.match(/"story"\s*:\s*"([^"]*)"/);
                    if (textMatch) {
                        parsed.story = textMatch[1].replace(/\\n/g, '\n');
                        console.log('✅ 从原始响应中提取到story字段');
                    } else {
                        // 如果还是没有，使用原始响应的一部分
                        parsed.story = response.substring(0, 500) + '\n\n[响应解析不完整，部分内容可能缺失]';
                        console.warn('⚠️ 使用原始响应片段作为story');
                    }
                }
                
                return parsed;
            } catch (e5) {
                console.error('❌ 暴力提取修复失败:', e5.message);
            }
        }

        // 都失败了，返回一个基本结构
        console.warn('⚠️ 所有修复尝试都失败了，使用原始文本作为story');
        console.warn('📊 原始响应长度:', response.length);
        console.error('🔍 可能原因：1) 第三方API截断输出  2) max_tokens 设置过低  3) AI未按格式输出');
        return {
            story: response,
            reasoning: { 
                situation: '解析失败 - AI响应格式错误，已尝试自动修复但未成功',
                playerChoice: '未知',
                logicChain: ['JSON解析失败', '自动修复尝试失败', '使用原始文本作为故事内容'],
                outcome: '建议检查AI模型配置或降低输出要求',
                variableCheck: {
                    hp_mp_changed: '否',
                    items_changed: '否', 
                    relationships_changed: '否',
                    sexual_content_occurred: '否',
                    attributes_changed: '否',
                    other_changes: '无',
                    history_content: '解析失败，无历史记录',
                    npc_reaction_appropriate: '否'
                }
            },
            variableChanges: {
                analysis: '解析失败，无变量变化',
                changes: {},
                arrayChanges: {}
            },
            options: [
                "重新生成回复",
                "跳过此回合", 
                "查看原始响应"
            ]
        };
    }
}

// 🆕 重建历史记录：根据对话历史自动生成缺失的重要历史
async function rebuildHistoryRecords() {
    if (!gameState.isGameStarted) {
        alert('请先加载存档！');
        return;
    }

    const confirm = window.confirm('此功能将使用 AI 根据你的对话历史，自动重建缺失的"重要历史"记录。\n\n这可能需要消耗一些 API 额度。是否继续？');
    if (!confirm) return;

    try {
        // 构建提示
        const conversationSummary = gameState.conversationHistory
            .filter(msg => msg.role === 'user')
            .map((msg, i) => `第${i+1}轮: ${msg.content}`)
            .join('\n');

        const prompt = `根据以下对话历史，为修仙角色"${gameState.variables.name}"生成重要历史记录。

要求：
1. 每轮对话生成1条历史记录
2. 每条至少40字，不超过100字
3. 包含时间、地点、人物、事件
4. 按时间顺序排列
5. 以JSON数组格式返回，例如：["历史1", "历史2"]

当前已有历史：
${gameState.variables.history ? gameState.variables.history.join('\n') : '(无)'}

对话历史：
${conversationSummary}

请返回完整的历史记录数组（包括已有的+新生成的）：`;

        const response = await callAI(prompt);
        
        // 解析响应
        let historyArray;
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                historyArray = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('未找到JSON数组');
            }
        } catch (error) {
            alert('解析失败：' + error.message);
            return;
        }

        // 更新历史记录
        gameState.variables.history = historyArray;
        updateStatusPanel();
        
        alert(`✅ 重建成功！\n已生成 ${historyArray.length} 条重要历史记录。`);
        console.log('[重建历史] 新的历史记录:', historyArray);
        
    } catch (error) {
        alert('重建失败：' + error.message);
        console.error('[重建历史] 错误:', error);
    }
}

// 查看上下文
async function viewContext() {
    if (!gameState.isGameStarted) {
        alert('请先开始游戏！');
        return;
    }

    // 构建即将发送的消息（使用空字符串作为用户消息占位符）
    const messages = await buildAIMessages('[即将发送的用户输入或选项]');
    
    // 保存原始 messages 用于纯净导出
    window._lastContextMessages = messages;
    const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;

    // 格式化消息
    let contextText = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    contextText += '📋 即将发送给AI的上下文内容\n';
    contextText += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    let systemFormatCount = 0;
    let formatOpen = false;
    let pendingBuffer = '';
    messages.forEach((msg, index) => {
        const roleLabel = msg.role === 'system' ? '🔧 系统' :
            msg.role === 'user' ? '👤 用户' :
                '🤖 AI';
        
        let prefix = '';
        if (enableVectorRetrieval && msg.role === 'system' && msg.content.includes('【相关历史回忆】')) {
            prefix = '🧬 [向量检索] ';
        }
        
        if (msg.role === 'system' && msg.content.includes('【极其重要】叙事视角强制要求')) {
            prefix = '📖 [叙事视角] ';
        }
        
        let blockText = `【消息 ${index + 1}】 ${prefix}${roleLabel}\n` +
                        '─'.repeat(40) + '\n' +
                        msg.content + '\n\n';
        
        const isVariableStatus = (msg.role === 'system' && msg.content.startsWith('当前角色变量状态'));
        const qualifies = (msg.role === 'system' && !isVariableStatus && systemFormatCount < 3);

        if (msg.role === 'assistant') {
            blockText = `<context>\n` + blockText + `</context>\n`;
        }

        if (formatOpen) {
            if (qualifies) {
                contextText += blockText;
                systemFormatCount++;
                if (systemFormatCount >= 3) {
                    contextText += `</format>\n`;
                    formatOpen = false;
                    if (pendingBuffer) {
                        contextText += pendingBuffer;
                        pendingBuffer = '';
                    }
                }
            } else {
                pendingBuffer += blockText;
            }
        } else {
            if (qualifies) {
                contextText += `<format>\n`;
                contextText += blockText;
                systemFormatCount++;
                formatOpen = true;
            } else {
                contextText += blockText;
            }
        }
    });
    // 若不足三条已打开，则在结尾关闭并追加缓冲
    if (formatOpen) {
        contextText += `</format>\n`;
        if (pendingBuffer) {
            contextText += pendingBuffer;
        }
    }

    // 获取统计信息（移到 contextPreviewPre 外面显示）
    const narrativePerspectiveInput = document.getElementById('narrativePerspective');
    const narrativePerspective = narrativePerspectiveInput ? narrativePerspectiveInput.value : 'first';
    const perspectiveText = {
        'first': '第一人称（我）',
        'second': '第二人称（你）',
        'third': '第三人称（他/她）'
    };
    // 计算实际发送给AI的字符数（所有消息内容的字符总数）
    let totalCharCount = 0;
    messages.forEach(msg => {
        totalCharCount += msg.content.length;
    });
    
    // 构建统计信息HTML（单独显示）
    const statsHtml = `
        <div style="
            background: linear-gradient(to right, #f0f4ff, #e8f0fe);
            border: 1px solid #d0e1ff;
            padding: 18px 24px;
            border-radius: 12px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        ">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 14px; color: #2c3e50;">
                <div>📊 <strong style="color: #4a5568;">总消息数:</strong> <span style="color: #2563eb; font-weight: 600;">${messages.length}</span></div>
                <div>🔍 <strong style="color: #4a5568;">向量检索:</strong> <span style="font-weight: 600;">${enableVectorRetrieval ? '✅ 已启用' : '❌ 未启用'}</span></div>
                <div>📜 <strong style="color: #4a5568;">历史层数设置:</strong> <span style="color: #2563eb; font-weight: 600;">${document.getElementById('historyDepth').value}</span></div>
                <div>📝 <strong style="color: #4a5568;">最小字数要求:</strong> <span style="color: #2563eb; font-weight: 600;">${document.getElementById('minWordCount').value}</span></div>
                <div>👁️ <strong style="color: #4a5568;">叙事视角:</strong> <span style="color: #2563eb; font-weight: 600;">${perspectiveText[narrativePerspective]}</span></div>
                <div>🔤 <strong style="color: #4a5568;">总字符数:</strong> <span style="color: #2563eb; font-weight: 600;">${totalCharCount}</span></div>
            </div>
        </div>
    `;

    // 创建模态框显示
    const modal = document.createElement('div');
    modal.id = 'contextViewModal';
    modal.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 900px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    `;

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #667eea; margin: 0;">👁️ 上下文预览</h2>
            <button onclick="document.getElementById('contextViewModal').remove()" style="
                padding: 8px 16px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">关闭</button>
        </div>
        ${statsHtml}
        <pre id="contextPreviewPre" style="
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 13px;
            line-height: 1.6;
            max-height: 60vh;
            overflow-y: auto;
        "></pre>
        <div style="margin-top: 15px; text-align: center; display: flex; gap: 10px; justify-content: center;">
            <button onclick="
                const text = document.getElementById('contextPreviewPre').textContent;
                navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板！'));
            " style="
                padding: 10px 20px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">📋 复制到剪贴板</button>
            <button onclick="exportContextToTxt()" style="
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">💾 导出为TXT</button>
        </div>
    `;
    // 使用 textContent 避免标签被HTML解析，保证<format>与<context>可见
    const preEl = content.querySelector('#contextPreviewPre');
    if (preEl) preEl.textContent = contextText;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// 导出上下文为TXT文件（纯净版，只包含实际发送内容）
function exportContextToTxt() {
    const messages = window._lastContextMessages;
    if (!messages || messages.length === 0) {
        alert('未找到上下文内容');
        return;
    }
    
    // 生成纯净内容：只包含 role 和 content
    let text = '';
    messages.forEach((msg, index) => {
        const roleLabel = msg.role === 'system' ? '[SYSTEM]' :
                          msg.role === 'user' ? '[USER]' : '[ASSISTANT]';
        text += `=== 消息 ${index + 1} ${roleLabel} ===\n`;
        text += msg.content + '\n\n';
    });
    
    const filename = 'ai_context_' + new Date().toISOString().slice(0,19).replace(/[T:]/g, '-') + '.txt';
    
    try {
        // 方法1: 使用 data URI
        const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        console.error('导出失败:', e);
        // 备用方案: 复制到剪贴板
        navigator.clipboard.writeText(text).then(() => {
            alert('导出失败，已复制到剪贴板，请手动粘贴保存');
        }).catch(() => {
            alert('导出失败: ' + e.message);
        });
    }
}

// 恢复对话历史显示
function restoreConversationHistory() {
    const historyDiv = document.getElementById('gameHistory');
    historyDiv.innerHTML = '';

    console.log('[恢复对话] 开始渲染，总条数:', gameState.conversationHistory.length);
    let userCount = 0;
    let aiCount = 0;

    // 遍历历史记录，重新显示
    for (let i = 0; i < gameState.conversationHistory.length; i++) {
        const msg = gameState.conversationHistory[i];
        if (msg.role === 'assistant') {
            // AI消息，需要从后续消息中获取选项（如果有）
            // 由于我们只保存了剧情，选项无法恢复，所以只显示剧情
            // 🎨 传入 imgPrompt 和 isRestore=true，恢复时只显示"点击生成图片"按钮
            displayAIMessage(msg.content, [], null, msg.imgPrompt || null, true);
            aiCount++;
            console.log(`[恢复对话] ✅ AI消息 ${i+1}: ${msg.content.substring(0, 30)}...`, msg.imgPrompt ? '(有图片提示词)' : '');
        } else if (msg.role === 'user') {
            // 用户消息 - 🔧 强制渲染，跳过调试模式检查
            displayUserMessage(msg.content, true);
            userCount++;
            console.log(`[恢复对话] ✅ 用户消息 ${i+1}: ${msg.content.substring(0, 30)}...`);
        }
    }

    console.log(`[恢复对话] 渲染完成: 用户 ${userCount} 条, AI ${aiCount} 条, gameHistory子元素: ${historyDiv.children.length}`);

    // 🌍 更新动态世界标签页显示（不插入到游戏历史）
    console.log('[动态世界] restoreConversationHistory - 动态世界记录:', {
        hasDynamicWorld: !!gameState.dynamicWorld,
        historyLength: gameState.dynamicWorld?.history?.length || 0
    });
    
    // 只更新动态世界Tab页，不插入到游戏历史
    displayDynamicWorldHistory();
    
    // 自动滚动到底部
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// 调试模式：切换显示区域
function toggleDebugMode() {
    const debug = document.getElementById('debugMode')?.checked;
    const hist = document.getElementById('gameHistory');
    const dbg = document.getElementById('debugOutput');
    if (!hist || !dbg) return;
    if (debug) {
        hist.style.display = 'none';
        dbg.style.display = 'block';
        // 提示一条启用信息，方便用户确认状态
        const ts = new Date().toLocaleTimeString();
        dbg.textContent = `[${ts}] ⚙️ 调试模式已开启` + "\n\n";
        // 立即把已有历史打印到调试区（优先原始JSON/响应）
        try {
            if (Array.isArray(gameState?.conversationHistory)) {
                gameState.conversationHistory.forEach(msg => {
                    if (!msg || !msg.role) return;
                    const from = msg.role === 'user' ? 'USER' : 'AI';
                    const payload = msg.rawJson || msg.rawResponse || msg.content || '';
                    appendDebug(from, payload);
                });
            }
        } catch (e) {
            console.warn('导出历史到调试区时发生错误:', e);
        }
    } else {
        hist.style.display = 'block';
        dbg.style.display = 'none';
        // 退出时清空调试日志，避免占用内存
        dbg.textContent = '';
    }
}

// 调试模式：追加一条原始日志
function appendDebug(from, text) {
    const dbg = document.getElementById('debugOutput');
    if (!dbg) return;
    const ts = new Date().toLocaleTimeString();
    const header = from === 'USER' ? '👤 USER' : '🤖 AI';
    dbg.textContent += `[${ts}] ${header}\n` + String(text ?? '') + "\n\n";
    dbg.scrollTop = dbg.scrollHeight;
}
