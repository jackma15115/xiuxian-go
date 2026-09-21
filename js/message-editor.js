        // 编辑用户消息
        let editDebounceTimer = null;
        let isEditing = false;
        
        function editUserMessage(messageIndex) {
            // 防止重复点击
            if (isEditing) {
                console.log('[编辑] 正在编辑中，忽略重复点击');
                return;
            }
            
            // 清除之前的防抖定时器
            if (editDebounceTimer) {
                clearTimeout(editDebounceTimer);
            }
            
            // 设置防抖
            editDebounceTimer = setTimeout(() => {
                performEdit(messageIndex);
                editDebounceTimer = null;
            }, 200);
        }
        
        function performEdit(messageIndex) {
            if (isEditing) return;
            isEditing = true;
            
            // 🔧 保护用户输入框，防止被编辑操作影响
            const userInput = document.getElementById('userInput');
            const originalInputValue = userInput ? userInput.value : '';
            
            try {
                const historyDiv = document.getElementById('gameHistory');
                const messages = historyDiv.children;
                
                if (messageIndex >= messages.length) {
                    isEditing = false;
                    return;
                }
                
                const messageDiv = messages[messageIndex];
                const contentDiv = messageDiv.querySelector('.message-content');
                const originalText = contentDiv.getAttribute('data-original-text') || contentDiv.textContent;
                
                // 检查是否已经在编辑模式
                if (contentDiv.classList.contains('edit-mode')) {
                    console.log('[编辑] 消息已经在编辑模式中');
                    isEditing = false;
                    return;
                }
                
                // 保存原始内容div的父元素引用
                const parentElement = contentDiv.parentNode;
                
                // 创建编辑区域
                const textarea = document.createElement('textarea');
                textarea.style.cssText = 'width: 100%; min-height: 100px; padding: 10px; border: 2px solid #667eea; border-radius: 8px; font-size: 14px;resize: vertical;';
                textarea.value = originalText;
                
                // 创建按钮容器
                const btnContainer = document.createElement('div');
                btnContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';
                
                // 创建编辑容器
                const editContainer = document.createElement('div');
                editContainer.className = 'message-content edit-mode';
                editContainer.appendChild(textarea);
                editContainer.appendChild(btnContainer);
                
                // 保存按钮
                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn btn-success';
                saveBtn.style.cssText = 'padding: 8px 16px; font-size: 13px;';
                saveBtn.innerHTML = '💾 保存';
                saveBtn.onclick = () => {
                    const newText = textarea.value.trim();
                    if (!newText) {
                        alert('内容不能为空！');
                        return;
                    }
                    
                    // 更新显示
                    contentDiv.textContent = newText;
                    contentDiv.setAttribute('data-original-text', newText);
                    
                    // 更新历史记录中的内容
                    let historyIndex = 0;
                    for (let i = 0; i <= messageIndex; i++) {
                        if (messages[i].classList.contains('user-message') || messages[i].classList.contains('ai-message')) {
                            if (i === messageIndex) break;
                            historyIndex++;
                        }
                    }
                    
                    if (historyIndex < gameState.conversationHistory.length) {
                        gameState.conversationHistory[historyIndex].content = newText;
                        // 保存到数据库
                        saveGameHistory().catch(err => console.error('保存失败:', err));
                    }
                    
                    // 恢复原始显示
                    parentElement.replaceChild(contentDiv, editContainer);
                    
                    // 🔧 检查并恢复用户输入框
                    if (userInput && userInput.value !== originalInputValue) {
                        console.warn('[编辑] 检测到输入框被意外修改，正在恢复...');
                        userInput.value = originalInputValue;
                    }
                    
                    isEditing = false;
                };
                
                // 取消按钮
                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn btn-secondary';
                cancelBtn.style.cssText = 'padding: 8px 16px; font-size: 13px;';
                cancelBtn.innerHTML = '❌ 取消';
                cancelBtn.onclick = () => {
                    // 恢复原始显示
                    parentElement.replaceChild(contentDiv, editContainer);
                    
                    // 🔧 检查并恢复用户输入框
                    if (userInput && userInput.value !== originalInputValue) {
                        console.warn('[编辑] 检测到输入框被意外修改，正在恢复...');
                        userInput.value = originalInputValue;
                    }
                    
                    isEditing = false;
                };
                
                btnContainer.appendChild(saveBtn);
                btnContainer.appendChild(cancelBtn);
                
                // 替换内容区域
                parentElement.replaceChild(editContainer, contentDiv);
                textarea.focus();
                
            } catch (error) {
                console.error('[编辑] 编辑消息时出错:', error);
                
                // 🔧 出错时也要恢复用户输入框
                if (userInput && userInput.value !== originalInputValue) {
                    console.warn('[编辑] 出错时恢复输入框内容...');
                    userInput.value = originalInputValue;
                }
                
                isEditing = false;
            }
        }

        // 重新发送用户消息
        async function resendUserMessage(messageIndex) {
            if (gameState.isProcessing) return;
            
            const historyDiv = document.getElementById('gameHistory');
            const messages = historyDiv.children;
            
            if (messageIndex >= messages.length) return;
            
            const messageDiv = messages[messageIndex];
            const contentDiv = messageDiv.querySelector('.message-content');
            const messageText = contentDiv.getAttribute('data-original-text') || contentDiv.textContent;
            
            if (!messageText.trim()) {
                alert('消息内容为空！');
                return;
            }
            
            // 找到这条消息之后的所有消息并删除
            const messagesToDelete = [];
            for (let i = messageIndex + 1; i < messages.length; i++) {
                messagesToDelete.push(messages[i]);
            }
            
            // 确认删除（如果有后续消息）
            if (messagesToDelete.length > 0) {
                if (!confirm(`重新发送将删除这条消息之后的 ${messagesToDelete.length} 条消息，确定继续吗？`)) {
                    return;
                }
                
                // 删除UI中的消息
                messagesToDelete.forEach(msg => msg.remove());
            }
            
            // 计算历史记录中的索引
            let historyIndex = 0;
            for (let i = 0; i <= messageIndex; i++) {
                if (messages[i] && (messages[i].classList.contains('user-message') || messages[i].classList.contains('ai-message'))) {
                    if (i === messageIndex) break;
                    historyIndex++;
                }
            }
            
            // 删除历史记录中对应的消息（这条用户消息之后的所有消息）
            const deleteCount = messagesToDelete.length;
            if (deleteCount > 0 && historyIndex + 1 < gameState.conversationHistory.length) {
                gameState.conversationHistory.splice(historyIndex + 1, deleteCount);
                gameState.variableSnapshots.splice(historyIndex + 1, deleteCount);
            }
            
            // 🌍 保存动态世界的独立数据（在回滚前保存）
            const dynamicWorldBackup = {
                history: JSON.parse(JSON.stringify(gameState.dynamicWorld.history || [])),
                floor: gameState.dynamicWorld.floor || 0
            };
            
            // 回滚变量到这条用户消息发送之前的状态
            if (historyIndex > 0 && historyIndex - 1 < gameState.variableSnapshots.length) {
                // 回滚到这条用户消息之前的AI回复的状态
                gameState.variables = JSON.parse(JSON.stringify(gameState.variableSnapshots[historyIndex - 1]));
                updateStatusPanel();
            }
            
            // 🌍 恢复动态世界的独立数据（回滚后恢复）
            gameState.dynamicWorld.history = dynamicWorldBackup.history;
            gameState.dynamicWorld.floor = dynamicWorldBackup.floor;
            console.log('[重新发送] 已保护动态世界数据不被回滚');
            
            // 删除历史记录中的这条用户消息（准备重新发送）
            if (historyIndex < gameState.conversationHistory.length) {
                gameState.conversationHistory.splice(historyIndex, 1);
                gameState.variableSnapshots.splice(historyIndex, 1);
            }
            
            gameState.isProcessing = true;
            
            // 删除UI中的这条用户消息
            messageDiv.remove();
            
            // 重新显示用户消息
            displayUserMessage(messageText);
            
            // 添加到历史记录
            gameState.conversationHistory.push({
                role: 'user',
                content: messageText
            });
            
            // 保存当前变量快照
            gameState.variableSnapshots.push(JSON.parse(JSON.stringify(gameState.variables)));
            
            // 显示加载提示（在用户消息之后）
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message ai-message';
            loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI重新思考中...</div>';
            loadingDiv.id = 'loading-message';
            historyDiv.appendChild(loadingDiv);
            
            try {
                // 🎯 使用统一函数构建增强提示
                const enhancedMessage = buildEnhancedPrompt(messageText);
                
                console.log('🔄 [重新发送] 原始用户消息:', messageText);
                console.log('🔄 [重新发送] 增强后的Prompt:', enhancedMessage);
                
                // 🔧 重新发送消息给AI（messageText是原始输入，可直接用于检索）
                const response = await callAI(enhancedMessage, false, messageText);
                
                // 移除加载提示
                const loading = document.getElementById('loading-message');
                if (loading) loading.remove();
                
                handleAIResponse(response);

                // 触发动态世界生成（异步，不阻塞主流程）
                generateDynamicWorld().catch(err => console.error('[动态世界] 生成异常:', err));

                // 触发好友自动消息（异步，不阻塞主流程）
                if (typeof window.generateAutoFriendMessage === 'function') {
                    window.generateAutoFriendMessage().catch(err => console.error('[好友自动消息] 生成异常:', err));
                }

            } catch (error) {
                // 移除加载提示
                const loading = document.getElementById('loading-message');
                if (loading) loading.remove();
                
                // 不要移除用户消息！显示错误和重试按钮
                displayErrorMessageWithRetry('重新发送失败：' + error.message, async () => {
                    // 移除错误消息
                    const errorDiv = document.getElementById('error-message-with-retry');
                    if (errorDiv) errorDiv.remove();
                    
                    // 再次重试
                    await resendUserMessage(messageIndex);
                });
            }
            
            gameState.isProcessing = false;
        }

        // 重新生成最后的响应
        async function regenerateLastResponse() {
            if (gameState.isProcessing) return;
            if (gameState.conversationHistory.length < 2) return;

            // 🔧 防止重复点击：立即设置处理标志
            gameState.isProcessing = true;

            // 🔧 启动全局输入框保护
            userInputProtection.start();

            // 🔧 保存被删除的内容，以便失败时恢复
            let removedAIMessage = null;
            let removedSnapshot = null;
            let removedAIMessageDOM = null;
            let previousVariablesBackup = null;

            // 🆕 检查最后一条消息是否是AI消息
            const lastMessageIsAI = gameState.conversationHistory.length > 0 &&
                gameState.conversationHistory[gameState.conversationHistory.length - 1].role === 'assistant';

            // 删除最后一条AI响应（只有当最后一条确实是AI消息时才删除）
            if (lastMessageIsAI) {

                // 🔧 保存当前变量状态（用于失败恢复）
                previousVariablesBackup = JSON.parse(JSON.stringify(gameState.variables));

                // 删除AI消息和快照
                removedAIMessage = gameState.conversationHistory.pop();
                if (gameState.variableSnapshots.length > 0) {
                    removedSnapshot = gameState.variableSnapshots.pop();
                }

                // 🆕 从向量库中删除对应的条目
                if (window.contextVectorManager) {
                    // 计算当前轮次（删除AI消息后的轮数）
                    const currentTurn = Math.floor(gameState.conversationHistory.length / 2);
                    
                    // 删除向量库中的这一轮
                    const vectorIndex = window.contextVectorManager.conversationEmbeddings.findIndex(
                        conv => conv.turnIndex === currentTurn + 1
                    );
                    
                    if (vectorIndex !== -1) {
                        window.contextVectorManager.conversationEmbeddings.splice(vectorIndex, 1);
                        console.log(`[向量库] 已删除第${currentTurn + 1}轮的向量记录（重新生成）`);
                    }
                    
                    // 🆕 同时删除history向量库中对应轮次的条目
                    if (window.contextVectorManager.historyEmbeddings) {
                        const historyIndicesToRemove = [];
                        window.contextVectorManager.historyEmbeddings.forEach((entry, index) => {
                            if (entry.turnIndex === currentTurn + 1) {
                                historyIndicesToRemove.push(index);
                            }
                        });
                        
                        // 从后往前删除，避免索引偏移问题
                        for (let i = historyIndicesToRemove.length - 1; i >= 0; i--) {
                            window.contextVectorManager.historyEmbeddings.splice(historyIndicesToRemove[i], 1);
                        }
                        
                        if (historyIndicesToRemove.length > 0) {
                            console.log(`[History向量库] 已删除第${currentTurn + 1}轮的${historyIndicesToRemove.length}条history记录（重新生成）`);
                            
                            // 🔧 同时清理historyMatrix中对应的条目
                            if (window.matrixManager && window.matrixManager.historyMatrix) {
                                // 重建historyMatrix（从当前historyEmbeddings）
                                window.matrixManager.historyMatrix.clear();
                                for (const entry of window.contextVectorManager.historyEmbeddings) {
                                    try {
                                        window.matrixManager.historyMatrix.ingestVector({
                                            vector: entry.vector,
                                            aiResponse: entry.content,
                                            turnIndex: entry.turnIndex,
                                            timestamp: entry.timestamp
                                        });
                                    } catch (error) {
                                        console.warn('[History矩阵] 重建时摄入失败:', error);
                                    }
                                }
                                console.log(`[History矩阵] 已重建（删除第${currentTurn + 1}轮后）`);
                            }
                        }
                    }
                    
                    // 保存到IndexedDB（异步，不阻塞）
                    window.contextVectorManager.saveToIndexedDB().catch(err => 
                        console.warn('[向量库] 保存失败:', err)
                    );
                }

                // 🌍 保存动态世界的独立数据（在回滚前保存）
                const dynamicWorldBackup = {
                    history: JSON.parse(JSON.stringify(gameState.dynamicWorld.history || [])),
                    floor: gameState.dynamicWorld.floor || 0,
                    messageCounter: gameState.dynamicWorld.messageCounter || 0
                };

                // ✅ 回滚变量到用户消息发送时的状态（这是关键！）
                // 用户消息的快照在倒数第二个位置
                if (gameState.variableSnapshots.length > 0) {
                    gameState.variables = JSON.parse(JSON.stringify(
                        gameState.variableSnapshots[gameState.variableSnapshots.length - 1]
                    ));
                    console.log('[重新生成] 已回滚变量到用户消息发送时的状态');
                    updateStatusPanel(); // 立即更新UI显示回滚后的状态
                }

                // 🌍 恢复动态世界的独立数据（回滚后恢复）
                gameState.dynamicWorld.history = dynamicWorldBackup.history;
                gameState.dynamicWorld.floor = dynamicWorldBackup.floor;
                gameState.dynamicWorld.messageCounter = dynamicWorldBackup.messageCounter;
                console.log('[重新生成] 已保护动态世界数据不被回滚');

                // 🆕 只有当确实有AI消息时，才删除UI中的AI消息
                // 删除UI中最后一条AI消息（排除动态世界消息和加载提示）
                const historyDiv = document.getElementById('gameHistory');
                const allAIMessages = historyDiv.querySelectorAll('.ai-message');

                // 过滤出真正的AI回复消息（排除动态世界消息和加载提示）
                const aiResponseMessages = Array.from(allAIMessages).filter(msg => {
                    // 排除加载提示
                    if (msg.id === 'loading-message' || msg.id === 'dynamic-world-loading') {
                        return false;
                    }
                    // 排除动态世界消息（检查header中是否包含"动态世界"文本）
                    const header = msg.querySelector('.message-header');
                    if (header && header.textContent.includes('动态世界')) {
                        return false;
                    }
                    // 排除错误消息
                    if (msg.id === 'error-message-with-retry') {
                        return false;
                    }
                    return true;
                });

                if (aiResponseMessages.length > 0) {
                    removedAIMessageDOM = aiResponseMessages[aiResponseMessages.length - 1];
                    removedAIMessageDOM.remove();
                    console.log('[重新生成] 已删除UI中的AI消息');
                }
            } else {
                // 🆕 如果最后一条不是AI消息（说明之前AI响应失败了），不需要删除任何东西
                console.log('[重新生成] 最后一条消息不是AI消息，无需删除');
            }

            // 获取最后一条用户消息
            const lastUserMessage = gameState.conversationHistory[gameState.conversationHistory.length - 1].content;

            // 🆕 在控制台显示重新生成的提示
            console.log('🔄 [重新生成] 原始用户消息:', lastUserMessage);

            // 🎯 使用统一函数构建增强提示
            const enhancedMessage = buildEnhancedPrompt(lastUserMessage);
            
            console.log('🔄 [重新生成] 增强后的Prompt:', enhancedMessage);

            // 显示加载提示
            const historyDiv = document.getElementById('gameHistory');
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'message ai-message';
            loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI重新思考中...</div>';
            loadingDiv.id = 'loading-message';
            historyDiv.appendChild(loadingDiv);

            try {
                // 从历史记录中临时移除用户消息，避免在buildAIMessages中重复
                // 因为callAI会在buildAIMessages中将用户消息添加到临时的messages数组末尾
                const userMessageObj = gameState.conversationHistory.pop();

                // 🆕 在控制台显示发送给AI的完整Prompt
                console.log('🤖 [重新生成-发送给AI的完整Prompt]', enhancedMessage);

                // 🔧 传入增强后的消息，原始消息用于向量检索
                const response = await callAI(enhancedMessage, false, lastUserMessage);

                // 重新添加用户消息到历史记录，保持历史记录完整
                gameState.conversationHistory.push(userMessageObj);

                // 移除加载提示
                const loading = document.getElementById('loading-message');
                if (loading) loading.remove();

                handleAIResponse(response);

                // 触发动态世界生成（异步，不阻塞主流程）
                generateDynamicWorld().catch(err => console.error('[动态世界] 生成异常:', err));

                // 📨 触发好友自动消息（异步，不阻塞主流程）
                if (typeof window.generateAutoFriendMessage === 'function') {
                    window.generateAutoFriendMessage().catch(err => console.error('[📨好友自动消息] 生成异常:', err));
                }

            } catch (error) {
                // 移除加载提示
                const loading = document.getElementById('loading-message');
                if (loading) loading.remove();
                
                // 🔧 恢复被删除的AI消息和变量快照
                if (removedAIMessage) {
                    gameState.conversationHistory.push(removedAIMessage);
                    console.log('[重试恢复] 已恢复AI消息到历史记录');
                }
                if (removedSnapshot) {
                    gameState.variableSnapshots.push(removedSnapshot);
                    console.log('[重试恢复] 已恢复变量快照');
                }
                
                // 🔧 恢复变量状态（如果有备份）
                if (previousVariablesBackup) {
                    gameState.variables = previousVariablesBackup;
                    updateStatusPanel();
                    console.log('[重试恢复] 已恢复变量状态');
                }
                
                // 🔧 恢复AI消息的DOM
                if (removedAIMessageDOM) {
                    historyDiv.appendChild(removedAIMessageDOM);
                    console.log('[重试恢复] 已恢复AI消息DOM');
                }
                
                // 错误时也要恢复用户消息（如果已经被pop了）
                if (gameState.conversationHistory.length === 0 || 
                    gameState.conversationHistory[gameState.conversationHistory.length - 1].role !== 'user') {
                    // 如果最后一条不是用户消息，需要重新添加
                    gameState.conversationHistory.push({
                        role: 'user',
                        content: lastUserMessage
                    });
                    console.log('[重试恢复] 已恢复用户消息到历史记录');
                }

                // 显示错误和重试按钮
                displayErrorMessageWithRetry('重新生成失败：' + error.message, async () => {
                    // 移除错误消息
                    const errorDiv = document.getElementById('error-message-with-retry');
                    if (errorDiv) errorDiv.remove();
                    
                    // 再次重试
                    await regenerateLastResponse();
                });
            }

            // 🔧 停止全局输入框保护
            userInputProtection.stop();

            gameState.isProcessing = false;
        }

        // 🔧 防抖动的重新生成函数，防止快速多次点击
        let regenerateDebounceTimer = null;
        function regenerateLastResponseDebounced() {
            if (regenerateDebounceTimer) {
                clearTimeout(regenerateDebounceTimer);
            }
            
            // 禁用按钮防止重复点击
            const regenerateBtns = document.querySelectorAll('.regenerate-btn');
            regenerateBtns.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
            
            regenerateDebounceTimer = setTimeout(async () => {
                try {
                    await regenerateLastResponse();
                } finally {
                    // 重新启用按钮
                    const regenerateBtns = document.querySelectorAll('.regenerate-btn');
                    regenerateBtns.forEach(btn => {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                        btn.style.cursor = 'pointer';
                    });
                    regenerateDebounceTimer = null;
                }
            }, 300); // 300ms 防抖延迟
        }

        // 🔧 全局保护用户输入框，防止被意外修改
        let userInputProtection = {
            isActive: false,
            originalValue: '',
            protectedElement: null,
            
            start: function() {
                const userInput = document.getElementById('userInput');
                if (userInput && !this.isActive) {
                    this.originalValue = userInput.value;
                    this.protectedElement = userInput;
                    this.isActive = true;
                    
                    // 监听值变化，如果被意外修改则立即恢复
                    this.observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                                if (this.protectedElement.value !== this.originalValue) {
                                    console.warn('[输入框保护] 检测到输入框被意外修改，正在恢复...');
                                    this.protectedElement.value = this.originalValue;
                                }
                            }
                        });
                    });
                    
                    this.observer.observe(this.protectedElement, { attributes: true });
                }
            },
            
            stop: function() {
                if (this.isActive && this.observer) {
                    this.observer.disconnect();
                    this.isActive = false;
                    this.protectedElement = null;
                    this.originalValue = '';
                }
            }
        };
