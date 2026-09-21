/**
 * 游戏配置模板
 * 定义游戏配置的标准格式
 */

export class GameConfig {
    constructor(config) {
        // 基本信息
        this.id = config.id;                           // 唯一标识符
        this.name = config.name;                       // 游戏名称
        this.version = config.version || '1.0.0';      // 版本号
        this.description = config.description || '';    // 游戏描述
        this.author = config.author || 'Anonymous';     // 作者
        this.thumbnail = config.thumbnail || '';        // 缩略图URL
        
        // 核心配置
        this.systemPrompt = config.systemPrompt;       // 系统提示词（必需）
        this.dynamicWorldPrompt = config.dynamicWorldPrompt || ''; // 动态世界提示词
        
        // 游戏机制配置
        this.features = {
            combat: config.features?.combat !== false,           // 是否启用战斗系统
            dynamicWorld: config.features?.dynamicWorld !== false, // 是否启用动态世界
            characterCreation: config.features?.characterCreation !== false, // 是否启用角色创建
            knowledge: config.features?.knowledge !== false,      // 是否启用知识库
            dlc: config.features?.dlc !== false,                 // 是否支持DLC
            ...config.features
        };
        
        // 变量定义
        this.variables = config.variables || this.getDefaultVariables();
        
        // 知识库配置
        this.knowledgeBase = config.knowledgeBase || [];
        
        // UI配置
        this.ui = {
            theme: config.ui?.theme || 'default',
            layout: config.ui?.layout || 'standard',
            customCSS: config.ui?.customCSS || '',
            statusFields: config.ui?.statusFields || this.getDefaultStatusFields(),
            ...config.ui
        };
        
        // 角色创建配置
        this.characterCreation = config.characterCreation || this.getDefaultCharacterCreation();
        
        // 游戏选项配置
        this.options = {
            maxOptions: config.options?.maxOptions || 5,
            optionTypes: config.options?.optionTypes || [
                'dialogue',    // 对话选项
                'action',      // 行动选项
                'skip',        // 跳过选项
                'special',     // 特殊选项
                'combat'       // 战斗选项
            ],
            requireCombatOption: config.options?.requireCombatOption || false,
            ...config.options
        };
        
        // API配置建议
        this.apiSettings = {
            model: config.apiSettings?.model || 'gpt-3.5-turbo',
            temperature: config.apiSettings?.temperature || 0.8,
            maxTokens: config.apiSettings?.maxTokens || 2000,
            ...config.apiSettings
        };
        
        // DLC配置
        this.dlcs = config.dlcs || [];
        
        // 生命周期钩子
        this.hooks = {
            onStart: config.hooks?.onStart,           // 游戏开始时
            onStop: config.hooks?.onStop,             // 游戏停止时
            onLoad: config.hooks?.onLoad,             // 加载游戏时
            onSave: config.hooks?.onSave,             // 保存游戏时
            beforeAICall: config.hooks?.beforeAICall, // AI调用前
            afterAICall: config.hooks?.afterAICall,   // AI调用后
            onVariableChange: config.hooks?.onVariableChange, // 变量变化时
            ...config.hooks
        };
        
        // 自定义功能
        this.custom = config.custom || {};
        
        // 自动保存配置
        this.autoSave = config.autoSave !== false;
        this.autoSaveInterval = config.autoSaveInterval || 60000; // 默认60秒
    }
    
    /**
     * 获取默认变量定义
     */
    getDefaultVariables() {
        return {
            // 基础信息
            name: { type: 'string', default: '', description: '角色名称' },
            level: { type: 'number', default: 1, min: 1, max: 100, description: '等级' },
            
            // 生命值和能量
            hp: { type: 'number', default: 100, min: 0, description: '当前生命值' },
            hpMax: { type: 'number', default: 100, min: 1, description: '最大生命值' },
            mp: { type: 'number', default: 100, min: 0, description: '当前魔法值' },
            mpMax: { type: 'number', default: 100, min: 1, description: '最大魔法值' },
            
            // 属性
            attributes: {
                type: 'object',
                default: {
                    strength: 10,
                    agility: 10,
                    intelligence: 10,
                    vitality: 10
                },
                description: '角色属性'
            },
            
            // 位置
            location: { type: 'string', default: '起始地点', description: '当前位置' },
            
            // 背包
            inventory: { type: 'array', default: [], description: '物品栏' },
            
            // 金钱
            gold: { type: 'number', default: 0, min: 0, description: '金币' }
        };
    }
    
    /**
     * 获取默认状态字段
     */
    getDefaultStatusFields() {
        return [
            { key: 'name', label: '名称', type: 'text' },
            { key: 'level', label: '等级', type: 'number' },
            { key: 'hp', label: '生命', type: 'bar', max: 'hpMax', color: '#ff6b6b' },
            { key: 'mp', label: '魔法', type: 'bar', max: 'mpMax', color: '#4dabf7' },
            { key: 'location', label: '位置', type: 'text' },
            { key: 'gold', label: '金币', type: 'number', icon: '💰' }
        ];
    }
    
    /**
     * 获取默认角色创建配置
     */
    getDefaultCharacterCreation() {
        return {
            steps: [
                {
                    id: 'name',
                    title: '输入角色名称',
                    type: 'input',
                    placeholder: '请输入你的角色名称',
                    validation: {
                        required: true,
                        minLength: 2,
                        maxLength: 20
                    }
                },
                {
                    id: 'attributes',
                    title: '分配属性点',
                    type: 'point-allocation',
                    totalPoints: 20,
                    attributes: ['strength', 'agility', 'intelligence', 'vitality'],
                    min: 5,
                    max: 15
                }
            ]
        };
    }
    
    /**
     * 验证配置有效性
     */
    validate() {
        const errors = [];
        
        if (!this.id) {
            errors.push('游戏配置缺少 id');
        }
        
        if (!this.name) {
            errors.push('游戏配置缺少 name');
        }
        
        if (!this.systemPrompt) {
            errors.push('游戏配置缺少 systemPrompt');
        }
        
        if (this.systemPrompt && this.systemPrompt.length < 50) {
            errors.push('系统提示词过短（建议至少50个字符）');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * 导出为JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            author: this.author,
            thumbnail: this.thumbnail,
            systemPrompt: this.systemPrompt,
            dynamicWorldPrompt: this.dynamicWorldPrompt,
            features: this.features,
            variables: this.variables,
            knowledgeBase: this.knowledgeBase,
            ui: this.ui,
            characterCreation: this.characterCreation,
            options: this.options,
            apiSettings: this.apiSettings,
            dlcs: this.dlcs,
            custom: this.custom,
            autoSave: this.autoSave,
            autoSaveInterval: this.autoSaveInterval
        };
    }
    
    /**
     * 从JSON创建
     */
    static fromJSON(json) {
        return new GameConfig(json);
    }
}
