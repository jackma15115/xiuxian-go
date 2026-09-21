/**
 * 状态管理器 - 管理游戏状态和变量
 * 提供响应式状态管理和数据隔离
 */

export class StateManager {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.states = new Map(); // 每个游戏的独立状态
        this.currentGameId = null;
        this.watchers = new Map(); // 状态观察者
        this.variableDefinitions = new Map(); // 变量定义
    }

    /**
     * 初始化游戏状态
     */
    async initGameState(gameId) {
        this.currentGameId = gameId;
        
        if (!this.states.has(gameId)) {
            this.states.set(gameId, this.createInitialState());
        }
        
        return this.states.get(gameId);
    }

    /**
     * 创建初始状态
     */
    createInitialState() {
        return {
            // 核心游戏状态
            isGameStarted: false,
            isPaused: false,
            
            // 游戏变量
            variables: {},
            
            // 对话历史
            conversationHistory: [],
            
            // 变量快照（用于回退）
            variableSnapshots: [],
            
            // 动态世界状态
            dynamicWorld: {
                enabled: false,
                history: [],
                floor: 0
            },
            
            // 战斗状态
            combat: {
                isActive: false,
                currentBattle: null
            },
            
            // 角色信息
            characterInfo: null,
            
            // 元数据
            metadata: {
                createdAt: Date.now(),
                lastModified: Date.now(),
                version: '1.0'
            }
        };
    }

    /**
     * 获取当前游戏状态
     */
    getState() {
        if (!this.currentGameId) return null;
        return this.states.get(this.currentGameId);
    }

    /**
     * 设置完整状态
     */
    setState(newState) {
        if (!this.currentGameId) return;
        
        const state = { ...this.createInitialState(), ...newState };
        state.metadata.lastModified = Date.now();
        
        this.states.set(this.currentGameId, state);
        this.notifyWatchers('*', state);
        this.gameCore.eventBus.emit('state:changed', { gameId: this.currentGameId, state });
    }

    /**
     * 获取特定变量
     */
    get(key) {
        const state = this.getState();
        if (!state) return undefined;
        
        // 支持嵌套路径，如 'variables.player.hp'
        return this.getNestedValue(state, key);
    }

    /**
     * 设置特定变量
     */
    set(key, value) {
        const state = this.getState();
        if (!state) return;
        
        this.setNestedValue(state, key, value);
        state.metadata.lastModified = Date.now();
        
        this.notifyWatchers(key, value);
        this.gameCore.eventBus.emit('state:changed', { 
            gameId: this.currentGameId, 
            key, 
            value 
        });
    }

    /**
     * 批量更新状态
     */
    update(updates) {
        const state = this.getState();
        if (!state) return;
        
        for (const [key, value] of Object.entries(updates)) {
            this.setNestedValue(state, key, value);
        }
        
        state.metadata.lastModified = Date.now();
        
        this.notifyWatchers('*', updates);
        this.gameCore.eventBus.emit('state:changed', { 
            gameId: this.currentGameId, 
            updates 
        });
    }

    /**
     * 更新游戏变量
     */
    updateVariables(newVariables) {
        const state = this.getState();
        if (!state) return;
        
        // 保存快照
        if (state.variables && Object.keys(state.variables).length > 0) {
            state.variableSnapshots.push({
                timestamp: Date.now(),
                variables: JSON.parse(JSON.stringify(state.variables))
            });
            
            // 只保留最近20个快照
            if (state.variableSnapshots.length > 20) {
                state.variableSnapshots.shift();
            }
        }
        
        // 合并新变量
        state.variables = { ...state.variables, ...newVariables };
        state.metadata.lastModified = Date.now();
        
        // 通知观察者
        this.notifyWatchers('variables', state.variables);
        
        // 触发事件
        this.gameCore.eventBus.emit('variables:updated', { 
            gameId: this.currentGameId, 
            variables: state.variables,
            changes: newVariables
        });
    }

    /**
     * 定义变量（用于验证和类型检查）
     */
    defineVariables(definitions) {
        if (!this.currentGameId) return;
        
        if (!this.variableDefinitions.has(this.currentGameId)) {
            this.variableDefinitions.set(this.currentGameId, {});
        }
        
        const gameDefs = this.variableDefinitions.get(this.currentGameId);
        Object.assign(gameDefs, definitions);
    }

    /**
     * 合并变量定义（用于DLC）
     */
    mergeVariables(newDefinitions) {
        const defs = this.variableDefinitions.get(this.currentGameId) || {};
        this.variableDefinitions.set(this.currentGameId, { ...defs, ...newDefinitions });
    }

    /**
     * 添加对话到历史
     */
    addConversation(message) {
        const state = this.getState();
        if (!state) return;
        
        state.conversationHistory.push({
            ...message,
            timestamp: Date.now()
        });
        
        // 限制历史长度
        if (state.conversationHistory.length > 100) {
            state.conversationHistory = state.conversationHistory.slice(-50);
        }
        
        this.gameCore.eventBus.emit('conversation:added', message);
    }

    /**
     * 清除游戏状态
     */
    clearGameState() {
        if (!this.currentGameId) return;
        
        this.states.delete(this.currentGameId);
        this.currentGameId = null;
    }

    /**
     * 监听状态变化
     */
    watch(key, callback) {
        if (!this.watchers.has(key)) {
            this.watchers.set(key, new Set());
        }
        this.watchers.get(key).add(callback);
        
        // 返回取消监听的函数
        return () => {
            const watchers = this.watchers.get(key);
            if (watchers) {
                watchers.delete(callback);
            }
        };
    }

    /**
     * 通知观察者
     */
    notifyWatchers(key, value) {
        // 通知特定键的观察者
        const keyWatchers = this.watchers.get(key);
        if (keyWatchers) {
            keyWatchers.forEach(callback => callback(value, key));
        }
        
        // 通知通配符观察者
        const allWatchers = this.watchers.get('*');
        if (allWatchers && key !== '*') {
            allWatchers.forEach(callback => callback(value, key));
        }
    }

    /**
     * 获取嵌套值
     */
    getNestedValue(obj, path) {
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value == null) return undefined;
            value = value[key];
        }
        
        return value;
    }

    /**
     * 设置嵌套值
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        
        let current = obj;
        for (const key of keys) {
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
    }

    /**
     * 创建响应式代理（可选功能）
     */
    createProxy(target = {}) {
        const self = this;
        
        return new Proxy(target, {
            get(obj, prop) {
                const value = obj[prop];
                if (typeof value === 'object' && value !== null) {
                    return self.createProxy(value);
                }
                return value;
            },
            set(obj, prop, value) {
                obj[prop] = value;
                self.notifyWatchers(prop, value);
                return true;
            }
        });
    }

    /**
     * 导出当前游戏状态
     */
    exportState() {
        const state = this.getState();
        if (!state) return null;
        
        return {
            gameId: this.currentGameId,
            state: JSON.parse(JSON.stringify(state)),
            exportedAt: Date.now()
        };
    }

    /**
     * 导入游戏状态
     */
    importState(exportData) {
        if (!exportData || !exportData.gameId || !exportData.state) {
            throw new Error('无效的导入数据');
        }
        
        this.currentGameId = exportData.gameId;
        this.setState(exportData.state);
        
        console.log(`[StateManager] 成功导入游戏状态: ${exportData.gameId}`);
    }
}
