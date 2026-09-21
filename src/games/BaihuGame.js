/**
 * 白虎宗游戏配置
 */

import { GameConfig } from './GameConfigTemplate.js';

const baihuSystemPrompt = `你是白虎宗的游戏主持人。

【背景设定】
白虎宗是一个神秘的修真门派，以培养女性修士闻名。宗门位于白虎山脉深处，常年云雾缭绕。
这里的修炼方式独特，强调阴阳调和，有独特的双修法门。

【游戏规则】
1. 玩家将扮演新入门的弟子，从外门开始修炼
2. 需要完成宗门任务，提升贡献度和修为
3. 可以与其他弟子互动，建立关系
4. 每次提供5个选项供选择

【特殊机制】
- 双修系统：可以与其他角色进行双修，快速提升修为
- 魅惑值：影响社交互动的成功率
- 宗门贡献：决定在宗门中的地位和资源获取

【重要提示】
- 保持神秘和诱惑的氛围
- NPC都有独特的性格和秘密
- 可以包含成人内容，但要有艺术性`;

const baihuDynamicWorldPrompt = `生成白虎宗内部的动态事件。

事件类型：
- 宗门比试
- 秘密聚会
- 长老授课
- 同门之间的明争暗斗
- 神秘访客
- 禁地异动

请生成符合白虎宗氛围的事件。`;

export const BaihuGameConfig = new GameConfig({
    id: 'baihu_sect',
    name: '白虎宗',
    version: '1.0.0',
    description: '加入神秘的白虎宗，探索独特的修炼之道，在美人如云的宗门中寻找你的道侣。',
    author: '白虎宗开发组',
    
    systemPrompt: baihuSystemPrompt,
    dynamicWorldPrompt: baihuDynamicWorldPrompt,
    
    features: {
        combat: true,
        dynamicWorld: true,
        characterCreation: true,
        knowledge: true,
        dlc: true,
        dualCultivation: true, // 双修系统
        relationship: true     // 关系系统
    },
    
    variables: {
        // 基础信息
        name: { type: 'string', default: '', description: '角色名称' },
        gender: { type: 'string', default: '女', description: '性别', enum: ['男', '女'] },
        age: { type: 'number', default: 18, min: 16, max: 25, description: '年龄' },
        
        // 修为系统
        realm: { type: 'string', default: '外门弟子', description: '宗门地位' },
        cultivation: { type: 'number', default: 0, min: 0, description: '修为值' },
        
        // 生命和灵力
        hp: { type: 'number', default: 100, min: 0, description: '生命值' },
        hpMax: { type: 'number', default: 100, min: 1, description: '最大生命值' },
        mp: { type: 'number', default: 100, min: 0, description: '灵力值' },
        mpMax: { type: 'number', default: 100, min: 1, description: '最大灵力值' },
        
        // 特殊属性
        charm: { type: 'number', default: 50, min: 0, max: 100, description: '魅惑值' },
        contribution: { type: 'number', default: 0, min: 0, description: '宗门贡献' },
        reputation: { type: 'number', default: 0, description: '声望' },
        
        // 位置
        location: { type: 'string', default: '外门居所', description: '当前位置' },
        
        // 关系系统
        relationships: { 
            type: 'object', 
            default: {},
            description: '人物关系（名字: 好感度）'
        },
        
        // 技能
        techniques: { type: 'array', default: ['白虎心法'], description: '已学功法' },
        specialSkills: { type: 'array', default: [], description: '特殊技能' },
        
        // 物品
        inventory: { type: 'array', default: [], description: '物品栏' },
        outfits: { type: 'array', default: ['外门弟子服'], description: '服装' },
        currentOutfit: { type: 'string', default: '外门弟子服', description: '当前服装' },
        
        // 任务
        quests: { type: 'array', default: [], description: '当前任务' },
        dailyTasks: { type: 'array', default: [], description: '每日任务' }
    },
    
    ui: {
        theme: 'baihu',
        layout: 'elegant',
        customCSS: `
            .status-panel {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            .charm-display {
                color: #ff69b4;
                text-shadow: 0 0 5px rgba(255, 105, 180, 0.5);
            }
        `,
        statusFields: [
            { key: 'name', label: '姓名', type: 'text' },
            { key: 'realm', label: '地位', type: 'text', class: 'realm-display' },
            { key: 'cultivation', label: '修为', type: 'number' },
            { key: 'hp', label: '生命', type: 'bar', max: 'hpMax', color: '#ff6b6b' },
            { key: 'mp', label: '灵力', type: 'bar', max: 'mpMax', color: '#cc5de8' },
            { key: 'charm', label: '魅惑', type: 'bar', max: 100, color: '#ff69b4', class: 'charm-display' },
            { key: 'contribution', label: '贡献', type: 'number', icon: '🌸' },
            { key: 'location', label: '位置', type: 'text', icon: '📍' },
            { key: 'currentOutfit', label: '服装', type: 'text', icon: '👘' }
        ]
    },
    
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
                        placeholder: '请输入角色姓名'
                    },
                    {
                        id: 'age',
                        label: '年龄',
                        type: 'number',
                        min: 16,
                        max: 25,
                        default: 18
                    }
                ]
            },
            {
                id: 'background',
                title: '选择来历',
                type: 'choice',
                choices: [
                    {
                        id: 'village_girl',
                        name: '村姑',
                        description: '来自山下村落的普通少女，纯真质朴',
                        effects: {
                            charm: 30,
                            attributes: { innocence: 80 }
                        }
                    },
                    {
                        id: 'noble_lady',
                        name: '千金小姐',
                        description: '大户人家的千金，气质高贵',
                        effects: {
                            charm: 60,
                            contribution: 100,
                            inventory: ['珍贵首饰']
                        }
                    },
                    {
                        id: 'wanderer',
                        name: '江湖女侠',
                        description: '闯荡江湖的女侠，身手不凡',
                        effects: {
                            charm: 40,
                            hp: 150,
                            techniques: ['基础剑法']
                        }
                    }
                ]
            }
        ]
    },
    
    options: {
        maxOptions: 5,
        optionTypes: [
            { type: 'dialogue', label: '交谈' },
            { type: 'cultivate', label: '修炼' },
            { type: 'explore', label: '探索' },
            { type: 'special', label: '特殊', subtype: 'r18' },
            { type: 'action', label: '行动' }
        ]
    },
    
    knowledgeBase: [
        {
            id: 'baihu_intro',
            title: '白虎宗介绍',
            content: '白虎宗是一个专门培养女修的宗门，以独特的阴阳调和之道闻名...',
            tags: ['宗门', '背景'],
            priority: 'high'
        },
        {
            id: 'dual_cultivation',
            title: '双修法门',
            content: '白虎宗的双修法门能够让修炼者快速提升修为，但需要找到合适的道侣...',
            tags: ['系统', '双修'],
            priority: 'medium'
        }
    ],
    
    hooks: {
        onStart: async (gameCore) => {
            console.log('[白虎宗] 欢迎来到白虎宗...');
        },
        
        onVariableChange: async (gameCore, changes) => {
            // 检查魅惑值变化
            if (changes.charm !== undefined) {
                if (changes.charm >= 80) {
                    gameCore.api.emit('achievement:unlock', { 
                        id: 'charm_master',
                        title: '魅惑大师'
                    });
                }
            }
        }
    }
});

export default BaihuGameConfig;
