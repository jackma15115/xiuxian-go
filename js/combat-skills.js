/**
 * 修仙游戏 - 战斗技能配置
 * 包含功法和法术的完整配置，按境界分类
 */

// 境界配置：定义每个境界的数值范围
const REALM_CONFIG = {
    0: { // 凡人
        name: "凡人",
        hp: { min: 50, max: 100 },
        mp: { min: 0, max: 50 },
        physique: { min: 3, max: 8 },
        comprehension: { min: 3, max: 8 },
        spirituality: { min: 3, max: 8 },
        luck: { min: 3, max: 8 },
        charm: { min: 3, max: 8 },
        willpower: { min: 3, max: 8 }
    },
    1: { // 练气期
        name: "练气期",
        hp: { min: 100, max: 200 },
        mp: { min: 80, max: 150 },
        physique: { min: 8, max: 15 },
        comprehension: { min: 8, max: 15 },
        spirituality: { min: 8, max: 15 },
        luck: { min: 8, max: 15 },
        charm: { min: 8, max: 15 },
        willpower: { min: 8, max: 15 }
    },
    2: { // 筑基期
        name: "筑基期",
        hp: { min: 200, max: 400 },
        mp: { min: 150, max: 300 },
        physique: { min: 15, max: 25 },
        comprehension: { min: 15, max: 25 },
        spirituality: { min: 15, max: 25 },
        luck: { min: 15, max: 25 },
        charm: { min: 15, max: 25 },
        willpower: { min: 15, max: 25 }
    },
    3: { // 金丹期
        name: "金丹期",
        hp: { min: 400, max: 800 },
        mp: { min: 300, max: 600 },
        physique: { min: 25, max: 40 },
        comprehension: { min: 25, max: 40 },
        spirituality: { min: 25, max: 40 },
        luck: { min: 25, max: 40 },
        charm: { min: 25, max: 40 },
        willpower: { min: 25, max: 40 }
    },
    4: { // 元婴期
        name: "元婴期",
        hp: { min: 800, max: 1500 },
        mp: { min: 600, max: 1200 },
        physique: { min: 40, max: 60 },
        comprehension: { min: 40, max: 60 },
        spirituality: { min: 40, max: 60 },
        luck: { min: 40, max: 60 },
        charm: { min: 40, max: 60 },
        willpower: { min: 40, max: 60 }
    },
    5: { // 化神期
        name: "化神期",
        hp: { min: 1500, max: 3000 },
        mp: { min: 1200, max: 2400 },
        physique: { min: 60, max: 80 },
        comprehension: { min: 60, max: 80 },
        spirituality: { min: 60, max: 80 },
        luck: { min: 60, max: 80 },
        charm: { min: 60, max: 80 },
        willpower: { min: 60, max: 80 }
    }
};

// 功法库 - 按境界分类
const TECHNIQUES = {
    // 凡人 & 练气期
    0: [
        {
            name: "基础炼体功",
            power: 20,
            mpCost: 10,
            cooldown: 0,
            effects: [],
            description: "最基础的炼体法门，强化肉身"
        },
        {
            name: "纳气诀",
            power: 25,
            mpCost: 15,
            cooldown: 1,
            effects: [{type: "heal", value: 10, duration: 0}],
            description: "吸收天地灵气，恢复少量生命"
        },
        {
            name: "玄元劲",
            power: 30,
            mpCost: 20,
            cooldown: 2,
            effects: [],
            description: "凝聚玄元之力，形成强劲攻击"
        }
    ],
    1: [
        {
            name: "青云心法",
            power: 45,
            mpCost: 30,
            cooldown: 1,
            effects: [],
            description: "青云宗基础心法，气息绵长"
        },
        {
            name: "太素养元功",
            power: 40,
            mpCost: 25,
            cooldown: 0,
            effects: [{type: "heal", value: 20, duration: 0}],
            description: "养元固本，恢复气血"
        },
        {
            name: "玄冥真劲",
            power: 55,
            mpCost: 40,
            cooldown: 2,
            effects: [{type: "weaken", value: 0.8, duration: 2}],
            description: "玄冥之力侵蚀敌人，降低其攻击力"
        },
        {
            name: "紫霄真元诀",
            power: 60,
            mpCost: 45,
            cooldown: 3,
            effects: [],
            description: "凝练紫霄真元，爆发强劲力量"
        }
    ],
    // 筑基期
    2: [
        {
            name: "太上清静经",
            power: 80,
            mpCost: 50,
            cooldown: 1,
            effects: [{type: "heal", value: 30, duration: 0}],
            description: "道家上乘心法，清静养元"
        },
        {
            name: "九转玄功",
            power: 95,
            mpCost: 65,
            cooldown: 2,
            effects: [{type: "shield", value: 40, duration: 2}],
            description: "九转练体，凝聚护体真元"
        },
        {
            name: "天罡北斗诀",
            power: 110,
            mpCost: 75,
            cooldown: 3,
            effects: [{type: "stun", value: 1, duration: 1}],
            description: "引动天罡之力，有概率眩晕敌人"
        },
        {
            name: "五行造化功",
            power: 100,
            mpCost: 70,
            cooldown: 2,
            effects: [],
            description: "五行之力循环，威力巨大"
        }
    ],
    // 金丹期
    3: [
        {
            name: "太乙玄元金丹诀",
            power: 150,
            mpCost: 100,
            cooldown: 2,
            effects: [{type: "shield", value: 60, duration: 2}],
            description: "金丹期至高心法，护体金光"
        },
        {
            name: "九天应元雷声诀",
            power: 180,
            mpCost: 120,
            cooldown: 3,
            effects: [{type: "burn", value: 20, duration: 3}],
            description: "引动九天雷霆，灼烧敌人"
        },
        {
            name: "混元一气功",
            power: 160,
            mpCost: 105,
            cooldown: 2,
            effects: [{type: "heal", value: 50, duration: 0}],
            description: "混元归一，恢复大量气血"
        },
        {
            name: "北冥神功吞噬诀",
            power: 170,
            mpCost: 115,
            cooldown: 4,
            effects: [{type: "absorb", value: 0.3, duration: 0}],
            description: "吞噬敌人真元，转化为己用"
        }
    ],
    // 元婴期
    4: [
        {
            name: "紫霄神雷灭世经",
            power: 240,
            mpCost: 160,
            cooldown: 3,
            effects: [{type: "burn", value: 35, duration: 3}],
            description: "紫霄神雷降世，灼烧万物"
        },
        {
            name: "太上洞玄元婴诀",
            power: 220,
            mpCost: 145,
            cooldown: 2,
            effects: [{type: "shield", value: 80, duration: 3}],
            description: "元婴护体，固若金汤"
        },
        {
            name: "九转还丹造化功",
            power: 210,
            mpCost: 140,
            cooldown: 3,
            effects: [{type: "heal", value: 80, duration: 0}],
            description: "九转还丹，生生不息"
        },
        {
            name: "天地大衍真元诀",
            power: 260,
            mpCost: 175,
            cooldown: 4,
            effects: [{type: "weaken", value: 0.6, duration: 3}],
            description: "以天地之力压制敌人"
        }
    ],
    // 化神期
    5: [
        {
            name: "太古混沌神魔诀",
            power: 350,
            mpCost: 230,
            cooldown: 3,
            effects: [{type: "burn", value: 50, duration: 3}],
            description: "混沌之力，焚烧一切"
        },
        {
            name: "九天玄女元神经",
            power: 320,
            mpCost: 210,
            cooldown: 2,
            effects: [{type: "shield", value: 120, duration: 3}],
            description: "元神护体，万法不侵"
        },
        {
            name: "先天造化生死轮",
            power: 330,
            mpCost: 220,
            cooldown: 4,
            effects: [{type: "absorb", value: 0.4, duration: 0}],
            description: "生死轮转，夺取敌人生命"
        },
        {
            name: "紫微星辰万法归宗",
            power: 380,
            mpCost: 250,
            cooldown: 5,
            effects: [{type: "stun", value: 1, duration: 1}, {type: "weaken", value: 0.5, duration: 3}],
            description: "紫微星光照耀，镇压一切"
        }
    ]
};

// 法术库 - 按境界分类
const SPELLS = {
    // 凡人 & 练气期
    0: [
        {
            name: "火球术",
            power: 15,
            mpCost: 8,
            cooldown: 0,
            effects: [],
            description: "凝聚火焰，投掷向敌人"
        },
        {
            name: "冰锥术",
            power: 18,
            mpCost: 10,
            cooldown: 1,
            effects: [{type: "slow", value: 0.8, duration: 1}],
            description: "冰锥刺骨，减缓敌人速度"
        },
        {
            name: "疾风斩",
            power: 22,
            mpCost: 12,
            cooldown: 1,
            effects: [],
            description: "风刃切割，迅捷如风"
        }
    ],
    1: [
        {
            name: "烈焰焚空咒",
            power: 35,
            mpCost: 22,
            cooldown: 1,
            effects: [{type: "burn", value: 5, duration: 3}],
            description: "烈焰焚烧，持续伤害"
        },
        {
            name: "玄冰封印",
            power: 40,
            mpCost: 28,
            cooldown: 2,
            effects: [{type: "freeze", value: 1, duration: 1}],
            description: "冰封敌人，使其无法行动"
        },
        {
            name: "雷霆万钧",
            power: 50,
            mpCost: 35,
            cooldown: 2,
            effects: [],
            description: "雷霆轰击，威力强大"
        },
        {
            name: "风刃乱舞",
            power: 45,
            mpCost: 30,
            cooldown: 1,
            effects: [],
            description: "风刃乱舞，连续攻击"
        }
    ],
    // 筑基期
    2: [
        {
            name: "碧落黄泉摄魂术",
            power: 70,
            mpCost: 45,
            cooldown: 2,
            effects: [{type: "weaken", value: 0.75, duration: 2}],
            description: "摄取神魂，削弱敌人"
        },
        {
            name: "九天玄火煞神咒",
            power: 85,
            mpCost: 55,
            cooldown: 2,
            effects: [{type: "burn", value: 12, duration: 3}],
            description: "玄火煞气，焚烧不息"
        },
        {
            name: "寒冰极光冻结术",
            power: 75,
            mpCost: 50,
            cooldown: 3,
            effects: [{type: "freeze", value: 1, duration: 1}],
            description: "极寒之光，冻结万物"
        },
        {
            name: "紫霄神雷降临",
            power: 95,
            mpCost: 65,
            cooldown: 3,
            effects: [{type: "stun", value: 1, duration: 1}],
            description: "神雷降世，震慑敌人"
        }
    ],
    // 金丹期
    3: [
        {
            name: "天地玄黄灭魂咒",
            power: 130,
            mpCost: 85,
            cooldown: 3,
            effects: [{type: "weaken", value: 0.6, duration: 3}],
            description: "玄黄之力，灭杀神魂"
        },
        {
            name: "三昧真火焚天术",
            power: 155,
            mpCost: 100,
            cooldown: 3,
            effects: [{type: "burn", value: 25, duration: 3}],
            description: "三昧真火，焚烧诸天"
        },
        {
            name: "九幽冰魄绝灭阵",
            power: 140,
            mpCost: 90,
            cooldown: 4,
            effects: [{type: "freeze", value: 1, duration: 2}],
            description: "九幽冰魄，冰封一切"
        },
        {
            name: "五雷正法轰天决",
            power: 165,
            mpCost: 110,
            cooldown: 4,
            effects: [{type: "stun", value: 1, duration: 1}, {type: "burn", value: 15, duration: 2}],
            description: "五雷轰顶，天罚降临"
        }
    ],
    // 元婴期
    4: [
        {
            name: "太乙天罡雷劫咒",
            power: 210,
            mpCost: 140,
            cooldown: 3,
            effects: [{type: "burn", value: 30, duration: 3}],
            description: "天罡雷劫，毁灭一切"
        },
        {
            name: "九天应元普化雷声",
            power: 230,
            mpCost: 155,
            cooldown: 4,
            effects: [{type: "stun", value: 1, duration: 1}, {type: "weaken", value: 0.65, duration: 3}],
            description: "雷声普化，震慑群敌"
        },
        {
            name: "大荒天炎焚世术",
            power: 245,
            mpCost: 165,
            cooldown: 4,
            effects: [{type: "burn", value: 40, duration: 4}],
            description: "天炎焚世，无物不焚"
        },
        {
            name: "万法归宗玄元诀",
            power: 200,
            mpCost: 130,
            cooldown: 3,
            effects: [{type: "absorb", value: 0.25, duration: 0}],
            description: "万法归宗，吸收敌人力量"
        }
    ],
    // 化神期
    5: [
        {
            name: "混沌神雷开天决",
            power: 320,
            mpCost: 210,
            cooldown: 4,
            effects: [{type: "burn", value: 45, duration: 4}, {type: "stun", value: 1, duration: 1}],
            description: "混沌雷霆，开天辟地"
        },
        {
            name: "太古星辰陨落术",
            power: 340,
            mpCost: 225,
            cooldown: 5,
            effects: [{type: "weaken", value: 0.5, duration: 4}],
            description: "星辰陨落，镇压万物"
        },
        {
            name: "九天玄女幽冥咒",
            power: 310,
            mpCost: 205,
            cooldown: 4,
            effects: [{type: "poison", value: 35, duration: 4}],
            description: "幽冥诅咒，侵蚀生命"
        },
        {
            name: "先天五行灭世阵",
            power: 360,
            mpCost: 240,
            cooldown: 6,
            effects: [{type: "burn", value: 50, duration: 4}, {type: "weaken", value: 0.55, duration: 3}],
            description: "五行之力，灭世大阵"
        }
    ]
};

// 状态效果描述
const EFFECT_DESCRIPTIONS = {
    burn: "🔥 灼烧",
    poison: "☠️ 中毒",
    freeze: "❄️ 冰封",
    stun: "💫 眩晕",
    slow: "🐌 减速",
    weaken: "⬇️ 虚弱",
    shield: "🛡️ 护盾",
    heal: "💚 治疗",
    absorb: "🌀 吸收"
};

// 根据境界随机生成敌人数据
function generateEnemyByRealm(realmLevel, name = "敌人") {
    const config = REALM_CONFIG[realmLevel] || REALM_CONFIG[1];
    
    // Roll点生成基础属性
    const hp = rollDice(config.hp.min, config.hp.max);
    const mp = rollDice(config.mp.min, config.mp.max);
    
    // 生成六维属性
    const attributes = {
        physique: rollDice(config.physique.min, config.physique.max),
        comprehension: rollDice(config.comprehension.min, config.comprehension.max),
        spirituality: rollDice(config.spirituality.min, config.spirituality.max),
        luck: rollDice(config.luck.min, config.luck.max),
        charm: rollDice(config.charm.min, config.charm.max),
        willpower: rollDice(config.willpower.min, config.willpower.max)
    };
    
    // 随机选择功法（2-3个）
    const techniqueCount = rollDice(2, 3);
    const availableTechniques = TECHNIQUES[realmLevel] || TECHNIQUES[1];
    const techniques = getRandomItems(availableTechniques, techniqueCount);
    
    // 随机选择法术（2-3个）
    const spellCount = rollDice(2, 3);
    const availableSpells = SPELLS[realmLevel] || SPELLS[1];
    const spells = getRandomItems(availableSpells, spellCount);
    
    return {
        name: name,
        realm: config.name,
        realmLevel: realmLevel,
        hp: hp,
        hpMax: hp,
        mp: mp,
        mpMax: mp,
        attributes: attributes,
        techniques: techniques,
        spells: spells,
        effects: [] // 当前生效的状态
    };
}

// 随机数生成
function rollDice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 从数组中随机选择N个不重复的元素
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REALM_CONFIG,
        TECHNIQUES,
        SPELLS,
        EFFECT_DESCRIPTIONS,
        generateEnemyByRealm,
        rollDice,
        getRandomItems
    };
}
