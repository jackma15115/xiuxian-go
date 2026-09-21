/**
 * 变量指令解析器 v2.0
 * 使用 Markdown 代码块 + YAML 风格的自然语法
 * 
 * @author Variable Instruction System
 * @version 2.0.0
 */

class VariableInstructionParserV2 {
    /**
     * @param {Object} gameState - 游戏状态对象
     * @param {Object} options - 配置选项
     */
    constructor(gameState, options = {}) {
        this.gameState = gameState;
        this.options = {
            debug: options.debug || false,
            enableRollback: options.enableRollback !== false,
            maxInstructionsPerBlock: options.maxInstructionsPerBlock || 100,
            ...options
        };
        
        // 指令执行日志
        this.executionLog = [];
        
        // 回滚备份
        this.rollbackBackup = null;
        
        console.log('[变量指令解析器 v2] 初始化', this.options);
    }
    
    /**
     * 从AI回复中提取变量更新块
     * @param {string} response - AI的完整回复
     * @returns {Array} 提取的代码块列表
     */
    extractInstructionBlocks(response) {
        const blocks = [];
        // 匹配 ```变量更新 或 ```variable_update
        const regex = /```(?:变量更新|variable_update)\s*\n([\s\S]*?)```/g;
        let match;
        
        while ((match = regex.exec(response)) !== null) {
            blocks.push(match[1].trim());
        }
        
        this.log(`提取到 ${blocks.length} 个变量更新块`);
        return blocks;
    }
    
    /**
     * 解析YAML风格的指令块
     * @param {string} blockText - 代码块内容
     * @returns {Object} 解析后的指令对象
     */
    parseBlock(blockText) {
        const instructions = {
            numChanges: [],      // 数值变化
            sets: {},            // 直接设置
            itemsAdd: [],        // 添加物品
            itemsRemove: [],     // 删除物品
            relationshipsUpdate: {}, // 更新关系
            relationshipsRemove: [], // 删除关系
            techniquesAdd: [],   // 添加功法
            spellsAdd: [],       // 添加法术
            historyAdd: [],      // 添加历史 - 改为数组
            equipmentSet: {}     // 设置装备
        };
        
        const lines = blockText.split('\n');
        let i = 0;
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            // 跳过空行和注释
            if (!line || line.startsWith('#') || line.startsWith('//')) {
                i++;
                continue;
            }
            
            // 检查是否是多行值的开始（|）
            if (line.includes(': |')) {
                const result = this.parseMultilineValue(lines, i);
                const [key, value] = result;
                this.processKeyValue(instructions, key.replace(': |', '').trim(), value);
                i = result[2]; // 跳到多行值后面
                continue;
            }
            
            // 检查是否是对象或列表的开始
            if (line.endsWith(':') && !line.includes(': ')) {
                const key = line.slice(0, -1).trim();
                const result = this.parseNestedStructure(lines, i + 1);
                this.processNestedKey(instructions, key, result.value);
                i = result.nextIndex;
                continue;
            }
            
            // 普通键值对
            if (line.includes(':')) {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // 移除行末注释
                value = this.removeComment(value);
                
                this.processKeyValue(instructions, key, value);
            }
            
            i++;
        }
        
        return instructions;
    }
    
    /**
     * 解析多行值（| 语法）
     * @param {Array} lines - 所有行
     * @param {number} startIndex - 开始索引
     * @returns {Array} [key, value, nextIndex]
     */
    parseMultilineValue(lines, startIndex) {
        const key = lines[startIndex].split(':')[0].trim();
        const valueLines = [];
        let i = startIndex + 1;
        
        // 获取基础缩进
        while (i < lines.length) {
            const line = lines[i];
            if (!line.trim()) {
                i++;
                continue;
            }
            
            // 检查是否还在多行值内（通过缩进判断）
            if (line.startsWith('  ') || line.startsWith('\t')) {
                valueLines.push(line.trim());
                i++;
            } else {
                break;
            }
        }
        
        return [key, valueLines.join('\n'), i];
    }
    
    /**
     * 解析嵌套结构（对象或列表）
     * @param {Array} lines - 所有行
     * @param {number} startIndex - 开始索引
     * @returns {Object} {value, nextIndex}
     */
    parseNestedStructure(lines, startIndex) {
        const baseIndent = this.getIndent(lines[startIndex]);
        let i = startIndex;
        let isList = false;
        let result = [];
        let currentObject = null;
        
        while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
                i++;
                continue;
            }
            
            const indent = this.getIndent(line);
            
            // 如果缩进小于基础缩进，结束
            if (indent < baseIndent) {
                break;
            }
            
            // 检查是否是列表项
            if (trimmed.startsWith('- ')) {
                isList = true;
                if (currentObject) {
                    result.push(currentObject);
                    currentObject = null;
                }
                
                const itemContent = trimmed.substring(2).trim();
                if (itemContent.includes(':')) {
                    currentObject = {};
                    const [key, value] = this.splitKeyValue(itemContent);
                    currentObject[key] = this.parseValue(value);
                } else {
                    result.push(itemContent);
                }
            }
            // 对象属性
            else if (trimmed.includes(':')) {
                const [key, value] = this.splitKeyValue(trimmed);
                
                if (!isList) {
                    // 不是列表，创建单个对象
                    if (!currentObject) {
                        currentObject = {};
                    }
                    currentObject[key] = this.parseValue(value);
                } else if (currentObject && typeof currentObject === 'object') {
                    // 列表中的对象属性
                    currentObject[key] = this.parseValue(value);
                }
            }
            
            i++;
        }
        
        // 保存最后一个对象
        if (currentObject) {
            if (isList) {
                result.push(currentObject);
            } else {
                result = currentObject;
            }
        }
        
        return { value: result, nextIndex: i };
    }
    
    /**
     * 获取行的缩进级别
     * @param {string} line - 行内容
     * @returns {number} 缩进空格数
     */
    getIndent(line) {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
    }
    
    /**
     * 分割键值对
     * @param {string} line - 行内容
     * @returns {Array} [key, value]
     */
    splitKeyValue(line) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        return [key, this.removeComment(value)];
    }
    
    /**
     * 移除行末注释
     * @param {string} value - 值
     * @returns {string} 移除注释后的值
     */
    removeComment(value) {
        // 移除 // 和 # 注释
        const commentMatch = value.match(/^(.*?)\s*(?:\/\/|#)/);
        return commentMatch ? commentMatch[1].trim() : value;
    }
    
    /**
     * 解析值（自动类型推断）
     * @param {string} value - 字符串值
     * @returns {any} 解析后的值
     */
    parseValue(value) {
        if (!value) return '';
        
        // 布尔值
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (value === 'null') return null;
        
        // 数字
        if (/^-?\d+(\.\d+)?$/.test(value)) {
            return parseFloat(value);
        }
        
        // JSON 对象/数组
        if ((value.startsWith('{') && value.endsWith('}')) ||
            (value.startsWith('[') && value.endsWith(']'))) {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        
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
        // 数值变化（+、-、= 前缀）
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
        
        // 历史记录 - 支持多条
        if (key === 'history.add') {
            if (!instructions.historyAdd) {
                instructions.historyAdd = [];
            }
            instructions.historyAdd.push(value);
            return;
        }
        
        // 其他情况，作为直接设置
        instructions.sets[key] = this.parseValue(value);
    }
    
    /**
     * 处理嵌套键（如 items.add）
     * @param {Object} instructions - 指令对象
     * @param {string} key - 键
     * @param {any} value - 值
     */
    processNestedKey(instructions, key, value) {
        const parts = key.split('.');
        
        if (parts[0] === 'items') {
            if (parts[1] === 'add') {
                instructions.itemsAdd = value;
            } else if (parts[1] === 'remove') {
                instructions.itemsRemove = value;
            }
        } else if (parts[0] === 'relationships') {
            if (parts[1] === 'update') {
                if (parts[2]) {
                    // relationships.update.角色名
                    if (!instructions.relationshipsUpdate) {
                        instructions.relationshipsUpdate = {};
                    }
                    // value 可能是对象或数组
                    if (Array.isArray(value)) {
                        instructions.relationshipsUpdate[parts[2]] = value[0] || {};
                    } else if (value && typeof value === 'object') {
                        instructions.relationshipsUpdate[parts[2]] = value;
                    } else {
                        instructions.relationshipsUpdate[parts[2]] = {};
                    }
                }
            } else if (parts[1] === 'remove') {
                instructions.relationshipsRemove = value;
            }
        } else if (parts[0] === 'techniques') {
            if (parts[1] === 'add') {
                instructions.techniquesAdd = value;
            }
        } else if (parts[0] === 'spells') {
            if (parts[1] === 'add') {
                instructions.spellsAdd = value;
            }
        } else if (parts[0] === 'equipment') {
            if (parts[1] === 'set') {
                instructions.equipmentSet = Array.isArray(value) ? value[0] : value;
            }
        }
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
            // 提取指令块
            const blocks = this.extractInstructionBlocks(response);
            
            if (blocks.length === 0) {
                this.log('未检测到任何变量更新块');
                return { success: true, executed: 0, errors: [] };
            }
            
            // 执行所有块
            let totalOperations = 0;
            const errors = [];
            
            for (const block of blocks) {
                try {
                    const instructions = this.parseBlock(block);
                    const count = this.applyInstructions(instructions);
                    totalOperations += count;
                } catch (error) {
                    errors.push({
                        block: block.substring(0, 100) + '...',
                        error: error.message
                    });
                    this.error(`执行指令块失败`, error);
                }
            }
            
            // 输出执行摘要
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`[变量指令 v2] ✅ 执行完成: ${totalOperations} 个操作`);
            if (errors.length > 0) {
                console.log(`[变量指令 v2] ⚠️ 错误: ${errors.length} 个块执行失败`);
                errors.forEach(e => console.log(`  - ${e.error}`));
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            return {
                success: errors.length === 0,
                executed: totalOperations,
                blocks: blocks.length,
                errors
            };
            
        } catch (error) {
            this.error('指令执行过程出现严重错误', error);
            
            // 回滚
            if (this.options.enableRollback && this.rollbackBackup) {
                this.gameState.variables = this.rollbackBackup;
                this.log('已回滚到执行前状态');
            }
            
            return {
                success: false,
                executed: 0,
                errors: [{ block: 'SYSTEM', error: error.message }]
            };
        }
    }
    
    /**
     * 应用解析后的指令
     * @param {Object} instructions - 指令对象
     * @returns {number} 执行的操作数
     */
    applyInstructions(instructions) {
        console.log('  [调试] 解析后的指令:', JSON.stringify(instructions, null, 2));
        
        let count = 0;
        
        // 1. 数值变化
        for (const change of instructions.numChanges) {
            this.applyNumChange(change);
            count++;
        }
        
        // 2. 直接设置
        for (const [key, value] of Object.entries(instructions.sets)) {
            this.setValueByPath(key, value);
            console.log(`  [设置] ${key}: ${JSON.stringify(value)}`);
            count++;
        }
        
        // 3. 添加物品
        for (const item of instructions.itemsAdd) {
            this.addItem(item);
            count++;
        }
        
        // 4. 删除物品
        for (const itemName of instructions.itemsRemove) {
            this.removeItem(itemName);
            count++;
        }
        
        // 5. 更新关系
        if (instructions.relationshipsUpdate) {
            for (const [name, updates] of Object.entries(instructions.relationshipsUpdate)) {
                this.updateRelationship(name, updates);
                count++;
            }
        }
        
        // 6. 删除关系
        for (const name of instructions.relationshipsRemove) {
            this.removeRelationship(name);
            count++;
        }
        
        // 7. 添加功法
        for (const technique of instructions.techniquesAdd) {
            this.addToArray('techniques', technique);
            count++;
        }
        
        // 8. 添加法术
        for (const spell of instructions.spellsAdd) {
            this.addToArray('spells', spell);
            count++;
        }
        
        // 9. 添加历史
        if (instructions.historyAdd && instructions.historyAdd.length > 0) {
            for (const history of instructions.historyAdd) {
                this.addHistory(history);
                count++;
            }
        }
        
        // 10. 设置装备
        if (Object.keys(instructions.equipmentSet).length > 0) {
            this.setEquipment(instructions.equipmentSet);
            count++;
        }
        
        return count;
    }
    
    /**
     * 应用数值变化
     * @param {Object} change - {path, operator, value}
     */
    applyNumChange(change) {
        const { path, operator, value } = change;
        const oldValue = this.getValueByPath(path) || 0;
        let newValue;
        
        switch (operator) {
            case '+':
                newValue = oldValue + value;
                break;
            case '-':
                newValue = oldValue - value;
                break;
            case '=':
                newValue = value;
                break;
        }
        
        this.setValueByPath(path, newValue);
        console.log(`  [数值变化] ${path}: ${oldValue} ${operator} ${value} = ${newValue}`);
    }
    
    /**
     * 添加物品
     * @param {Object|string} item - 物品对象或名称
     */
    addItem(item) {
        let items = this.getValueByPath('items');
        if (!items) {
            items = [];
            this.setValueByPath('items', items);
        }
        
        const itemObj = typeof item === 'string' ? { name: item, count: 1 } : item;
        
        // 检查是否已存在
        const existingIndex = items.findIndex(i => i.name === itemObj.name);
        if (existingIndex !== -1) {
            // 合并数量
            if (itemObj.count) {
                items[existingIndex].count = (items[existingIndex].count || 1) + itemObj.count;
            }
            // 合并其他属性
            Object.assign(items[existingIndex], itemObj);
            console.log(`  [添加物品] ${itemObj.name}: 已存在，合并更新`);
        } else {
            items.push(itemObj);
            console.log(`  [添加物品] ${itemObj.name}: 新增`);
        }
    }
    
    /**
     * 删除物品
     * @param {string} itemName - 物品名称
     */
    removeItem(itemName) {
        const items = this.getValueByPath('items');
        if (!items) return;
        
        const index = items.findIndex(i => i.name === itemName);
        if (index !== -1) {
            items.splice(index, 1);
            console.log(`  [删除物品] ${itemName}: 已删除`);
        }
    }
    
    /**
     * 更新关系
     * @param {string} name - 角色名称
     * @param {Object} updates - 更新内容
     */
    updateRelationship(name, updates) {
        // 参数检查
        if (!name || !updates || typeof updates !== 'object') {
            console.warn(`  [更新关系] 参数错误: name=${name}, updates=${updates}`);
            return;
        }
        
        let relationships = this.getValueByPath('relationships');
        if (!relationships) {
            relationships = [];
            this.setValueByPath('relationships', relationships);
        }
        
        const index = relationships.findIndex(r => r.name === name);
        if (index !== -1) {
            Object.assign(relationships[index], updates);
            console.log(`  [更新关系] ${name}: 已更新 ${Object.keys(updates).join(', ')}`);
        } else {
            relationships.push({ name, ...updates });
            console.log(`  [更新关系] ${name}: 新增关系`);
        }
    }
    
    /**
     * 删除关系
     * @param {string} name - 角色名称
     */
    removeRelationship(name) {
        const relationships = this.getValueByPath('relationships');
        if (!relationships) return;
        
        const index = relationships.findIndex(r => r.name === name);
        if (index !== -1) {
            relationships.splice(index, 1);
            console.log(`  [删除关系] ${name}: 已删除`);
        }
    }
    
    /**
     * 添加历史记录
     * @param {string} text - 历史文本
     */
    addHistory(text) {
        let history = this.getValueByPath('history');
        if (!history) {
            history = [];
            this.setValueByPath('history', history);
        }
        
        // 去重
        if (!history.includes(text)) {
            history.push(text);
            console.log(`  [添加历史] ${text.substring(0, 50)}...`);
        }
    }
    
    /**
     * 添加到数组
     * @param {string} path - 数组路径
     * @param {any} item - 项目
     */
    addToArray(path, item) {
        let arr = this.getValueByPath(path);
        if (!arr) {
            arr = [];
            this.setValueByPath(path, arr);
        }
        
        arr.push(item);
        console.log(`  [添加] ${path}: ${JSON.stringify(item).substring(0, 50)}`);
    }
    
    /**
     * 设置装备
     * @param {Object} equipment - 装备对象
     */
    setEquipment(equipment) {
        const currentEquipment = this.getValueByPath('equipment') || {};
        Object.assign(currentEquipment, equipment);
        this.setValueByPath('equipment', currentEquipment);
        console.log(`  [设置装备] 已更新 ${Object.keys(equipment).join(', ')}`);
    }
    
    /**
     * 通过路径获取值
     * @param {string} path - 点分隔的路径
     * @returns {any}
     */
    getValueByPath(path) {
        const parts = path.split('.');
        let current = this.gameState.variables;
        
        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }
    
    /**
     * 通过路径设置值
     * @param {string} path - 点分隔的路径
     * @param {any} value - 要设置的值
     */
    setValueByPath(path, value) {
        const parts = path.split('.');
        let current = this.gameState.variables;
        
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            
            if (!current[part]) {
                current[part] = {};
            }
            
            current = current[part];
        }
        
        current[parts[parts.length - 1]] = value;
    }
    
    /**
     * 日志输出
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[变量指令 v2] ${message}`);
        }
        this.executionLog.push({ level: 'info', message, timestamp: Date.now() });
    }
    
    warn(message) {
        console.warn(`[变量指令 v2] ⚠️ ${message}`);
        this.executionLog.push({ level: 'warn', message, timestamp: Date.now() });
    }
    
    error(message, error) {
        console.error(`[变量指令 v2] ❌ ${message}`, error);
        this.executionLog.push({ level: 'error', message, error: error?.message, timestamp: Date.now() });
    }
    
    /**
     * 获取执行日志
     * @returns {Array}
     */
    getExecutionLog() {
        return this.executionLog;
    }
    
    /**
     * 清除执行日志
     */
    clearLog() {
        this.executionLog = [];
    }
}

// 导出到全局
window.VariableInstructionParserV2 = VariableInstructionParserV2;

console.log('📦 [模块加载] variable-instruction-parser-v2.js 已加载');
