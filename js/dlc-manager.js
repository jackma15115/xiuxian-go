/**
 * DLC管理器 - 核心功能模块
 * 负责DLC知识包的创建、管理、存储和激活
 */

class DLCManager {
    constructor() {
        this.dlcPackages = [];
        this.activatedDLCs = new Set();
        // 根据游戏配置使用不同的数据库名称
        // game-bhz.html 使用 BHZ_CONFIG, game.html 使用 GAME_CONFIG
        const config = window.BHZ_CONFIG || window.GAME_CONFIG || {};
        this.dbName = config.DB_NAME || 'xiuxian_dlc_db';
        this.dbVersion = 1;
        this.storeName = 'dlc_packages';
        this.db = null;
        console.log('[DLCManager] 使用数据库:', this.dbName);
    }

    /**
     * 初始化IndexedDB数据库
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('DLC数据库打开失败:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('DLC数据库打开成功');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('activated', 'activated', { unique: false });
                    console.log('DLC数据库对象存储创建成功');
                }
            };
        });
    }

    /**
     * 从IndexedDB加载所有DLC包
     */
    async loadAllDLCs() {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.dlcPackages = request.result || [];
                this.activatedDLCs.clear();
                this.dlcPackages.forEach(dlc => {
                    if (dlc.activated) {
                        this.activatedDLCs.add(dlc.id);
                    }
                });
                console.log(`[DLC管理器] 已加载 ${this.dlcPackages.length} 个DLC包`);
                resolve(this.dlcPackages);
            };
            
            request.onerror = () => {
                console.error('加载DLC包失败:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 创建新的DLC包
     */
    createDLC(name, description, knowledgeItems) {
        const dlc = {
            id: 'dlc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            description: description,
            knowledgeItems: knowledgeItems || [],
            activated: false,
            createdAt: new Date().toISOString(),
            version: '1.0',
            source: 'user_created'
        };
        
        this.dlcPackages.push(dlc);
        console.log(`[DLC管理器] 创建DLC包: ${name} (${dlc.id})`);
        return dlc;
    }

    /**
     * 获取DLC列表
     */
    getDLCList() {
        return [...this.dlcPackages];
    }

    /**
     * 获取已激活的DLC列表
     */
    getActivatedDLCs() {
        return this.dlcPackages.filter(dlc => dlc.activated);
    }

    /**
     * 激活DLC包
     */
    async activateDLC(dlcId) {
        const dlc = this.dlcPackages.find(d => d.id === dlcId);
        if (!dlc) {
            throw new Error('DLC包不存在');
        }
        
        if (dlc.activated) {
            console.log(`[DLC管理器] DLC ${dlc.name} 已经激活`);
            return;
        }
        
        dlc.activated = true;
        this.activatedDLCs.add(dlcId);
        
        // 将DLC知识添加到知识库
        if (window.contextVectorManager) {
            console.log(`[DLC管理器] 开始添加DLC知识到向量库，DLC包含 ${dlc.knowledgeItems.length} 个知识条目`);
            for (const item of dlc.knowledgeItems) {
                console.log(`[DLC管理器] 添加知识条目: ${item.title} (ID: ${item.id})`);
                
                // 创建知识条目对象
                const knowledgeItem = {
                    id: item.id,
                    title: item.title,
                    content: item.content,
                    category: item.category || 'dlc',
                    tags: item.tags || [],
                    alwaysInclude: item.alwaysInclude || false, // 保持原有的常驻知识设置
                    priority: item.priority || 'medium', // 保持原有的优先级设置
                    vector: null, // 向量稍后处理
                    vectorType: item.vectorType || 'sparse', // 保持原有的向量类型
                    source: 'dlc',
                    dlcId: dlcId,
                    createdAt: new Date().toISOString()
                };
                
                // 如果知识条目已经有向量，直接使用
                if (item.vector) {
                    knowledgeItem.vector = item.vector;
                    knowledgeItem.vectorType = item.vectorType;
                    knowledgeItem.vectorizedAt = item.vectorizedAt;
                    knowledgeItem.vectorMethod = item.vectorMethod;
                    console.log(`[DLC管理器] ${item.title}: 使用已有向量 (${knowledgeItem.vectorType})`);
                } else {
                    // 根据当前向量化方法生成向量
                    try {
                        if (window.contextVectorManager.embeddingMethod === 'transformers') {
                            // 使用浏览器模型生成稠密向量
                            knowledgeItem.vector = await window.contextVectorManager.getEmbeddingFromTransformers(item.content);
                            knowledgeItem.vectorType = 'dense';
                            console.log(`[DLC管理器] ${item.title}: 使用浏览器模型生成稠密向量`);
                        } else if (window.contextVectorManager.embeddingMethod === 'api') {
                            // 使用API生成稠密向量
                            knowledgeItem.vector = await window.contextVectorManager.getEmbeddingFromAPI(item.content);
                            knowledgeItem.vectorType = 'dense';
                            console.log(`[DLC管理器] ${item.title}: 使用API生成稠密向量`);
                        } else {
                            // 使用关键词方法生成稀疏向量
                            knowledgeItem.vector = window.contextVectorManager.createKeywordVector(item.content);
                            knowledgeItem.vectorType = 'sparse';
                            console.log(`[DLC管理器] ${item.title}: 使用关键词方法生成稀疏向量`);
                        }
                    } catch (error) {
                        console.warn(`[DLC管理器] ${item.title} 向量化失败，回退到关键词方法:`, error.message);
                        // 失败时回退到关键词方法
                        knowledgeItem.vector = window.contextVectorManager.createKeywordVector(item.content);
                        knowledgeItem.vectorType = 'sparse';
                    }
                }
                
                // 检查是否已存在相同ID的条目，避免重复添加
                const existingIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(kb => kb.id === knowledgeItem.id);
                if (existingIndex !== -1) {
                    console.log(`[DLC管理器] ${item.title}: 知识条目已存在，跳过添加`);
                    continue;
                }
                
                // 添加到知识库
                window.contextVectorManager.staticKnowledgeBase.push(knowledgeItem);
            }
            
            // 保存到IndexedDB
            await window.contextVectorManager.saveStaticKBToIndexedDB();
            
            console.log(`[DLC管理器] 已将 ${dlc.knowledgeItems.length} 个知识条目添加到向量库`);
            
            // 验证添加结果
            const currentKB = window.contextVectorManager.staticKnowledgeBase;
            const dlcItems = currentKB.filter(item => item.category === 'dlc');
            console.log(`[DLC管理器] 验证: 知识库中当前有 ${dlcItems.length} 个DLC条目`);
        } else {
            console.warn('[DLC管理器] 警告: contextVectorManager 未初始化，无法添加DLC知识到向量库');
        }
        
        console.log(`[DLC管理器] 已激活DLC: ${dlc.name}`);
        
        // 保存状态到数据库
        await this.saveDLCToIndexedDB();
        
        // 显示激活成功通知
        setTimeout(() => {
            alert(`✅ DLC激活成功！\n\n📦 DLC名称：${dlc.name}\n📚 知识条目：${dlc.knowledgeItems.length}个\n\n💡 你可以点击"📚 查看知识库"来查看已激活的DLC内容\nDLC条目会以 📦 标记显示`);
        }, 100);
    }

    /**
     * 停用DLC包
     */
    async deactivateDLC(dlcId) {
        const dlc = this.dlcPackages.find(d => d.id === dlcId);
        if (!dlc) {
            throw new Error('DLC包不存在');
        }
        
        if (!dlc.activated) {
            console.log(`[DLC管理器] DLC ${dlc.name} 未激活`);
            return;
        }
        
        dlc.activated = false;
        this.activatedDLCs.delete(dlcId);
        
        // 从知识库移除DLC知识
        if (window.contextVectorManager) {
            // 找到所有属于此DLC的知识条目
            const dlcKnowledgeItems = window.contextVectorManager.staticKnowledgeBase.filter(item => item.dlcId === dlcId);
            
            for (const item of dlcKnowledgeItems) {
                // 从数组中移除
                const index = window.contextVectorManager.staticKnowledgeBase.findIndex(kb => kb.id === item.id);
                if (index !== -1) {
                    window.contextVectorManager.staticKnowledgeBase.splice(index, 1);
                }
            }
            
            // 保存到IndexedDB
            await window.contextVectorManager.saveStaticKBToIndexedDB();
            
            console.log(`[DLC管理器] 已从向量库移除 ${dlcKnowledgeItems.length} 个知识条目`);
        }
        
        console.log(`[DLC管理器] 已停用DLC: ${dlc.name}`);
        
        // 保存状态到数据库
        await this.saveDLCToIndexedDB();
        
        // 显示停用成功通知
        setTimeout(() => {
            alert(`✅ DLC停用成功！\n\n📦 DLC名称：${dlc.name}\n📚 知识条目：${dlc.knowledgeItems.length}个\n\n💡 相关知识条目已从知识库中移除\n你可以在"📚 查看知识库"中确认移除`);
        }, 100);
    }

    /**
     * 删除DLC包
     */
    async deleteDLC(dlcId) {
        const index = this.dlcPackages.findIndex(d => d.id === dlcId);
        if (index === -1) {
            throw new Error('DLC包不存在');
        }
        
        const dlc = this.dlcPackages[index];
        
        // 如果DLC已激活，先停用
        if (dlc.activated) {
            await this.deactivateDLC(dlcId);
        }
        
        // 从数组中移除
        this.dlcPackages.splice(index, 1);
        
        // 从数据库删除
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const request = store.delete(dlcId);
                
                request.onsuccess = () => {
                    console.log(`[DLC管理器] 已删除DLC: ${dlc.name}`);
                    resolve();
                };
                
                request.onerror = () => {
                    console.error('删除DLC失败:', request.error);
                    reject(request.error);
                };
            });
        }
    }

    /**
     * 保存所有DLC包到IndexedDB
     */
    async saveDLCToIndexedDB() {
        if (!this.db) {
            await this.initDB();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // 清空现有数据
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
                // 重新添加所有DLC包
                let saveCount = 0;
                const totalDLCs = this.dlcPackages.length;
                
                if (totalDLCs === 0) {
                    console.log('[DLC管理器] 所有DLC包已保存到数据库');
                    resolve();
                    return;
                }
                
                this.dlcPackages.forEach(dlc => {
                    const addRequest = store.add(dlc);
                    
                    addRequest.onsuccess = () => {
                        saveCount++;
                        if (saveCount === totalDLCs) {
                            console.log(`[DLC管理器] 已保存 ${totalDLCs} 个DLC包到数据库`);
                            resolve();
                        }
                    };
                    
                    addRequest.onerror = () => {
                        console.error('保存DLC包失败:', addRequest.error);
                        reject(addRequest.error);
                    };
                });
            };
            
            clearRequest.onerror = () => {
                console.error('清空DLC数据库失败:', clearRequest.error);
                reject(clearRequest.error);
            };
        });
    }

    /**
     * 导入DLC包
     */
    async importDLC(dlcData) {
        if (!dlcData || !dlcData.id) {
            throw new Error('无效的DLC数据');
        }
        
        // 检查是否已存在
        const existingIndex = this.dlcPackages.findIndex(d => d.id === dlcData.id);
        if (existingIndex !== -1) {
            // 更新现有DLC
            this.dlcPackages[existingIndex] = { ...dlcData, activated: false };
            console.log(`[DLC管理器] 更新DLC包: ${dlcData.name}`);
        } else {
            // 添加新DLC
            this.dlcPackages.push({ ...dlcData, activated: false });
            console.log(`[DLC管理器] 导入DLC包: ${dlcData.name}`);
        }
        
        await this.saveDLCToIndexedDB();
    }

    /**
     * 获取DLC统计信息
     */
    getStats() {
        const total = this.dlcPackages.length;
        const activated = this.activatedDLCs.size;
        const totalKnowledgeItems = this.dlcPackages.reduce((sum, dlc) => sum + (dlc.knowledgeItems?.length || 0), 0);
        
        return {
            total,
            activated,
            inactive: total - activated,
            totalKnowledgeItems
        };
    }

    /**
     * 清空所有DLC数据
     */
    async clearAllDLCs() {
        console.log('[DLC管理器] 开始清空所有DLC数据');
        
        // 停用所有已激活的DLC
        const activatedDLCs = this.getActivatedDLCs();
        for (const dlc of activatedDLCs) {
            try {
                await this.deactivateDLC(dlc.id);
            } catch (error) {
                console.warn(`[DLC管理器] 停用DLC ${dlc.name} 失败:`, error.message);
            }
        }
        
        // 清空内存中的DLC数据
        this.dlcPackages = [];
        this.activatedDLCs.clear();
        
        // 清空数据库
        if (this.db) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const store = transaction.objectStore(this.storeName);
                const clearRequest = store.clear();
                
                clearRequest.onsuccess = () => {
                    console.log('[DLC管理器] 已清空所有DLC数据');
                    resolve();
                };
                
                clearRequest.onerror = () => {
                    console.error('[DLC管理器] 清空DLC数据库失败:', clearRequest.error);
                    reject(clearRequest.error);
                };
            });
        }
    }
}

// 创建全局DLC管理器实例
window.dlcManager = new DLCManager();

// 初始化DLC管理器
window.dlcManager.loadAllDLCs().catch(error => {
    console.error('DLC管理器初始化失败:', error);
});

console.log('[DLC管理器] 已加载并初始化');
