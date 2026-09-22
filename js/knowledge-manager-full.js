        // ==================== 静态知识库相关函数 ====================

        // 确保系统提示词条目存在
        // ==================== 知识库管理系统 ====================
        // ✅ 已完整迁移到 knowledge-manager-full.js (10765-12591, 约1826行)
        // 包括：
        // - ensureSystemPromptInKB - 系统提示词管理
        // - debugSystemPrompt - 调试系统提示词
        // - viewKnowledgeBase - 查看静态知识库
        // - filterKBList - 过滤知识库
        // - showKBDetail - 显示详情
        // - editKBItem - 编辑条目
        // - deleteKBItem - 删除条目
        // - addNewKBItem - 添加新条目
        // - changeKBPriority - 修改优先级
        // - testKBRetrieval - 测试检索
        // - 以及所有其他知识库相关UI函数

        async function ensureSystemPromptInKB() {
            if (!window.contextVectorManager) {
                console.error('[系统提示词] 向量管理器未初始化');
                return;
            }
            
            // 检查是否已存在系统提示词条目
            const hasGameSystemPrompt = window.contextVectorManager.staticKnowledgeBase.some(
                item => item.id === 'system_prompt_main'
            );
            const hasXiuxianRules = window.contextVectorManager.staticKnowledgeBase.some(
                item => item.id === 'xiuxian_rules_main'
            );
            
            if (hasGameSystemPrompt && hasXiuxianRules) {
                console.log('[系统提示词] ✅ 知识库中已存在所有系统提示词条目');
                // 确保修仙规则在最顶部
                const xiuxianIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
                    item => item.id === 'xiuxian_rules_main'
                );
                const gameIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
                    item => item.id === 'system_prompt_main'
                );
                
                if (xiuxianIndex > 0) {
                    // 将修仙规则移到最顶部
                    const xiuxianItem = window.contextVectorManager.staticKnowledgeBase.splice(xiuxianIndex, 1)[0];
                    window.contextVectorManager.staticKnowledgeBase.unshift(xiuxianItem);
                    console.log('[系统提示词] 🔄 已将修仙规则移到最顶部');
                }
                return true;
            }
            
            console.log('[系统提示词] 📝 创建系统提示词条目...');
            
            // 1. 首先创建修仙游戏规则（放在最顶部）
            if (!hasXiuxianRules) {
                const xiuxianPrompt = typeof defaultSystemPrompt !== 'undefined' ? defaultSystemPrompt : 
                    (typeof getSystemPrompt === 'function' ? getSystemPrompt() : 
                    (document.getElementById('systemPrompt')?.value || '你是一个修仙世界的游戏主持人。'));
                
                console.log('[系统提示词] 📋 修仙规则提示词长度:', xiuxianPrompt.length);
                
                // 🔧 修复：动态检测游戏类型，使用正确的配置来源
                const isBhzGame = typeof window.BHZ_CONFIG !== 'undefined' || 
                                 window.location.pathname.includes('game-bhz.html') || 
                                 document.title.includes('白虎宗');
                const promptSource = isBhzGame ? 'bhz-config.js defaultSystemPrompt' : 'xiuxian-config.js defaultSystemPrompt';
                const gameTitle = isBhzGame ? '🐅 白虎宗游戏规则（参考）' : '🧾 游戏规则（参考）';
                const gameDescription = isBhzGame ? '白虎宗游戏的详细规则，独立显示在最顶部' : '修仙游戏的详细规则，独立显示在最顶部';
                const gameTags = isBhzGame ? 
                    ['系统', '提示词', '白虎宗', 'JSON规则', '变量更新', '参考'] : 
                    ['系统', '提示词', '修仙', 'JSON规则', '变量更新', '参考'];
                
                const xiuxianRulesItem = {
                    id: 'xiuxian_rules_main',
                    title: gameTitle,
                    content: xiuxianPrompt,
                    category: '系统',
                    tags: gameTags,
                    alwaysInclude: true, // 🔧 改为 true，作为常驻知识
                    priority: 'top', // 🔧 设置为顶部优先级
                    vector: null,
                    vectorType: 'system',
                    metadata: {
                        description: gameDescription,
                        source: promptSource,
                        isEditable: true,
                        isCore: true, // 🔧 改回核心，因为要在顶部显示
                        note: '此规则以顶部优先级独立显示，确保AI始终参考'
                    }
                };
                
                // 插入到最顶部
                window.contextVectorManager.staticKnowledgeBase.unshift(xiuxianRulesItem);
                const gameTypeName = isBhzGame ? '白虎宗' : '修仙';
                console.log(`[系统提示词] ✅ 已创建${gameTypeName}游戏规则条目（最顶部）`);
            }
            
            // 2. 然后创建游戏基础系统提示词（放在修仙规则之后）
            if (!hasGameSystemPrompt) {
                const gamePrompt = typeof getSystemPrompt === 'function' ? getSystemPrompt() : 
                    (document.getElementById('systemPrompt')?.value || '你是一个修仙世界的游戏主持人。');
                
                console.log('[系统提示词] 📋 游戏基础提示词长度:', gamePrompt.length);
                
                const gameSystemPromptItem = {
                    id: 'system_prompt_main',
                    title: '🎮 游戏系统提示词（基础）',
                    content: gamePrompt,
                    category: '系统',
                    tags: ['系统', '提示词', '基础', '游戏规则'],
                    alwaysInclude: true,
                    priority: 'high', // 高优先级
                    vector: null,
                    vectorType: 'system',
                    metadata: {
                        description: '游戏基础系统提示词，包含基本的游戏主持规则和选项生成',
                        source: 'getSystemPrompt() / textarea',
                        isEditable: true,
                        isCore: true
                    }
                };
                
                // 插入到修仙规则之后（第二个位置）
                const insertIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
                    item => item.id === 'xiuxian_rules_main'
                ) + 1;
                
                if (insertIndex > 0) {
                    window.contextVectorManager.staticKnowledgeBase.splice(insertIndex, 0, gameSystemPromptItem);
                } else {
                    window.contextVectorManager.staticKnowledgeBase.push(gameSystemPromptItem);
                }
                
                console.log('[系统提示词] ✅ 已创建游戏基础系统提示词条目（第二位置）');
            }
            
            // 保存到IndexedDB
            try {
                await window.contextVectorManager.saveStaticKBToIndexedDB();
                console.log('[系统提示词] ✅ 所有系统提示词已保存到知识库和IndexedDB');
                console.log('[系统提示词] 📋 修仙规则在最顶部，游戏基础规则在第二位置');
                return true;
            } catch (error) {
                console.error('[系统提示词] ❌ 保存到IndexedDB失败:', error);
                // 即使保存失败，也添加到内存中
                return true;
            }
        }

        // 🔧 调试函数：验证系统提示词是否正确加载
        async function debugSystemPrompt() {
            console.log('=== 系统提示词调试信息 ===');
            
            // 1. 检查 defaultSystemPrompt 是否存在
            if (typeof defaultSystemPrompt !== 'undefined') {
                console.log('✅ defaultSystemPrompt 存在');
                console.log('📏 长度:', defaultSystemPrompt.length);
                console.log('📋 前100字符:', defaultSystemPrompt.substring(0, 100));
            } else {
                console.log('❌ defaultSystemPrompt 不存在');
            }
            
            // 2. 检查 getSystemPrompt 函数
            if (typeof getSystemPrompt === 'function') {
                const promptFromFunc = getSystemPrompt();
                console.log('✅ getSystemPrompt 函数存在');
                console.log('📏 返回长度:', promptFromFunc.length);
                console.log('📋 前100字符:', promptFromFunc.substring(0, 100));
            } else {
                console.log('❌ getSystemPrompt 函数不存在');
            }
            
            // 3. 检查 textarea
            const textareaEl = document.getElementById('systemPrompt');
            if (textareaEl) {
                console.log('✅ textarea 元素存在');
                console.log('📏 内容长度:', textareaEl.value.length);
                console.log('📋 前100字符:', textareaEl.value.substring(0, 100));
            } else {
                console.log('❌ textarea 元素不存在');
            }
            
            // 4. 检查知识库中的系统提示词
            if (window.contextVectorManager) {
                const xiuxianKbItem = window.contextVectorManager.staticKnowledgeBase.find(item => item.id === 'xiuxian_rules_main');
                const gameKbItem = window.contextVectorManager.staticKnowledgeBase.find(item => item.id === 'system_prompt_main');
                
                // 检查修仙规则的位置（应该在索引0）
                const xiuxianIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
                    item => item.id === 'xiuxian_rules_main'
                );
                const gameIndex = window.contextVectorManager.staticKnowledgeBase.findIndex(
                    item => item.id === 'system_prompt_main'
                );
                
                if (xiuxianKbItem) {
                    console.log('✅ 知识库中存在修仙游戏规则（备份参考）');
                    console.log('📋 标题:', xiuxianKbItem.title);
                    console.log('📏 内容长度:', xiuxianKbItem.content.length);
                    console.log('📋 前100字符:', xiuxianKbItem.content.substring(0, 100));
                    console.log('🏷️ 优先级:', xiuxianKbItem.priority, '(medium - 备份参考)');
                    console.log('📌 常驻标记:', xiuxianKbItem.alwaysInclude, '(false - 避免重复)');
                    console.log('📍 索引位置:', xiuxianIndex);
                    console.log('💡 说明: 此规则已在系统提示词最顶部，此处仅作为备份');
                } else {
                    console.log('❌ 知识库中不存在修仙游戏规则备份');
                }
                
                if (gameKbItem) {
                    console.log('✅ 知识库中存在游戏基础系统提示词（第二位置）');
                    console.log('📋 标题:', gameKbItem.title);
                    console.log('📏 内容长度:', gameKbItem.content.length);
                    console.log('📋 前100字符:', gameKbItem.content.substring(0, 100));
                    console.log('🏷️ 优先级:', gameKbItem.priority);
                    console.log('📌 常驻标记:', gameKbItem.alwaysInclude);
                    console.log('📍 索引位置:', gameIndex, '(应该是1)');
                } else {
                    console.log('❌ 知识库中不存在游戏基础系统提示词');
                }
                
                // 统计总的高优先级系统提示词
                const highPrioritySystemPrompts = window.contextVectorManager.staticKnowledgeBase.filter(
                    item => item.category === '系统' && item.priority === 'high'
                );
                console.log('📊 高优先级系统提示词总数:', highPrioritySystemPrompts.length);
                console.log('📊 知识库最前3条:', window.contextVectorManager.staticKnowledgeBase.slice(0, 3).map(item => item.title));
            } else {
                console.log('❌ 向量管理器未初始化');
            }
            
            console.log('=== 调试信息结束 ===');
        }

        // 查看静态知识库
        function viewKnowledgeBase() {
            if (!window.contextVectorManager) {
                alert('向量管理器未初始化！');
                return;
            }

            const kb = window.contextVectorManager.staticKnowledgeBase;

            if (kb.length === 0) {
                alert('静态知识库为空！\n\n你可以：\n1. 点击"导入知识库文件"加载预制的知识库\n2. 点击"创建模板"生成知识库模板');
                return;
            }

            // 构建HTML内容
            let htmlContent = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">📚 静态知识库查看器</h2>
                    <button onclick="document.getElementById('knowledgeBaseModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">关闭</button>
                </div>
                
                <div style="background: #f0f2ff; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${kb.length}</div>
                            <div style="font-size: 12px; color: #666;">总条数</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #764ba2;">${window.contextVectorManager.embeddingMethod}</div>
                            <div style="font-size: 12px; color: #666;">向量化方法</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ff6b6b;">${kb.filter(item => item.category === 'dlc').length}</div>
                            <div style="font-size: 12px; color: #666;">📦 DLC条目</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px;">
                        <div style="text-align: center;">
                            <div style="font-size: 20px; font-weight: bold; color: #ff6b6b;">${kb.filter(item => item.alwaysInclude === true).length}</div>
                            <div style="font-size: 11px; color: #666;">常驻知识</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #764ba2;">${kb.filter(item => item.priority === 'top').length}</div>
                            <div style="font-size: 10px; color: #666;">👑顶部</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #ff4444;">${kb.filter(item => item.priority === 'high').length}</div>
                            <div style="font-size: 10px; color: #666;">⭐重点</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #ffa500;">${kb.filter(item => item.priority === 'medium').length}</div>
                            <div style="font-size: 10px; color: #666;">📌次重点</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 18px; font-weight: bold; color: #999;">${kb.filter(item => item.priority === 'low' || (item.alwaysInclude && !item.priority)).length}</div>
                            <div style="font-size: 10px; color: #666;">📋非重点</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; font-weight: bold; color: #28a745;">${kb.filter(item => item.vector && Array.isArray(item.vector)).length}</div>
                            <div style="font-size: 11px; color: #666;">稠密向量</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; font-weight: bold; color: #17a2b8;">${kb.filter(item => item.vector && !Array.isArray(item.vector)).length}</div>
                            <div style="font-size: 11px; color: #666;">稀疏向量</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 20px; font-weight: bold; color: #ffc107;">${kb.filter(item => !item.vector && !item.alwaysInclude).length}</div>
                            <div style="font-size: 11px; color: #666;">延迟生成</div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px; text-align: center;">
                        <div style="font-size: 12px; color: #666;">
                            💾 存储位置：IndexedDB (xiuxian_vector_db → staticKB)
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <button onclick="addNewKBItem()" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                        transition: all 0.3s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.6)'"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.4)'">
                        ➕ 添加新条目
                    </button>
                    
                    <input type="text" id="kbSearchInput" placeholder="🔍 输入关键词搜索知识..." 
                        style="width: 100%; padding: 12px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;"
                        onkeyup="filterKBList(this.value)">
                </div>

                <div id="kbListContainer" style="max-height: 500px; overflow-y: auto;">
            `;

            kb.forEach((item, index) => {
                const tagsHtml = item.tags.length > 0 
                    ? item.tags.map(tag => `<span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-right: 3px;">${tag}</span>`).join('')
                    : '<span style="color: #999; font-size: 11px;">无标签</span>';
                
                // 判断知识类型和向量状态
                let typeBadge = '';
                let priorityBadge = ''; // 🆕 重点标记
                let vectorBadge = '';
                let vectorInfo = '';
                let itemStyle = '';
                
                // 系统提示词特殊标记
                if (item.id === 'system_prompt_main') {
                    typeBadge = '<span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">🎮 系统</span>';
                    itemStyle = 'border: 3px solid #667eea !important;';
                } else if (item.category === 'dlc') {
                    // DLC知识特殊标记
                    typeBadge = '<span style="background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📦 DLC</span>';
                    itemStyle = 'border: 2px solid #ff6b6b !important; background: linear-gradient(135deg, #fff5f5 0%, #fffbf0 100%) !important;';
                } else if (item.alwaysInclude === true) {
                    // 常驻知识 - 根据优先级显示不同徽章
                    if (item.priority === 'top') {
                        priorityBadge = '<span style="background: linear-gradient(45deg, #ff6b6b, #764ba2); color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">👑 顶部</span>';
                        itemStyle = 'border: 3px solid #764ba2 !important; box-shadow: 0 0 10px rgba(118, 75, 162, 0.3) !important;';
                    } else if (item.priority === 'high') {
                        priorityBadge = '<span style="background: #ff4444; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">⭐ 重点</span>';
                        itemStyle = 'border: 2px solid #ff4444 !important;';
                    } else if (item.priority === 'medium') {
                        priorityBadge = '<span style="background: #ffa500; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📌 次重点</span>';
                        itemStyle = 'border: 2px solid #ffa500 !important;';
                    } else {
                        // low 或无priority（默认）
                        priorityBadge = '<span style="background: #999; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📋 非重点</span>';
                    }
                    typeBadge = '<span style="background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">常驻</span>';
                }
                
                if (item.vector) {
                    if (Array.isArray(item.vector)) {
                        vectorBadge = '<span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">🔢 稠密向量</span>';
                        vectorInfo = `维度: ${item.vector.length}`;
                    } else {
                        const keyCount = Object.keys(item.vector).length;
                        vectorBadge = '<span style="background: #17a2b8; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">📊 稀疏向量</span>';
                        vectorInfo = `关键词: ${keyCount}个`;
                    }
                } else if (item.alwaysInclude === true) {
                    vectorBadge = '<span style="background: #999; color: white; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">🚫 无需向量</span>';
                    vectorInfo = '常驻生效';
                } else {
                    vectorBadge = '<span style="background: #ffc107; color: #333; padding: 2px 8px; border-radius: 5px; font-size: 10px; margin-right: 5px;">⏳ 延迟生成</span>';
                    vectorInfo = '检索时实时生成';
                }
                
                htmlContent += `
                    <div class="kb-item" data-index="${index}" style="
                        background: white;
                        padding: 15px;
                        border-radius: 10px;
                        margin-bottom: 10px;
                        border: 2px solid ${item.id === 'system_prompt_main' ? '#667eea' : '#e0e0e0'};
                        cursor: pointer;
                        transition: all 0.3s;
                        ${itemStyle}
                    " onmouseover="this.style.borderColor='#667eea'; this.style.background='#f8f9ff';"
                       onmouseout="this.style.borderColor='${item.id === 'system_prompt_main' ? '#667eea' : '#e0e0e0'}'; this.style.background='white';"
                       onclick="showKBDetail(${index})">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 5px;">
                                ${priorityBadge}${typeBadge}
                                <span style="background: #764ba2; color: white; padding: 3px 10px; border-radius: 5px; font-size: 11px; margin-right: 5px;">${item.category}</span>
                                <span style="font-weight: bold; color: #667eea; font-size: 15px;">${item.title}</span>
                            </div>
                            ${item.id === 'system_prompt_main' ? '' : `<button onclick="event.stopPropagation(); deleteKBItem(${index})" style="
                                padding: 4px 10px;
                                background: #dc3545;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 11px;
                            ">删除</button>`}
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 13px; color: #333; line-height: 1.6;">
                                ${(() => {
                                    let contentText = item.content;
                                    if (typeof item.content === 'object' && item.content !== null) {
                                        contentText = JSON.stringify(item.content, null, 2);
                                    }
                                    return contentText.length > 150 ? contentText.substring(0, 150) + '...' : contentText;
                                })()}
                            </div>
                        </div>
                        
                        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <div>${tagsHtml}</div>
                            <div style="text-align: right;">
                                ${vectorBadge}
                                <span style="font-size: 10px; color: #999;">${vectorInfo}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            htmlContent += `
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    <button onclick="testKBRetrieval()" style="
                        flex: 1;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 测试检索</button>
                </div>
            `;

            // 创建模态框
            const modal = document.createElement('div');
            modal.id = 'knowledgeBaseModal';
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
                max-width: 1000px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            `;
            content.innerHTML = htmlContent;

            modal.appendChild(content);
            document.body.appendChild(modal);

            // 点击背景关闭
            modal.onclick = function (e) {
                if (e.target === modal) {
                    modal.remove();
                }
            };
        }

        // 过滤知识库列表
        function filterKBList(keyword) {
            const items = document.querySelectorAll('.kb-item');
            const lowerKeyword = keyword.toLowerCase();
            
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(lowerKeyword)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // 显示知识库项详情
        function showKBDetail(index) {
            const item = window.contextVectorManager.staticKnowledgeBase[index];
            if (!item) return;

            // 判断知识类型
            let alwaysIncludeBadge = '';
            if (item.id === 'system_prompt_main') {
                // 系统提示词特殊说明
                alwaysIncludeBadge = `
                    <div style="background: #e7f0ff; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                        <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">🎮 系统提示词（核心）</div>
                        <div style="font-size: 13px; line-height: 1.8; color: #666;">
                            ✅ 这是AI的核心行为规则，会在每次请求中首先发送<br>
                            🔧 控制AI的回复格式、剧情风格、游戏规则等<br>
                            💡 你可以直接在这里编辑，无需去设置中修改<br>
                            ⚠️ 修改后会立即生效（下次对话时使用）<br>
                            🚫 此条目不能删除，但可以编辑内容
                        </div>
                    </div>
                `;
            } else if (item.alwaysInclude === true) {
                // 根据优先级显示不同的说明
                let priorityInfo = {
                    top: {
                        icon: '👑',
                        title: '常驻知识【顶部】',
                        color: '#764ba2',
                        bg: '#f3e8ff',
                        desc: '👑 独占最顶部位置，位于P0.5（超越所有其他内容）<br>🚀 获得绝对最高优先级，独立显示<br>💡 适用于：核心规则、修仙游戏规则<br>⚠️ 消耗中等token，但效果最佳'
                    },
                    high: {
                        icon: '⭐',
                        title: '常驻知识【重点】',
                        color: '#ff4444',
                        bg: '#ffe6e6',
                        desc: '✅ 每次都会自动注入，位于P2.5（仅次于最近AI回复）<br>🔥 获得最高关注度<br>💡 适用于：当前关键设定、重要规则<br>⚠️ 消耗较多token'
                    },
                    medium: {
                        icon: '📌',
                        title: '常驻知识【次重点】',
                        color: '#ffa500',
                        bg: '#fff4e6',
                        desc: '✅ 每次都会自动注入，位于P3.5（仅次于向量检索历史）<br>📊 获得中等关注度<br>💡 适用于：重要世界观、核心背景<br>⚠️ 消耗中token'
                    },
                    low: {
                        icon: '📋',
                        title: '常驻知识【非重点】',
                        color: '#999',
                        bg: '#f5f5f5',
                        desc: '✅ 每次都会自动注入，位于P5（靠后位置）<br>📄 获得较低关注度<br>💡 适用于：一般设定、参考信息<br>👍 消耗token较少'
                    }
                };
                
                const p = item.priority || 'low';
                const info = priorityInfo[p];
                
                alwaysIncludeBadge = `
                    <div style="background: ${info.bg}; padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid ${info.color};">
                        <div style="font-weight: bold; color: ${info.color}; margin-bottom: 8px;">${info.icon} ${info.title}</div>
                        <div style="font-size: 13px; line-height: 1.8; color: #666;">
                            ${info.desc}
                        </div>
                    </div>
                `;
            }
            
            // 判断向量状态
            let vectorStatusHtml = '';
            if (item.vector) {
                if (Array.isArray(item.vector)) {
                    // 稠密向量
                    const preview = item.vector.slice(0, 5).map(v => v.toFixed(4)).join(', ');
                    vectorStatusHtml = `
                        <div style="background: #e7f5e9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                            <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">🔢 稠密向量信息</div>
                            <div style="font-size: 13px; line-height: 1.8;">
                                📏 向量维度：${item.vector.length}<br>
                                🎯 向量类型：Dense (数组)<br>
                                💾 已保存到：IndexedDB<br>
                                📊 向量预览：[${preview}, ...]<br>
                                ${item.alwaysInclude ? '⚠️ 常驻知识无需向量，此向量不会被使用' : '✅ 检索时使用此向量（精确匹配）'}
                            </div>
                        </div>
                    `;
                } else {
                    // 稀疏向量
                    const keywords = Object.keys(item.vector);
                    const topKeywords = Object.entries(item.vector)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([k, v]) => `${k}(${v.toFixed(2)})`)
                        .join(', ');
                    vectorStatusHtml = `
                        <div style="background: #e7f5ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                            <div style="font-weight: bold; color: #17a2b8; margin-bottom: 8px;">📊 稀疏向量信息</div>
                            <div style="font-size: 13px; line-height: 1.8;">
                                📏 关键词数量：${keywords.length}个<br>
                                🎯 向量类型：Sparse (对象)<br>
                                💾 已保存到：IndexedDB<br>
                                🔑 Top关键词：${topKeywords}<br>
                                ${item.alwaysInclude ? '⚠️ 常驻知识无需向量，此向量不会被使用' : '✅ 检索时使用此向量（关键词匹配）'}
                            </div>
                        </div>
                    `;
                }
            } else if (!item.alwaysInclude) {
                // 非常驻知识且无向量（延迟生成）
                vectorStatusHtml = `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <div style="font-weight: bold; color: #856404; margin-bottom: 8px;">⏳ 延迟向量化</div>
                        <div style="font-size: 13px; line-height: 1.8;">
                            📏 向量状态：未预先生成<br>
                            🎯 生成策略：检索时实时生成关键词向量<br>
                            💡 说明：大型知识库（100+条）采用延迟生成策略，节省存储空间<br>
                            ⚡ 性能：首次检索时生成，后续缓存在内存中
                        </div>
                    </div>
                `;
            }

            const detailHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">📋 知识详情</h2>
                    <button onclick="document.getElementById('kbDetailModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">关闭</button>
                </div>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #666; margin-bottom: 8px;">📊 基本信息</div>
                    <div style="font-size: 13px; line-height: 1.8;">
                        🏷️ ID：${item.id}<br>
                        📂 分类：${item.category}<br>
                        🏷️ 标签：${item.tags.length > 0 ? item.tags.join(', ') : '无'}
                    </div>
                </div>

                ${alwaysIncludeBadge}
                ${vectorStatusHtml}

                <div style="background: #e7f5ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 8px; font-size: 18px;">${item.title}</div>
                </div>

                <div style="background: #f0f2ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">📄 内容</div>
                    <div id="kbContent-${index}" style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">
                        ${(() => {
                            let contentText = item.content;
                            if (typeof item.content === 'object' && item.content !== null) {
                                contentText = JSON.stringify(item.content, null, 2);
                            }
                            return contentText;
                        })()}
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    ${!item.alwaysInclude && item.id !== 'system_prompt_main' ? `<button onclick="testKBItemRetrieval(${index})" style="
                        flex: 1;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 测试相似度</button>` : ''}
                    
                    <button onclick="editKBItem(${index})" style="
                        flex: 1;
                        padding: 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">✏️ 编辑${item.id === 'system_prompt_main' ? '系统提示词' : '内容'}</button>
                    
                    ${item.id === 'system_prompt_main' ? '' : `<button onclick="changeKBPriority(${index})" style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🎯 修改优先级</button>`}
                </div>
            `;

            const modal = document.createElement('div');
            modal.id = 'kbDetailModal';
            modal.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
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
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            `;
            content.innerHTML = detailHtml;

            modal.appendChild(content);
            document.body.appendChild(modal);

            modal.onclick = function (e) {
                if (e.target === modal) {
                    modal.remove();
                }
            };
        }

        // 删除知识库项
        async function deleteKBItem(index) {
            const item = window.contextVectorManager.staticKnowledgeBase[index];
            
            // 防止删除系统提示词
            if (item.id === 'system_prompt_main') {
                alert('❌ 不能删除系统提示词！\n\n系统提示词是AI的核心规则，不能删除。\n你可以编辑它的内容。');
                return;
            }
            
            if (!confirm(`确定要删除"${item.title}"吗？\n\n将同时从内存和IndexedDB中删除。`)) return;

            window.contextVectorManager.staticKnowledgeBase.splice(index, 1);
            await window.contextVectorManager.saveStaticKBToIndexedDB();
            
            alert('✅ 已删除并更新IndexedDB');
            
            // 刷新显示
            document.getElementById('knowledgeBaseModal')?.remove();
            viewKnowledgeBase();
        }

        // 清空知识库
        async function clearKnowledgeBase() {
            if (!confirm('⚠️ 确定要清空整个静态知识库吗？\n\n这将删除所有知识。\n系统提示词会在下次启动时自动重建。\n\n此操作不可恢复！')) {
                return;
            }

            window.contextVectorManager.clearStaticKB();
            await window.contextVectorManager.saveStaticKBToIndexedDB();
            
            // 重新创建系统提示词
            await ensureSystemPromptInKB();
            
            alert('✅ 静态知识库已清空！\n\n已同时清除内存和IndexedDB中的数据。\n系统提示词已自动重建（游戏基础+修仙规则）。');
        }

        // 测试知识库检索
        async function testKBRetrieval() {
            const keyword = prompt('请输入测试查询（如：青云宗、法宝、筑基等）：');
            if (!keyword) return;

            const results = await window.contextVectorManager.retrieveFromStaticKB(keyword, 5);

            if (results.length === 0) {
                alert('❌ 未找到相关知识\n\n建议：\n- 调整相似度阈值\n- 检查关键词是否准确\n- 确认知识库中有相关内容');
                return;
            }

            let resultText = `🔍 检索结果（找到 ${results.length} 条）\n\n`;
            
            results.forEach((item, index) => {
                resultText += `━━━━━━━━━━━━━━━━━━━━\n`;
                resultText += `${index + 1}. [${item.category}] ${item.title}\n`;
                resultText += `   相似度：${(item.similarity * 100).toFixed(2)}%\n`;
                resultText += `   内容：${item.content.substring(0, 100)}...\n\n`;
            });

            alert(resultText);
            console.log('[知识库检索测试] 查询:', keyword);
            console.log('[知识库检索测试] 结果:', results);
        }

        // 测试单条知识库项的向量相似度
        async function testKBItemRetrieval(itemIndex) {
            const item = window.contextVectorManager.staticKnowledgeBase[itemIndex];
            if (!item) return;

            const keyword = prompt(`请输入测试关键词（将与"${item.title}"计算相似度）：`, item.tags[0] || '');
            if (!keyword) return;

            // 生成查询向量
            const queryVector = window.contextVectorManager.createKeywordVector(keyword);
            
            // 生成或获取知识库项的向量
            let itemVector;
            if (item.vector) {
                itemVector = item.vector;
            } else {
                // 实时生成
                itemVector = window.contextVectorManager.createKeywordVector(item.content);
            }
            
            // 计算相似度
            const similarity = window.contextVectorManager.calculateCosineSimilarity(queryVector, itemVector);
            
            // 找出共同关键词（如果都是稀疏向量）
            let commonKeywords = '';
            if (!Array.isArray(queryVector) && !Array.isArray(itemVector)) {
                const queryKeys = Object.keys(queryVector);
                const itemKeys = Object.keys(itemVector);
                const common = queryKeys.filter(k => itemKeys.includes(k));
                commonKeywords = common.length > 0 ? `\n\n🔑 共同关键词（${common.length}个）：\n${common.slice(0, 15).join('、')}` : '\n\n⚠️ 无共同关键词';
            }
            
            const threshold = window.contextVectorManager.minSimilarityThreshold * 0.5;
            const wouldMatch = similarity >= threshold;
            
            alert(`🧪 向量相似度测试结果\n\n` +
                  `📋 知识：${item.title}\n` +
                  `🔍 关键词："${keyword}"\n\n` +
                  `📊 相似度：${(similarity * 100).toFixed(2)}%\n` +
                  `🎯 阈值：${(threshold * 100).toFixed(2)}%\n\n` +
                  `${wouldMatch ? '✅ 高于阈值，检索时会被匹配到' : '❌ 低于阈值，检索时不会被匹配到'}` +
                  commonKeywords +
                  `\n\n💡 向量类型：${Array.isArray(itemVector) ? 'Dense(稠密)' : 'Sparse(稀疏)'}`);
            
            console.log(`[知识库向量测试] 知识: ${item.title}`);
            console.log(`[知识库向量测试] 关键词: ${keyword}`);
            console.log(`[知识库向量测试] 相似度: ${similarity}`);
            console.log(`[知识库向量测试] 是否匹配: ${wouldMatch}`);
        }

        // 添加新的知识库条目
        async function addNewKBItem() {
            // 创建表单模态框
            const formHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">➕ 添加新知识条目</h2>
                    <button onclick="document.getElementById('addKBModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">关闭</button>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">📝 标题（必填）</label>
                        <input type="text" id="newKBTitle" placeholder="如：李青云、青云宗、筑基期..." 
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">📂 分类（必填）</label>
                        <select id="newKBCategory" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                            <option value="人物">人物</option>
                            <option value="宗门">宗门</option>
                            <option value="境界">境界</option>
                            <option value="丹药">丹药</option>
                            <option value="功法">功法</option>
                            <option value="法宝">法宝</option>
                            <option value="地点">地点</option>
                            <option value="设定">世界观设定</option>
                            <option value="规则">游戏规则</option>
                            <option value="通用">通用</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">📄 内容（必填，建议100-500字）</label>
                        <textarea id="newKBContent" placeholder="输入详细内容..." 
                            style="width: 100%; min-height: 200px; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical;"></textarea>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">
                            当前字数：<span id="contentCharCount">0</span> 字
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; font-weight: bold; color: #666; margin-bottom: 8px;">🏷️ 标签（可选，用逗号或空格分隔）</label>
                        <input type="text" id="newKBTags" placeholder="如：李青云, 青云宗, 金丹期, 执法长老" 
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px;">
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">
                            💡 标签用于检索，多个标签用逗号或空格分隔
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px; border-left: 4px solid #667eea;">
                        <div style="font-weight: bold; color: #667eea; margin-bottom: 10px;">🎯 知识类型与优先级</div>
                        <select id="newKBPriority" style="
                            width: 100%;
                            padding: 10px;
                            border: 2px solid #667eea;
                            border-radius: 5px;
                            font-size: 14px;
                            cursor: pointer;
                            background: white;
                        " onchange="updatePriorityDescription(this.value)">
                            <option value="">🔍 向量检索知识（默认）</option>
                            <option value="top">👑 常驻【顶部】- P0.5最高优先级</option>
                            <option value="high">⭐ 常驻【重点】- P2.5高优先级</option>
                            <option value="medium">📌 常驻【次重点】- P3.5中优先级</option>
                            <option value="low">📋 常驻【非重点】- P5低优先级</option>
                        </select>
                        <div id="priorityDescription" style="font-size: 12px; color: #666; margin-top: 10px; line-height: 1.6;">
                            🔍 需要向量匹配才会出现在上下文中<br>
                            💡 适用于：大量辅助信息、可选内容
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="saveNewKBItem()" style="
                            flex: 1;
                            padding: 15px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                            box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4);
                        ">💾 保存并生成向量</button>
                        
                        <button onclick="document.getElementById('addKBModal').remove()" style="
                            flex: 0 0 120px;
                            padding: 15px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: bold;
                        ">取消</button>
                    </div>
                </div>
            `;

            const modal = document.createElement('div');
            modal.id = 'addKBModal';
            modal.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
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
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            `;
            content.innerHTML = formHtml;

            modal.appendChild(content);
            document.body.appendChild(modal);

            // 实时字数统计
            const textarea = document.getElementById('newKBContent');
            textarea.addEventListener('input', function() {
                document.getElementById('contentCharCount').textContent = this.value.length;
            });

            modal.onclick = function (e) {
                if (e.target === modal) {
                    if (confirm('确定要关闭吗？未保存的内容将丢失。')) {
                        modal.remove();
                    }
                }
            };
        }

        // 更新优先级描述
        function updatePriorityDescription(priority) {
            const descEl = document.getElementById('priorityDescription');
            if (!descEl) return;
            
            const descriptions = {
                '': '🔍 需要向量匹配才会出现在上下文中<br>💡 适用于：大量辅助信息、可选内容',
                'top': '👑 独占最顶部位置，位于P0.5（超越所有其他内容）<br>🚀 获得绝对最高优先级，独立显示<br>💡 适用于：核心规则、修仙游戏规则<br>⚠️ 消耗中等token，但效果最佳',
                'high': '⭐ 每次都会自动注入，位于P2.5（仅次于最近AI回复）<br>🔥 获得最高关注度<br>💡 适用于：当前关键设定、重要规则<br>⚠️ 消耗较多token',
                'medium': '📌 每次都会自动注入，位于P3.5（仅次于向量检索历史）<br>📊 获得中等关注度<br>💡 适用于：重要世界观、核心背景<br>⚠️ 消耗中token',
                'low': '📋 每次都会自动注入，位于P5（靠后位置）<br>📄 获得较低关注度<br>💡 适用于：一般设定、参考信息<br>👍 消耗token较少'
            };
            
            descEl.innerHTML = descriptions[priority] || descriptions[''];
        }

        // 保存新的知识库条目
        async function saveNewKBItem() {
            const title = document.getElementById('newKBTitle').value.trim();
            const category = document.getElementById('newKBCategory').value;
            const content = document.getElementById('newKBContent').value.trim();
            const tagsInput = document.getElementById('newKBTags').value.trim();
            const priority = document.getElementById('newKBPriority').value; // 'high'/'medium'/'low'/''

            // 验证必填项
            if (!title) {
                alert('请输入标题！');
                return;
            }
            if (!content) {
                alert('请输入内容！');
                return;
            }
            if (content.length < 20) {
                alert('内容太短！建议至少20字。');
                return;
            }

            // 解析标签
            const tags = tagsInput 
                ? tagsInput.split(/[,，\s]+/).map(t => t.trim()).filter(t => t)
                : [];

            // 生成唯一ID
            const id = `kb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            // 创建新条目
            const alwaysInclude = priority !== ''; // 只要有priority就是常驻
            const newItem = {
                id: id,
                title: title,
                content: content,
                category: category,
                tags: tags,
                alwaysInclude: alwaysInclude,
                priority: priority || undefined, // high/medium/low，空则为undefined
                metadata: {
                    createdAt: new Date().toISOString(),
                    source: 'manual'
                }
            };

            // 显示加载提示
            const loadingMsg = document.createElement('div');
            loadingMsg.id = 'kbItemSaving';
            loadingMsg.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10002;
                text-align: center;
            `;
            loadingMsg.innerHTML = `
                <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                    💾 正在保存并生成向量...
                </div>
                <div class="loading" style="margin: 20px auto;"></div>
                <div style="font-size: 13px; color: #666; margin-top: 10px;">
                    ${alwaysInclude ? '⭐ 常驻知识' : '🔍 需检索匹配'}
                </div>
            `;
            document.body.appendChild(loadingMsg);

            try {
                // 根据设置生成向量
                const vectorMethod = document.getElementById('vectorMethod')?.value || 'keyword';
                
                if (alwaysInclude) {
                    // 常驻知识不需要向量
                    newItem.vector = null;
                    newItem.vectorType = 'always';
                    loadingMsg.querySelector('div:nth-child(1)').innerHTML = '💾 正在保存常驻知识...';
                } else if (vectorMethod === 'transformers') {
                    // 使用浏览器模型生成稠密向量
                    loadingMsg.querySelector('div:nth-child(1)').innerHTML = '🤖 正在生成稠密向量...';
                    const denseVector = await window.contextVectorManager.getEmbeddingFromTransformers(content);
                    newItem.vector = denseVector;
                    newItem.vectorType = 'dense';
                } else if (vectorMethod === 'api') {
                    // 使用API生成稠密向量
                    loadingMsg.querySelector('div:nth-child(1)').innerHTML = '🌐 正在调用API生成向量...';
                    const apiVector = await window.contextVectorManager.getEmbeddingFromAPI(content);
                    newItem.vector = apiVector;
                    newItem.vectorType = 'dense';
                } else {
                    // 使用关键词方法生成稀疏向量
                    loadingMsg.querySelector('div:nth-child(1)').innerHTML = '📊 正在生成关键词向量...';
                    const keywordVector = window.contextVectorManager.createKeywordVector(content);
                    newItem.vector = keywordVector;
                    newItem.vectorType = 'sparse';
                }

                // 添加到知识库
                window.contextVectorManager.staticKnowledgeBase.push(newItem);

                // 保存到IndexedDB
                await window.contextVectorManager.saveStaticKBToIndexedDB();

                loadingMsg.remove();

                // 构建成功消息
                let successMsg = `✅ 知识条目已保存！\n\n📋 标题：${title}\n📂 分类：${category}\n📝 内容：${content.length}字\n🏷️ 标签：${tags.length}个`;
                
                if (alwaysInclude) {
                    successMsg += `\n\n⭐ 常驻知识：每次都会自动注入上下文`;
                } else if (newItem.vector) {
                    if (Array.isArray(newItem.vector)) {
                        successMsg += `\n\n🔢 稠密向量：维度${newItem.vector.length}`;
                    } else {
                        successMsg += `\n\n📊 稀疏向量：${Object.keys(newItem.vector).length}个关键词`;
                    }
                    successMsg += `\n💡 会根据相似度检索匹配`;
                }
                
                successMsg += `\n\n💾 已保存到：IndexedDB`;

                alert(successMsg);

                // 关闭表单
                document.getElementById('addKBModal')?.remove();
                
                // 刷新知识库显示
                document.getElementById('knowledgeBaseModal')?.remove();
                viewKnowledgeBase();

            } catch (error) {
                loadingMsg.remove();
                alert(`❌ 保存失败：${error.message}\n\n可能原因：\n- 向量生成失败\n- IndexedDB错误\n\n建议：查看控制台（F12）了解详情`);
                console.error('[添加知识库条目] 失败:', error);
            }
        }

        // 编辑知识库项（所见即所得）
        async function editKBItem(itemIndex) {
            const item = window.contextVectorManager.staticKnowledgeBase[itemIndex];
            if (!item) return;

            const isSystemPrompt = item.id === 'system_prompt_main';
            
            // 找到内容显示区域
            const contentDiv = document.getElementById(`kbContent-${itemIndex}`);
            if (!contentDiv) {
                alert('内容区域未找到！');
                return;
            }
            
            // 保存原始内容
            const originalContent = item.content;
            
            // 创建textarea
            const textarea = document.createElement('textarea');
            textarea.style.cssText = `
                width: 100%;
                min-height: 300px;
                padding: 12px;
                border: 3px solid #667eea;
                border-radius: 8px;
                font-size: 13px;
                line-height: 1.6;
                resize: vertical;
                font-family: inherit;
                box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
            `;
            textarea.value = originalContent;
            
            // 实时字数统计
            const charCounter = document.createElement('div');
            charCounter.style.cssText = 'font-size: 12px; color: #666; margin-top: 8px;';
            charCounter.innerHTML = `当前字数：<span id="editCharCount">${originalContent.length}</span> 字`;
            
            textarea.addEventListener('input', function() {
                document.getElementById('editCharCount').textContent = this.value.length;
            });
            
            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 15px;';
            
            // 保存按钮
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn btn-success';
            saveBtn.style.cssText = 'flex: 1; padding: 12px; font-size: 14px;';
            saveBtn.innerHTML = '💾 保存并生成向量';
            saveBtn.onclick = async () => {
                const newContent = textarea.value.trim();
                
                if (!newContent) {
                    alert('内容不能为空！');
                    return;
                }
                
                if (newContent === originalContent) {
                    alert('内容没有变化！');
                    return;
                }
                
                // 更新内容
                item.content = newContent;
                
                // 系统提示词不需要生成向量
                if (isSystemPrompt) {
                    await window.contextVectorManager.saveStaticKBToIndexedDB();
                    alert('✅ 系统提示词已更新！\n\n修改会在下次对话时生效。\n已保存到IndexedDB。');
                    
                    // 刷新显示
                    document.getElementById('kbDetailModal')?.remove();
                    viewKnowledgeBase();
                    return;
                }
                
                // 普通知识：根据向量化方法生成向量
                const vectorMethod = document.getElementById('vectorMethod')?.value || 'keyword';
                
                // 显示加载提示
                const loadingMsg = document.createElement('div');
                loadingMsg.id = 'vectorGenerating';
                loadingMsg.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10003;
                    text-align: center;
                `;
                
                try {
                    if (vectorMethod === 'transformers') {
                        // 生成稠密向量
                        loadingMsg.innerHTML = `
                            <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                                🤖 正在生成稠密向量...
                            </div>
                            <div class="loading" style="margin: 20px auto;"></div>
                        `;
                        document.body.appendChild(loadingMsg);
                        
                        const denseVector = await window.contextVectorManager.getEmbeddingFromTransformers(newContent);
                        item.vector = denseVector;
                        item.vectorType = 'dense';
                        
                        loadingMsg.remove();
                        
                        await window.contextVectorManager.saveStaticKBToIndexedDB();
                        alert(`✅ 内容已更新并生成稠密向量！\n\n维度：${denseVector.length}\n已保存到IndexedDB`);
                    } else if (vectorMethod === 'api') {
                        // 生成API向量
                        loadingMsg.innerHTML = `
                            <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                                🌐 正在调用API生成向量...
                            </div>
                            <div class="loading" style="margin: 20px auto;"></div>
                        `;
                        document.body.appendChild(loadingMsg);
                        
                        const apiVector = await window.contextVectorManager.getEmbeddingFromAPI(newContent);
                        item.vector = apiVector;
                        item.vectorType = 'dense';
                        
                        loadingMsg.remove();
                        
                        await window.contextVectorManager.saveStaticKBToIndexedDB();
                        alert(`✅ 内容已更新并生成API向量！\n\n维度：${apiVector.length}\n已保存到IndexedDB`);
                    } else {
                        // 生成关键词向量
                        item.vector = window.contextVectorManager.createKeywordVector(newContent);
                        item.vectorType = 'sparse';
                        
                        await window.contextVectorManager.saveStaticKBToIndexedDB();
                        alert(`✅ 内容已更新并生成关键词向量！\n\n关键词：${Object.keys(item.vector).length}个\n已保存到IndexedDB`);
                    }
                    
                    // 刷新显示
                    document.getElementById('kbDetailModal')?.remove();
                    viewKnowledgeBase();
                    
                } catch (error) {
                    if (loadingMsg.parentNode) loadingMsg.remove();
                    alert(`❌ 保存失败：${error.message}`);
                    console.error('[编辑知识库] 失败:', error);
                }
            };
            
            // 取消按钮
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.style.cssText = 'flex: 0 0 120px; padding: 12px; font-size: 14px;';
            cancelBtn.innerHTML = '❌ 取消';
            cancelBtn.onclick = () => {
                // 恢复原始显示
                contentDiv.innerHTML = originalContent;
                contentDiv.style.whiteSpace = 'pre-wrap';
                // 移除编辑元素
                textarea.remove();
                charCounter.remove();
                buttonContainer.remove();
            };
            
            buttonContainer.appendChild(saveBtn);
            buttonContainer.appendChild(cancelBtn);
            
            // 替换内容为可编辑状态
            const parentDiv = contentDiv.parentElement;
            contentDiv.style.display = 'none';
            
            // 插入编辑元素
            parentDiv.appendChild(textarea);
            parentDiv.appendChild(charCounter);
            parentDiv.appendChild(buttonContainer);
            
            // 聚焦到textarea
            textarea.focus();
            textarea.setSelectionRange(0, 0); // 光标移到开头
        }

        // 🎯 修改知识库项的优先级
        async function changeKBPriority(itemIndex) {
            const item = window.contextVectorManager.staticKnowledgeBase[itemIndex];
            if (!item) {
                alert('❌ 未找到知识库项！');
                return;
            }
            
            // 防止修改系统提示词
            if (item.id === 'system_prompt_main') {
                alert('❌ 不能修改系统提示词的优先级！');
                return;
            }
            
            // 获取当前优先级
            const currentPriority = item.alwaysInclude ? (item.priority || 'low') : '';
            
            // 创建优先级选择对话框
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                z-index: 10002;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 100%;">
                    <div style="font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 20px;">
                        🎯 修改优先级：${item.title}
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">选择新的优先级：</div>
                        <select id="newPrioritySelect" style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 5px; font-size: 14px;">
                            <option value="" ${currentPriority === '' ? 'selected' : ''}>🔍 向量检索知识（默认）</option>
                            <option value="top" ${currentPriority === 'top' ? 'selected' : ''}>👑 独占【顶部】- P0最高优先级</option>
                            <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>⭐ 常驻【重点】- P2.5高优先级</option>
                            <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>📌 常驻【次重点】- P3.5中优先级</option>
                            <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>📋 常驻【非重点】- P5低优先级</option>
                        </select>
                    </div>
                    
                    <div id="priorityDesc" style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button id="confirmPriorityBtn" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            ✅ 确定
                        </button>
                        <button id="cancelPriorityBtn" style="flex: 1; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                            ❌ 取消
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const selectEl = document.getElementById('newPrioritySelect');
            const descEl = document.getElementById('priorityDesc');
            const confirmBtn = document.getElementById('confirmPriorityBtn');
            const cancelBtn = document.getElementById('cancelPriorityBtn');
            
            const descriptions = {
                '': '🔍 需要向量匹配才会出现在上下文中<br>💡 适用于：大量辅助信息、可选内容<br>👍 几乎不消耗额外token',
                'top': '👑 独占最顶部位置，位于P0（超越所有其他内容）<br>🚀 获得绝对最高优先级，独立显示<br>💡 适用于：核心规则、修仙游戏规则<br>⚠️ 消耗中等token，但效果最佳',
                'high': '⭐ 每次都会自动注入，位于P2.5（仅次于最近AI回复）<br>🔥 获得最高关注度<br>💡 适用于：当前关键设定、重要规则<br>⚠️ 消耗较多token',
                'medium': '📌 每次都会自动注入，位于P3.5（仅次于向量检索历史）<br>📊 获得中等关注度<br>💡 适用于：重要世界观、核心背景<br>⚠️ 消耗中token',
                'low': '📋 每次都会自动注入，位于P5（靠后位置）<br>📄 获得较低关注度<br>💡 适用于：一般设定、参考信息<br>👍 消耗token较少'
            };
            
            function updateDesc() {
                descEl.innerHTML = descriptions[selectEl.value] || descriptions[''];
            }
            
            updateDesc();
            selectEl.onchange = updateDesc;
            
            confirmBtn.onclick = async () => {
                const newPriority = selectEl.value;
                
                // 更新item属性
                if (newPriority === '') {
                    // 设为向量检索知识
                    item.alwaysInclude = false;
                    delete item.priority;
                } else {
                    // 设为常驻知识
                    item.alwaysInclude = true;
                    item.priority = newPriority;
                }
                
                // 保存到IndexedDB
                await window.contextVectorManager.saveStaticKBToIndexedDB();
                
                const priorityNames = {
                    '': '向量检索知识',
                    'top': '独占【顶部】',
                    'high': '常驻【重点】',
                    'medium': '常驻【次重点】',
                    'low': '常驻【非重点】'
                };
                
                alert(`✅ 优先级已更新！\n\n"${item.title}"\n优先级：${priorityNames[newPriority]}\n\n已保存到IndexedDB`);
                
                modal.remove();
                document.getElementById('kbDetailModal')?.remove();
                viewKnowledgeBase();
            };
            
            cancelBtn.onclick = () => {
                modal.remove();
            };
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            };
        }

        // 查看知识库向量状态（简洁版）
        function viewKBVectorStatus() {
            if (!window.contextVectorManager) {
                alert('向量管理器未初始化！');
                return;
            }

            const kb = window.contextVectorManager.staticKnowledgeBase;

            if (kb.length === 0) {
                alert('静态知识库为空！');
                return;
            }

            // 统计向量类型
            const alwaysCount = kb.filter(item => item.alwaysInclude === true).length;
            const denseCount = kb.filter(item => item.vector && Array.isArray(item.vector)).length;
            const sparseCount = kb.filter(item => item.vector && !Array.isArray(item.vector)).length;
            const lazyCount = kb.filter(item => !item.vector && !item.alwaysInclude).length;

            let statusReport = `╔════════════════════════════════════════╗\n`;
            statusReport += `║  📚 静态知识库向量状态报告            ║\n`;
            statusReport += `╠════════════════════════════════════════╣\n`;
            statusReport += `║  总条数：${kb.length.toString().padEnd(28)}║\n`;
            statusReport += `║  ⭐常驻知识：${alwaysCount.toString().padEnd(24)}║\n`;
            statusReport += `║  🔢稠密向量(Dense)：${denseCount.toString().padEnd(18)}║\n`;
            statusReport += `║  📊稀疏向量(Sparse)：${sparseCount.toString().padEnd(17)}║\n`;
            statusReport += `║  ⏳延迟生成(Lazy)：${lazyCount.toString().padEnd(18)}║\n`;
            statusReport += `╠════════════════════════════════════════╣\n`;
            statusReport += `║  💾 存储位置：                        ║\n`;
            statusReport += `║     IndexedDB → xiuxian_vector_db     ║\n`;
            statusReport += `║     → staticKB 对象存储                ║\n`;
            statusReport += `╠════════════════════════════════════════╣\n`;
            statusReport += `║  🎯 向量化方法：                      ║\n`;
            statusReport += `║     ${window.contextVectorManager.embeddingMethod.padEnd(32)}║\n`;
            statusReport += `╠════════════════════════════════════════╣\n`;
            statusReport += `║  📋 详细列表：                        ║\n`;
            statusReport += `╚════════════════════════════════════════╝\n\n`;

            kb.forEach((item, idx) => {
                let prefix = '';
                let vectorType = '';
                let vectorSize = '';
                
                if (item.alwaysInclude === true) {
                    prefix = '⭐';
                    vectorType = '常驻';
                    vectorSize = '无需向量';
                } else if (item.vector) {
                    if (Array.isArray(item.vector)) {
                        vectorType = '🔢Dense';
                        vectorSize = `维度:${item.vector.length}`;
                    } else {
                        vectorType = '📊Sparse';
                        vectorSize = `关键词:${Object.keys(item.vector).length}个`;
                    }
                } else {
                    vectorType = '⏳Lazy';
                    vectorSize = '延迟生成';
                }
                
                statusReport += `${(idx + 1).toString().padStart(3)}. ${prefix}[${item.category}] ${item.title}\n`;
                statusReport += `     ${vectorType} | ${vectorSize}\n`;
                statusReport += `     标签: ${item.tags.join(', ') || '无'}\n\n`;
            });

            statusReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            statusReport += `💡 提示：\n`;
            statusReport += `- ⭐常驻知识：每次都注入上下文，无需检索\n`;
            statusReport += `- 🔢稠密向量：浏览器模型生成，精确但占空间\n`;
            statusReport += `- 📊稀疏向量：关键词方法生成，快速且兼容\n`;
            statusReport += `- ⏳延迟生成：大型库（100+条）策略，节省空间\n`;
            statusReport += `- 所有数据都已保存在IndexedDB中\n`;

            console.log(statusReport);
            alert('✅ 向量状态报告已输出到控制台！\n\n按F12打开控制台查看详细信息。\n\n' +
                  `总计：${kb.length}条\n` +
                  `⭐常驻：${alwaysCount}条\n` +
                  `稠密：${denseCount}条\n` +
                  `稀疏：${sparseCount}条\n` +
                  `延迟：${lazyCount}条`);
        }

        // 创建知识库模板
        function createKnowledgeTemplate() {
            const template = {
                "version": "1.0",
                "description": "修仙游戏静态知识库模板",
                "knowledge": [
                    {
                        "id": "worldview_basic_001",
                        "title": "修仙世界基本设定",
                        "content": "本世界为修仙世界，修士通过吸收天地灵气修炼，可延寿、御空、呼风唤雨。境界从低到高为：炼气期、筑基期、金丹期、元婴期、化神期、合体期、大乘期、渡劫期、真仙。灵石是通用货币，分为下品、中品、上品、极品四个等级。",
                        "category": "设定",
                        "tags": ["世界观", "境界", "灵石", "修仙"],
                        "alwaysInclude": true,
                        "priority": "high",
                        "metadata": {
                            "type": "core"
                        }
                    },
                    {
                        "id": "sect_qingyun_001",
                        "title": "青云宗基本信息",
                        "content": "青云宗，修真界七大正道门派之首，坐落于东域青云山脉。宗门共有十二峰，分别为主峰通天峰、大竹峰、龙首峰、朝阳峰等。宗主名为道玄真人，已是大乘期修为。宗门弟子分为外门、内门、真传三个层级，共计弟子三千余人。青云宗以《太极玄清道》为根本心法，擅长御剑之术。",
                        "category": "宗门",
                        "tags": ["青云宗", "正道", "门派", "东域"],
                        "alwaysInclude": true,
                        "priority": "medium",
                        "metadata": {
                            "region": "东域",
                            "alignment": "正道",
                            "strength": "强大"
                        }
                    },
                    {
                        "id": "realm_foundation_001",
                        "title": "筑基期境界说明",
                        "content": "筑基期是炼气期之后的重要境界。修士在此阶段需要凝练真气，筑就道基，将散乱的灵气凝聚成液态真元。筑基分为前、中、后三个小境界。突破筑基需要满足条件：1.修炼进度达标 2.准备筑基丹或有长辈护法 3.寻找灵气充裕之地闭关。筑基成功后，寿命可延至200岁，可御器飞行，法力增长十倍。",
                        "category": "境界",
                        "tags": ["筑基期", "境界", "突破"],
                        "metadata": {
                            "realm": "筑基期",
                            "difficulty": "中等"
                        }
                    },
                    {
                        "id": "item_foundation_pill_001",
                        "title": "筑基丹介绍",
                        "content": "筑基丹，三品灵丹，主要材料为百年灵芝、紫血参、天心草等。服用后可增加30%筑基成功率，凝练真元，稳固根基。市价约500灵石。炼制需要三品炼丹师，成丹率约50%。副作用：连续服用三颗以上会产生抗药性。",
                        "category": "丹药",
                        "tags": ["筑基丹", "丹药", "突破", "辅助"],
                        "metadata": {
                            "grade": "三品",
                            "price": 500
                        }
                    },
                    {
                        "id": "npc_elder_li_001",
                        "title": "李长老人物背景",
                        "content": "李长老，本名李青山，青云宗执法长老，金丹后期修为，年龄156岁。性格刚正不阿，疾恶如仇，对门规极为看重。曾在魔道围攻时力战三名金丹魔修，身负重伤但保全了宗门传承。对有才华的年轻弟子颇为照顾，但对违反门规者绝不容情。",
                        "category": "人物",
                        "tags": ["李长老", "青云宗", "执法", "金丹期"],
                        "metadata": {
                            "realm": "金丹后期",
                            "affiliation": "青云宗"
                        }
                    },
                    {
                        "id": "location_market_001",
                        "title": "望仙镇坊市",
                        "content": "望仙镇坊市，位于青云山脉脚下，是东域最大的散修交易市场。这里汇聚了来自各地的散修、商贩、寻宝者。坊市分为东市（灵器法宝）、西市（丹药材料）、南市（功法秘籍）、北市（杂货客栈）四个区域。坊市由散修盟管理，禁止私斗，违者重罚。每月十五有大型拍卖会。",
                        "category": "地点",
                        "tags": ["望仙镇", "坊市", "交易", "东域"],
                        "metadata": {
                            "region": "东域",
                            "type": "市场"
                        }
                    }
                ],
                "instructions": "📖 使用说明：\n\n1. 每条知识包含：\n   - id：唯一标识符（如果重复会自动覆盖）\n   - title：标题\n   - content：详细内容（建议100-500字）\n   - category：分类（宗门/境界/丹药/人物/地点/功法/法宝等）\n   - tags：标签数组（用于检索）\n   - alwaysInclude：设为true则成为常驻知识（每次都注入，无需检索）\n   - priority：优先级（仅常驻知识有效）\n   - metadata：额外元数据（可选）\n\n2. 如果不包含vector字段，导入时会自动生成向量\n\n3. 可以添加已经向量化的内容（包含vector字段）以加快加载速度\n\n4. 建议将相关内容分类组织，便于管理\n\n5. 常驻知识优先级设置：\n   - 设置 \"alwaysInclude\": true 的知识会在每次构建上下文时自动注入\n   - 不需要向量匹配或关键词检索\n   - priority字段：\n     * \"high\" - 重点（P2.5，仅次于最近AI回复）⭐ 消耗较多token\n     * \"medium\" - 次重点（P3.5，仅次于向量检索历史）📌 消耗中token\n     * \"low\" - 非重点（P5，靠后位置）📋 消耗较少token\n     * 不设置或空 - 等同于low\n   - 适用于：世界观设定、核心规则、重要背景等\n   - 注意：会消耗更多token，建议只对核心知识使用\n\n6. 导入说明：\n   - 如果id重复（如system_prompt_main），会自动覆盖而不是重复添加\n   - 导入后所有设定（alwaysInclude、priority等）都会保留"
            };

            const dataStr = JSON.stringify(template, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = '知识库模板.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('✅ 模板已下载！\n\n请编辑模板文件，添加你的游戏设定，然后通过"导入知识库文件"加载。\n\n💡 提示：\n- 宗门设定\n- 人物背景\n- 地图信息\n- 境界说明\n- 丹药介绍\n- 功法法术\n等等...');
        }

        // 保存知识库文件路径配置
        async function saveKBFilePaths() {
            const textarea = document.getElementById('kbFilePaths');
            const paths = textarea.value.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#')); // 支持#注释
            
            if (paths.length === 0) {
                alert('请输入至少一个文件路径！');
                return;
            }
            
            // 保存配置
            window.contextVectorManager.saveKBFileConfig(paths);
            
            // 显示加载提示
            const loadingMsg = document.createElement('div');
            loadingMsg.id = 'kbLoadingMsg';
            loadingMsg.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10001;
                text-align: center;
                min-width: 300px;
            `;
            loadingMsg.innerHTML = `
                <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                    📚 正在加载知识库...
                </div>
                <div class="loading" style="margin: 20px auto;"></div>
                <div id="kbLoadingProgress" style="font-size: 12px; color: #666; margin-top: 15px;">
                    准备中...
                </div>
            `;
            document.body.appendChild(loadingMsg);
            
            try {
                // 立即加载
                const result = await window.contextVectorManager.loadMultipleKnowledgeFiles(paths);
                
                loadingMsg.remove();
                
                // 统计向量类型
                const kb = window.contextVectorManager.staticKnowledgeBase;
                const denseCount = kb.filter(item => item.vector && Array.isArray(item.vector)).length;
                const sparseCount = kb.filter(item => item.vector && !Array.isArray(item.vector)).length;
                const lazyCount = kb.filter(item => !item.vector).length;
                
                if (result.errors.length > 0) {
                    const errorDetails = result.errors.map(e => `  - ${e.file}\n    ${e.error}`).join('\n');
                    alert(`⚠️ 部分导入成功\n\n` +
                          `📊 统计：\n` +
                          `- 成功：${result.totalLoaded} 条\n` +
                          `- 失败：${result.errors.length} 个文件\n\n` +
                          `🔢 向量状态：\n` +
                          `- 稠密向量：${denseCount} 条\n` +
                          `- 稀疏向量：${sparseCount} 条\n` +
                          `- 延迟生成：${lazyCount} 条\n\n` +
                          `失败详情：\n${errorDetails}\n\n` +
                          `建议：\n1. 检查文件路径是否正确\n2. 确保文件在游戏目录下\n3. 查看控制台（F12）了解详情`);
                } else {
                    alert(`✅ 知识库导入成功！\n\n` +
                          `📊 统计：\n` +
                          `- 文件数量：${result.totalFiles} 个\n` +
                          `- 知识总数：${result.totalLoaded} 条\n\n` +
                          `🔢 向量类型：\n` +
                          `- 稠密向量（Dense）：${denseCount} 条\n` +
                          `- 稀疏向量（Sparse）：${sparseCount} 条\n` +
                          `- 延迟生成（Lazy）：${lazyCount} 条\n\n` +
                          `💾 存储位置：IndexedDB (xiuxian_vector_db → staticKB)\n\n` +
                          `💡 提示：\n` +
                          `- 下次启动自动从IndexedDB加载\n` +
                          `- 大文件（100+条）启用实时向量化\n` +
                          `- 点击"查看向量状态"可查看详情`);
                }
                
                console.log('[知识库配置] ✅ 保存并加载完成');
                
            } catch (error) {
                loadingMsg.remove();
                alert('❌ 加载失败：' + error.message + '\n\n请检查：\n1. 文件路径是否正确\n2. 文件格式是否正确\n3. 控制台（F12）查看详细错误');
                console.error('[知识库配置] 加载失败:', error);
            }
        }
        
        // 加载知识库文件路径配置到UI
        function loadKBFilePathsToUI() {
            const paths = window.contextVectorManager.loadKBFileConfig();
            const textarea = document.getElementById('kbFilePaths');
            if (textarea && paths.length > 0) {
                textarea.value = paths.join('\n');
            }
        }

        // 🔐 导出完整备份
        async function exportCompleteBackup() {
            try {
                console.log('[完整备份] 开始导出...');
                
                // 获取所有存档
                const allSaves = await getAllSaves();
                console.log('[完整备份] 获取到', allSaves.length, '个存档');
                
                const backupData = {
                    version: '2.1',
                    type: 'complete_backup',
                    timestamp: Date.now(),
                    exportDate: new Date().toLocaleString('zh-CN'),
                    
                    // 1. API配置和游戏设置（从localStorage）
                    config: JSON.parse(localStorage.getItem('gameConfig') || '{}'),
                    
                    // 2. 额外API配置
                    extraConfig: JSON.parse(localStorage.getItem('extraApiConfig') || '{}'),
                    
                    // 3. 所有存档数据（从IndexedDB）
                    allSaves: allSaves,
                    
                    // 4. 当前游戏状态（兼容旧版本）
                    gameState: {
                        variables: JSON.parse(JSON.stringify(gameState.variables)),
                        conversationHistory: JSON.parse(JSON.stringify(gameState.conversationHistory)),
                        variableSnapshots: JSON.parse(JSON.stringify(gameState.variableSnapshots)),
                        isGameStarted: gameState.isGameStarted,
                        characterInfo: gameState.characterInfo,
                        dynamicWorld: JSON.parse(JSON.stringify(gameState.dynamicWorld))
                    },
                    
                    // 5. 静态知识库
                    knowledgeBase: window.contextVectorManager ? 
                        window.contextVectorManager.exportStaticKB() : null,
                    
                    // 6. 对话向量库
                    conversationVectors: window.contextVectorManager ? 
                        window.contextVectorManager.exportConversationVectors() : null,
                    
                    // 7. NovelAI 生图配置
                    novelAIConfig: {
                        apiKey: localStorage.getItem('novelai_api_key') || '',
                        enabled: localStorage.getItem('novelai_enabled') === 'true',
                        imagePromptTemplate: localStorage.getItem('novelai_image_prompt_template') || '',
                        positivePromptPrefix: localStorage.getItem('novelai_positive_prompt_prefix') || '',
                        imageConfig: JSON.parse(localStorage.getItem('novelai_image_config') || '{}')
                    },
                    
                    // 8. 人物图谱数据和配置
                    characterGraph: window.characterGraphManager ? 
                        window.characterGraphManager.exportData() : null
                };
                
                // 生成文件名
                const filename = `修仙游戏完整备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}_${Date.now()}.json`;
                
                // 导出为JSON文件
                const dataStr = JSON.stringify(backupData, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // 统计信息
                const stats = {
                    apiConfigured: !!backupData.config.endpoint,
                    gameStarted: backupData.gameState.isGameStarted,
                    savesCount: backupData.allSaves.length,
                    conversationCount: backupData.gameState.conversationHistory.length,
                    knowledgeCount: backupData.knowledgeBase?.knowledge?.length || 0,
                    vectorCount: backupData.conversationVectors?.embeddings?.length || 0,
                    novelAIEnabled: backupData.novelAIConfig?.enabled || false,
                    characterGraphCount: backupData.characterGraph?.characters?.length || 0
                };
                
                alert(`✅ 完整备份导出成功！\n\n📦 备份内容：\n` +
                      `- API配置：${stats.apiConfigured ? '✓ 已配置' : '✗ 未配置'}\n` +
                      `- 游戏状态：${stats.gameStarted ? '✓ 已开始' : '✗ 未开始'}\n` +
                      `- 所有存档：${stats.savesCount} 个\n` +
                      `- 当前对话：${stats.conversationCount} 条\n` +
                      `- 静态知识库：${stats.knowledgeCount} 条\n` +
                      `- 对话向量：${stats.vectorCount} 条\n` +
                      `- NovelAI生图：${stats.novelAIEnabled ? '✓ 已启用' : '✗ 未启用'}\n` +
                      `- 人物图谱：${stats.characterGraphCount} 个人物\n\n` +
                      `💾 文件名：${filename}\n\n` +
                      `💡 建议保存到安全的位置！`);
                
                console.log('[完整备份] 导出成功:', stats);
                
            } catch (error) {
                console.error('[完整备份] 导出失败:', error);
                alert(`❌ 导出失败：${error.message}\n\n请查看控制台了解详情`);
            }
        }

        // 🔐 导入完整备份
        async function importCompleteBackup() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // 显示加载提示
                const loadingMsg = document.createElement('div');
                loadingMsg.id = 'backupImporting';
                loadingMsg.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10002;
                    text-align: center;
                    min-width: 300px;
                `;
                loadingMsg.innerHTML = `
                    <div style="color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px;">
                        📦 正在导入完整备份...
                    </div>
                    <div class="loading" style="margin: 20px auto;"></div>
                    <div id="importProgress" style="font-size: 12px; color: #666; margin-top: 15px;">
                        正在读取备份文件...
                    </div>
                `;
                document.body.appendChild(loadingMsg);
                
                const updateProgress = (msg) => {
                    const progressEl = document.getElementById('importProgress');
                    if (progressEl) progressEl.textContent = msg;
                };
                
                try {
                    // 读取文件
                    const text = await file.text();
                    const backupData = JSON.parse(text);
                    
                    // 验证备份文件
                    if (backupData.type !== 'complete_backup') {
                        throw new Error('这不是一个有效的完整备份文件');
                    }
                    
                    console.log('[完整备份] 开始导入...', backupData);
                    
                    // 确认导入
                    loadingMsg.remove();
                    const confirmMsg = `确定要导入此备份吗？\n\n` +
                        `📅 备份日期：${backupData.exportDate || '未知'}\n` +
                        `📦 版本：${backupData.version || '1.0'}\n\n` +
                        `⚠️ 警告：\n` +
                        `- 将覆盖当前所有设置和数据\n` +
                        `- API配置、游戏存档、知识库等都会被替换\n` +
                        `- 建议先导出当前数据作为备份\n\n` +
                        `是否继续？`;
                    
                    if (!confirm(confirmMsg)) {
                        console.log('[完整备份] 用户取消导入');
                        return;
                    }
                    
                    // 重新显示加载提示
                    document.body.appendChild(loadingMsg);
                    
                    let importedItems = {
                        config: false,
                        extraConfig: false,
                        allSaves: false,
                        gameState: false,
                        knowledgeBase: false,
                        conversationVectors: false,
                        novelAIConfig: false,
                        characterGraph: false
                    };
                    
                    // 1. 导入API配置和游戏设置
                    if (backupData.config) {
                        updateProgress('正在恢复API配置...');
                        localStorage.setItem('gameConfig', JSON.stringify(backupData.config));
                        loadConfig(); // 重新加载配置到UI
                        importedItems.config = true;
                        console.log('[完整备份] ✓ API配置已恢复');
                    }
                    
                    // 2. 导入额外API配置
                    if (backupData.extraConfig) {
                        updateProgress('正在恢复额外API配置...');
                        localStorage.setItem('extraApiConfig', JSON.stringify(backupData.extraConfig));
                        importedItems.extraConfig = true;
                        console.log('[完整备份] ✓ 额外API配置已恢复');
                    }
                    
                    // 3. 导入所有存档到IndexedDB
                    if (backupData.allSaves && Array.isArray(backupData.allSaves)) {
                        updateProgress(`正在恢复${backupData.allSaves.length}个存档...`);
                        try {
                            // 确保数据库已初始化
                            if (!db) {
                                await initDB();
                            }
                            
                            // 清空现有存档（可选，根据需求决定）
                            // 这里选择不清空，而是添加/更新存档
                            
                            let restoredCount = 0;
                            for (const saveData of backupData.allSaves) {
                                if (saveData.saveName && saveData.timestamp) {
                                    // 🔧 检查存档数据完整性
                                    if (!saveData.conversationHistory || !Array.isArray(saveData.conversationHistory)) {
                                        console.warn('[完整备份] 跳过无效存档:', saveData.saveName, '- 缺少conversationHistory');
                                        continue;
                                    }
                                    console.log(`[完整备份] 恢复存档: ${saveData.saveName}, 对话数: ${saveData.conversationHistory?.length || 0}`);
                                    await saveGameToSlot(saveData.saveName, saveData);
                                    restoredCount++;
                                }
                            }
                            
                            importedItems.allSaves = true;
                            console.log(`[完整备份] ✓ 已恢复${restoredCount}个存档到IndexedDB`);
                        } catch (error) {
                            console.error('[完整备份] 恢复存档失败:', error);
                            throw new Error(`恢复存档失败: ${error.message}`);
                        }
                    }
                    
                    // 4. 导入当前游戏状态（兼容旧版本）
                    if (backupData.gameState) {
                        updateProgress('正在恢复游戏状态...');
                        await loadSaveData(backupData.gameState);
                        // 🔧 同时更新自动存档
                        await saveGameHistory();
                        importedItems.gameState = true;
                        console.log('[完整备份] ✓ 游戏状态已恢复');
                        console.log('[完整备份] ✓ 自动存档已更新');
                    }
                    
                    // 5. 导入静态知识库
                    if (backupData.knowledgeBase && window.contextVectorManager) {
                        updateProgress('正在恢复静态知识库...');
                        const result = await window.contextVectorManager.importStaticKnowledge(
                            backupData.knowledgeBase,
                            true  // replace = true，替换现有知识库
                        );
                        importedItems.knowledgeBase = true;
                        console.log('[完整备份] ✓ 静态知识库已恢复:', result.count, '条');
                    }
                    
                    // 6. 导入对话向量库
                    if (backupData.conversationVectors && window.contextVectorManager) {
                        updateProgress('正在恢复对话向量库...');
                        const result = await window.contextVectorManager.importConversationVectors(
                            backupData.conversationVectors
                        );
                        importedItems.conversationVectors = true;
                        console.log('[完整备份] ✓ 对话向量库已恢复:', result.count, '条');
                    }
                    
                    // 7. 导入 NovelAI 生图配置
                    if (backupData.novelAIConfig) {
                        updateProgress('正在恢复 NovelAI 生图配置...');
                        
                        // 恢复各项配置到 localStorage
                        if (backupData.novelAIConfig.apiKey) {
                            localStorage.setItem('novelai_api_key', backupData.novelAIConfig.apiKey);
                        }
                        localStorage.setItem('novelai_enabled', backupData.novelAIConfig.enabled ? 'true' : 'false');
                        if (backupData.novelAIConfig.imagePromptTemplate) {
                            localStorage.setItem('novelai_image_prompt_template', backupData.novelAIConfig.imagePromptTemplate);
                        }
                        if (backupData.novelAIConfig.positivePromptPrefix !== undefined) {
                            localStorage.setItem('novelai_positive_prompt_prefix', backupData.novelAIConfig.positivePromptPrefix);
                        }
                        if (backupData.novelAIConfig.imageConfig && Object.keys(backupData.novelAIConfig.imageConfig).length > 0) {
                            localStorage.setItem('novelai_image_config', JSON.stringify(backupData.novelAIConfig.imageConfig));
                        }
                        
                        // 如果 novelAIGenerator 实例存在，重新加载配置
                        if (window.novelAIGenerator && typeof window.novelAIGenerator.loadConfig === 'function') {
                            window.novelAIGenerator.loadConfig();
                        }
                        
                        importedItems.novelAIConfig = true;
                        console.log('[完整备份] ✓ NovelAI 生图配置已恢复');
                    }
                    
                    // 8. 导入人物图谱数据
                    if (backupData.characterGraph && window.characterGraphManager) {
                        updateProgress('正在恢复人物图谱...');
                        
                        await window.characterGraphManager.importData(backupData.characterGraph);
                        
                        importedItems.characterGraph = true;
                        const charCount = backupData.characterGraph.characters?.length || 0;
                        console.log('[完整备份] ✓ 人物图谱已恢复:', charCount, '个人物');
                    }
                    
                    loadingMsg.remove();
                    
                    // 显示导入结果
                    const stats = {
                        savesCount: backupData.allSaves?.length || 0,
                        conversationCount: backupData.gameState?.conversationHistory?.length || 0,
                        knowledgeCount: backupData.knowledgeBase?.knowledge?.length || 0,
                        vectorCount: backupData.conversationVectors?.embeddings?.length || 0,
                        novelAIEnabled: backupData.novelAIConfig?.enabled || false,
                        characterGraphCount: backupData.characterGraph?.characters?.length || 0
                    };
                    
                    alert(`✅ 完整备份导入成功！\n\n` +
                          `📦 已恢复的内容：\n` +
                          `${importedItems.config ? '✓' : '✗'} API配置\n` +
                          `${importedItems.extraConfig ? '✓' : '✗'} 额外API配置\n` +
                          `${importedItems.allSaves ? '✓' : '✗'} 所有存档（${stats.savesCount} 个）\n` +
                          `${importedItems.gameState ? '✓' : '✗'} 当前游戏状态（${stats.conversationCount} 条对话）\n` +
                          `${importedItems.knowledgeBase ? '✓' : '✗'} 静态知识库（${stats.knowledgeCount} 条）\n` +
                          `${importedItems.conversationVectors ? '✓' : '✗'} 对话向量库（${stats.vectorCount} 条）\n` +
                          `${importedItems.novelAIConfig ? '✓' : '✗'} NovelAI生图配置\n` +
                          `${importedItems.characterGraph ? '✓' : '✗'} 人物图谱（${stats.characterGraphCount} 个人物）\n\n` +
                          `💡 所有存档已保存到IndexedDB，可以通过"加载存档"查看\n\n` +
                          `🎉 建议现在刷新页面以确保所有设置生效`);
                    
                    console.log('[完整备份] 导入成功');
                    
                } catch (error) {
                    loadingMsg.remove();
                    console.error('[完整备份] 导入失败:', error);
                    alert(`❌ 导入失败：${error.message}\n\n可能的原因：\n` +
                          `1. 文件格式不正确\n` +
                          `2. 备份文件损坏\n` +
                          `3. 版本不兼容\n\n` +
                          `请查看控制台了解详情`);
                }
            };
            
            input.click();
        }
        
        // 页面加载时恢复配置
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                loadKBFilePathsToUI();
            }, 500);
        });
