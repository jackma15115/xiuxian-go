/**
 * 增强版JSON修复和解析工具
 * 解决AI响应格式错误问题
 */

/**
 * 增强版JSON自动修复
 * @param {string} jsonStr - 待修复的JSON字符串
 * @returns {string} 修复后的JSON字符串
 */
function enhancedAutoFixJSON(jsonStr) {
    console.log('🔧 [增强修复] 开始修复JSON，输入长度:', jsonStr.length);
    let fixed = jsonStr.trim();
    
    // ========== 第1步：清理前缀和后缀 ==========
    // 移除代码块标记
    fixed = fixed.replace(/^```(?:json)?\s*/i, '');
    fixed = fixed.replace(/\s*```$/, '');
    
    // 移除 "json 或 json 前缀
    fixed = fixed.replace(/^["']?json["']?\s*/i, '');
    
    // 移除开头多余的引号
    if (fixed.startsWith('"') && !fixed.startsWith('"{')) {
        fixed = fixed.substring(1);
    }
    
    // 移除末尾多余的引号
    if (fixed.endsWith('"') && !fixed.endsWith('}"')) {
        fixed = fixed.substring(0, fixed.length - 1);
    }
    
    // ========== 第2步：处理注释 ==========
    // 移除单行注释 //
    fixed = fixed.replace(/\/\/[^\n]*/g, '');
    
    // 移除多行注释 /* */
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // ========== 第3步：修复换行符 ==========
    // 在字符串值中转义换行符
    fixed = fixed.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    });
    
    // ========== 第4步：修复逗号问题 ==========
    // 4.0 移除逗号后的无效字符（如 ,_ 应该变成 ,）
    // 这种情况通常是AI生成时的typo，如 "step": 3,_ 应该修复为 "step": 3,
    fixed = fixed.replace(/,\s*[_]+\s*(?=["{\[])/g, ', ');
    fixed = fixed.replace(/,\s*[_]+\s*(?=\n)/g, ',');
    
    // 4.1 移除对象和数组末尾的多余逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 4.2 修复数组元素之间缺失的逗号
    // 匹配: "xxx" "yyy" 或 "xxx"\n"yyy" (两个字符串之间没有逗号)
    fixed = fixed.replace(/("[^"]*")\s+(")/g, '$1, $2');
    
    // 4.3 修复对象之间缺失的逗号: } { 或 }\n{
    fixed = fixed.replace(/(\})\s+(\{)/g, '$1, $2');
    
    // 4.4 修复数组之间缺失的逗号: ] [ 或 ]\n[
    fixed = fixed.replace(/(\])\s+(\[)/g, '$1, $2');
    
    // 4.5 修复对象后跟字符串缺失的逗号: } "xxx"
    fixed = fixed.replace(/(\})\s+(")/g, '$1, $2');
    
    // 4.6 修复字符串后跟对象缺失的逗号: "xxx" {
    fixed = fixed.replace(/("[^"]*")\s+(\{)/g, '$1, $2');
    
    // 4.7 修复数字后跟其他元素缺失的逗号
    fixed = fixed.replace(/(\d)\s+(")/g, '$1, $2');
    fixed = fixed.replace(/(\d)\s+(\{)/g, '$1, $2');
    fixed = fixed.replace(/(\d)\s+(\[)/g, '$1, $2');
    
    // 4.8 修复布尔值/null后缺失的逗号
    fixed = fixed.replace(/(true|false|null)\s+(")/gi, '$1, $2');
    fixed = fixed.replace(/(true|false|null)\s+(\{)/gi, '$1, $2');
    fixed = fixed.replace(/(true|false|null)\s+(\[)/gi, '$1, $2');
    
    // ========== 第5步：补全缺失的括号 ==========
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    if (openBraces > closeBraces) {
        console.warn(`🔧 补全${openBraces - closeBraces}个闭合大括号`);
        fixed += '}'.repeat(openBraces - closeBraces);
    }
    
    if (openBrackets > closeBrackets) {
        console.warn(`🔧 补全${openBrackets - closeBrackets}个闭合中括号`);
        fixed += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // ========== 第6步：修复引号 ==========
    // 统一使用双引号
    // 注意：只替换作为JSON语法的单引号，不影响字符串内部的单引号
    let inString = false;
    let result = '';
    let i = 0;
    
    while (i < fixed.length) {
        const char = fixed[i];
        const nextChar = fixed[i + 1];
        
        // 处理转义字符
        if (char === '\\' && inString) {
            result += char + (nextChar || '');
            i += 2;
            continue;
        }
        
        // 切换字符串状态
        if (char === '"') {
            inString = !inString;
            result += char;
            i++;
            continue;
        }
        
        // 在字符串外部，将单引号替换为双引号
        if (char === "'" && !inString) {
            result += '"';
            i++;
            continue;
        }
        
        result += char;
        i++;
    }
    
    fixed = result;
    
    // ========== 第7步：修复属性名 ==========
    // 为没有引号的属性名添加引号
    // 匹配模式：换行+空白+单词+空白+冒号
    fixed = fixed.replace(/(\n\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, (match, indent, propName, space) => {
        // 检查是否已经有引号
        if (fixed[fixed.indexOf(match) - 1] === '"') {
            return match;
        }
        return indent + '"' + propName + '"' + space + ':';
    });
    
    // 也处理第一个属性（在{之后）
    fixed = fixed.replace(/(\{\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, (match, brace, propName, space) => {
        return brace + '"' + propName + '"' + space + ':';
    });
    
    // ========== 第8步：修复无效的转义序列 ==========
    // JSON只支持: \" \\ \/ \b \f \n \r \t \uXXXX
    // 其他的反斜杠+字符组合是无效的，需要修复
    fixed = fixed.replace(/\\([^"\\\/bfnrtu])/g, (match, char) => {
        // 如果是非法转义序列，移除反斜杠
        console.log('🔧 [增强修复] 修复无效转义序列: \\' + char + ' -> ' + char);
        return char;
    });
    
    // 修复 \uXXXX 格式不完整的情况
    fixed = fixed.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');
    
    // ========== 第9步：修复特殊字符 ==========
    // 移除控制字符（除了换行、回车、制表符）
    fixed = fixed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    console.log('✅ [增强修复] 修复完成');
    return fixed;
}

/**
 * 智能解析AI响应（多策略尝试）
 * @param {string} response - AI原始响应
 * @returns {Object|null} 解析后的数据对象，失败返回null
 */
function smartParseAIResponse(response) {
    const strategies = [
        {
            name: '直接解析',
            fn: (r) => JSON.parse(r)
        },
        {
            name: '提取代码块',
            fn: (r) => {
                const match = r.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (!match) throw new Error('未找到代码块');
                return JSON.parse(match[1]);
            }
        },
        {
            name: '增强修复-全文',
            fn: (r) => {
                const fixed = enhancedAutoFixJSON(r);
                return JSON.parse(fixed);
            }
        },
        {
            name: '增强修复-代码块',
            fn: (r) => {
                const match = r.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (!match) throw new Error('未找到代码块');
                const fixed = enhancedAutoFixJSON(match[1]);
                return JSON.parse(fixed);
            }
        },
        {
            name: '提取花括号内容',
            fn: (r) => {
                const match = r.match(/\{[\s\S]*\}/);
                if (!match) throw new Error('未找到JSON对象');
                const fixed = enhancedAutoFixJSON(match[0]);
                return JSON.parse(fixed);
            }
        },
        {
            name: '宽松JSON解析',
            fn: (r) => {
                // 使用eval（有风险，作为最后手段）
                const fixed = enhancedAutoFixJSON(r);
                // 先尝试JSON.parse
                try {
                    return JSON.parse(fixed);
                } catch (e) {
                    // 如果失败，尝试更激进的修复
                    console.warn('⚠️ 使用激进修复模式');
                    return tryAggressiveRepair(fixed);
                }
            }
        }
    ];
    
    for (const strategy of strategies) {
        try {
            console.log(`🔍 尝试策略: ${strategy.name}`);
            const result = strategy.fn(response);
            console.log(`✅ 策略成功: ${strategy.name}`);
            return result;
        } catch (error) {
            console.log(`❌ 策略失败: ${strategy.name} - ${error.message}`);
        }
    }
    
    console.error('❌ 所有解析策略都失败了');
    return null;
}

/**
 * 激进修复模式（最后手段）
 * @param {string} jsonStr - JSON字符串
 * @returns {Object} 解析结果
 */
function tryAggressiveRepair(jsonStr) {
    let fixed = jsonStr;
    
    console.log('🔧 [激进修复] 开始激进修复，长度:', fixed.length);
    
    // ========== 策略1：逐字符状态机修复 ==========
    try {
        const stateMachineFixed = fixJsonWithStateMachine(fixed);
        const parsed = JSON.parse(stateMachineFixed);
        console.log('✅ [激进修复] 状态机修复成功');
        return parsed;
    } catch (e) {
        console.log('⚠️ [激进修复] 状态机修复失败:', e.message);
    }
    
    // ========== 策略2：找到最后一个完整的JSON ==========
    let lastValidJson = null;
    let maxLength = 0;
    
    // 从后往前尝试找到有效的JSON
    for (let i = fixed.length; i > fixed.length / 2; i--) {
        const substr = fixed.substring(0, i);
        
        // 补全可能缺失的结束符
        let attempt = substr;
        const missingBraces = (attempt.match(/\{/g) || []).length - (attempt.match(/\}/g) || []).length;
        const missingBrackets = (attempt.match(/\[/g) || []).length - (attempt.match(/\]/g) || []).length;
        
        if (missingBraces > 0) attempt += '}'.repeat(missingBraces);
        if (missingBrackets > 0) attempt += ']'.repeat(missingBrackets);
        
        // 移除尾随逗号
        attempt = attempt.replace(/,(\s*[}\]])/g, '$1');
        
        try {
            const parsed = JSON.parse(attempt);
            if (i > maxLength) {
                maxLength = i;
                lastValidJson = parsed;
            }
        } catch (e) {
            // 继续尝试
        }
    }
    
    if (lastValidJson) {
        console.log('✅ [激进修复] 截断修复成功，长度:', maxLength);
        return lastValidJson;
    }
    
    throw new Error('激进修复也失败');
}

/**
 * 使用状态机修复JSON（处理缺失逗号等问题）
 * @param {string} jsonStr - JSON字符串
 * @returns {string} 修复后的JSON字符串
 */
function fixJsonWithStateMachine(jsonStr) {
    let result = '';
    let i = 0;
    let inString = false;
    let escapeNext = false;
    let lastNonWhitespaceChar = '';
    let stack = []; // 记录 { 或 [ 的嵌套
    
    while (i < jsonStr.length) {
        const char = jsonStr[i];
        
        // 处理转义字符
        if (escapeNext) {
            // 检查是否是有效的JSON转义字符
            const validEscapes = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
            if (validEscapes.includes(char)) {
                result += char;
            } else {
                // 无效的转义序列，移除前面的反斜杠，只保留字符
                // 需要移除result末尾的反斜杠
                result = result.slice(0, -1) + char;
                console.log('🔧 [状态机] 修复无效转义序列: \\' + char + ' -> ' + char);
            }
            escapeNext = false;
            i++;
            continue;
        }
        
        if (char === '\\' && inString) {
            result += char;
            escapeNext = true;
            i++;
            continue;
        }
        
        // 处理字符串边界
        if (char === '"') {
            // 检查是否需要在引号前加逗号
            if (!inString && (lastNonWhitespaceChar === '"' || lastNonWhitespaceChar === '}' || lastNonWhitespaceChar === ']' || /\d/.test(lastNonWhitespaceChar))) {
                // 检查是否是键值对的冒号后面（不需要加逗号）
                const trimmedResult = result.trimEnd();
                if (!trimmedResult.endsWith(':') && !trimmedResult.endsWith(',') && !trimmedResult.endsWith('[') && !trimmedResult.endsWith('{')) {
                    result += ',';
                    console.log('🔧 [状态机] 在位置', i, '补充逗号');
                }
            }
            inString = !inString;
            result += char;
            if (!inString) {
                lastNonWhitespaceChar = char;
            }
            i++;
            continue;
        }
        
        if (inString) {
            // 在字符串内部，处理未转义的换行
            if (char === '\n') {
                result += '\\n';
            } else if (char === '\r') {
                result += '\\r';
            } else if (char === '\t') {
                result += '\\t';
            } else {
                result += char;
            }
            i++;
            continue;
        }
        
        // 不在字符串内部
        if (char === '{' || char === '[') {
            // 检查是否需要加逗号
            if (lastNonWhitespaceChar === '"' || lastNonWhitespaceChar === '}' || lastNonWhitespaceChar === ']' || /\d/.test(lastNonWhitespaceChar)) {
                const trimmedResult = result.trimEnd();
                if (!trimmedResult.endsWith(':') && !trimmedResult.endsWith(',') && !trimmedResult.endsWith('[') && !trimmedResult.endsWith('{')) {
                    result += ',';
                    console.log('🔧 [状态机] 在位置', i, '补充逗号(开括号前)');
                }
            }
            stack.push(char);
            result += char;
            lastNonWhitespaceChar = char;
            i++;
            continue;
        }
        
        if (char === '}' || char === ']') {
            // 移除尾随逗号
            const trimmedResult = result.trimEnd();
            if (trimmedResult.endsWith(',')) {
                result = trimmedResult.slice(0, -1);
                console.log('🔧 [状态机] 移除尾随逗号');
            }
            stack.pop();
            result += char;
            lastNonWhitespaceChar = char;
            i++;
            continue;
        }
        
        if (char === ':' || char === ',') {
            result += char;
            lastNonWhitespaceChar = char;
            i++;
            continue;
        }
        
        // 空白字符
        if (/\s/.test(char)) {
            result += char;
            i++;
            continue;
        }
        
        // 其他字符（数字、true、false、null等）
        // 过滤掉不应该出现在JSON中的无效字符（如孤立的 _ ）
        // 有效字符：字母、数字、-（用于负数）、.（用于小数）、true/false/null的一部分
        if (/[a-zA-Z0-9.\-]/.test(char)) {
            result += char;
            lastNonWhitespaceChar = char;
        } else {
            // 跳过无效字符（如 _ ），并记录日志
            console.log('🔧 [状态机] 跳过无效字符:', char, '在位置', i);
        }
        i++;
    }
    
    // 补全缺失的闭合括号
    while (stack.length > 0) {
        const open = stack.pop();
        result += (open === '{') ? '}' : ']';
        console.log('🔧 [状态机] 补充闭合括号:', (open === '{') ? '}' : ']');
    }
    
    return result;
}

/**
 * 验证并补全必需字段
 * @param {Object} data - 解析后的数据
 * @returns {Object} 验证并补全后的数据
 */
function validateAndCompleteData(data) {
    console.log('🔍 验证数据完整性...');
    
    // 必需字段定义
    const requiredFields = {
        reasoning: {
            default: {
                situation: '数据解析中',
                playerChoice: '继续游戏',
                logicChain: ['解析成功'],
                outcome: '继续游戏流程'
            },
            type: 'object'
        },
        variableChanges: {
            default: {
                analysis: 'No changes',
                changes: {}
            },
            type: 'object'
        },
        story: {
            default: '（AI正在生成剧情...）',
            type: 'string'
        },
        options: {
            default: [
                '与周围人交谈',
                '离开此地',
                '继续探索',
                '【R18】休息片刻'
            ],
            type: 'array',
            minLength: 4
        }
    };
    
    // 检查并补全缺失字段
    for (const [field, config] of Object.entries(requiredFields)) {
        if (!data[field]) {
            console.warn(`⚠️ 缺少字段 ${field}，使用默认值`);
            data[field] = config.default;
        } else if (config.type === 'array' && config.minLength) {
            // 补全不足的数组元素
            while (data[field].length < config.minLength) {
                const index = data[field].length;
                data[field].push(config.default[index] || `选项${index + 1}`);
            }
        }
    }
    
    // 验证options数量
    if (data.options && data.options.length < 4) {
        console.warn(`⚠️ 选项数量不足（${data.options.length}/4），自动补全`);
        const defaultOptions = [
            '与周围人交谈',
            '离开此地',
            '继续探索',
            '【R18】休息片刻'
        ];
        while (data.options.length < 4) {
            data.options.push(defaultOptions[data.options.length] || `选项${data.options.length + 1}`);
        }
    }
    
    // 验证story长度
    if (data.story && data.story.length < 20) {
        console.warn('⚠️ 剧情描述过短');
        data.story += '\n\n（故事继续...）';
    }
    
    console.log('✅ 数据验证完成');
    return data;
}

/**
 * 降级渲染模式（当JSON完全无法解析时）
 * @param {string} response - AI原始响应
 * @returns {Object} 降级后的数据对象
 */
function fallbackParse(response) {
    console.log('⚠️ 启动降级渲染模式');
    
    // 尝试提取文本内容
    let story = response;
    
    // 移除代码块标记
    story = story.replace(/```(?:json)?\s*/g, '').replace(/```/g, '');
    
    // 如果文本太短，添加提示
    if (story.length < 50) {
        story = `AI响应格式异常，原始内容：\n\n${story}\n\n建议选择"重新生成"。`;
    }
    
    return {
        reasoning: {
            situation: 'AI响应解析失败',
            playerChoice: '等待玩家选择',
            logicChain: ['响应格式错误', '启用降级模式', '显示原始内容'],
            outcome: '等待玩家重新生成或继续'
        },
        variableChanges: {
            analysis: 'No changes due to parsing error',
            changes: {}
        },
        story: story,
        options: [
            '重新生成回复',
            '尝试继续',
            '查看原始响应',
            '返回上一步',
            '保存并退出'
        ]
    };
}

/**
 * 完整的AI响应处理流程
 * @param {string} response - AI原始响应
 * @returns {Object} 处理后的数据对象（保证不为null）
 */
function processAIResponse(response) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 [AI响应处理] 开始处理');
    console.log('📝 响应长度:', response.length);
    
    try {
        // 第1步：智能解析
        let data = smartParseAIResponse(response);
        
        // 第2步：如果解析失败，使用降级模式
        if (!data) {
            console.warn('⚠️ 智能解析失败，使用降级模式');
            data = fallbackParse(response);
        }
        
        // 第3步：验证并补全数据
        data = validateAndCompleteData(data);
        
        console.log('✅ [AI响应处理] 处理成功');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        return data;
    } catch (error) {
        console.error('❌ [AI响应处理] 处理失败:', error);
        console.error('使用最终降级方案');
        
        return fallbackParse(response);
    }
}
