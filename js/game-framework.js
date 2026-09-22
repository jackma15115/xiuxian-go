/**
 * 通用游戏框架 - Game Framework
 * 提供游戏状态管理、渲染系统、API调用等通用功能
 * 可以被不同的游戏配置文件使用
 */

class GameFramework {
    constructor(config) {
        this.config = config; // 游戏特定配置
        this.gameState = {
            variables: {},
            conversationHistory: [],
            isGameStarted: false,
            lastVariables: {}
        };
        this.apiConfig = {
            endpoint: '',
            apiKey: '',
            model: '',
            type: 'openai'
        };
        this.extraApiConfig = null;
        this.isProcessing = false;
    }

    /**
     * 初始化游戏框架
     */
    init() {
        console.log('[GameFramework] 初始化游戏框架:', this.config.gameName);

        // 加载配置
        this.loadConfig();

        // 初始化UI
        this.initUI();

        // 绑定事件
        this.bindEvents();

        // 如果配置提供了初始化回调，执行它
        if (this.config.onInit) {
            this.config.onInit(this);
        }
    }

    /**
     * 加载保存的配置
     */
    loadConfig() {
        const savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.apiConfig = config.apiConfig || this.apiConfig;
            this.extraApiConfig = config.extraApiConfig || null;
        }
    }

    /**
     * 保存配置
     */
    saveConfig() {
        const config = {
            apiConfig: this.apiConfig,
            extraApiConfig: this.extraApiConfig
        };
        localStorage.setItem('gameConfig', JSON.stringify(config));
    }

    /**
     * 初始化UI
     */
    initUI() {
        // 设置标题
        if (this.config.gameName) {
            document.title = this.config.gameName;
        }

        // 初始化系统提示词
        if (this.config.systemPrompt) {
            const systemPromptEl = document.getElementById('systemPrompt');
            if (systemPromptEl) {
                systemPromptEl.value = this.config.systemPrompt;
            }
        }

        // 初始化动态世界提示词
        if (this.config.dynamicWorldPrompt) {
            const dynamicWorldPromptEl = document.getElementById('dynamicWorldPrompt');
            if (dynamicWorldPromptEl) {
                dynamicWorldPromptEl.value = this.config.dynamicWorldPrompt;
            }
        }
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 这里可以绑定通用事件
        // 具体游戏的事件由配置文件处理
    }

    /**
     * 更新状态面板 - 通用方法
     * 调用游戏特定的渲染函数
     */
    updateStatusPanel() {
        if (this.config.renderStatus) {
            this.config.renderStatus(this.gameState.variables);
        }
    }

    /**
     * 获取角色创建配置
     */
    getCharacterCreationConfig() {
        return this.config.characterCreation || null;
    }

    /**
     * 获取状态字段配置
     */
    getStatusFieldsConfig() {
        return this.config.statusFields || [];
    }

    /**
     * 设置游戏状态
     */
    setGameState(state) {
        this.gameState = { ...this.gameState, ...state };
    }

    /**
     * 获取游戏状态
     */
    getGameState() {
        return this.gameState;
    }

    /**
     * 更新变量
     */
    updateVariables(newVars) {
        this.gameState.lastVariables = { ...this.gameState.variables };
        this.gameState.variables = { ...this.gameState.variables, ...newVars };
        this.updateStatusPanel();
    }
}

// 导出框架类
window.GameFramework = GameFramework;