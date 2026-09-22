/**
 * 人物图谱管理器 - 基于向量匹配的人物信息检索系统
 * 
 * 功能：
 * 1. 将人际关系中的姓名、性格、外貌提取并向量化存储
 * 2. 通过向量相似度匹配来检索相关人物
 * 3. 支持阈值过滤，只返回高度匹配的人物
 * 4. 动态构建上下文，而不是全部加载到变量表单
 */

class CharacterGraphManager {
    constructor(config = {}) {
        this.characters = new Map(); // 存储完整的人物信息 {name: characterData}
        this.vectors = new Map(); // 存储人物向量 {name: vector}
        this.indexedDB = null;
        this.dbName = 'CharacterGraphDB';
        this.storeName = 'characters';
        this.isInitialized = false;
        
        // 配置参数
        this.config = {
            nameWeight: config.nameWeight || 3, // 姓名权重
            matchThreshold: config.matchThreshold || 0.4, // 匹配阈值（384维向量：40%）
            maxResults: config.maxResults || 3, // 最大返回结果数
            enableDebug: config.enableDebug !== undefined ? config.enableDebug : true, // 默认启用调试日志
            personalityWeight: config.personalityWeight || 1.0, // 性格权重
            appearanceWeight: config.appearanceWeight || 1.0, // 外貌权重
            vectorDim: config.vectorDim || 384 // 向量维度（与embedding API对应）
        };
        
        // 统计信息
        this.stats = {
            totalCharacters: 0,
            lastUpdate: null,
            matchCount: 0,
            avgMatchScore: 0
        };
    }

    /**
     * 初始化IndexedDB
     */
    async init() {
        if (this.isInitialized) {
            return true;
        }

        try {
            console.log('[人物图谱] 初始化IndexedDB...');
            
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, 1);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // 创建人物存储
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const store = db.createObjectStore(this.storeName, { keyPath: 'name' });
                        store.createIndex('addedAt', 'addedAt', { unique: false });
                        store.createIndex('lastMatchedAt', 'lastMatchedAt', { unique: false });
                        console.log('[人物图谱] 创建对象存储:', this.storeName);
                    }
                };
            });

            this.indexedDB = db;
            
            // 加载已有数据到内存
            await this.loadFromIndexedDB();
            
            this.isInitialized = true;
            console.log(`[人物图谱] ✅ 初始化完成，已加载 ${this.stats.totalCharacters} 个人物`);
            return true;
            
        } catch (error) {
            console.error('[人物图谱] ❌ 初始化失败:', error);
            return false;
        }
    }

    /**
     * 从IndexedDB加载数据
     */
    async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = async () => {
                const characters = request.result || [];
                
                // 🔧 处理加载的数据，移除旧的vector字段，重新生成
                for (const char of characters) {
                    // 移除旧的vector字段（如果存在）
                    const {vector, ...charWithoutVector} = char;
                    
                    // 保存到内存（不包含vector）
                    this.characters.set(char.name, charWithoutVector);
                    
                    // 重新生成向量（或使用旧的vector如果存在）
                    if (vector) {
                        // 旧数据有vector，直接使用
                        this.vectors.set(char.name, vector);
                    } else {
                        // 新数据没有vector，需要重新生成
                        try {
                            const newVector = await this.generateVector(char.name, char.personality, char.appearance);
                            this.vectors.set(char.name, newVector);
                        } catch (error) {
                            console.warn(`[人物图谱] ⚠️ 无法为 ${char.name} 生成向量:`, error);
                        }
                    }
                }
                
                this.stats.totalCharacters = characters.length;
                console.log(`[人物图谱] 从IndexedDB加载了 ${characters.length} 个人物`);
                resolve();
            };

            request.onerror = () => {
                console.error('[人物图谱] 加载失败:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 保存单个人物到IndexedDB
     */
    async saveCharacter(character) {
        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(character);

            request.onsuccess = () => {
                console.log(`[人物图谱] ✅ 保存人物: ${character.name}`);
                resolve();
            };

            request.onerror = () => {
                console.error(`[人物图谱] ❌ 保存失败: ${character.name}`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 添加或更新人物信息
     * @param {Object} relationship - 从AI响应的relationships中提取的人物信息
     * @param {number} turnIndex - 🆕 当前轮次索引（用于回滚时删除）
     */
    async addOrUpdateCharacter(relationship, turnIndex = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        const { name, personality, appearance, ...otherData } = relationship;

        if (!name) {
            console.warn('[人物图谱] ⚠️ 人物缺少姓名，跳过');
            return null;
        }

        // 检查是否已存在
        const existing = this.characters.get(name);
        
        // 🆕 计算当前轮次索引（如果没有传入）
        if (turnIndex === null && window.gameState) {
            turnIndex = Math.floor((window.gameState.conversationHistory?.length || 0) / 2);
        }
        
        // 准备人物数据（不包含vector，避免浪费存储和发送给AI）
        const characterData = {
            name,
            personality: personality || existing?.personality || '未知',
            appearance: appearance || existing?.appearance || '未知',
            ...otherData,
            addedAt: existing?.addedAt || Date.now(),
            addedAtTurn: existing?.addedAtTurn ?? turnIndex, // 🆕 记录首次添加时的轮次
            updatedAt: Date.now(),
            lastMatchedAt: existing?.lastMatchedAt || null,
            matchCount: existing?.matchCount || 0
        };

        // 生成向量（基于姓名、性格、外貌）
        const vector = await this.generateVector(name, personality, appearance);
        
        // 🔧 重要：vector只存储在this.vectors中，不存储在characterData中
        // 这样可以避免：
        // 1. 浪费IndexedDB存储空间（384个浮点数）
        // 2. 浪费AI的上下文token（向量对AI无意义）

        // 保存到内存
        this.characters.set(name, characterData);
        this.vectors.set(name, vector);

        // 保存到IndexedDB（不包含vector）
        await this.saveCharacter(characterData);

        // 更新统计
        if (!existing) {
            this.stats.totalCharacters++;
        }
        this.stats.lastUpdate = Date.now();

        console.log(`[人物图谱] ${existing ? '更新' : '添加'} 人物: ${name}`);
        return characterData;
    }

    /**
     * 生成人物向量（使用supply.js的384维embedding）
     * @param {string} name - 人物姓名
     * @param {string} personality - 性格
     * @param {string} appearance - 外貌
     * @returns {Array|Object} 向量表示（384维数组或关键词对象）
     */
    async generateVector(name, personality = '', appearance = '') {
        if (!window.contextVectorManager) {
            console.error('[人物图谱] contextVectorManager未加载，使用降级方案');
            // 降级：返回简单的关键词对象
            const vector = {};
            vector[name] = this.config.nameWeight * 10;
            if (personality) vector[personality] = 5;
            if (appearance) vector[appearance] = 5;
            return vector;
        }
        
        // 🔧 使用transformer生成384维向量，增强姓名权重
        // 重复姓名多次以提高权重
        const nameRepeated = Array(this.config.nameWeight * 2).fill(name).join(' ');
        const text = `${nameRepeated} ${name} ${personality} ${appearance}`;
        
        try {
            let vector;
            if (window.contextVectorManager.embeddingMethod === 'transformers') {
                // 使用384维transformer向量
                vector = await window.contextVectorManager.getEmbeddingFromTransformers(text);
                if (this.config.enableDebug) {
                    console.log(`[人物图谱] 生成向量: ${name}`);
                    console.log(`  文本: "${text}"`);
                    console.log(`  向量类型: Dense (384维)`);
                    console.log(`  向量前5维: [${vector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`);
                }
            } else {
                // 回退到关键词向量
                vector = window.contextVectorManager.createKeywordVector(text);
                if (this.config.enableDebug) {
                    const keywordList = Object.entries(vector)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([word, weight]) => `${word}(${weight.toFixed(1)})`)
                        .join(', ');
                    console.log(`[人物图谱] 生成向量: ${name}`);
                    console.log(`  文本: "${text}"`);
                    console.log(`  向量类型: Sparse (关键词)`);
                    console.log(`  关键词(前10): ${keywordList}`);
                }
            }
            
            return vector;
        } catch (error) {
            console.error(`[人物图谱] 向量生成失败: ${error.message}`);
            // 降级到关键词方法
            return window.contextVectorManager.createKeywordVector(text);
        }
    }

    /**
     * 计算余弦相似度（智能识别向量类型）
     * @param {Array|Object} vecA - 向量A（数组或对象）
     * @param {Array|Object} vecB - 向量B（数组或对象）
     * @returns {number} 相似度（0-1）
     */
    cosineSimilarity(vecA, vecB) {
        if (!window.contextVectorManager) {
            console.error('[人物图谱] contextVectorManager未加载');
            return 0;
        }
        
        // 智能识别向量类型
        const isArrayA = Array.isArray(vecA);
        const isArrayB = Array.isArray(vecB);
        
        if (isArrayA && isArrayB) {
            // 两个都是数组，使用数组向量相似度
            return window.contextVectorManager.calculateArrayCosineSimilarity(vecA, vecB);
        } else if (!isArrayA && !isArrayB) {
            // 两个都是对象，使用对象向量相似度
            return window.contextVectorManager.calculateObjectCosineSimilarity(vecA, vecB);
        } else {
            // 类型不匹配
            console.warn('[人物图谱] 向量类型不匹配，无法计算相似度');
            return 0;
        }
    }

    /**
     * 🆕 直接用向量搜索人物（推荐方法）
     * @param {string} queryText - 用户输入的文本（可能包含AI回复）
     * @param {string} userInputOnly - 可选，仅用户输入部分（用于区分匹配来源）
     * @returns {Array} 匹配的人物列表，按相似度排序
     */
    async searchByText(queryText, userInputOnly = null) {
        if (!this.isInitialized) {
            await this.init();
        }

        // 🔧 第一步：精确名字匹配（优先级最高）
        // 如果文本中明确包含人物姓名，应该直接匹配，不依赖向量相似度
        // 匹配来源：用户输入 或 AI回复
        const exactNameMatches = new Map(); // {name: 'user' | 'ai_reply' | 'both'}
        for (const [name, character] of this.characters.entries()) {
            const inUserInput = userInputOnly ? userInputOnly.includes(name) : queryText.includes(name);
            const inFullText = queryText.includes(name);
            
            if (inFullText) {
                let matchSource = 'unknown';
                if (userInputOnly) {
                    // 有区分用户输入和完整文本
                    if (inUserInput && inFullText) {
                        matchSource = 'both';
                    } else if (inUserInput) {
                        matchSource = 'user';
                    } else {
                        matchSource = 'ai_reply';
                    }
                } else {
                    matchSource = 'text';
                }
                
                exactNameMatches.set(name, matchSource);
                if (this.config.enableDebug) {
                    const sourceLabel = {
                        'user': '用户输入',
                        'ai_reply': 'AI回复',
                        'both': '用户输入+AI回复',
                        'text': '查询文本',
                        'unknown': '文本'
                    }[matchSource];
                    console.log(`[人物图谱] 🎯 精确名字匹配: "${name}" 在${sourceLabel}中找到`);
                }
            }
        }

        // 使用与人物向量相同的方法生成查询向量
        if (!window.contextVectorManager) {
            console.error('[人物图谱] contextVectorManager未加载');
            // 如果有精确名字匹配，仍然返回结果
            if (exactNameMatches.size > 0) {
                const exactResults = [];
                for (const [name, matchSource] of exactNameMatches) {
                    const character = this.characters.get(name);
                    if (character) {
                        exactResults.push({
                            ...character,
                            matchScore: 1.0, // 精确匹配给最高分
                            matchType: 'exact_name',
                            matchSource
                        });
                    }
                }
                return exactResults.slice(0, this.config.maxResults);
            }
            return [];
        }

        // 🔧 使用384维transformer向量
        let queryVector;
        try {
            if (window.contextVectorManager.embeddingMethod === 'transformers') {
                // 使用384维transformer向量
                queryVector = await window.contextVectorManager.getEmbeddingFromTransformers(queryText);
                if (this.config.enableDebug) {
                    console.log(`[人物图谱] 查询向量类型: Dense (384维)`);
                    console.log(`[人物图谱] 查询向量前5维: [${queryVector.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`);
                }
            } else {
                // 回退到关键词向量
                queryVector = window.contextVectorManager.createKeywordVector(queryText);
                if (this.config.enableDebug) {
                    const keywordList = Object.entries(queryVector)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([word, weight]) => `${word}(${weight.toFixed(1)})`)
                        .join(', ');
                    console.log(`[人物图谱] 查询向量类型: Sparse (关键词)`);
                    console.log(`[人物图谱] 查询关键词(前10): ${keywordList}`);
                }
            }
        } catch (error) {
            console.error(`[人物图谱] 查询向量生成失败: ${error.message}`);
            // 降级到关键词方法
            queryVector = window.contextVectorManager.createKeywordVector(queryText);
        }

        // 计算所有人物的相似度
        const matches = [];
        const allMatches = []; // 🔧 保存所有匹配分数用于调试
        
        for (const [name, character] of this.characters.entries()) {
            const vector = this.vectors.get(name);
            
            if (!vector) {
                console.warn(`[人物图谱] ⚠️ 人物 ${name} 没有向量，跳过匹配`);
                continue;
            }
            
            // 🔧 调试向量计算
            if (this.config.enableDebug && name === '小翠') {
                console.log(`[人物图谱调试] 🎯 检查小翠的向量计算:`);
                const queryIsArray = Array.isArray(queryVector);
                const vectorIsArray = Array.isArray(vector);
                console.log(`  查询向量类型:`, queryIsArray ? `Dense (${queryVector.length}维)` : `Sparse (${Object.keys(queryVector).length}关键词)`);
                console.log(`  小翠向量类型:`, vectorIsArray ? `Dense (${vector.length}维)` : `Sparse (${Object.keys(vector).length}关键词)`);
                if (queryIsArray) {
                    console.log(`  查询向量前5维:`, queryVector.slice(0, 5).map(v => v.toFixed(3)));
                }
                if (vectorIsArray) {
                    console.log(`  小翠向量前5维:`, vector.slice(0, 5).map(v => v.toFixed(3)));
                }
            }
            
            const similarity = this.cosineSimilarity(queryVector, vector);
            
            // 🔧 调试相似度结果
            if (this.config.enableDebug && name === '小翠') {
                console.log(`[人物图谱调试] 📊 小翠相似度结果: ${similarity}`);
                if (similarity === 0) {
                    console.log(`[人物图谱调试] ❌ 相似度为0，可能原因:`);
                    console.log(`  1. contextVectorManager未加载:`, !window.contextVectorManager);
                    console.log(`  2. 查询向量为空:`, Object.keys(queryVector || {}).length === 0);
                    console.log(`  3. 小翠向量为空:`, Object.keys(vector || {}).length === 0);
                }
            }
            
            // 🔧 检查是否是精确名字匹配
            const isExactNameMatch = exactNameMatches.has(name);
            const matchSource = exactNameMatches.get(name); // 'user' | 'ai_reply' | 'both' | undefined
            
            // 保存所有匹配结果（用于调试）
            allMatches.push({
                name,
                matchScore: similarity,
                character,
                isExactNameMatch,
                matchSource
            });
            
            // 🔧 修改匹配逻辑：精确名字匹配或向量相似度达到阈值
            if (isExactNameMatch || similarity >= this.config.matchThreshold) {
                // 精确名字匹配时，至少给予阈值分数，确保不会被过滤
                const finalScore = isExactNameMatch ? Math.max(similarity, this.config.matchThreshold + 0.1) : similarity;
                matches.push({
                    ...character,  // 包含完整的relationship数据（含history），不包含vector
                    matchScore: finalScore,
                    matchType: isExactNameMatch ? 'exact_name' : 'vector',
                    matchSource: matchSource || null
                });
            }
        }

        // 按相似度排序（降序）
        matches.sort((a, b) => b.matchScore - a.matchScore);
        allMatches.sort((a, b) => b.matchScore - a.matchScore);

        // 限制返回数量
        const results = matches.slice(0, this.config.maxResults);

        // 更新统计和最后匹配时间
        results.forEach(char => {
            const original = this.characters.get(char.name);
            if (original) {
                original.lastMatchedAt = Date.now();
                original.matchCount = (original.matchCount || 0) + 1;
                this.saveCharacter(original);
            }
        });

        // 更新统计
        if (results.length > 0) {
            this.stats.matchCount++;
            const avgScore = results.reduce((sum, r) => sum + r.matchScore, 0) / results.length;
            this.stats.avgMatchScore = (this.stats.avgMatchScore * (this.stats.matchCount - 1) + avgScore) / this.stats.matchCount;
        }

        if (this.config.enableDebug) {
            console.log(`[人物图谱] 🔍 查询: "${queryText.substring(0, 50)}..."`);
            console.log(`[人物图谱] 图谱中共有 ${this.characters.size} 个人物`);
            console.log(`[人物图谱] 匹配阈值: ${(this.config.matchThreshold * 100).toFixed(0)}%`);
            
            // 显示精确名字匹配详情
            if (exactNameMatches.size > 0) {
                const matchDetails = Array.from(exactNameMatches.entries())
                    .map(([name, source]) => {
                        const sourceLabel = {
                            'user': '👤用户输入',
                            'ai_reply': '🤖AI回复',
                            'both': '👤+🤖',
                            'text': '📝文本'
                        }[source] || source;
                        return `${name}(${sourceLabel})`;
                    }).join(', ');
                console.log(`[人物图谱] 精确名字匹配: ${matchDetails}`);
            } else {
                console.log(`[人物图谱] 精确名字匹配: 无`);
            }
            
            console.log(`[人物图谱] 找到 ${results.length} 个匹配:`);
            results.forEach((r, i) => {
                const matchTypeIcon = r.matchType === 'exact_name' ? '🎯' : '📊';
                const sourceInfo = r.matchSource ? ` [来源: ${r.matchSource}]` : '';
                console.log(`  ${i + 1}. ${r.name} ${matchTypeIcon} (相似度: ${(r.matchScore * 100).toFixed(1)}%, 类型: ${r.matchType || 'vector'}${sourceInfo})`);
            });
            
            // 🔧 显示所有人物的匹配分数（即使未达到阈值）
            if (allMatches.length > 0) {
                console.log(`[人物图谱] 所有人物的匹配分数:`);
                allMatches.forEach((r, i) => {
                    const isMatched = r.isExactNameMatch || r.matchScore >= this.config.matchThreshold;
                    const status = isMatched ? '✅' : '❌';
                    const sourceLabel = r.matchSource ? {
                        'user': '👤',
                        'ai_reply': '🤖',
                        'both': '👤+🤖',
                        'text': '📝'
                    }[r.matchSource] || '' : '';
                    const matchInfo = r.isExactNameMatch ? `, 精确匹配${sourceLabel}` : '';
                    console.log(`  ${i + 1}. ${r.name} ${status} (向量相似度: ${(r.matchScore * 100).toFixed(1)}%${matchInfo})`);
                });
            } else {
                console.log(`[人物图谱] ❌ 没有任何人物的匹配分数（可能是向量计算问题）`);
            }
        }

        return results;
    }

    /**
     * 搜索匹配的人物（兼容旧方法）
     * @param {string} queryName - 查询姓名
     * @param {string} queryPersonality - 查询性格
     * @param {string} queryAppearance - 查询外貌
     * @returns {Array} 匹配的人物列表，按相似度排序
     */
    async searchCharacters(queryName, queryPersonality = '', queryAppearance = '') {
        // 如果只有queryName，使用新的searchByText方法
        if (queryName && !queryPersonality && !queryAppearance) {
            return await this.searchByText(queryName);
        }

        // 否则使用原有的三参数匹配
        if (!this.isInitialized) {
            await this.init();
        }

        // 生成查询向量
        const queryVector = await this.generateVector(queryName, queryPersonality, queryAppearance);

        // 计算所有人物的相似度
        const matches = [];
        
        for (const [name, vector] of this.vectors.entries()) {
            const similarity = this.cosineSimilarity(queryVector, vector);
            
            // 过滤低于阈值的结果
            if (similarity >= this.config.matchThreshold) {
                const character = this.characters.get(name);
                matches.push({
                    ...character,  // 包含完整的relationship数据（含history），不包含vector
                    matchScore: similarity
                });
            }
        }

        // 按相似度排序（降序）
        matches.sort((a, b) => b.matchScore - a.matchScore);

        // 限制返回数量
        const results = matches.slice(0, this.config.maxResults);

        // 更新统计
        if (results.length > 0) {
            this.stats.matchCount++;
            const avgScore = results.reduce((sum, r) => sum + r.matchScore, 0) / results.length;
            this.stats.avgMatchScore = (this.stats.avgMatchScore * (this.stats.matchCount - 1) + avgScore) / this.stats.matchCount;
        }

        if (this.config.enableDebug) {
            console.log(`[人物图谱] 🔍 查询: ${queryName} | 找到 ${results.length} 个匹配`);
            results.forEach((r, i) => {
                console.log(`  ${i + 1}. ${r.name} (相似度: ${(r.matchScore * 100).toFixed(1)}%)`);
            });
        }

        return results;
    }

    /**
     * 获取人物完整信息
     */
    getCharacter(name) {
        return this.characters.get(name);
    }

    /**
     * 删除人物
     */
    async deleteCharacter(name) {
        if (!this.isInitialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(name);

            request.onsuccess = () => {
                this.characters.delete(name);
                this.vectors.delete(name);
                this.stats.totalCharacters--;
                console.log(`[人物图谱] 🗑️ 删除人物: ${name}`);
                resolve();
            };

            request.onerror = () => {
                console.error(`[人物图谱] ❌ 删除失败: ${name}`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 🆕 根据轮次范围删除人物（用于消息回滚）
     * @param {number} turnStart - 起始轮次（包含）
     * @param {number} turnEnd - 结束轮次（包含）
     * @returns {Array} 被删除的人物名称列表
     */
    async deleteCharactersByTurnRange(turnStart, turnEnd) {
        if (!this.isInitialized) {
            await this.init();
        }

        const deletedNames = [];
        
        // 找出在指定轮次范围内首次添加的人物
        for (const [name, char] of this.characters.entries()) {
            const addedAtTurn = char.addedAtTurn;
            
            // 只删除在指定轮次范围内首次添加的人物
            if (addedAtTurn !== undefined && addedAtTurn >= turnStart && addedAtTurn <= turnEnd) {
                try {
                    await this.deleteCharacter(name);
                    deletedNames.push(name);
                } catch (error) {
                    console.error(`[人物图谱] 回滚删除失败: ${name}`, error);
                }
            }
        }

        if (deletedNames.length > 0) {
            console.log(`[人物图谱] 🔄 回滚删除了 ${deletedNames.length} 个人物（轮次${turnStart}-${turnEnd}）:`, deletedNames);
        }

        return deletedNames;
    }

    /**
     * 清空所有人物
     */
    async clearAll() {
        if (!this.isInitialized) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.indexedDB.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                this.characters.clear();
                this.vectors.clear();
                this.stats.totalCharacters = 0;
                console.log('[人物图谱] 🗑️ 已清空所有人物');
                resolve();
            };

            request.onerror = () => {
                console.error('[人物图谱] ❌ 清空失败:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 批量添加人物（从现有的relationships迁移）
     */
    async batchAddCharacters(relationships) {
        if (!this.isInitialized) {
            await this.init();
        }

        console.log(`[人物图谱] 📥 批量添加 ${relationships.length} 个人物...`);
        
        const results = [];
        for (const rel of relationships) {
            try {
                const result = await this.addOrUpdateCharacter(rel);
                results.push(result);
            } catch (error) {
                console.error(`[人物图谱] 添加失败: ${rel.name}`, error);
            }
        }

        console.log(`[人物图谱] ✅ 批量添加完成: ${results.length}/${relationships.length}`);
        return results;
    }

    /**
     * 🔧 调试：查看所有人物的向量
     */
    debugShowAllVectors() {
        console.log('╔════════════════════════════════════════════════╗');
        console.log('║  🎭 人物图谱向量调试                          ║');
        console.log('╠════════════════════════════════════════════════╣');
        
        this.characters.forEach((character, name) => {
            const vector = this.vectors.get(name);
            console.log(`║  👤 ${name}:`);
            console.log(`║     人物数据: ${JSON.stringify(character, null, 6).substring(0, 100)}...`);
            
            if (vector) {
                if (Array.isArray(vector)) {
                    // 密集向量（数组）
                    console.log(`║     向量类型: Dense (${vector.length}维)`);
                    console.log(`║     向量前8维: [${vector.slice(0, 8).map(v => v.toFixed(3)).join(', ')}]`);
                } else {
                    // 稀疏向量（对象）
                    const keywordList = Object.entries(vector)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([word, weight]) => `${word}(${weight.toFixed(1)})`)
                        .join(', ');
                    console.log(`║     向量类型: Sparse (关键词)`);
                    console.log(`║     关键词(前8): ${keywordList}`);
                    console.log(`║     总关键词数: ${Object.keys(vector).length}`);
                }
            } else {
                console.log(`║     ❌ 向量为空！`);
            }
            console.log('║');
        });
        
        console.log(`╚════════════════════════════════════════════════╝`);
        console.log(`总计: ${this.characters.size} 个人物`);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            config: this.config
        };
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('[人物图谱] 配置已更新:', this.config);
    }

    /**
     * 导出所有人物数据
     */
    exportData() {
        const characters = Array.from(this.characters.values());
        return {
            characters,
            stats: this.stats,
            config: this.config,
            exportedAt: Date.now()
        };
    }

    /**
     * 导入人物数据
     */
    async importData(data) {
        if (!this.isInitialized) {
            await this.init();
        }

        console.log(`[人物图谱] 📥 导入 ${data.characters.length} 个人物...`);
        
        for (const char of data.characters) {
            await this.addOrUpdateCharacter(char);
        }

        if (data.config) {
            this.updateConfig(data.config);
        }

        console.log('[人物图谱] ✅ 导入完成');
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.characterGraphManager = new CharacterGraphManager();
    console.log('[人物图谱] 全局实例已创建: window.characterGraphManager');
}
