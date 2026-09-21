/**
 * 修仙游戏配置 - 使用新框架
 */

import { GameConfig } from './GameConfigTemplate.js';

// 修仙游戏的系统提示词
const xiuxianSystemPrompt = `你是一个修仙世界的游戏主持人。

【核心规则】
1. 你需要扮演一个修仙世界的叙述者，引导玩家在这个世界中冒险
2. 每次回复必须包含5个选项供玩家选择
3. 需要根据玩家的选择推进剧情，并更新相关变量
4. 保持剧情的连贯性和合理性

【选项规则】
每次必须提供5个选项：
- 选项1：对话/交互 - 与NPC或环境互动
- 选项2：探索/移动 - 前往新地点或探索当前区域
- 选项3：修炼/行动 - 进行修炼或其他重要行动
- 选项4：特殊选项 - 根据当前场景的特殊行动
- 选项5：战斗选项 - 【必须包含】挑战或攻击目标

【变量更新规则】
每次回复必须包含变量更新的JSON格式：
\`\`\`json
{
  "variables": {
    "hp": 数值,
    "mp": 数值,
    "exp": 数值,
    "location": "地点名称",
    // 其他需要更新的变量
  }
}
\`\`\`

【境界体系】
- 凡人 (0-99 修为)
- 练气期 (100-999 修为)
- 筑基期 (1000-9999 修为)
- 金丹期 (10000-99999 修为)
- 元婴期 (100000-999999 修为)
- 化神期 (1000000+ 修为)

【重要提示】
- 保持描述生动有趣，富有画面感
- 战斗要有策略性，不是简单的数值对抗
- NPC要有独特的性格和背景
- 世界要有深度和神秘感`;

// 动态世界提示词
const xiuxianDynamicWorldPrompt = `你需要根据玩家的行动和世界状态，生成动态的世界事件。

这些事件应该：
1. 与玩家当前的境界和位置相关
2. 可能影响后续的剧情发展
3. 增加世界的真实感和深度

事件类型包括但不限于：
- 宗门大事（比武、庆典、危机等）
- 秘境开启
- 天材地宝出世
- 修真界传闻
- NPC之间的互动
- 天象变化

请用简短的描述（50-100字）生成一个世界事件。`;

// 创建修仙游戏配置
export const XiuxianGameConfig = new GameConfig({
    // 基本信息
    id: 'xiuxian_v2',
    name: '觅长生 2.0',
    version: '2.0.0',
    description: '踏入修仙世界，追寻长生之道。在这个充满机遇与危险的世界中，你将从一介凡人开始，历经千难万险，最终能否得道成仙？',
    author: '修仙游戏开发组',
    thumbnail: '/images/xiuxian_thumbnail.jpg',
    
    // 核心配置
    systemPrompt: xiuxianSystemPrompt,
    dynamicWorldPrompt: xiuxianDynamicWorldPrompt,
    
    // 游戏机制
    features: {
        combat: true,
        dynamicWorld: true,
        characterCreation: true,
        knowledge: true,
        dlc: true,
        alchemy: true,  // 炼丹系统
        crafting: true, // 炼器系统
        sect: true      // 宗门系统
    },
    
    // 变量定义
    variables: {
        // 基础信息
        name: { type: 'string', default: '', description: '角色名称' },
        gender: { type: 'string', default: '男', description: '性别', enum: ['男', '女'] },
        age: { type: 'number', default: 18, min: 15, max: 100, description: '年龄' },
        
        // 境界和修为
        realm: { type: 'string', default: '凡人', description: '当前境界' },
        cultivation: { type: 'number', default: 0, min: 0, description: '修为值' },
        exp: { type: 'number', default: 0, min: 0, description: '经验值' },
        
        // 生命和灵力
        hp: { type: 'number', default: 100, min: 0, description: '生命值' },
        hpMax: { type: 'number', default: 100, min: 1, description: '最大生命值' },
        mp: { type: 'number', default: 50, min: 0, description: '灵力值' },
        mpMax: { type: 'number', default: 50, min: 1, description: '最大灵力值' },
        
        // 六维属性
        attributes: {
            type: 'object',
            default: {
                physique: 10,     // 根骨
                comprehension: 10, // 悟性
                spirituality: 10,  // 灵性
                luck: 10,         // 气运
                charm: 10,        // 魅力
                willpower: 10     // 意志
            },
            description: '六维属性'
        },
        
        // 位置和所属
        location: { type: 'string', default: '新手村', description: '当前位置' },
        sect: { type: 'string', default: '无', description: '所属宗门' },
        
        // 功法和技能
        techniques: { type: 'array', default: [], description: '已学功法' },
        spells: { type: 'array', default: [], description: '已学法术' },
        
        // 物品和资源
        inventory: { type: 'array', default: [], description: '背包物品' },
        storage: { type: 'array', default: [], description: '储物空间' },
        spiritStones: { type: 'number', default: 10, min: 0, description: '灵石' },
        
        // 社交关系
        reputation: { type: 'object', default: {}, description: '声望' },
        relationships: { type: 'object', default: {}, description: '人物关系' },
        
        // 任务
        quests: { type: 'array', default: [], description: '当前任务' },
        
        // 特殊状态
        buffs: { type: 'array', default: [], description: '增益状态' },
        debuffs: { type: 'array', default: [], description: '减益状态' },
        
        // 善恶值
        karma: { type: 'number', default: 0, description: '因果值（负数为恶，正数为善）' },
        demonScore: { type: 'number', default: 0, min: 0, max: 100, description: '入魔值' }
    },
    
    // UI配置
    ui: {
        theme: 'xiuxian',
        layout: 'tabbed',
        customCSS: `
            .status-panel {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .realm-display {
                font-size: 1.2em;
                color: gold;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            }
        `,
        statusFields: [
            { key: 'name', label: '姓名', type: 'text', class: 'name-display' },
            { key: 'realm', label: '境界', type: 'text', class: 'realm-display' },
            { key: 'cultivation', label: '修为', type: 'number', format: 'compact' },
            { key: 'hp', label: '生命', type: 'bar', max: 'hpMax', color: '#ff6b6b' },
            { key: 'mp', label: '灵力', type: 'bar', max: 'mpMax', color: '#4dabf7' },
            { key: 'location', label: '位置', type: 'text', icon: '📍' },
            { key: 'sect', label: '宗门', type: 'text', icon: '⛩️' },
            { key: 'spiritStones', label: '灵石', type: 'number', icon: '💎' },
            { key: 'karma', label: '因果', type: 'number', format: 'signed', 
              color: (value) => value > 0 ? '#51cf66' : value < 0 ? '#ff6b6b' : '#868e96' }
        ],
        tabs: [
            { id: 'status', label: '状态', icon: '👤' },
            { id: 'inventory', label: '背包', icon: '🎒' },
            { id: 'techniques', label: '功法', icon: '📖' },
            { id: 'quests', label: '任务', icon: '📜' },
            { id: 'world', label: '世界', icon: '🌍' }
        ]
    },
    
    // 角色创建配置
    characterCreation: {
        steps: [
            {
                id: 'basic',
                title: '基础信息',
                fields: [
                    {
                        id: 'name',
                        label: '姓名',
                        type: 'input',
                        placeholder: '请输入角色姓名',
                        validation: {
                            required: true,
                            minLength: 2,
                            maxLength: 10,
                            pattern: '^[\u4e00-\u9fa5]+$',
                            message: '请输入2-10个中文字符'
                        }
                    },
                    {
                        id: 'gender',
                        label: '性别',
                        type: 'select',
                        options: [
                            { value: '男', label: '男' },
                            { value: '女', label: '女' }
                        ]
                    },
                    {
                        id: 'age',
                        label: '年龄',
                        type: 'number',
                        min: 15,
                        max: 30,
                        default: 18
                    }
                ]
            },
            {
                id: 'origin',
                title: '选择出身',
                type: 'choice',
                choices: [
                    {
                        id: 'common',
                        name: '普通出身',
                        description: '平凡的出身，没有特殊加成，但潜力无限',
                        effects: { attributePoints: 20 }
                    },
                    {
                        id: 'noble',
                        name: '世家子弟',
                        description: '出身修真世家，起点较高',
                        effects: {
                            attributePoints: 15,
                            attributes: { charm: 5, spirituality: 3 },
                            spiritStones: 100
                        }
                    },
                    {
                        id: 'orphan',
                        name: '孤儿',
                        description: '身世坎坷，但意志坚定',
                        effects: {
                            attributePoints: 25,
                            attributes: { willpower: 5 },
                            spiritStones: -5
                        }
                    },
                    {
                        id: 'genius',
                        name: '天资聪颖',
                        description: '天生慧根，修炼事半功倍',
                        effects: {
                            attributePoints: 18,
                            attributes: { comprehension: 8, spirituality: 5 }
                        }
                    }
                ]
            },
            {
                id: 'attributes',
                title: '分配属性点',
                type: 'point-allocation',
                totalPoints: 20,
                attributes: [
                    { id: 'physique', label: '根骨', min: 5, max: 20, default: 10 },
                    { id: 'comprehension', label: '悟性', min: 5, max: 20, default: 10 },
                    { id: 'spirituality', label: '灵性', min: 5, max: 20, default: 10 },
                    { id: 'luck', label: '气运', min: 5, max: 20, default: 10 },
                    { id: 'charm', label: '魅力', min: 5, max: 20, default: 10 },
                    { id: 'willpower', label: '意志', min: 5, max: 20, default: 10 }
                ]
            }
        ]
    },
    
    // 游戏选项配置
    options: {
        maxOptions: 5,
        requireCombatOption: true,
        optionTypes: [
            { type: 'dialogue', label: '对话', priority: 1 },
            { type: 'explore', label: '探索', priority: 2 },
            { type: 'cultivate', label: '修炼', priority: 3 },
            { type: 'special', label: '特殊', priority: 4 },
            { type: 'combat', label: '战斗', priority: 5, required: true }
        ]
    },
    
    // 知识库初始条目
    knowledgeBase: [
        {
            id: 'xiuxian_world_intro',
            title: '修仙世界背景',
            content: '这是一个灵气充裕的修仙世界，分为东洲、西漠、南疆、北域、中州五大地域...',
            tags: ['世界观', '背景'],
            priority: 'high',
            alwaysInclude: true
        },
        {
            id: 'cultivation_system',
            title: '修炼体系',
            content: '修炼分为炼气、筑基、金丹、元婴、化神、合体、大乘、渡劫等境界...',
            tags: ['系统', '境界'],
            priority: 'high'
        }
    ],
    
    // API设置建议
    apiSettings: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.8,
        maxTokens: 3000,
        systemMessageFirst: true
    },
    
    // 生命周期钩子
    hooks: {
        onStart: async (gameCore) => {
            console.log('[修仙游戏] 游戏开始，天道初开...');
            // 初始化修仙世界特有的系统
        },
        
        onVariableChange: async (gameCore, changes) => {
            // 检查境界提升
            const cultivation = changes.cultivation;
            if (cultivation !== undefined) {
                const oldRealm = gameCore.api.getState('variables.realm');
                const newRealm = calculateRealm(cultivation);
                if (oldRealm !== newRealm) {
                    gameCore.api.setState('variables.realm', newRealm);
                    gameCore.api.emit('realm:breakthrough', { from: oldRealm, to: newRealm });
                }
            }
        },
        
        beforeAICall: async (gameCore, message) => {
            // 在AI调用前注入额外的上下文
            return message;
        }
    }
});

// 辅助函数：计算境界
function calculateRealm(cultivation) {
    if (cultivation < 100) return '凡人';
    if (cultivation < 1000) return '练气期';
    if (cultivation < 10000) return '筑基期';
    if (cultivation < 100000) return '金丹期';
    if (cultivation < 1000000) return '元婴期';
    return '化神期';
}

export default XiuxianGameConfig;
