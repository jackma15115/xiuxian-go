/**
 * API管理器 - 处理所有AI相关的API调用
 * 支持多种API格式和配置
 */

export class APIManager {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.config = {
            endpoint: '',
            apiKey: '',
            model: '',
            type: 'openai', // openai, gemini, claude
            temperature: 0.8,
            maxTokens: 2000
        };
        this.extraConfig = null; // 额外API配置（用于动态世界等）
        this.systemPrompt = '';
        this.conversationHistory = [];
        this.isProcessing = false;
    }

    /**
     * 初始化
     */
    async init() {
        // 加载保存的API配置
        const saved = await this.gameCore.managers.storage.loadGlobalSetting('apiConfig');
        if (saved) {
            this.config = { ...this.config, ...saved };
        }
        
        const extraSaved = await this.gameCore.managers.storage.loadGlobalSetting('extraApiConfig');
        if (extraSaved) {
            this.extraConfig = extraSaved;
        }
    }

    /**
     * 设置系统提示词
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        console.log('[APIManager] 系统提示词已更新');
    }

    /**
     * 设置API配置
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
        this.gameCore.managers.storage.saveGlobalSetting('apiConfig', this.config);
    }

    /**
     * 设置额外API配置
     */
    setExtraConfig(config) {
        this.extraConfig = config;
        this.gameCore.managers.storage.saveGlobalSetting('extraApiConfig', config);
    }

    /**
     * 发送消息到AI
     */
    async sendMessage(message, options = {}) {
        if (this.isProcessing && !options.force) {
            console.warn('[APIManager] 已有请求正在处理中');
            return null;
        }

        this.isProcessing = true;
        
        try {
            // 构建消息列表
            const messages = this.buildMessages(message, options);
            
            // 选择API
            const useExtraAPI = options.useExtraAPI && this.extraConfig;
            const config = useExtraAPI ? this.extraConfig : this.config;
            
            // 调用API
            const response = await this.callAPI(messages, config);
            
            // 处理响应
            const processedResponse = await this.processResponse(response, options);
            
            // 添加到历史
            if (!options.noHistory) {
                this.addToHistory(message, processedResponse);
            }
            
            // 触发事件
            this.gameCore.eventBus.emit('api:response', {
                request: message,
                response: processedResponse,
                raw: response
            });
            
            return processedResponse;
        } catch (error) {
            console.error('[APIManager] API调用失败:', error);
            this.gameCore.eventBus.emit('api:error', { error, message });
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 构建消息列表
     */
    buildMessages(userMessage, options = {}) {
        const messages = [];
        
        // 添加系统提示词
        if (this.systemPrompt) {
            messages.push({
                role: 'system',
                content: this.systemPrompt
            });
        }
        
        // 添加知识库上下文
        if (!options.noKnowledge && this.gameCore.managers.knowledge) {
            const knowledgeContext = this.gameCore.managers.knowledge.getRelevantKnowledge(userMessage);
            if (knowledgeContext) {
                messages.push({
                    role: 'system',
                    content: `相关知识：\n${knowledgeContext}`
                });
            }
        }
        
        // 添加变量状态
        if (!options.noVariables) {
            const variables = this.gameCore.managers.state.get('variables');
            if (variables && Object.keys(variables).length > 0) {
                messages.push({
                    role: 'system',
                    content: `当前游戏变量：\n${JSON.stringify(variables, null, 2)}`
                });
            }
        }
        
        // 添加对话历史
        const historyLimit = options.historyLimit || 10;
        const recentHistory = this.conversationHistory.slice(-historyLimit);
        messages.push(...recentHistory);
        
        // 添加用户消息
        messages.push({
            role: 'user',
            content: userMessage
        });
        
        return messages;
    }

    /**
     * 调用API
     */
    async callAPI(messages, config) {
        const endpoint = this.getEndpoint(config);
        const headers = this.getHeaders(config);
        const body = this.getRequestBody(messages, config);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        return this.extractContent(data, config);
    }

    /**
     * 获取API端点
     */
    getEndpoint(config) {
        switch (config.type) {
            case 'gemini':
                return `${config.endpoint}/models/${config.model}:generateContent?key=${config.apiKey}`;
            case 'openai':
            case 'claude':
            default:
                return `${config.endpoint}/chat/completions`;
        }
    }

    /**
     * 获取请求头
     */
    getHeaders(config) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (config.type !== 'gemini') {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
        
        if (config.type === 'claude') {
            headers['anthropic-version'] = '2023-06-01';
        }
        
        return headers;
    }

    /**
     * 获取请求体
     */
    getRequestBody(messages, config) {
        switch (config.type) {
            case 'gemini':
                return this.buildGeminiBody(messages, config);
            case 'claude':
                return this.buildClaudeBody(messages, config);
            default:
                return this.buildOpenAIBody(messages, config);
        }
    }

    /**
     * 构建OpenAI格式请求体
     */
    buildOpenAIBody(messages, config) {
        return {
            model: config.model || 'gpt-3.5-turbo',
            messages: messages,
            temperature: config.temperature || 0.8,
            max_tokens: config.maxTokens || 2000,
            presence_penalty: config.presencePenalty || 0,
            frequency_penalty: config.frequencyPenalty || 0
        };
    }

    /**
     * 构建Gemini格式请求体
     */
    buildGeminiBody(messages, config) {
        const systemMessage = messages.find(m => m.role === 'system');
        const contents = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
        
        return {
            contents: contents,
            systemInstruction: systemMessage ? {
                parts: [{ text: systemMessage.content }]
            } : undefined,
            generationConfig: {
                temperature: config.temperature || 0.8,
                maxOutputTokens: config.maxTokens || 2000,
                topK: 40,
                topP: 0.95
            }
        };
    }

    /**
     * 构建Claude格式请求体
     */
    buildClaudeBody(messages, config) {
        const systemMessage = messages.find(m => m.role === 'system');
        const userMessages = messages.filter(m => m.role !== 'system');
        
        return {
            model: config.model || 'claude-3-sonnet-20240229',
            messages: userMessages,
            system: systemMessage ? systemMessage.content : undefined,
            max_tokens: config.maxTokens || 2000,
            temperature: config.temperature || 0.8
        };
    }

    /**
     * 提取响应内容
     */
    extractContent(data, config) {
        switch (config.type) {
            case 'gemini':
                return data.candidates[0].content.parts[0].text;
            case 'claude':
                return data.content[0].text;
            default:
                return data.choices[0].message.content;
        }
    }

    /**
     * 处理响应
     */
    async processResponse(response, options = {}) {
        const processed = {
            content: response,
            variables: null,
            options: null,
            metadata: {}
        };
        
        // 尝试解析JSON部分（变量更新）
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[1]);
                if (jsonData.variables) {
                    processed.variables = jsonData.variables;
                }
                if (jsonData.options) {
                    processed.options = jsonData.options;
                }
                processed.metadata = jsonData;
            } catch (error) {
                console.warn('[APIManager] JSON解析失败:', error);
            }
        }
        
        // 解析选项（如果有特定格式）
        const optionMatches = response.match(/\d+\.\s*(.+?)(?=\n\d+\.|\n*$)/g);
        if (optionMatches && optionMatches.length > 0) {
            processed.options = optionMatches.map(opt => opt.replace(/^\d+\.\s*/, '').trim());
        }
        
        return processed;
    }

    /**
     * 添加到对话历史
     */
    addToHistory(userMessage, aiResponse) {
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });
        
        this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse.content
        });
        
        // 限制历史长度
        const maxHistory = 50;
        if (this.conversationHistory.length > maxHistory * 2) {
            this.conversationHistory = this.conversationHistory.slice(-maxHistory);
        }
        
        // 同步到状态管理器
        this.gameCore.managers.state.addConversation({
            role: 'user',
            content: userMessage
        });
        
        this.gameCore.managers.state.addConversation({
            role: 'assistant',
            content: aiResponse.content
        });
    }

    /**
     * 清除对话历史
     */
    clearHistory() {
        this.conversationHistory = [];
        console.log('[APIManager] 对话历史已清除');
    }

    /**
     * 测试API连接
     */
    async testConnection(config = null) {
        const testConfig = config || this.config;
        
        try {
            const messages = [{
                role: 'user',
                content: '请用一句话介绍你自己'
            }];
            
            const response = await this.callAPI(messages, testConfig);
            return {
                success: true,
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 导出对话历史
     */
    exportHistory() {
        return {
            systemPrompt: this.systemPrompt,
            history: this.conversationHistory,
            exportedAt: Date.now()
        };
    }

    /**
     * 导入对话历史
     */
    importHistory(data) {
        if (data.systemPrompt) {
            this.systemPrompt = data.systemPrompt;
        }
        if (data.history) {
            this.conversationHistory = data.history;
        }
        console.log('[APIManager] 对话历史已导入');
    }
}
