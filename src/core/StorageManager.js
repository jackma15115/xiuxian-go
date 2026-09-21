/**
 * 存储管理器 - 处理游戏数据的持久化和隔离
 * 每个游戏有独立的存储空间
 */

export class StorageManager {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.dbName = 'GameFrameworkDB';
        this.dbVersion = 2;
        this.db = null;
        this.currentNamespace = null;
        this.stores = {
            games: 'games',          // 游戏配置和元数据
            saves: 'saves',          // 存档数据
            settings: 'settings',    // 设置数据
            knowledge: 'knowledge',  // 知识库数据
            dlc: 'dlc'              // DLC数据
        };
    }

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('[StorageManager] 数据库打开失败:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('[StorageManager] 数据库初始化成功');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建游戏配置存储
                if (!db.objectStoreNames.contains(this.stores.games)) {
                    const gamesStore = db.createObjectStore(this.stores.games, { keyPath: 'id' });
                    gamesStore.createIndex('name', 'name', { unique: false });
                    gamesStore.createIndex('version', 'version', { unique: false });
                }
                
                // 创建存档存储
                if (!db.objectStoreNames.contains(this.stores.saves)) {
                    const savesStore = db.createObjectStore(this.stores.saves, { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    savesStore.createIndex('gameId', 'gameId', { unique: false });
                    savesStore.createIndex('slotName', ['gameId', 'slotName'], { unique: true });
                    savesStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // 创建设置存储
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    const settingsStore = db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                    settingsStore.createIndex('gameId', 'gameId', { unique: false });
                }
                
                // 创建知识库存储
                if (!db.objectStoreNames.contains(this.stores.knowledge)) {
                    const knowledgeStore = db.createObjectStore(this.stores.knowledge, { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    knowledgeStore.createIndex('gameId', 'gameId', { unique: false });
                    knowledgeStore.createIndex('type', 'type', { unique: false });
                    knowledgeStore.createIndex('category', 'category', { unique: false });
                }
                
                // 创建DLC存储
                if (!db.objectStoreNames.contains(this.stores.dlc)) {
                    const dlcStore = db.createObjectStore(this.stores.dlc, { keyPath: 'id' });
                    dlcStore.createIndex('gameId', 'gameId', { unique: false });
                    dlcStore.createIndex('name', 'name', { unique: false });
                    dlcStore.createIndex('activated', 'activated', { unique: false });
                }
                
                console.log('[StorageManager] 数据库结构创建/更新完成');
            };
        });
    }

    /**
     * 设置游戏命名空间
     */
    setGameNamespace(gameId) {
        this.currentNamespace = gameId;
        console.log(`[StorageManager] 切换到游戏命名空间: ${gameId}`);
    }

    /**
     * 保存游戏数据
     */
    async saveGame(gameData, slotName = 'autosave') {
        if (!this.currentNamespace) {
            throw new Error('未设置游戏命名空间');
        }

        const saveData = {
            gameId: this.currentNamespace,
            slotName: slotName,
            data: gameData,
            timestamp: Date.now(),
            version: gameData.version || '1.0'
        };

        return await this.saveToStore(this.stores.saves, saveData, 
            ['gameId', 'slotName'], [this.currentNamespace, slotName]);
    }

    /**
     * 加载游戏数据
     */
    async loadGame(gameId, slotName = 'autosave') {
        const index = this.db.transaction([this.stores.saves], 'readonly')
            .objectStore(this.stores.saves)
            .index('slotName');
            
        return new Promise((resolve, reject) => {
            const request = index.get([gameId, slotName]);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.data : null);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 获取游戏的所有存档
     */
    async getGameSaves(gameId) {
        const index = this.db.transaction([this.stores.saves], 'readonly')
            .objectStore(this.stores.saves)
            .index('gameId');
            
        return new Promise((resolve, reject) => {
            const request = index.getAll(gameId);
            
            request.onsuccess = () => {
                const saves = request.result.map(save => ({
                    id: save.id,
                    slotName: save.slotName,
                    timestamp: save.timestamp,
                    version: save.version
                }));
                resolve(saves);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 删除存档
     */
    async deleteSave(saveId) {
        return await this.deleteFromStore(this.stores.saves, saveId);
    }

    /**
     * 保存设置
     */
    async saveSetting(key, value) {
        const settingData = {
            key: this.currentNamespace ? `${this.currentNamespace}_${key}` : key,
            gameId: this.currentNamespace,
            value: value,
            updatedAt: Date.now()
        };
        
        return await this.saveToStore(this.stores.settings, settingData);
    }

    /**
     * 加载设置
     */
    async loadSetting(key) {
        const fullKey = this.currentNamespace ? `${this.currentNamespace}_${key}` : key;
        const result = await this.getFromStore(this.stores.settings, fullKey);
        return result ? result.value : null;
    }

    /**
     * 保存全局设置（不限于特定游戏）
     */
    async saveGlobalSetting(key, value) {
        const settingData = {
            key: `global_${key}`,
            gameId: null,
            value: value,
            updatedAt: Date.now()
        };
        
        return await this.saveToStore(this.stores.settings, settingData);
    }

    /**
     * 加载全局设置
     */
    async loadGlobalSetting(key) {
        const result = await this.getFromStore(this.stores.settings, `global_${key}`);
        return result ? result.value : null;
    }

    /**
     * 保存知识库条目
     */
    async saveKnowledgeItem(item) {
        const knowledgeData = {
            ...item,
            gameId: this.currentNamespace,
            createdAt: item.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        
        return await this.addToStore(this.stores.knowledge, knowledgeData);
    }

    /**
     * 获取游戏的知识库
     */
    async getGameKnowledge(gameId) {
        const index = this.db.transaction([this.stores.knowledge], 'readonly')
            .objectStore(this.stores.knowledge)
            .index('gameId');
            
        return new Promise((resolve, reject) => {
            const request = index.getAll(gameId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 保存DLC数据
     */
    async saveDLC(dlcData) {
        const dlc = {
            ...dlcData,
            gameId: this.currentNamespace,
            installedAt: Date.now()
        };
        
        return await this.saveToStore(this.stores.dlc, dlc);
    }

    /**
     * 获取游戏的DLC列表
     */
    async getGameDLCs(gameId) {
        const index = this.db.transaction([this.stores.dlc], 'readonly')
            .objectStore(this.stores.dlc)
            .index('gameId');
            
        return new Promise((resolve, reject) => {
            const request = index.getAll(gameId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 导出游戏的所有数据
     */
    async exportGameData(gameId) {
        const [saves, settings, knowledge, dlcs] = await Promise.all([
            this.getGameSaves(gameId),
            this.getGameSettings(gameId),
            this.getGameKnowledge(gameId),
            this.getGameDLCs(gameId)
        ]);
        
        return {
            gameId,
            exportedAt: Date.now(),
            saves,
            settings,
            knowledge,
            dlcs
        };
    }

    /**
     * 导入游戏数据
     */
    async importGameData(exportData) {
        const { gameId, saves, settings, knowledge, dlcs } = exportData;
        
        // 设置命名空间
        this.setGameNamespace(gameId);
        
        // 导入各类数据
        const promises = [];
        
        if (saves && saves.length > 0) {
            for (const save of saves) {
                promises.push(this.saveGame(save.data, save.slotName));
            }
        }
        
        if (settings && settings.length > 0) {
            for (const setting of settings) {
                promises.push(this.saveSetting(setting.key, setting.value));
            }
        }
        
        if (knowledge && knowledge.length > 0) {
            for (const item of knowledge) {
                promises.push(this.saveKnowledgeItem(item));
            }
        }
        
        if (dlcs && dlcs.length > 0) {
            for (const dlc of dlcs) {
                promises.push(this.saveDLC(dlc));
            }
        }
        
        await Promise.all(promises);
        
        console.log(`[StorageManager] 成功导入游戏数据: ${gameId}`);
    }

    /**
     * 清除游戏的所有数据
     */
    async clearGameData(gameId) {
        // 清除存档
        const saves = await this.getGameSaves(gameId);
        for (const save of saves) {
            await this.deleteSave(save.id);
        }
        
        // 清除知识库
        const knowledge = await this.getGameKnowledge(gameId);
        for (const item of knowledge) {
            await this.deleteFromStore(this.stores.knowledge, item.id);
        }
        
        // 清除DLC
        const dlcs = await this.getGameDLCs(gameId);
        for (const dlc of dlcs) {
            await this.deleteFromStore(this.stores.dlc, dlc.id);
        }
        
        console.log(`[StorageManager] 已清除游戏数据: ${gameId}`);
    }

    // ============ 辅助方法 ============

    /**
     * 保存到存储
     */
    async saveToStore(storeName, data, indexName = null, indexValue = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // 如果提供了索引，先检查是否存在
            if (indexName && indexValue) {
                const index = store.index(indexName);
                const checkRequest = index.get(indexValue);
                
                checkRequest.onsuccess = () => {
                    const existing = checkRequest.result;
                    if (existing) {
                        data.id = existing.id;
                    }
                    
                    const request = store.put(data);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                };
                
                checkRequest.onerror = () => reject(checkRequest.error);
            } else {
                const request = store.put(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            }
        });
    }

    /**
     * 添加到存储
     */
    async addToStore(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 从存储获取
     */
    async getFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 从存储删除
     */
    async deleteFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 获取游戏的设置
     */
    async getGameSettings(gameId) {
        const index = this.db.transaction([this.stores.settings], 'readonly')
            .objectStore(this.stores.settings)
            .index('gameId');
            
        return new Promise((resolve, reject) => {
            const request = index.getAll(gameId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }
}
