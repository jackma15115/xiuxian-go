/**
 * 游戏核心类 - 统一的游戏框架
 * 所有游戏都通过这个核心类运行
 */

import { StateManager } from './StateManager.js';
import { EventBus } from './EventBus.js';
import { StorageManager } from './StorageManager.js';
import { APIManager } from './APIManager.js';
import { KnowledgeManager } from './KnowledgeManager.js';
import { DynamicWorldManager } from './DynamicWorldManager.js';
import { CombatManager } from './CombatManager.js';
import { UIManager } from './UIManager.js';

export class GameCore {
    constructor() {
        this.games = new Map(); // 存储所有注册的游戏
        this.currentGame = null; // 当前运行的游戏
        this.managers = {}; // 各种管理器实例
        this.initialized = false;
    }

    /**
     * 初始化核心框架
     */
    async init() {
        if (this.initialized) return;

        console.log('[GameCore] 初始化游戏核心框架...');

        // 初始化事件总线
        this.eventBus = new EventBus();

        // 初始化各个管理器
        this.managers = {
            state: new StateManager(this),
            storage: new StorageManager(this),
            api: new APIManager(this),
            knowledge: new KnowledgeManager(this),
            dynamicWorld: new DynamicWorldManager(this),
            combat: new CombatManager(this),
            ui: new UIManager(this)
        };

        // 初始化所有管理器
        for (const [name, manager] of Object.entries(this.managers)) {
            if (manager.init) {
                await manager.init();
                console.log(`[GameCore] ${name} 管理器初始化完成`);
            }
        }

        // 监听全局事件
        this.setupEventListeners();

        this.initialized = true;
        console.log('[GameCore] ✅ 核心框架初始化完成');
    }

    /**
     * 注册新游戏
     * @param {GameConfig} gameConfig - 游戏配置对象
     */
    registerGame(gameConfig) {
        if (!gameConfig.id) {
            throw new Error('游戏配置必须包含唯一的 id');
        }

        if (this.games.has(gameConfig.id)) {
            console.warn(`[GameCore] 游戏 ${gameConfig.id} 已存在，将被覆盖`);
        }

        // 验证必要的配置项
        this.validateGameConfig(gameConfig);

        // 存储游戏配置
        this.games.set(gameConfig.id, gameConfig);
        console.log(`[GameCore] ✅ 游戏 "${gameConfig.name}" (${gameConfig.id}) 注册成功`);

        // 触发游戏注册事件
        this.eventBus.emit('game:registered', { gameId: gameConfig.id, config: gameConfig });
    }

    /**
     * 验证游戏配置
     */
    validateGameConfig(config) {
        const required = ['id', 'name', 'version', 'systemPrompt'];
        for (const field of required) {
            if (!config[field]) {
                throw new Error(`游戏配置缺少必要字段: ${field}`);
            }
        }
    }

    /**
     * 启动指定游戏
     * @param {string} gameId - 游戏ID
     */
    async startGame(gameId, options = {}) {
        const gameConfig = this.games.get(gameId);
        if (!gameConfig) {
            throw new Error(`未找到游戏: ${gameId}`);
        }

        console.log(`[GameCore] 启动游戏: ${gameConfig.name}`);

        // 如果有其他游戏在运行，先停止
        if (this.currentGame && this.currentGame.id !== gameId) {
            await this.stopGame();
        }

        // 设置当前游戏
        this.currentGame = gameConfig;

        // 初始化游戏状态
        await this.managers.state.initGameState(gameId);

        // 设置游戏专属的存储空间
        this.managers.storage.setGameNamespace(gameId);

        // 加载游戏保存的数据
        if (!options.newGame) {
            await this.loadGameData(gameId);
        }

        // 应用游戏配置
        await this.applyGameConfig(gameConfig);

        // 初始化UI
        await this.managers.ui.initGameUI(gameConfig);

        // 调用游戏的初始化钩子
        if (gameConfig.hooks?.onStart) {
            await gameConfig.hooks.onStart(this);
        }

        // 触发游戏启动事件
        this.eventBus.emit('game:started', { gameId, config: gameConfig });

        console.log(`[GameCore] ✅ 游戏 ${gameConfig.name} 启动成功`);
    }

    /**
     * 应用游戏配置
     */
    async applyGameConfig(config) {
        // 设置系统提示词
        if (config.systemPrompt) {
            this.managers.api.setSystemPrompt(config.systemPrompt);
        }

        // 设置动态世界提示词
        if (config.dynamicWorldPrompt) {
            this.managers.dynamicWorld.setPrompt(config.dynamicWorldPrompt);
        }

        // 加载游戏特定的知识库
        if (config.knowledgeBase) {
            await this.managers.knowledge.loadGameKnowledge(config.knowledgeBase);
        }

        // 设置游戏特定的变量定义
        if (config.variables) {
            this.managers.state.defineVariables(config.variables);
        }

        // 加载游戏的DLC
        if (config.dlcs) {
            for (const dlc of config.dlcs) {
                await this.loadDLC(dlc);
            }
        }
    }

    /**
     * 停止当前游戏
     */
    async stopGame() {
        if (!this.currentGame) return;

        console.log(`[GameCore] 停止游戏: ${this.currentGame.name}`);

        // 保存游戏数据
        await this.saveGameData();

        // 调用游戏的停止钩子
        if (this.currentGame.hooks?.onStop) {
            await this.currentGame.hooks.onStop(this);
        }

        // 清理游戏状态
        this.managers.state.clearGameState();

        // 触发游戏停止事件
        this.eventBus.emit('game:stopped', { gameId: this.currentGame.id });

        this.currentGame = null;
    }

    /**
     * 切换游戏
     */
    async switchGame(gameId) {
        await this.stopGame();
        await this.startGame(gameId);
    }

    /**
     * 保存游戏数据
     */
    async saveGameData() {
        if (!this.currentGame) return;

        const gameData = {
            gameId: this.currentGame.id,
            version: this.currentGame.version,
            state: this.managers.state.getState(),
            timestamp: Date.now()
        };

        await this.managers.storage.saveGame(gameData);
        console.log(`[GameCore] 游戏数据已保存`);
    }

    /**
     * 加载游戏数据
     */
    async loadGameData(gameId) {
        const gameData = await this.managers.storage.loadGame(gameId);
        if (gameData && gameData.state) {
            this.managers.state.setState(gameData.state);
            console.log(`[GameCore] 游戏数据已加载`);
            return true;
        }
        return false;
    }

    /**
     * 获取所有已注册的游戏
     */
    getRegisteredGames() {
        return Array.from(this.games.values()).map(game => ({
            id: game.id,
            name: game.name,
            version: game.version,
            description: game.description,
            thumbnail: game.thumbnail
        }));
    }

    /**
     * 加载DLC
     */
    async loadDLC(dlcConfig) {
        console.log(`[GameCore] 加载DLC: ${dlcConfig.name}`);
        
        // 合并DLC的知识库
        if (dlcConfig.knowledgeBase) {
            await this.managers.knowledge.addDLCKnowledge(dlcConfig.id, dlcConfig.knowledgeBase);
        }

        // 合并DLC的变量
        if (dlcConfig.variables) {
            this.managers.state.mergeVariables(dlcConfig.variables);
        }

        // 调用DLC的加载钩子
        if (dlcConfig.hooks?.onLoad) {
            await dlcConfig.hooks.onLoad(this);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听状态变化
        this.eventBus.on('state:changed', (data) => {
            // 自动保存
            if (this.currentGame?.autoSave !== false) {
                this.saveGameData();
            }
        });

        // 监听API调用
        this.eventBus.on('api:response', (data) => {
            // 处理AI响应
            this.handleAIResponse(data);
        });
    }

    /**
     * 处理AI响应
     */
    handleAIResponse(data) {
        // 解析变量更新
        if (data.variables) {
            this.managers.state.updateVariables(data.variables);
        }

        // 处理动态世界更新
        if (this.managers.dynamicWorld.isEnabled()) {
            this.managers.dynamicWorld.processResponse(data);
        }

        // 更新知识库
        if (data.knowledgeUpdate) {
            this.managers.knowledge.updateFromResponse(data);
        }
    }

    /**
     * 公开的API接口，供游戏调用
     */
    api = {
        // 状态管理
        getState: (key) => this.managers.state.get(key),
        setState: (key, value) => this.managers.state.set(key, value),
        updateState: (updates) => this.managers.state.update(updates),

        // 事件系统
        on: (event, handler) => this.eventBus.on(event, handler),
        emit: (event, data) => this.eventBus.emit(event, data),
        off: (event, handler) => this.eventBus.off(event, handler),

        // AI交互
        sendMessage: (message) => this.managers.api.sendMessage(message),
        
        // 存储
        save: () => this.saveGameData(),
        load: () => this.loadGameData(this.currentGame.id),

        // 战斗系统
        startCombat: (enemyData) => this.managers.combat.start(enemyData),
        
        // UI
        showModal: (content) => this.managers.ui.showModal(content),
        updateUI: () => this.managers.ui.update()
    };
}

// 创建全局实例
const gameCore = new GameCore();
export default gameCore;
