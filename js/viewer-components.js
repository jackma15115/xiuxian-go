        // 查看向量库
        function viewVectorLibrary() {
            if (!window.contextVectorManager) {
                alert('向量管理器未初始化！');
                return;
            }

            const embeddings = window.contextVectorManager.conversationEmbeddings;
            const enableVectorRetrieval = document.getElementById('enableVectorRetrieval')?.checked || false;

            if (!enableVectorRetrieval) {
                alert('向量检索未启用！\n\n请在游戏设置中启用"🧬 启用向量检索（智能记忆）"');
                return;
            }

            if (embeddings.length === 0) {
                alert('向量库为空！\n\n请先进行游戏，系统会自动记录对话到向量库。');
                return;
            }

            // 构建HTML内容
            let htmlContent = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">🧬 向量库查看器</h2>
                    <button onclick="document.getElementById('vectorLibraryModal').remove()" style="
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
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #667eea;">${embeddings.length}</div>
                            <div style="font-size: 12px; color: #666;">总对话数</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #764ba2;">${window.contextVectorManager.embeddingMethod}</div>
                            <div style="font-size: 12px; color: #666;">向量化方法</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${window.contextVectorManager.maxRetrieveCount}</div>
                            <div style="font-size: 12px; color: #666;">检索数量</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${window.contextVectorManager.minSimilarityThreshold}</div>
                            <div style="font-size: 12px; color: #666;">相似度阈值</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <input type="text" id="vectorSearchInput" placeholder="🔍 输入关键词搜索相关对话..." 
                        style="width: 100%; padding: 12px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;"
                        onkeyup="filterVectorList(this.value)">
                </div>

                <div id="vectorListContainer" style="max-height: 500px; overflow-y: auto;">
            `;

            embeddings.forEach((conv, index) => {
                const date = new Date(conv.timestamp).toLocaleString('zh-CN');
                const userPreview = conv.userMessage.length > 60 ? conv.userMessage.substring(0, 60) + '...' : conv.userMessage;
                const aiPreview = conv.aiResponse.length > 100 ? conv.aiResponse.substring(0, 100) + '...' : conv.aiResponse;
                
                htmlContent += `
                    <div class="vector-item" data-index="${index}" style="
                        background: white;
                        padding: 15px;
                        border-radius: 10px;
                        margin-bottom: 10px;
                        border: 2px solid #e0e0e0;
                        cursor: pointer;
                        transition: all 0.3s;
                    " onmouseover="this.style.borderColor='#667eea'; this.style.background='#f8f9ff';"
                       onmouseout="this.style.borderColor='#e0e0e0'; this.style.background='white';"
                       onclick="showVectorDetail(${index})">
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="font-weight: bold; color: #667eea;">第 ${conv.turnIndex} 轮对话</div>
                            <div style="font-size: 11px; color: #999;">${date}</div>
                        </div>
                        
                        <div style="background: #e7f5e9; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 11px; color: #666; margin-bottom: 3px;">👤 玩家</div>
                            <div style="font-size: 13px; color: #333;">${userPreview}</div>
                        </div>
                        
                        <div style="background: #f0f2ff; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 11px; color: #666; margin-bottom: 3px;">🤖 AI回复</div>
                            <div style="font-size: 13px; color: #333;">${aiPreview}</div>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 8px; border-radius: 5px;">
                            <div style="font-size: 11px; color: #856404;">📝 摘要：${conv.summary}</div>
                        </div>
                        
                        ${conv.variables ? `
                            <div style="margin-top: 8px; font-size: 11px; color: #666;">
                                📍 ${conv.variables.location || '未知'} | 
                                ⚔️ ${conv.variables.realm || '未知'} |
                                ${conv.variables.hasNewItems ? '🎒 获得物品' : ''} 
                                ${conv.variables.hasNewRelationships ? '👥 新增关系' : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            htmlContent += `
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    <button onclick="exportVectorLibrary()" style="
                        flex: 1;
                        padding: 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">📤 导出向量库</button>
                    
                    <button onclick="clearVectorLibraryConfirm()" style="
                        flex: 1;
                        padding: 12px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🗑️ 清空向量库</button>
                </div>
            `;

            // 创建模态框
            const modal = document.createElement('div');
            modal.id = 'vectorLibraryModal';
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

        // 过滤向量列表
        function filterVectorList(keyword) {
            const items = document.querySelectorAll('.vector-item');
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

        // 显示向量详情
        function showVectorDetail(index) {
            const conv = window.contextVectorManager.conversationEmbeddings[index];
            if (!conv) return;

            const detailHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #667eea; margin: 0;">📋 第 ${conv.turnIndex} 轮对话详情</h2>
                    <button onclick="document.getElementById('vectorDetailModal').remove()" style="
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
                    <div style="font-weight: bold; color: #666; margin-bottom: 8px;">📊 元数据</div>
                    <div style="font-size: 13px; line-height: 1.8;">
                        🕐 时间：${new Date(conv.timestamp).toLocaleString('zh-CN')}<br>
                        🔢 轮次：第 ${conv.turnIndex} 轮<br>
                        📝 摘要：${conv.summary}
                    </div>
                </div>

                <div style="background: #e7f5e9; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #28a745; margin-bottom: 8px;">👤 玩家消息</div>
                    <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.6;">${conv.userMessage}</div>
                </div>

                <div style="background: #f0f2ff; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">🤖 AI回复</div>
                    <div style="white-space: pre-wrap; font-size: 13px; line-height: 1.6; max-height: 300px; overflow-y: auto;">${conv.aiResponse}</div>
                </div>

                ${conv.variables ? `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px;">
                        <div style="font-weight: bold; color: #856404; margin-bottom: 8px;">📍 关键变量</div>
                        <div style="font-size: 13px; line-height: 1.8;">
                            地点：${conv.variables.location || '未知'}<br>
                            境界：${conv.variables.realm || '未知'}<br>
                            体力：${conv.variables.hp || '?'}/${conv.variables.hpMax || '?'}<br>
                            法力：${conv.variables.mp || '?'}/${conv.variables.mpMax || '?'}<br>
                            ${conv.variables.hasNewItems ? '✅ 本轮获得新物品<br>' : ''}
                            ${conv.variables.hasNewRelationships ? '✅ 本轮新增人际关系<br>' : ''}
                        </div>
                    </div>
                ` : ''}

                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;">
                    <button onclick="testVectorSimilarity(${index})" style="
                        width: 100%;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 测试与此对话的相似度</button>
                </div>
            `;

            const modal = document.createElement('div');
            modal.id = 'vectorDetailModal';
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

        // 测试相似度
        function testVectorSimilarity(targetIndex) {
            const keyword = prompt('请输入测试关键词（如：青云宗、长老、修炼等）：');
            if (!keyword) return;

            const targetConv = window.contextVectorManager.conversationEmbeddings[targetIndex];
            const testVector = window.contextVectorManager.createKeywordVector(keyword);
            const similarity = window.contextVectorManager.calculateCosineSimilarity(testVector, targetConv.vector);

            alert(`🧪 相似度测试结果\n\n关键词："${keyword}"\n目标对话：第${targetConv.turnIndex}轮\n\n相似度：${(similarity * 100).toFixed(2)}%\n\n${similarity >= window.contextVectorManager.minSimilarityThreshold ? '✅ 高于阈值，会被检索到' : '❌ 低于阈值，不会被检索到'}`);
        }

        // 导出向量库
        function exportVectorLibrary() {
            const data = {
                embeddings: window.contextVectorManager.conversationEmbeddings,
                method: window.contextVectorManager.embeddingMethod,
                exportTime: new Date().toISOString()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `向量库_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('✅ 向量库已导出！');
        }

        // 清空向量库确认
        function clearVectorLibraryConfirm() {
            if (!confirm('⚠️ 确定要清空向量库吗？\n\n这将删除所有已存储的对话向量，此操作不可恢复！')) {
                return;
            }

            window.contextVectorManager.clear();
            window.contextVectorManager.saveToIndexedDB().then(() => {
                alert('✅ 向量库已清空！');
                document.getElementById('vectorLibraryModal')?.remove();
            }).catch(err => {
                console.error('清空失败:', err);
                alert('❌ 清空失败：' + err.message);
            });
        }

        // 🆕 诊断：检查实际渲染的消息数量
        function diagnoseMessageDisplay() {
            const historyDiv = document.getElementById('gameHistory');
            const userMessages = historyDiv.querySelectorAll('.user-message');
            const aiMessages = historyDiv.querySelectorAll('.ai-message');
            const dynamicMessages = historyDiv.querySelectorAll('.dynamic-world-message');
            
            const report = `
━━━━━━━━━━ 消息显示诊断报告 ━━━━━━━━━━

📊 内存中的数据：
  - conversationHistory 总条数: ${gameState.conversationHistory.length}
  - 用户消息: ${gameState.conversationHistory.filter(m => m.role === 'user').length} 条
  - AI消息: ${gameState.conversationHistory.filter(m => m.role === 'assistant').length} 条
  - 重要历史记录: ${gameState.variables.history ? gameState.variables.history.length : 0} 条

🖥️ 实际渲染的DOM元素：
  - gameHistory 子元素总数: ${historyDiv.children.length}
  - 用户消息 (.user-message): ${userMessages.length} 条
  - AI消息 (.ai-message): ${aiMessages.length} 条
  - 动态世界消息 (.dynamic-world-message): ${dynamicMessages.length} 条

📝 conversationHistory 详情：
${gameState.conversationHistory.map((msg, i) => 
    `  [${i+1}] ${msg.role === 'user' ? '👤用户' : '🤖AI'}: ${msg.content.substring(0, 40)}...`
).join('\n')}

📜 重要历史 (variables.history)：
${gameState.variables.history ? gameState.variables.history.map((h, i) => `  [${i+1}] ${h.substring(0, 50)}...`).join('\n') : '  (无)'}

💡 建议：
  ${historyDiv.children.length === 0 ? '❌ 没有任何消息被渲染！请检查渲染函数是否正常工作。' : ''}
  ${historyDiv.children.length < gameState.conversationHistory.length ? '⚠️ 渲染的消息数量少于存档中的数量，部分消息可能渲染失败。' : ''}
  ${historyDiv.children.length === gameState.conversationHistory.length ? '✅ 消息数量匹配，如果看不到可能是CSS样式问题。' : ''}
  ${gameState.variables.history && gameState.variables.history.length < gameState.conversationHistory.filter(m => m.role === 'user').length ? '⚠️ 重要历史记录数量少于对话轮数，建议使用"重建历史记录"功能。' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `;
            
            console.log(report);
            alert(report);
        }

        // 🆕 查看History矩阵
        function viewHistoryMatrix() {
            if (!window.contextVectorManager) {
                alert('向量管理器未初始化！');
                return;
            }
            
            if (!window.matrixManager) {
                alert('矩阵管理器未初始化！');
                return;
            }
            
            const historyVectorSize = window.contextVectorManager.historyEmbeddings.length;
            const historyMatrixLayers = window.matrixManager.historyMatrix.layers.length;
            const recentCount = window.contextVectorManager.recentHistoryCount;
            const matrixCount = window.contextVectorManager.matrixHistoryCount;
            
            // 构建HTML内容
            let htmlContent = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #28a745; margin: 0;">📊 History矩阵查看器</h2>
                    <button onclick="document.getElementById('historyMatrixModal').remove()" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    ">关闭</button>
                </div>
                
                <div style="background: #f0f8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${historyVectorSize}</div>
                            <div style="font-size: 12px; color: #666;">History向量数</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${historyMatrixLayers}</div>
                            <div style="font-size: 12px; color: #666;">矩阵层数</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${recentCount}</div>
                            <div style="font-size: 12px; color: #666;">最近发送条数</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">${matrixCount}</div>
                            <div style="font-size: 12px; color: #666;">矩阵检索条数</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <input type="text" id="matrixSearchInput" placeholder="🔍 输入关键词搜索相关矩阵层..." 
                        style="width: 100%; padding: 12px; border: 2px solid #28a745; border-radius: 8px; font-size: 14px;"
                        onkeyup="filterMatrixLayers(this.value)">
                </div>

                <div id="matrixLayersContainer" style="max-height: 400px; overflow-y: auto;">
            `;

            // 显示矩阵层信息
            if (historyMatrixLayers > 0) {
                const layers = window.matrixManager.historyMatrix.layers;
                layers.forEach((layer, index) => {
                    const weight = layer.weight ? layer.weight.toFixed(3) : '0.000';
                    const vectorCount = layer.vectors ? layer.vectors.length : 0;
                    const topic = layer.topic || '未分类';
                    
                    // 获取该层第一个向量作为预览
                    let preview = '无数据';
                    if (layer.vectors && layer.vectors.length > 0) {
                        const firstVector = layer.vectors[0];
                        // History向量使用content字段，对话向量使用text字段
                        const textContent = firstVector.content || firstVector.text || firstVector.aiResponse;
                        if (textContent) {
                            preview = textContent.length > 80 ? 
                                textContent.substring(0, 80) + '...' : 
                                textContent;
                        }
                    }
                    
                    const createTime = layer.createTime ? new Date(layer.createTime).toLocaleString('zh-CN') : '未知';
                    
                    htmlContent += `
                        <div class="matrix-layer-item" data-index="${index}" style="
                            background: white;
                            padding: 15px;
                            border-radius: 10px;
                            margin-bottom: 10px;
                            border: 2px solid #e0e0e0;
                            cursor: pointer;
                            transition: all 0.3s;
                        " onmouseover="this.style.borderColor='#28a745'; this.style.background='#f8fff8';"
                           onmouseout="this.style.borderColor='#e0e0e0'; this.style.background='white';"
                           onclick="showMatrixLayerDetail(${index})">
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div style="font-weight: bold; color: #28a745;">层 ${index + 1}: ${topic}</div>
                                <div style="font-size: 11px; color: #999;">权重: ${weight}</div>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                                <div style="font-size: 11px; color: #666; margin-bottom: 3px;">📊 统计信息</div>
                                <div style="font-size: 13px; color: #333;">
                                    向量数量: ${vectorCount} | 创建时间: ${createTime}
                                </div>
                            </div>
                            
                            <div style="background: #e7f5e9; padding: 10px; border-radius: 5px;">
                                <div style="font-size: 11px; color: #666; margin-bottom: 3px;">📝 内容预览</div>
                                <div style="font-size: 13px; color: #333;">${preview}</div>
                            </div>
                        </div>
                    `;
                });
            } else {
                htmlContent += `
                    <div style="
                        background: #fff3cd;
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        color: #856404;
                    ">
                        <div style="font-size: 18px; margin-bottom: 10px;">⚠️ 矩阵为空</div>
                        <div style="font-size: 14px; margin-bottom: 10px;">需要AI返回包含history的回复才能构建矩阵</div>
                        <div style="font-size: 13px; margin-bottom: 15px;">💡 启用向量检索后，AI回复中的history会自动向量化并构建矩阵</div>
                        <div style="font-size: 12px; color: #856404; background: #fef5e7; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            <strong>当前状态：</strong><br>
                            • History向量库：${historyVectorSize} 条数据<br>
                            • 矩阵层数：${historyMatrixLayers} 层<br>
                            <br>
                            <strong>可能原因：</strong><br>
                            • 向量数量太少，尚未形成有意义的层<br>
                            • 向量相似度不够高，无法聚类<br>
                            • 矩阵构建需要更多对话积累
                        </div>
                        <button onclick="rebuildHistoryMatrix()" style="
                            margin-top: 15px;
                            padding: 10px 20px;
                            background: #28a745;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 13px;
                        ">🔄 手动重建矩阵</button>
                    </div>
                `;
            }

            // 显示最近History
            if (historyVectorSize > 0) {
                htmlContent += `
                    <div style="margin-top: 20px;">
                        <h3 style="color: #6f42c1; margin-bottom: 10px;">📋 最近3条History</h3>
                `;
                
                for (let i = Math.max(0, historyVectorSize - 3); i < historyVectorSize; i++) {
                    const embedding = window.contextVectorManager.historyEmbeddings[i];
                    if (embedding && embedding.content) {
                        const preview = embedding.content.length > 100 ? embedding.content.substring(0, 100) + '...' : embedding.content;
                        const turnIndex = embedding.turnIndex || '?';
                        const historyIndex = embedding.historyIndex || '?';
                        const timestamp = embedding.timestamp ? new Date(embedding.timestamp).toLocaleString('zh-CN') : '未知时间';
                        
                        htmlContent += `
                            <div style="
                                background: #f8f9ff;
                                padding: 12px;
                                border-radius: 8px;
                                margin-bottom: 8px;
                                border-left: 4px solid #6f42c1;
                            ">
                                <div style="font-size: 11px; color: #666; margin-bottom: 5px;">
                                    [轮${turnIndex}-条${historyIndex}] ${timestamp}
                                </div>
                                <div style="font-size: 13px; color: #333;">${preview}</div>
                            </div>
                        `;
                    }
                }
                htmlContent += `</div>`;
            }
            
            htmlContent += `
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; display: flex; gap: 10px;">
                    <button onclick="testMatrixRetrieval()" style="
                        flex: 1;
                        padding: 12px;
                        background: #17a2b8;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🧪 测试矩阵检索</button>
                    
                    <button onclick="rebuildHistoryMatrix()" style="
                        flex: 1;
                        padding: 12px;
                        background: #ffc107;
                        color: #212529;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">🔄 重建矩阵</button>
                    
                    <button onclick="exportHistoryMatrix()" style="
                        flex: 1;
                        padding: 12px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                    ">📤 导出矩阵</button>
                </div>
                
                <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px;">💡 控制台命令：</div>
                    <div style="font-size: 11px; font-family: monospace; color: #333;">
                        • HistoryMatrixTest.runFullTest() - 完整测试<br>
                        • window.matrixManager.visualizeHistory() - 可视化矩阵
                    </div>
                </div>
            `;

            // 创建模态框
            const modal = document.createElement('div');
            modal.id = 'historyMatrixModal';
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
