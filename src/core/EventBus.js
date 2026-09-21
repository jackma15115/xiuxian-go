/**
 * 事件总线 - 统一的事件管理系统
 * 支持事件的发布订阅、优先级、异步处理等
 */

export class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.debug = false;
    }

    /**
     * 订阅事件
     * @param {string} eventName - 事件名称
     * @param {Function} handler - 事件处理函数
     * @param {Object} options - 配置选项
     */
    on(eventName, handler, options = {}) {
        if (!eventName || !handler) {
            throw new Error('事件名称和处理函数不能为空');
        }

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const eventHandler = {
            handler,
            priority: options.priority || 0,
            once: options.once || false,
            context: options.context || null,
            id: this.generateHandlerId()
        };

        const handlers = this.events.get(eventName);
        handlers.push(eventHandler);
        
        // 按优先级排序（高优先级在前）
        handlers.sort((a, b) => b.priority - a.priority);

        if (this.debug) {
            console.log(`[EventBus] 订阅事件: ${eventName}`, eventHandler);
        }

        // 返回取消订阅的函数
        return () => this.off(eventName, eventHandler.id);
    }

    /**
     * 订阅一次性事件
     */
    once(eventName, handler, options = {}) {
        return this.on(eventName, handler, { ...options, once: true });
    }

    /**
     * 取消订阅事件
     * @param {string} eventName - 事件名称
     * @param {string|Function} handlerOrId - 处理函数或ID
     */
    off(eventName, handlerOrId) {
        if (!this.events.has(eventName)) {
            return false;
        }

        const handlers = this.events.get(eventName);
        const index = handlers.findIndex(h => 
            h.id === handlerOrId || h.handler === handlerOrId
        );

        if (index > -1) {
            handlers.splice(index, 1);
            if (handlers.length === 0) {
                this.events.delete(eventName);
            }
            if (this.debug) {
                console.log(`[EventBus] 取消订阅: ${eventName}`);
            }
            return true;
        }

        return false;
    }

    /**
     * 触发事件
     * @param {string} eventName - 事件名称
     * @param {any} data - 事件数据
     * @param {Object} options - 配置选项
     */
    emit(eventName, data, options = {}) {
        // 记录事件历史
        this.recordEvent(eventName, data);

        if (!this.events.has(eventName)) {
            if (this.debug) {
                console.log(`[EventBus] 没有监听器: ${eventName}`);
            }
            return [];
        }

        const handlers = [...this.events.get(eventName)];
        const results = [];

        if (this.debug) {
            console.log(`[EventBus] 触发事件: ${eventName}`, data);
        }

        for (const eventHandler of handlers) {
            try {
                // 处理一次性事件
                if (eventHandler.once) {
                    this.off(eventName, eventHandler.id);
                }

                // 执行处理函数
                const context = eventHandler.context || null;
                const result = eventHandler.handler.call(context, data, eventName);
                
                // 处理异步函数
                if (result instanceof Promise && options.waitForAsync) {
                    results.push(result);
                } else {
                    results.push(result);
                }
            } catch (error) {
                console.error(`[EventBus] 事件处理出错: ${eventName}`, error);
                if (options.throwOnError) {
                    throw error;
                }
            }
        }

        // 如果需要等待所有异步操作
        if (options.waitForAsync) {
            return Promise.all(results);
        }

        return results;
    }

    /**
     * 异步触发事件
     */
    async emitAsync(eventName, data, options = {}) {
        return this.emit(eventName, data, { ...options, waitForAsync: true });
    }

    /**
     * 清除所有事件监听器
     */
    clear(eventName = null) {
        if (eventName) {
            this.events.delete(eventName);
        } else {
            this.events.clear();
        }
    }

    /**
     * 获取事件监听器数量
     */
    listenerCount(eventName) {
        if (!this.events.has(eventName)) {
            return 0;
        }
        return this.events.get(eventName).length;
    }

    /**
     * 获取所有事件名称
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * 记录事件历史
     */
    recordEvent(eventName, data) {
        this.eventHistory.push({
            eventName,
            data: data !== undefined ? JSON.parse(JSON.stringify(data)) : undefined,
            timestamp: Date.now()
        });

        // 限制历史记录大小
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    /**
     * 获取事件历史
     */
    getHistory(eventName = null) {
        if (eventName) {
            return this.eventHistory.filter(e => e.eventName === eventName);
        }
        return [...this.eventHistory];
    }

    /**
     * 生成唯一的处理器ID
     */
    generateHandlerId() {
        return `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 设置调试模式
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * 创建命名空间事件总线
     */
    createNamespace(namespace) {
        const self = this;
        return {
            on: (eventName, handler, options) => 
                self.on(`${namespace}:${eventName}`, handler, options),
            once: (eventName, handler, options) => 
                self.once(`${namespace}:${eventName}`, handler, options),
            off: (eventName, handlerOrId) => 
                self.off(`${namespace}:${eventName}`, handlerOrId),
            emit: (eventName, data, options) => 
                self.emit(`${namespace}:${eventName}`, data, options),
            emitAsync: (eventName, data, options) => 
                self.emitAsync(`${namespace}:${eventName}`, data, options),
            clear: () => {
                const prefix = `${namespace}:`;
                for (const eventName of self.eventNames()) {
                    if (eventName.startsWith(prefix)) {
                        self.clear(eventName);
                    }
                }
            }
        };
    }

    /**
     * 等待事件触发
     */
    waitFor(eventName, timeout = 0) {
        return new Promise((resolve, reject) => {
            let timeoutId;
            
            const handler = (data) => {
                if (timeoutId) clearTimeout(timeoutId);
                resolve(data);
            };

            this.once(eventName, handler);

            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    this.off(eventName, handler);
                    reject(new Error(`等待事件 ${eventName} 超时`));
                }, timeout);
            }
        });
    }

    /**
     * 代理另一个事件总线的事件
     */
    proxy(otherBus, eventName, targetEventName = null) {
        const target = targetEventName || eventName;
        return otherBus.on(eventName, (data) => {
            this.emit(target, data);
        });
    }
}
