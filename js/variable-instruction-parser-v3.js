/**
 * 变量指令解析器 v3.0 - 简化版
 * 使用 <变量更新></变量更新> 标签，不需要 | 和 ```
 */
class VariableInstructionParserV3 {
    constructor(gameState, options = {}) {
        this.gameState = gameState;
        this.options = {
            debug: options.debug || false,
            enableRollback: options.enableRollback !== false,
            ...options
        };
        this.executionLog = [];
        this.rollbackBackup = null;
    }
    
    /**
     * 执行指令
     * @param {string} response - AI的完整回复
     * @returns {Object} 执行结果
     */
    execute(response) {
        // 清空日志
        this.executionLog = [];
        
        // 创建回滚备份
        if (this.options.enableRollback) {
            this.rollbackBackup = JSON.parse(JSON.stringify(this.gameState.variables));
            this.log('已创建回滚备份');
        }
        
        try {
            // 提取变量更新内容
            const content = this.extractVariableUpdate(response);
            
            if (!content) {
                this.log('未检测到变量更新标签');
                return { success: true, executed: 0, errors: [] };
            }
            
            // 解析并执行指令
            const instructions = this.parseContent(content);
            const count = this.applyInstructions(instructions);
            
            this.log(`✅ 执行完成: ${count} 个操作`);
            return { success: true, executed: count, errors: [] };
            
        } catch (error) {
            this.log(`❌ 执行失败: ${error.message}`);
            
            // 回滚
            if (this.options.enableRollback && this.rollbackBackup) {
                this.gameState.variables = this.rollbackBackup;
                this.log('已回滚到之前状态');
            }
            
            return { success: false, executed: 0, errors: [error.message] };
        }
    }
    
    /**
     * 提取变量更新内容
     * @param {string} response - AI回复
     * @returns {string|null} 变量更新内容
     */
    extractVariableUpdate(response) {
        // 支持 <变量更新> 和 <variable_update>
        const patterns = [
            /<变量更新>([\s\S]*?)<\/变量更新>/,
            /<variable_update>([\s\S]*?)<\/variable_update>/
        ];
        
        for (const pattern of patterns) {
            const match = response.match(pattern);
            if (match && match[1]) {
                this.log('提取到变量更新内容');
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    /**
     * 解析内容
     * @param {string} content - 变量更新内容
     * @returns {Object} 指令对象
     */
    parseContent(content) {
        const instructions = {
            numChanges: [],
            sets: {},
            itemsAdd: [],
            relationshipsUpdate: {},
            historyAdd: []
        };
        
        const lines = content.split('\n');
        let currentSection = null;
        let currentObject = null;
        let inItemsSection = false;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // 跳过空行和注释
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            
            // 检查是否是章节标题（如 # 添加物品）
            if (trimmed.startsWith('#')) {
                currentSection = trimmed.substring(1).trim();
                inItemsSection = currentSection.includes('物品') || currentSection.includes('items');
                continue;
            }
            
            // 解析键值对
            if (trimmed.includes(':')) {
                const [key, value] = this.splitKeyValue(trimmed);
                
                // 处理特殊键
                if (key.includes('.')) {
                    this.processNestedKey(instructions, key, value);
                } else {
                    this.processKeyValue(instructions, key, value);
                }
            }
            // 处理列表项（如 - name: 物品）
            else if (trimmed.startsWith('- ')) {
                const itemContent = trimmed.substring(2).trim();
                if (itemContent.includes(':')) {
                    const [key, value] = this.splitKeyValue(itemContent);
                    if (!currentObject) {
                        currentObject = {};
                    }
                    currentObject[key] = this.parseValue(value);
                } else {
                    // 简单列表项
                    instructions.itemsAdd.push({ name: itemContent });
                }
            }
            // 继续当前对象的属性（缩进的行）
            else if (currentObject && trimmed.includes(':')) {
                const [key, value] = this.splitKeyValue(trimmed);
                currentObject[key] = this.parseValue(value);
            }
            // 保存对象（空行表示对象结束）
            else if (!trimmed && currentObject) {
                instructions.itemsAdd.push(currentObject);
                currentObject = null;
            }
        }
        
        // 保存最后一个对象
        if (currentObject) {
            instructions.itemsAdd.push(currentObject);
        }
        
        return instructions;
    }
    
    /**
     * 分割键值
     * @param {string} line - 行内容
     * @returns {Array} [key, value]
     */
    splitKeyValue(line) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        return [key, value];
    }
    
    /**
     * 解析值
     * @param {string} value - 值字符串
     * @returns {any} 解析后的值
     */
    parseValue(value) {
        if (!value) return '';
        
        // 数值
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return parseFloat(value);
        }
        
        // 布尔值
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        // 字符串
        return value;
    }
    
    /**
     * 处理键值对
     * @param {Object} instructions - 指令对象
     * @param {string} key - 键
     * @param {string} value - 值
     */
    processKeyValue(instructions, key, value) {
        // 数值变化
        if (typeof value === 'string' && /^[+\-=]/.test(value)) {
            const match = value.match(/^([+\-=])(\d+(?:\.\d+)?)/);
            if (match) {
                instructions.numChanges.push({
                    path: key,
                    operator: match[1],
                    value: parseFloat(match[2])
                });
                return;
            }
        }
        
        // 历史记录
        if (key === 'history.add') {
            instructions.historyAdd.push(value);
            return;
        }
        
        // 其他直接设置
        instructions.sets[key] = this.parseValue(value);
    }
    
    /**
     * 处理嵌套键
     * @param {Object} instructions - 指令对象
     * @param {string} key - 键
     * @param {string} value - 值
     */
    processNestedKey(instructions, key, value) {
        const parts = key.split('.');
        
        if (parts[0] === 'items' && parts[1] === 'add') {
            // items.add: 物品名
            instructions.itemsAdd.push({ name: value });
        } else if (parts[0] === 'relationships' && parts[1] === 'update') {
            if (parts[2]) {
                if (!instructions.relationshipsUpdate[parts[2]]) {
                    instructions.relationshipsUpdate[parts[2]] = {};
                }
                instructions.relationshipsUpdate[parts[2]][parts[3] || 'favor'] = this.parseValue(value);
            }
        }
    }
    
    /**
     * 应用指令
     * @param {Object} instructions - 指令对象
     * @returns {number} 执行的操作数
     */
    applyInstructions(instructions) {
        let count = 0;
        
        // 1. 数值变化
        for (const change of instructions.numChanges) {
            this.applyNumChange(change);
            count++;
        }
        
        // 2. 直接设置
        for (const [key, value] of Object.entries(instructions.sets)) {
            this.setValueByPath(key, value);
            count++;
        }
        
        // 3. 添加物品
        for (const item of instructions.itemsAdd) {
            this.addItem(item);
            count++;
        }
        
        // 4. 更新关系
        for (const [name, updates] of Object.entries(instructions.relationshipsUpdate)) {
            this.updateRelationship(name, updates);
            count++;
        }
        
        // 5. 添加历史
        for (const history of instructions.historyAdd) {
            this.addHistory(history);
            count++;
        }
        
        return count;
    }
    
    /**
     * 应用数值变化
     * @param {Object} change - 变化对象
     */
    applyNumChange(change) {
        const current = this.getValueByPath(change.path) || 0;
        let newValue;
        
        switch (change.operator) {
            case '+':
                newValue = current + change.value;
                break;
            case '-':
                newValue = current - change.value;
                break;
            case '=':
                newValue = change.value;
                break;
        }
        
        this.setValueByPath(change.path, newValue);
        this.log(`[数值变化] ${change.path}: ${current} → ${newValue}`);
    }
    
    /**
     * 添加物品
     * @param {Object} item - 物品对象
     */
    addItem(item) {
        const items = this.getValueByPath('items') || [];
        items.push(item);
        this.setValueByPath('items', items);
        this.log(`[添加物品] ${item.name || '未知物品'}`);
    }
    
    /**
     * 更新关系
     * @param {string} name - 角色名
     * @param {Object} updates - 更新内容
     */
    updateRelationship(name, updates) {
        const relationships = this.getValueByPath('relationships') || [];
        const index = relationships.findIndex(r => r.name === name);
        
        if (index !== -1) {
            Object.assign(relationships[index], updates);
            this.log(`[更新关系] ${name}: ${Object.keys(updates).join(', ')}`);
        } else {
            relationships.push({ name, ...updates });
            this.log(`[新增关系] ${name}`);
        }
        
        this.setValueByPath('relationships', relationships);
    }
    
    /**
     * 添加历史
     * @param {string} text - 历史文本
     */
    addHistory(text) {
        const history = this.getValueByPath('history') || [];
        if (!history.includes(text)) {
            history.push(text);
            this.setValueByPath('history', history);
            this.log(`[添加历史] ${text.substring(0, 30)}...`);
        }
    }
    
    /**
     * 通过路径获取值
     * @param {string} path - 路径
     * @returns {any} 值
     */
    getValueByPath(path) {
        const parts = path.split('.');
        let current = this.gameState.variables;
        
        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }
    
    /**
     * 通过路径设置值
     * @param {string} path - 路径
     * @param {any} value - 值
     */
    setValueByPath(path, value) {
        const parts = path.split('.');
        let current = this.gameState.variables;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (current[part] === undefined || current[part] === null) {
                current[part] = {};
            }
            current = current[part];
        }
        
        current[parts[parts.length - 1]] = value;
    }
    
    /**
     * 记录日志
     * @param {string} message - 日志消息
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[变量指令 v3] ${message}`);
            this.executionLog.push(message);
        }
    }
    
    /**
     * 获取执行日志
     * @returns {Array} 日志数组
     */
    getExecutionLog() {
        return [...this.executionLog];
    }
    
    /**
     * 清空日志
     */
    clearLog() {
        this.executionLog = [];
    }
}

// 导出（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariableInstructionParserV3;
}
