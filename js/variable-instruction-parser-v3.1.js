/**
 * 变量指令解析器 v3.1 - 极简版
 * 超级简单，AI 一看就懂！
 */
class VariableInstructionParserV31 {
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
     */
    execute(response) {
        this.executionLog = [];
        
        if (this.options.enableRollback) {
            this.rollbackBackup = JSON.parse(JSON.stringify(this.gameState.variables));
            this.log('已创建回滚备份');
        }
        
        try {
            const content = this.extractContent(response);
            if (!content) {
                this.log('未检测到变量更新标签');
                return { success: true, executed: 0, errors: [] };
            }
            
            const count = this.parseAndExecute(content);
            this.log(`✅ 执行完成: ${count} 个操作`);
            return { success: true, executed: count, errors: [] };
            
        } catch (error) {
            this.log(`❌ 执行失败: ${error.message}`);
            
            if (this.options.enableRollback && this.rollbackBackup) {
                this.gameState.variables = this.rollbackBackup;
                this.log('已回滚到之前状态');
            }
            
            return { success: false, executed: 0, errors: [error.message] };
        }
    }
    
    /**
     * 提取变量更新内容
     */
    extractContent(response) {
        const patterns = [
            /<variable_update>([\s\S]*?)<\/variable_update>/,
            /<变量更新>([\s\S]*?)<\/变量更新>/
        ];
        
        for (const pattern of patterns) {
            const match = response.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        return null;
    }
    
    /**
     * 解析并执行内容
     */
    parseAndExecute(content) {
        const lines = content.split('\n');
        let count = 0;
        let currentSection = null;
        let currentSectionKey = null;
        
        // 需要忽略的章节（这些不应该作为追加操作）
        const ignoredSections = ['items', 'relationships', 'equipment', 'bodyParts', 'attributes'];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // 跳过空行和注释
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            
            // 检测章节（如 history:, thoughts:, diary:）
            if (trimmed.endsWith(':') && !trimmed.startsWith('- ')) {
                currentSectionKey = trimmed.slice(0, -1).trim();
                // 如果是需要忽略的章节，跳过不处理
                if (ignoredSections.includes(currentSectionKey)) {
                    currentSection = null;
                    currentSectionKey = null;
                    continue;
                }
                currentSection = true;
                continue;
            }
            
            // 章节内的列表项
            if (currentSection && trimmed.startsWith('- ')) {
                const text = trimmed.substring(2).trim();
                this.appendToArray(currentSectionKey, text);
                count++;
                continue;
            }
            
            // 非列表项结束章节
            if (currentSection && !trimmed.startsWith('- ')) {
                currentSection = false;
                currentSectionKey = null;
            }
            
            // 追加操作：>>history: 文本
            if (trimmed.startsWith('>>')) {
                const content = trimmed.substring(2).trim();
                console.log(`[v3.1] 检测到追加操作: ${content}`);
                if (content.includes(':')) {
                    const [key, value] = this.splitKeyValue(content);
                    console.log(`[v3.1] 解析追加: key="${key}", value="${value}"`);
                    this.appendToArray(key, value);
                    count++;
                    continue;
                } else {
                    console.log(`[v3.1] 追加操作格式错误，缺少冒号: ${content}`);
                }
            }
            
            // 物品操作：+疗伤丹 x3 或 -疗伤丹 x1
            if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
                this.processItem(trimmed);
                count++;
                continue;
            }
            
            // 键值对：hp: -15 或 李师姐.favor: +10
            if (trimmed.includes(':')) {
                this.processKeyValue(trimmed);
                count++;
                continue;
            }
        }
        
        return count;
    }
    
    /**
     * 处理物品操作
     * 格式：+疗伤丹 x3 或 -疗伤丹 x1
     */
    processItem(line) {
        const isAdd = line.startsWith('+');
        const content = line.substring(1).trim();
        
        // 解析：疗伤丹 x3 [type:丹药]
        let name = content;
        let count = 1;
        let attrs = {};
        
        // 提取数量 x3
        const countMatch = content.match(/\s+x(\d+)/);
        if (countMatch) {
            count = parseInt(countMatch[1]);
            name = content.substring(0, countMatch.index).trim();
        }
        
        // 提取属性 [type:丹药, atk:50]
        const attrMatch = content.match(/\[([^\]]+)\]/);
        if (attrMatch) {
            const attrStr = attrMatch[1];
            attrStr.split(',').forEach(pair => {
                const [key, value] = pair.split(':').map(s => s.trim());
                attrs[key] = isNaN(value) ? value : parseFloat(value);
            });
            name = name.replace(/\s*\[.*?\]/, '').trim();
        }
        
        if (isAdd) {
            this.addItem(name, count, attrs);
        } else {
            this.removeItem(name, count);
        }
    }
    
    /**
     * 处理键值对
     * 支持：hp: -15, 李师姐.favor: +10
     */
    processKeyValue(line) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        
        // 检查是否是关系操作（包含点号）
        // 排除系统变量：attributes, items, history, bodyParts, faction 等
        const systemPrefixes = ['items.', 'history.', 'attributes.', 'bodyParts.', 'faction.', 'equipment.', 'specialStatus.'];
        const isSystemVariable = systemPrefixes.some(prefix => key.startsWith(prefix));
        
        // 特殊处理 protagonist（主角详细信息，存储在 gameState.variables.protagonist）
        if (key.startsWith('protagonist.')) {
            this.processProtagonist(key, value);
            return;
        }
        
        // 特殊处理 specialStatus（特殊状态，存储在 gameState.variables.specialStatus）
        if (key.startsWith('specialStatus.')) {
            this.processSpecialStatus(key, value);
            return;
        }
        
        if (key.includes('.') && !isSystemVariable) {
            this.processRelationship(key, value);
            return;
        }
        
        // 数值操作
        if (/^[+\-=]/.test(value)) {
            this.processNumber(key, value);
            return;
        }
        
        // 特殊处理炼丹炼器等级（新格式：字符串）
        if (key === 'alchemyLevel' || key === 'craftingLevel') {
            this.setValue(key, value);
            this.log(`[等级] ${key}: ${value}`);
            return;
        }
        
        // 尝试解析 JSON 对象或数组
        let parsedValue = value;
        if ((value.startsWith('{') && value.endsWith('}')) || 
            (value.startsWith('[') && value.endsWith(']'))) {
            try {
                parsedValue = JSON.parse(value);
                this.log(`[解析] ${key}: JSON解析成功`);
            } catch (e) {
                this.log(`[解析] ${key}: JSON解析失败，保持字符串 - ${e.message}`);
            }
        } else {
            // 使用统一的值解析方法
            parsedValue = this.parseValue(value);
        }
        
        // 直接设置
        this.setValue(key, parsedValue);
    }
    
    /**
     * 处理关系操作
     * 格式：李师姐.favor: +10 或 李师姐.bodyParts.vagina.useCount: +1
     */
    processRelationship(key, value) {
        const parts = key.split('.');
        const name = parts[0];
        const attrPath = parts.slice(1); // 获取剩余的属性路径
        
        const relationships = this.getValue('relationships') || [];
        let relationship = relationships.find(r => r.name === name);
        
        if (!relationship) {
            relationship = { name };
            relationships.push(relationship);
            this.setValue('relationships', relationships);
        }
        
        // 处理嵌套属性（如 bodyParts.vagina.useCount）
        if (attrPath.length > 1) {
            this.setNestedValue(relationship, attrPath, value);
            this.log(`[关系] ${name}.${attrPath.join('.')} = ${value}`);
            return;
        }
        
        const attr = attrPath[0] || 'favor';
        
        // 处理数值操作
        if (/^[+\-=]/.test(value)) {
            const operator = value[0];
            const restValue = value.substring(1);
            const num = parseFloat(restValue);
            const current = relationship[attr] || 0;
            
            // 检查是否是布尔值赋值（如 =true 或 =false）
            if (operator === '=' && isNaN(num)) {
                // 不是数字，使用parseValue解析（处理true/false等）
                const parsedValue = this.parseValue(restValue);
                relationship[attr] = parsedValue;
                console.log(`[v3.1 DEBUG] ${name}.${attr} = ${parsedValue} (type: ${typeof parsedValue})`, { restValue, parsedValue });
                this.log(`[关系] ${name}.${attr} = ${parsedValue} (布尔/字符串)`);
            } else {
                switch (operator) {
                    case '+':
                        relationship[attr] = current + num;
                        break;
                    case '-':
                        relationship[attr] = current - num;
                        break;
                    case '=':
                        relationship[attr] = num;
                        break;
                }
                this.log(`[关系] ${name}.${attr}: ${current} → ${relationship[attr]}`);
            }
        } else {
            // 解析值（移除引号、解析布尔值等）
            let parsedValue = this.parseValue(value);
            relationship[attr] = parsedValue;
            this.log(`[关系] ${name}.${attr} = ${parsedValue}`);
        }
    }
    
    /**
     * 设置嵌套属性值
     */
    setNestedValue(obj, path, value) {
        let current = obj;
        
        // 遍历路径，创建嵌套对象
        for (let i = 0; i < path.length - 1; i++) {
            const part = path[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        
        // 设置最终值
        const finalKey = path[path.length - 1];
        
        // 处理数值操作
        if (/^[+\-=]/.test(value)) {
            const operator = value[0];
            const restValue = value.substring(1);
            const num = parseFloat(restValue);
            const currentValue = current[finalKey] || 0;
            
            // 检查是否是布尔值赋值（如 =true 或 =false）
            if (operator === '=' && isNaN(num)) {
                // 不是数字，使用parseValue解析（处理true/false等）
                current[finalKey] = this.parseValue(restValue);
            } else {
                switch (operator) {
                    case '+':
                        current[finalKey] = currentValue + num;
                        break;
                    case '-':
                        current[finalKey] = currentValue - num;
                        break;
                    case '=':
                        current[finalKey] = num;
                        break;
                }
            }
        } else {
            // 解析值（移除引号、解析布尔值等）
            current[finalKey] = this.parseValue(value);
        }
    }
    
    /**
     * 处理主角详细信息
     * 格式：protagonist.appearance: 描述 或 protagonist.bodyParts.penis.useCount: +1
     */
    processProtagonist(key, value) {
        // 去掉 protagonist. 前缀，获取属性路径
        const attrPath = key.substring('protagonist.'.length).split('.');
        
        // 确保 protagonist 对象存在
        if (!this.gameState.variables.protagonist) {
            this.gameState.variables.protagonist = {};
        }
        
        const protagonist = this.gameState.variables.protagonist;
        
        // 处理嵌套属性（如 bodyParts.penis.useCount）
        if (attrPath.length > 1) {
            this.setNestedValue(protagonist, attrPath, value);
            this.log(`[主角] protagonist.${attrPath.join('.')} = ${value}`);
            return;
        }
        
        // 单层属性（如 appearance, isVirgin）
        const attr = attrPath[0];
        
        // 处理数值操作
        if (/^[+\-=]/.test(value)) {
            const operator = value[0];
            const restValue = value.substring(1);
            const num = parseFloat(restValue);
            const current = protagonist[attr] || 0;
            
            // 检查是否是布尔值赋值（如 =true 或 =false）
            if (operator === '=' && isNaN(num)) {
                protagonist[attr] = this.parseValue(restValue);
                this.log(`[主角] protagonist.${attr} = ${protagonist[attr]} (布尔/字符串)`);
            } else {
                switch (operator) {
                    case '+':
                        protagonist[attr] = current + num;
                        break;
                    case '-':
                        protagonist[attr] = current - num;
                        break;
                    case '=':
                        protagonist[attr] = num;
                        break;
                }
                this.log(`[主角] protagonist.${attr}: ${current} → ${protagonist[attr]}`);
            }
        } else {
            // 直接设置字符串值
            protagonist[attr] = this.parseValue(value);
            this.log(`[主角] protagonist.${attr} = ${protagonist[attr]}`);
        }
    }
    
    /**
     * 处理特殊状态
     * 格式：specialStatus.催情药.active: =true 或 specialStatus.催情药.effect: 攻击力-3
     */
    processSpecialStatus(key, value) {
        // 去掉 specialStatus. 前缀，获取属性路径
        const attrPath = key.substring('specialStatus.'.length).split('.');
        
        // 确保 specialStatus 对象存在
        if (!this.gameState.variables.specialStatus) {
            this.gameState.variables.specialStatus = {};
        }
        
        const specialStatus = this.gameState.variables.specialStatus;
        
        // attrPath[0] 是状态名（如 "催情药"），attrPath[1] 是属性（如 "active", "effect"）
        const statusName = attrPath[0];
        const attr = attrPath[1] || 'active';
        
        // 确保该状态对象存在
        if (!specialStatus[statusName]) {
            specialStatus[statusName] = {};
        }
        
        // 处理值
        if (/^[+\-=]/.test(value)) {
            const operator = value[0];
            const restValue = value.substring(1);
            const num = parseFloat(restValue);
            
            // 检查是否是布尔值或字符串赋值（如 =true 或 =false）
            if (operator === '=' && isNaN(num)) {
                specialStatus[statusName][attr] = this.parseValue(restValue);
                this.log(`[特殊状态] ${statusName}.${attr} = ${specialStatus[statusName][attr]}`);
            } else {
                const current = specialStatus[statusName][attr] || 0;
                switch (operator) {
                    case '+':
                        specialStatus[statusName][attr] = current + num;
                        break;
                    case '-':
                        specialStatus[statusName][attr] = current - num;
                        break;
                    case '=':
                        specialStatus[statusName][attr] = num;
                        break;
                }
                this.log(`[特殊状态] ${statusName}.${attr}: ${current} → ${specialStatus[statusName][attr]}`);
            }
        } else {
            // 直接设置字符串值
            specialStatus[statusName][attr] = this.parseValue(value);
            this.log(`[特殊状态] ${statusName}.${attr} = ${specialStatus[statusName][attr]}`);
        }
    }
    
    /**
     * 处理数值操作
     */
    processNumber(key, value) {
        const operator = value[0];
        const num = parseFloat(value.substring(1));
        const current = this.getValue(key) || 0;
        let newValue;
        
        switch (operator) {
            case '+':
                newValue = current + num;
                break;
            case '-':
                newValue = current - num;
                break;
            case '=':
                newValue = num;
                break;
        }
        
        this.setValue(key, newValue);
        this.log(`[数值] ${key}: ${current} → ${newValue}`);
    }
    
    /**
     * 添加物品（自动合并）
     */
    addItem(name, count, attrs = {}) {
        const items = this.getValue('items') || [];
        
        // 查找相同物品
        const existingItem = items.find(item => item.name === name);
        
        if (existingItem) {
            // 合并数量
            existingItem.count = (existingItem.count || 1) + count;
            this.log(`[物品] ${name}: 数量增加 ${count} → 总计 ${existingItem.count}`);
        } else {
            // 添加新物品
            items.push({ name, count, ...attrs });
            this.log(`[物品] 新增 ${name} x${count}`);
        }
        
        this.setValue('items', items);
    }
    
    /**
     * 移除物品
     */
    removeItem(name, count) {
        const items = this.getValue('items') || [];
        const item = items.find(i => i.name === name);
        
        if (item) {
            item.count = (item.count || 1) - count;
            
            if (item.count <= 0) {
                // 删除物品
                const index = items.indexOf(item);
                items.splice(index, 1);
                this.log(`[物品] ${name} 已用完，删除`);
            } else {
                this.log(`[物品] ${name}: 数量减少 ${count} → 剩余 ${item.count}`);
            }
            
            this.setValue('items', items);
        } else {
            this.log(`[警告] 物品 ${name} 不存在`);
        }
    }
    
    /**
     * 通用追加到数组
     * @param {string} key - 变量名
     * @param {*} value - 值
     */
    appendToArray(key, value) {
        console.log(`[v3.1] appendToArray 被调用: key="${key}", value="${value}"`);
        
        // 检查是否是关系的历史字段（如：柳如烟.history）
        if (key.includes('.') && key.endsWith('.history')) {
            console.log(`[v3.1] 检测到关系历史字段，调用 processRelationshipHistory`);
            this.processRelationshipHistory(key, value);
            return;
        }
        
        const arr = this.getValue(key) || [];
        
        // 确保是数组
        if (!Array.isArray(arr)) {
            this.log(`[警告] ${key} 不是数组，无法追加`);
            return;
        }
        
        // 尝试解析JSON对象（用于techniques/spells等）
        let parsedValue = value;
        if (typeof value === 'string' && value.trim().startsWith('{')) {
            try {
                parsedValue = JSON.parse(value);
                console.log(`[v3.1] ✅ JSON解析成功，对象:`, parsedValue);
                console.log(`[v3.1] 对象属性:`, Object.keys(parsedValue));
            } catch (e) {
                console.log(`[v3.1] ❌ JSON解析失败，保持原值: ${e.message}`);
                console.log(`[v3.1] 原始值:`, value);
            }
        }
        
        // 推入数组（对象直接推入，字符串检查重复）
        if (typeof parsedValue === 'object' && parsedValue !== null) {
            arr.push(parsedValue);
            this.setValue(key, arr);
            console.log(`[v3.1] ✅ JSON对象已添加到 ${key}，当前数组长度: ${arr.length}`);
            this.log(`[追加] ${key}: JSON对象已添加 (name: ${parsedValue.name || 'N/A'})`);
        } else {
            // 字符串类型才检查重复（history等）
            if (!arr.includes(parsedValue)) {
                arr.push(parsedValue);
                this.setValue(key, arr);
                this.log(`[追加] ${key}: ${parsedValue.substring(0, 30)}${parsedValue.length > 30 ? '...' : ''}`);
            }
        }
    }
    
    /**
     * 处理关系的历史记录追加
     * 格式：柳如烟.history: 互动文本
     */
    processRelationshipHistory(key, value) {
        console.log(`[v3.1] 处理关系历史: ${key} = ${value}`);
        
        const parts = key.split('.');
        const name = parts[0];
        
        const relationships = this.getValue('relationships') || [];
        console.log(`[v3.1] 当前关系列表:`, relationships);
        
        let relationship = relationships.find(r => r.name === name);
        
        if (!relationship) {
            relationship = { name };
            relationships.push(relationship);
            this.setValue('relationships', relationships);
            this.log(`[关系] 创建新关系: ${name}`);
            console.log(`[v3.1] 已创建新关系: ${name}`);
        }
        
        console.log(`[v3.1] 找到关系: ${name}, 当前历史:`, relationship.history);
        
        // 初始化历史数组
        if (!relationship.history) {
            relationship.history = [];
            console.log(`[v3.1] 初始化 ${name} 的历史数组`);
        }
        
        // 避免重复
        if (!relationship.history.includes(value)) {
            relationship.history.push(value);
            this.log(`[关系] ${name}.history: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
            console.log(`[v3.1] 已添加历史记录: ${name}.history =`, relationship.history);
        } else {
            console.log(`[v3.1] 历史记录已存在，跳过: ${value}`);
        }
    }
    
    /**
     * 添加历史
     */
    addHistory(text) {
        this.appendToArray('history', text);
    }
    
    /**
     * 解析值（移除引号、解析特殊值）
     */
    parseValue(value) {
        const trimmed = value.trim();
        
        // 移除首尾的引号
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.slice(1, -1);
        }
        
        // 解析特殊值 - 布尔值（支持大小写）
        const lowerTrimmed = trimmed.toLowerCase();
        if (trimmed === 'null' || lowerTrimmed === 'null') return null;
        if (trimmed === 'true' || lowerTrimmed === 'true') {
            console.log('[parseValue] 解析布尔值 true:', value);
            return true;
        }
        if (trimmed === 'false' || lowerTrimmed === 'false') {
            console.log('[parseValue] 解析布尔值 false:', value);
            return false;
        }
        
        // 支持 =true / =false 格式
        if (lowerTrimmed.startsWith('=true') || lowerTrimmed === '=true') {
            console.log('[parseValue] 解析 =true:', value);
            return true;
        }
        if (lowerTrimmed.startsWith('=false') || lowerTrimmed === '=false') {
            console.log('[parseValue] 解析 =false:', value);
            return false;
        }
        
        // 尝试解析数字
        if (!isNaN(trimmed) && trimmed !== '') {
            return parseFloat(trimmed);
        }
        
        // 返回裁剪后的值（而不是原始值）
        return trimmed;
    }
    
    /**
     * 分割键值
     */
    splitKeyValue(line) {
        const colonIndex = line.indexOf(':');
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        return [key, value];
    }
    
    /**
     * 获取值
     */
    getValue(path) {
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
     * 设置值
     */
    setValue(path, value) {
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
     */
    log(message) {
        if (this.options.debug) {
            console.log(`[变量指令 v3.1] ${message}`);
            this.executionLog.push(message);
        }
    }
    
    /**
     * 获取执行日志
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

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariableInstructionParserV31;
}
