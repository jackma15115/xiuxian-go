/**
 * 艾超尖塔 - 卡牌系统
 * Card System for ACJT Game
 */

// ==================== 卡牌类型枚举 ====================
const CardType = {
    ATTACK: 'attack',           // 攻击
    H_ATTACK: 'h_attack',       // H攻击（特殊攻击）
    HEAL: 'heal',               // 治疗
    BUFF: 'buff',               // 我方增益
    DEBUFF: 'debuff',           // 给对方debuff
    ARMOR: 'armor',             // 护甲
    CURSE: 'curse'              // 诅咒（敌人H技能，不能打出）
};

// ==================== 路线卡类型 ====================
const RouteType = {
    UNKNOWN: 'unknown',         // 问号牌（随机事件）
    MONSTER: 'monster',         // 小怪牌
    ELITE: 'elite',             // 精英怪牌
    BOSS: 'boss',               // Boss牌
    SHOP: 'shop',               // 商店牌
    REST: 'rest'                // 温泉牌（休息/升级）
};

const RouteTypeConfig = {
    [RouteType.UNKNOWN]: { name: '???', icon: '❓', color: '#9c88ff', desc: '随机事件' },
    [RouteType.MONSTER]: { name: '小怪', icon: '👹', color: '#ff4757', desc: '战斗遭遇' },
    [RouteType.ELITE]: { name: '精英', icon: '💀', color: '#ffa502', desc: '精英战斗' },
    [RouteType.BOSS]: { name: 'BOSS', icon: '👿', color: '#ff0000', desc: 'Boss战斗' },
    [RouteType.SHOP]: { name: '商店', icon: '🏪', color: '#2ed573', desc: '购买卡牌和圣遗物' },
    [RouteType.REST]: { name: '温泉', icon: '♨️', color: '#70a1ff', desc: '休息或升级卡牌' }
};

// ==================== 敌人意图系统 ====================
const EnemyIntentType = {
    ATTACK: 'attack',           // 攻击
    DEFEND: 'defend',           // 防御（获得护甲）
    BUFF: 'buff',               // 自我增强
    DEBUFF: 'debuff',           // 削弱玩家
    CHARGE: 'charge',           // 蓄力（下回合大招）
    HEAL: 'heal',               // 治疗自身
    SPECIAL: 'special'          // Boss专属技能
};

const EnemyIntentConfig = {
    [EnemyIntentType.ATTACK]: { name: '攻击', icon: '⚔️', color: '#ff4757', desc: '造成伤害' },
    [EnemyIntentType.DEFEND]: { name: '防御', icon: '🛡️', color: '#74b9ff', desc: '获得护甲' },
    [EnemyIntentType.BUFF]: { name: '增强', icon: '💪', color: '#ffa502', desc: '提升自身属性' },
    [EnemyIntentType.DEBUFF]: { name: '削弱', icon: '💫', color: '#a55eea', desc: '降低玩家属性' },
    [EnemyIntentType.CHARGE]: { name: '蓄力', icon: '🔥', color: '#ff6348', desc: '准备大招' },
    [EnemyIntentType.HEAL]: { name: '治疗', icon: '❤️', color: '#2ed573', desc: '恢复生命' },
    [EnemyIntentType.SPECIAL]: { name: '特殊', icon: '⭐', color: '#ffd700', desc: 'Boss技能' }
};

// ==================== 卡牌词缀系统 ====================
const CardAffixConfig = {
    burning: {
        id: 'burning', name: '炽热', icon: '🔥', rarity: 'common',
        description: '额外造成3点燃烧(2回合)',
        effect: { type: 'dot', damage: 3, duration: 2 }
    },
    frozen: {
        id: 'frozen', name: '冰冻', icon: '❄️', rarity: 'rare',
        description: '15%几率冻结敌人1回合',
        effect: { type: 'freeze', chance: 0.15, duration: 1 }
    },
    vampiric: {
        id: 'vampiric', name: '吸血', icon: '🦷', rarity: 'rare',
        description: '伤害的20%恢复生命',
        effect: { type: 'lifesteal', percent: 0.2 }
    },
    poison: {
        id: 'poison', name: '剧毒', icon: '🧪', rarity: 'common',
        description: '额外造成2点毒伤(3回合)',
        effect: { type: 'dot', damage: 2, duration: 3 }
    },
    echo: {
        id: 'echo', name: '回响', icon: '🔊', rarity: 'epic',
        description: '30%几率再次触发效果',
        effect: { type: 'echo', chance: 0.3 }
    },
    swift: {
        id: 'swift', name: '迅捷', icon: '⚡', rarity: 'common',
        description: '使用后抽1张牌',
        effect: { type: 'draw', count: 1 }
    },
    fortify: {
        id: 'fortify', name: '坚固', icon: '🛡️', rarity: 'common',
        description: '额外获得3点护甲',
        effect: { type: 'armor', value: 3 }
    },
    blessed: {
        id: 'blessed', name: '祝福', icon: '✨', rarity: 'rare',
        description: '使用后恢复3HP',
        effect: { type: 'heal', value: 3 }
    },
    cursed: {
        id: 'cursed', name: '诅咒', icon: '💀', rarity: 'epic',
        description: '效果+50%，但增加3堕落值',
        effect: { type: 'empower', bonus: 0.5, corruption: 3 }
    },
    chaos: {
        id: 'chaos', name: '混沌', icon: '🌀', rarity: 'legendary',
        description: '随机触发另一种词缀效果',
        effect: { type: 'random' }
    }
};

const AffixRarityWeights = {
    common: 60,
    rare: 25,
    epic: 12,
    legendary: 3
};

// ==================== 职业系统 ====================
const ProfessionConfig = {
    nun: {
        id: 'nun',
        name: '修女',
        icon: 'img/user/user_001.png',  // 修女职业图标
        description: '虔诚的修女，擅长治疗和神圣攻击，堕落后解锁强力H技能。',
        baseStats: {
            hp: 70, maxHp: 70, energy: 3, attack: 0, defense: 0, baseArmor: 0, corruption: 0
        },
        cardPool: [
            'attack_001', 'attack_001', 'attack_002', 'attack_006', 'attack_007',
            'heal_001', 'heal_001', 'heal_002', 'heal_003', 'heal_004', 'heal_005', 'heal_006', 'heal_007',
            'buff_001', 'buff_002', 'buff_003', 'buff_008', 'buff_009',
            'debuff_001', 'debuff_002', 'debuff_006',
            'armor_001', 'armor_001', 'armor_002', 'armor_003'
        ],
        professionCardPool: [
            'nun_001', 'nun_002', 'nun_003', 'nun_004', 'nun_005', 'nun_006',
            'nun_007', 'nun_008', 'nun_009', 'nun_010', 'nun_011', 'nun_012',
            'nun_013', 'nun_014', 'nun_015', 'nun_016', 'nun_017', 'nun_018',
            'nun_019', 'nun_020', 'nun_021', 'nun_022', 'nun_023', 'nun_024',
            'nun_025', 'nun_026', 'nun_027', 'nun_028', 'nun_029', 'nun_030'
        ],
        guaranteedCards: ['nun_001', 'nun_007', 'heal_001', 'armor_001', 'h_attack_001']
    },
    courtesan: {
        id: 'courtesan',
        name: '妓女',
        icon: 'img/user/user_006.png',
        description: '风月场中的老手，擅长削弱敌人攻防，少数技能可控制敌人。',
        baseStats: {
            hp: 55, maxHp: 55, energy: 3, attack: 2, defense: 0, baseArmor: 0, corruption: 20
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_003', 'attack_008',
            'heal_001', 'heal_002', 'heal_009',
            'buff_001', 'buff_003', 'buff_004', 'buff_005', 'buff_010',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004', 'debuff_006', 'debuff_007', 'debuff_008',
            'armor_001', 'armor_002'
        ],
        professionCardPool: [
            'courtesan_001', 'courtesan_002', 'courtesan_003', 'courtesan_004', 'courtesan_005',
            'courtesan_006', 'courtesan_007', 'courtesan_008', 'courtesan_009', 'courtesan_010',
            'courtesan_011', 'courtesan_012', 'courtesan_013', 'courtesan_014', 'courtesan_015',
            'courtesan_016', 'courtesan_017', 'courtesan_018', 'courtesan_019', 'courtesan_020',
            'courtesan_021', 'courtesan_022', 'courtesan_023', 'courtesan_024', 'courtesan_025'
        ],
        guaranteedCards: ['courtesan_001', 'courtesan_006', 'courtesan_019', 'h_attack_001', 'h_attack_002']
    },
    commoner: {
        id: 'commoner',
        name: '平民',
        icon: 'img/user/user_004.png',
        description: '普通人的智慧与韧性，低费高效，擅长抽牌和获取金币。',
        baseStats: {
            hp: 65, maxHp: 65, energy: 3, attack: 0, defense: 0, baseArmor: 0, corruption: 0
        },
        startingGold: 150,
        cardPool: [
            'attack_001', 'attack_001', 'attack_002', 'attack_003', 'attack_004', 'attack_005', 'attack_006',
            'heal_001', 'heal_002', 'heal_003', 'heal_004',
            'buff_001', 'buff_002', 'buff_003', 'buff_004', 'buff_005', 'buff_006',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004',
            'armor_001', 'armor_001', 'armor_002', 'armor_003', 'armor_004'
        ],
        professionCardPool: [
            'commoner_001', 'commoner_002', 'commoner_003', 'commoner_004', 'commoner_005',
            'commoner_006', 'commoner_007', 'commoner_008', 'commoner_009', 'commoner_010',
            'commoner_011', 'commoner_012', 'commoner_013', 'commoner_014', 'commoner_015',
            'commoner_016', 'commoner_017', 'commoner_018', 'commoner_019', 'commoner_020'
        ],
        guaranteedCards: ['commoner_001', 'commoner_004', 'commoner_011', 'heal_001', 'armor_001']
    },
    thief: {
        id: 'thief',
        name: '盗贼',
        icon: 'img/user/user_002.png',
        description: '身手敏捷的盗贼，擅长持续伤害和抽牌，用毒和流血慢慢磨死敌人。',
        baseStats: {
            hp: 50, maxHp: 50, energy: 4, attack: 3, defense: 0, baseArmor: 0, corruption: 5
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_003', 'attack_004', 'attack_005', 'attack_008',
            'heal_001', 'heal_009',
            'buff_001', 'buff_002', 'buff_004', 'buff_010',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004', 'debuff_006', 'debuff_007',
            'armor_001', 'armor_006'
        ],
        professionCardPool: [
            'thief_001', 'thief_002', 'thief_003', 'thief_004', 'thief_005',
            'thief_006', 'thief_007', 'thief_008', 'thief_009', 'thief_010',
            'thief_011', 'thief_012', 'thief_013', 'thief_014', 'thief_015',
            'thief_016', 'thief_017', 'thief_018', 'thief_019', 'thief_020',
            'thief_021', 'thief_022', 'thief_023', 'thief_024', 'thief_025'
        ],
        guaranteedCards: ['thief_001', 'thief_002', 'thief_006', 'thief_007', 'armor_001']
    },
    warrior: {
        id: 'warrior',
        name: '战士',
        icon: 'img/user/user_005.png',
        description: '勇猛的女战士，高生命高护甲，正面作战能力强。',
        baseStats: {
            hp: 85, maxHp: 85, energy: 3, attack: 2, defense: 2, baseArmor: 5, corruption: 0
        },
        cardPool: [
            'attack_001', 'attack_001', 'attack_002', 'attack_003', 'attack_004', 'attack_005', 'attack_006', 'attack_007',
            'heal_001', 'heal_002', 'heal_010', 'heal_011',
            'buff_001', 'buff_002', 'buff_006', 'buff_008',
            'debuff_001', 'debuff_002',
            'armor_001', 'armor_001', 'armor_002', 'armor_003', 'armor_004'
        ],
        professionCardPool: [
            'warrior_001', 'warrior_002', 'warrior_003', 'warrior_004', 'warrior_005',
            'warrior_006', 'warrior_007', 'warrior_008', 'warrior_009', 'warrior_010',
            'warrior_011', 'warrior_012', 'warrior_013', 'warrior_014', 'warrior_015'
        ],
        guaranteedCards: ['warrior_001', 'warrior_002', 'warrior_003', 'warrior_004', 'armor_001']
    },
    mage: {
        id: 'mage',
        name: '女法师',
        icon: 'img/user/user_009.png',
        description: '精通魔法的法师，高伤害法术，擅长抽牌和能量获取。',
        baseStats: {
            hp: 45, maxHp: 45, energy: 4, attack: 0, defense: 0, baseArmor: 0, corruption: 0
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_006', 'attack_007',
            'heal_001', 'heal_005', 'heal_009',
            'buff_001', 'buff_002', 'buff_005', 'buff_008', 'buff_015',
            'debuff_001', 'debuff_002', 'debuff_006',
            'armor_001', 'armor_002'
        ],
        professionCardPool: [
            'mage_001', 'mage_002', 'mage_003', 'mage_004', 'mage_005',
            'mage_006', 'mage_007', 'mage_008', 'mage_009', 'mage_010',
            'mage_011', 'mage_012', 'mage_013', 'mage_014', 'mage_015',
            'mage_016', 'mage_017', 'mage_018', 'mage_019', 'mage_020',
            'mage_021', 'mage_022', 'mage_023', 'mage_024', 'mage_025'
        ],
        guaranteedCards: ['mage_001', 'mage_005', 'mage_015', 'mage_019', 'attack_001']
    },
    succubus_player: {
        id: 'succubus_player',
        name: '魅魔',
        icon: 'img/user/user_012.png',
        description: '来自深渊的魅魔，擅长吸血，造成伤害的同时恢复生命。',
        baseStats: {
            hp: 55, maxHp: 55, energy: 3, attack: 3, defense: 0, baseArmor: 0, corruption: 30
        },
        cardPool: [
            'attack_001', 'attack_002', 'attack_003', 'attack_008',
            'heal_001', 'heal_009',
            'buff_001', 'buff_002', 'buff_004', 'buff_005',
            'debuff_001', 'debuff_002', 'debuff_003', 'debuff_004', 'debuff_007',
            'armor_001'
        ],
        professionCardPool: [
            'succubus_p_001', 'succubus_p_002', 'succubus_p_003', 'succubus_p_004', 'succubus_p_005',
            'succubus_p_006', 'succubus_p_007', 'succubus_p_008', 'succubus_p_009', 'succubus_p_010',
            'succubus_p_011', 'succubus_p_012', 'succubus_p_013', 'succubus_p_014', 'succubus_p_015',
            'succubus_p_016', 'succubus_p_017', 'succubus_p_018', 'succubus_p_019', 'succubus_p_020'
        ],
        guaranteedCards: ['succubus_p_001', 'succubus_p_004', 'succubus_p_005', 'h_attack_001', 'h_attack_002']
    }
};

// ==================== 种族系统 ====================
const RaceConfig = {
    human: {
        id: 'human', name: '人类', icon: '👩',
        description: '普通的人类女性，属性均衡，没有特殊优劣。',
        statMods: { hp: 0, attack: 0, defense: 0, energy: 0, corruption: 0 }
    },
    elf: {
        id: 'elf', name: '精灵', icon: '🧝‍♀️',
        description: '优雅的精灵族，魔力充沛但体质较弱。',
        statMods: { hp: -10, attack: 0, defense: -1, energy: 1, corruption: 0 }
    },
    succubus: {
        id: 'succubus', name: '魅魔', icon: '😈',
        description: '魅惑的魅魔，天生擅长H技能，但防御较低。',
        statMods: { hp: -5, attack: 3, defense: -2, energy: 0, corruption: 15 }
    },
    incubus: {
        id: 'incubus', name: '淫魔', icon: '👿',
        description: '淫欲化身的淫魔，攻击力极高但极易堕落。',
        statMods: { hp: -15, attack: 5, defense: -1, energy: 0, corruption: 30 }
    },
    catgirl: {
        id: 'catgirl', name: '猫娘', icon: '🐱',
        description: '灵活的猫娘，闪避能力强，擅长连续攻击。',
        statMods: { hp: -5, attack: 2, defense: 1, energy: 0, corruption: 5 }
    },
    foxgirl: {
        id: 'foxgirl', name: '狐娘', icon: '🦊',
        description: '狡黠的狐娘，魅惑能力强，综合实力均衡。',
        statMods: { hp: 0, attack: 1, defense: 0, energy: 0, corruption: 10 }
    }
};

// ==================== 身体属性配置 ====================
const BodyConfig = {
    height: [
        { id: 'petite', name: '娇小 (145-155cm)', desc: '娇小玲珑的身材' },
        { id: 'short', name: '偏矮 (155-160cm)', desc: '小巧可爱的身高' },
        { id: 'average', name: '中等 (160-165cm)', desc: '普通的身高' },
        { id: 'tall', name: '偏高 (165-170cm)', desc: '修长的身材' },
        { id: 'model', name: '高挑 (170-175cm)', desc: '模特般的高挑身材' },
        { id: 'amazon', name: '高大 (175cm+)', desc: '高大威猛的身材' }
    ],
    weight: [
        { id: 'slim', name: '纤细', desc: '纤细苗条' },
        { id: 'slender', name: '苗条', desc: '苗条匀称' },
        { id: 'average', name: '标准', desc: '标准身材' },
        { id: 'curvy', name: '丰满', desc: '曲线丰满' },
        { id: 'plump', name: '圆润', desc: '肉感十足' },
        { id: 'voluptuous', name: '肉感', desc: '丰腴诱人' }
    ],
    chest: [
        { id: 'A', name: 'A罩杯', desc: '平坦的胸部' },
        { id: 'B', name: 'B罩杯', desc: '小巧的双峰' },
        { id: 'C', name: 'C罩杯', desc: '适中的胸围' },
        { id: 'D', name: 'D罩杯', desc: '丰满的乳房' },
        { id: 'E', name: 'E罩杯', desc: '巨大的双峰' },
        { id: 'F', name: 'F罩杯', desc: '硕大的巨乳' }
    ],
    hips: [
        { id: 'slim', name: '纤细', desc: '纤细的臀部' },
        { id: 'petite', name: '小巧', desc: '小巧玲珑的翘臀' },
        { id: 'average', name: '适中', desc: '匀称的臀部' },
        { id: 'round', name: '浑圆', desc: '浑圆饱满的臀部' },
        { id: 'plump', name: '肥硕', desc: '肥美丰腴的臀部' },
        { id: 'huge', name: '巨臀', desc: '硕大诱人的肥臀' }
    ],
    vagina: [
        // ===== 外形分类 =====
        { id: 'steamed_bun', name: '馒头型', desc: '【馒头型】阴阜饱满隆起，肉感十足，圆润可爱' },
        { id: 'pink_butterfly', name: '粉蝴蝶', desc: '【粉蝴蝶】花瓣粉嫩外翻如蝶翼，娇艳欲滴' },
        { id: 'black_butterfly', name: '黑蝴蝶', desc: '【黑蝴蝶】蝶翼舒展色泽深邃，成熟妩媚' },
        { id: 'abalone', name: '鲍鱼型', desc: '【鲍鱼型】外缩口小巧紧致，层层褶皱如鲍鱼' },
        { id: 'conch', name: '海螺型', desc: '【海螺型】螺旋状褶皱深邃，曲径通幽' },
        { id: 'cherry', name: '樱桃型', desc: '【樱桃型】小巧玲珑粉嫩，娇小可人' },
        { id: 'white_tiger', name: '白虎', desc: '【白虎】光滑无毛天生丽质，娇嫩如玉' },
        { id: 'peach', name: '蜜桃型', desc: '【蜜桃型】丰满圆润如蜜桃，汁水充盈' },
        { id: 'virgin_tight', name: '一线天', desc: '【一线天】紧闭如线缝隙极小，处女名器' },
        { id: 'lotus', name: '莲花型', desc: '【莲花型】花瓣层叠如莲绽放，清雅脱俗' },
        // ===== 内部特征分类 =====
        { id: 'octopus_pot', name: '章鱼壶', desc: '【章鱼壶】入口紧小内部宽敞，吸附力强' },
        { id: 'thousand_worm', name: '千蚯蚓', desc: '【千蚯蚓】内壁褶皱密布蠕动，缠绵销魂' },
        { id: 'bead_string', name: '数珠型', desc: '【数珠型】内壁颗粒如串珠，刺激非凡' },
        { id: 'spiral', name: '螺旋型', desc: '【螺旋型】内壁旋转纹路，紧致缠绵' },
        { id: 'velvet', name: '天鹅绒', desc: '【天鹅绒】内壁柔软如丝绒，温柔包裹' },
        { id: 'suction', name: '吸盘型', desc: '【吸盘型】强力吸附紧紧咬住，欲罢不能' },
        { id: 'hot_spring', name: '温泉型', desc: '【温泉型】内部温热湿润，水量充沛' },
        { id: 'honey_pot', name: '蜜罐型', desc: '【蜜罐型】蜜汁丰盈甜美，润滑顺畅' },
        { id: 'deep_throat', name: '深渊型', desc: '【深渊型】穴道深邃直抵花心，深不可测' },
        { id: 'sensitive', name: '敏感型', desc: '【敏感型】轻触即有反应，极易高潮' }
    ]
};

// ==================== 开局特殊状态（消耗点数，与黑市联动） ====================
const StartingStatusConfig = {
    // ========== 负面状态（给予点数） ==========
    slave_collar: {
        id: 'slave_collar', name: '奴隶项圈', icon: '⭕', points: 15,
        description: '脖子上戴着屈辱的项圈',
        effect: '最大HP-10',
        statusEffect: { maxHp: -10 },
        linkedBodyMod: null
    },
    chastity_belt: {
        id: 'chastity_belt', name: '贞操带', icon: '🔒', points: 20,
        description: '被锁上了贞操带',
        effect: 'HP无法超过50%',
        statusEffect: { hpCap: 0.5 },
        linkedBodyMod: null
    },
    curse_mark: {
        id: 'curse_mark', name: '淫纹诅咒', icon: '🔮', points: 25,
        description: '身上刻有淫靡的魔纹',
        effect: '每次休息堕落+5',
        statusEffect: { corruptionPerRest: 5 },
        linkedBodyMod: null
    },
    aphrodisiac: {
        id: 'aphrodisiac', name: '残留媚药', icon: '💊', points: 10,
        description: '体内残留着媚药',
        effect: '攻击-2',
        statusEffect: { attack: -2 },
        linkedBodyMod: null
    },
    branded: {
        id: 'branded', name: '奴隶烙印', icon: '🔥', points: 15,
        description: '身上有奴隶的烙印',
        effect: '防御-2',
        statusEffect: { defense: -2 },
        linkedBodyMod: null
    },
    debt_slave: {
        id: 'debt_slave', name: '债务奴隶', icon: '📜', points: 20,
        description: '背负巨额债务',
        effect: '初始金币-50',
        statusEffect: { gold: -50 },
        linkedBodyMod: null
    },

    // ========== 黑市同款状态（消耗点数） ==========
    // 魔族系
    start_succubus: {
        id: 'start_succubus', name: '魅魔化', icon: '😈', points: -40,
        description: '天生的魅魔体质',
        effect: '堕落+50, 攻+3, 防+3',
        statusEffect: { corruption: 50, attack: 3, defense: 3 },
        linkedBodyMod: 'succubus'
    },
    start_demon_blood: {
        id: 'start_demon_blood', name: '淫魔血脉', icon: '🩸', points: -50,
        description: '体内流淌着淫魔血液',
        effect: '堕落+60, 攻+5, 防+5',
        statusEffect: { corruption: 60, attack: 5, defense: 5 },
        linkedBodyMod: 'demon_blood'
    },
    start_demon_tail: {
        id: 'start_demon_tail', name: '魔族尾巴', icon: '🦯', points: -25,
        description: '天生拥有魔族尾巴',
        effect: '堕落+25, 攻+2, 防+2',
        statusEffect: { corruption: 25, attack: 2, defense: 2 },
        linkedBodyMod: 'demon_tail'
    },
    start_demon_horns: {
        id: 'start_demon_horns', name: '魔族犄角', icon: '🦌', points: -25,
        description: '头顶天生有犄角',
        effect: '堕落+30, 攻+4',
        statusEffect: { corruption: 30, attack: 4 },
        linkedBodyMod: 'demon_horns'
    },
    start_demon_wings: {
        id: 'start_demon_wings', name: '魔族翅膀', icon: '🦇', points: -35,
        description: '天生拥有翅膀',
        effect: '堕落+35, 攻+3, 防+3',
        statusEffect: { corruption: 35, attack: 3, defense: 3 },
        linkedBodyMod: 'demon_wings'
    },

    // 胸部系
    start_nipple_ring: {
        id: 'start_nipple_ring', name: '乳环', icon: '💎', points: -20,
        description: '乳头上的银色环饰',
        effect: '堕落+20, H伤害+6',
        statusEffect: { corruption: 20, hDamageBonus: 6 },
        linkedBodyMod: 'nipple_ring'
    },
    start_lactation: {
        id: 'start_lactation', name: '泌乳体质', icon: '🍼', points: -25,
        description: '天生会分泌乳汁',
        effect: '堕落+30, 每回合+1HP, 防+2',
        statusEffect: { corruption: 30, hpPerTurn: 1, defense: 2 },
        linkedBodyMod: 'lactation'
    },
    start_mega_breast: {
        id: 'start_mega_breast', name: '天然巨乳', icon: '🎈', points: -35,
        description: '天生的巨乳',
        effect: '堕落+40, 防+5, 攻-1',
        statusEffect: { corruption: 40, defense: 5, attack: -1 },
        linkedBodyMod: 'mega_breast'
    },

    // 下体系
    start_pussy_enhance: {
        id: 'start_pussy_enhance', name: '名器', icon: '🌸', points: -35,
        description: '天生的名器',
        effect: '堕落+40, H伤害+15',
        statusEffect: { corruption: 40, hDamageBonus: 15 },
        linkedBodyMod: 'pussy_enhance'
    },
    start_anal_develop: {
        id: 'start_anal_develop', name: '后穴敏感', icon: '🍑', points: -30,
        description: '后穴天生敏感',
        effect: '堕落+35, 防+3',
        statusEffect: { corruption: 35, defense: 3 },
        linkedBodyMod: 'anal_develop'
    },

    // 体质系
    start_sensitive_body: {
        id: 'start_sensitive_body', name: '敏感体质', icon: '💗', points: -25,
        description: '天生的敏感体质',
        effect: '堕落+25, 每回合+2HP',
        statusEffect: { corruption: 25, hpPerTurn: 2 },
        linkedBodyMod: 'sensitive_body'
    },
    start_heat_body: {
        id: 'start_heat_body', name: '发情体质', icon: '🔥', points: -30,
        description: '天生容易发情',
        effect: '堕落+35, 攻+4',
        statusEffect: { corruption: 35, attack: 4 },
        linkedBodyMod: 'heat_body'
    },
    start_body_enhance: {
        id: 'start_body_enhance', name: '强壮体质', icon: '💪', points: -25,
        description: '天生强壮',
        effect: '堕落+20, HP+15',
        statusEffect: { corruption: 20, maxHp: 15 },
        linkedBodyMod: 'body_enhance'
    },
    start_elastic_body: {
        id: 'start_elastic_body', name: '柔韧身体', icon: '🤸', points: -25,
        description: '天生柔软灵活',
        effect: '堕落+25, 防+4',
        statusEffect: { corruption: 25, defense: 4 },
        linkedBodyMod: 'elastic_body'
    },
    start_regeneration: {
        id: 'start_regeneration', name: '再生能力', icon: '♻️', points: -40,
        description: '天生的再生能力',
        effect: '堕落+35, 每回合+3HP',
        statusEffect: { corruption: 35, hpPerTurn: 3 },
        linkedBodyMod: 'regeneration'
    },
    start_pain_pleasure: {
        id: 'start_pain_pleasure', name: '受虐体质', icon: '😵', points: -30,
        description: '痛苦会转化为快感',
        effect: '堕落+40, 受伤+4HP, 防-2',
        statusEffect: { corruption: 40, hpOnHit: 4, defense: -2 },
        linkedBodyMod: 'pain_pleasure'
    },

    // 特殊系
    start_pheromone_gland: {
        id: 'start_pheromone_gland', name: '媚香体质', icon: '🌺', points: -25,
        description: '散发迷人香气',
        effect: '堕落+30, 敌人攻击-2',
        statusEffect: { corruption: 30, enemyAttackReduce: 2 },
        linkedBodyMod: 'pheromone_gland'
    },
    start_pleasure_nerve: {
        id: 'start_pleasure_nerve', name: '快感神经', icon: '⚡', points: -35,
        description: '痛苦转化为快感',
        effect: '堕落+45, 受伤+3HP',
        statusEffect: { corruption: 45, hpOnHit: 3 },
        linkedBodyMod: 'pleasure_nerve'
    },
    start_tentacle_implant: {
        id: 'start_tentacle_implant', name: '触手共生', icon: '🐙', points: -40,
        description: '体内有触手器官',
        effect: '堕落+45, 攻+6',
        statusEffect: { corruption: 45, attack: 6 },
        linkedBodyMod: 'tentacle_implant'
    },
    start_charm_voice: {
        id: 'start_charm_voice', name: '魅音', icon: '🎤', points: -30,
        description: '天生的魅惑嗓音',
        effect: '堕落+30, 敌攻-3, 攻+2',
        statusEffect: { corruption: 30, enemyAttackReduce: 3, attack: 2 },
        linkedBodyMod: 'charm_voice'
    },
    start_lewd_tattoo: {
        id: 'start_lewd_tattoo', name: '天生淫纹', icon: '🔯', points: -25,
        description: '出生就带有淫纹',
        effect: '堕落+30, H伤害+10',
        statusEffect: { corruption: 30, hDamageBonus: 10 },
        linkedBodyMod: 'lewd_tattoo'
    },
    start_charm_body: {
        id: 'start_charm_body', name: '天生媚体', icon: '💃', points: -35,
        description: '天生充满魅力的身体',
        effect: '堕落+40, 攻+5',
        statusEffect: { corruption: 40, attack: 5 },
        linkedBodyMod: 'charm_body'
    }
};

// ==================== 开局经历配置 ====================
// 正点数 = 艰难背景(给予点数), 负点数 = 有利背景(消耗点数)
const OriginConfig = {
    slum: {
        id: 'slum', name: '贫民窟孤儿', icon: '🏚️', points: 10,
        description: '在贫民窟长大的孤儿，见惯了世态炎凉。',
        effect: '初始金币-30，初始HP+5',
        statMods: { gold: -30, hp: 5, maxHp: 5 }
    },
    debt: {
        id: 'debt', name: '背负债务', icon: '💰', points: 20,
        description: '欠下巨额债务，被迫来此冒险还债。',
        effect: '初始金币-50，攻击+1',
        statMods: { gold: -50, attack: 1 }
    },
    slave: {
        id: 'slave', name: '逃亡奴隶', icon: '⛓️', points: 25,
        description: '从主人身边逃跑的奴隶，正在被追杀。',
        effect: '初始金币-60，防御+2，堕落+10',
        statMods: { gold: -60, defense: 2, corruption: 10 }
    },
    fallen_noble: {
        id: 'fallen_noble', name: '落魄贵族', icon: '👑', points: -10,
        description: '曾经的贵族小姐，家道中落。',
        effect: '初始金币+20，无战斗经验',
        statMods: { gold: 20 }
    },
    brothel: {
        id: 'brothel', name: '青楼出身', icon: '🏮', points: -15,
        description: '从青楼中逃出，熟悉风月之事。',
        effect: '堕落+20，H伤害+5',
        statMods: { corruption: 20, hDamageBonus: 5 }
    },
    cursed: {
        id: 'cursed', name: '诅咒缠身', icon: '☠️', points: 30,
        description: '身上背负着神秘的诅咒。',
        effect: '最大HP-15，每场战斗堕落+2',
        statMods: { maxHp: -15, hp: -15, corruptionPerBattle: 2 }
    },
    adventurer: {
        id: 'adventurer', name: '新人冒险者', icon: '🎒', points: 0,
        description: '怀揣梦想的新人冒险者。',
        effect: '无特殊效果',
        statMods: {}
    },
    witch: {
        id: 'witch', name: '被驱逐的魔女', icon: '🧙‍♀️', points: -20,
        description: '因为某些原因被村庄驱逐的魔女。',
        effect: '费用+1，HP-10',
        statMods: { energy: 1, hp: -10, maxHp: -10 }
    },
    experiment: {
        id: 'experiment', name: '炼金实验体', icon: '⚗️', points: -25,
        description: '从炼金术士的实验室逃出的实验体。',
        effect: '攻击+2，防御-1，堕落+15',
        statMods: { attack: 2, defense: -1, corruption: 15 }
    },
    temple_maiden: {
        id: 'temple_maiden', name: '堕落的圣女', icon: '⛪', points: -30,
        description: '曾是神殿的圣女，因某种原因被逐出神殿。',
        effect: '最大HP+10，堕落+25，初始金币+30',
        statMods: { maxHp: 10, hp: 10, corruption: 25, gold: 30 }
    },
    assassin: {
        id: 'assassin', name: '逃离刺客', icon: '🗡️', points: 15,
        description: '曾是刺客公会的成员，因任务失败而被追杀。',
        effect: '攻击+3，初始金币-40，被追杀状态',
        statMods: { attack: 3, gold: -40 }
    },
    merchant_daughter: {
        id: 'merchant_daughter', name: '商人之女', icon: '🏪', points: -5,
        description: '富商的女儿，因家族破产而流落江湖。',
        effect: '初始金币+50，无战斗经验',
        statMods: { gold: 50, attack: -1 }
    },
    forest_raised: {
        id: 'forest_raised', name: '森林养大', icon: '🌲', points: 5,
        description: '从小被遗弃在森林，由野兽养大。',
        effect: '攻击+2，防御+1，初始金币-30',
        statMods: { attack: 2, defense: 1, gold: -30 }
    },
    demon_contract: {
        id: 'demon_contract', name: '魔族契约', icon: '📜', points: -35,
        description: '与魔族签订了契约，获得力量但失去自由。',
        effect: '攻击+4，堕落+30，每场战斗堕落+3',
        statMods: { attack: 4, corruption: 30, corruptionPerBattle: 3 }
    },
    war_refugee: {
        id: 'war_refugee', name: '战争难民', icon: '🏃', points: 20,
        description: '家乡被战火摧毁，失去一切的难民。',
        effect: '初始金币-50，防御+2，HP+10',
        statMods: { gold: -50, defense: 2, hp: 10, maxHp: 10 }
    },
    circus_performer: {
        id: 'circus_performer', name: '马戏团逃者', icon: '🎪', points: 10,
        description: '从残酷的马戏团逃出的表演者。',
        effect: '敏捷+1，初始金币-20，堕落+10',
        statMods: { gold: -20, corruption: 10, defense: 1 }
    },
    cult_survivor: {
        id: 'cult_survivor', name: '邪教幸存者', icon: '🔮', points: 25,
        description: '从邪教祭祀中侥幸逃脱的幸存者。',
        effect: '堕落+35，HP-10，神秘抗性',
        statMods: { corruption: 35, hp: -10, maxHp: -10 }
    },
    royal_spy: {
        id: 'royal_spy', name: '皇家密探', icon: '🎭', points: -15,
        description: '曾是皇家密探，因知晓太多秘密而被灭口。',
        effect: '攻击+2，初始金币+25，被追杀状态',
        statMods: { attack: 2, gold: 25 }
    },
    gladiator: {
        id: 'gladiator', name: '角斗士奴隶', icon: '⚔️', points: 15,
        description: '曾是竞技场的角斗士，通过血腥战斗求生。',
        effect: '攻击+3，防御+1，初始金币-40，堕落+10',
        statMods: { attack: 3, defense: 1, gold: -40, corruption: 10 }
    },
    shrine_servant: {
        id: 'shrine_servant', name: '神社巫女', icon: '⛩️', points: -10,
        description: '神社的巫女，因神社被毁而流浪。',
        effect: '最大HP+5，初始金币+15，堕落-5',
        statMods: { maxHp: 5, hp: 5, gold: 15, corruption: -5 }
    },
    pirate_captive: {
        id: 'pirate_captive', name: '海盗俘虏', icon: '🏴‍☠️', points: 15,
        description: '被海盗掳走后逃脱的俘虏。',
        effect: '初始金币-30，防御+2，堕落+15',
        statMods: { gold: -30, defense: 2, corruption: 15 }
    },
    noble_maid: {
        id: 'noble_maid', name: '贵族侍女', icon: '🎀', points: 5,
        description: '曾服务于贵族家庭的侍女，因主人倒台而失业。',
        effect: '初始金币-10，堕落+5，了解贵族社交',
        statMods: { gold: -10, corruption: 5 }
    },
    monster_child: {
        id: 'monster_child', name: '魔物之子', icon: '👹', points: -40,
        description: '人类与魔物结合所生的混血儿。',
        effect: '攻击+5，堕落+40，被歧视状态',
        statMods: { attack: 5, corruption: 40 }
    },
    alchemist_apprentice: {
        id: 'alchemist_apprentice', name: '炼金学徒', icon: '🧪', points: -10,
        description: '炼金术士的学徒，因师父去世而独自流浪。',
        effect: '初始金币+20，最大HP-5',
        statMods: { gold: 20, maxHp: -5, hp: -5 }
    },
    arena_champion: {
        id: 'arena_champion', name: '竞技冠军', icon: '🏆', points: -25,
        description: '地下竞技场的冠军，因拒绝打假比赛而被追杀。',
        effect: '攻击+4，防御+2，初始金币-20',
        statMods: { attack: 4, defense: 2, gold: -20 }
    },
    dream_wanderer: {
        id: 'dream_wanderer', name: '梦境旅人', icon: '💫', points: 10,
        description: '不知为何从异世界梦境中醒来的旅人。',
        effect: '初始金币-20，神秘感知',
        statMods: { gold: -20 }
    },
    sacrifice_survivor: {
        id: 'sacrifice_survivor', name: '祭品幸存', icon: '🩸', points: 30,
        description: '本应成为献祭的祭品，却奇迹般逃脱。',
        effect: '堕落+40，最大HP-15，神秘印记',
        statMods: { corruption: 40, maxHp: -15, hp: -15 }
    }
};

// ==================== 玩家状态管理 ====================
const PlayerState = {
    profession: null,           // 职业
    race: null,                 // 种族
    name: '旅行者',
    age: 18,                    // 年龄
    hp: 70,
    maxHp: 70,
    energy: 3,                  // 费用点（每回合）
    attack: 0,                  // 攻击力加成
    defense: 0,                 // 防御力加成
    baseArmor: 0,               // 进入战斗时的初始护甲
    corruption: 0,              // 堕落值
    gold: 100,                  // 金币
    floor: 1,                   // 当前层数
    relics: [],                 // 圣遗物列表
    floorSnapshots: {},         // 楼层快照（用于回滚）
    // 身体属性
    bodyAttributes: {
        height: null,
        weight: null,
        chest: null,
        hips: null,
        vagina: null
    },
    // 开局经历
    origin: null,
    // 开局特殊状态（与黑市联动）
    startingStatuses: [],

    // 初始化玩家（支持完整角色创建数据）
    init: function (professionId, name, options = {}) {
        const prof = ProfessionConfig[professionId];
        if (!prof) {
            console.error('[玩家] 职业不存在:', professionId);
            return;
        }

        this.profession = prof;
        this.name = name || '旅行者';
        this.age = options.age || 18;

        // 基础属性来自职业
        this.hp = prof.baseStats.hp;
        this.maxHp = prof.baseStats.maxHp;
        this.energy = prof.baseStats.energy;
        this.attack = prof.baseStats.attack;
        this.defense = prof.baseStats.defense;
        this.baseArmor = prof.baseStats.baseArmor;
        this.corruption = prof.baseStats.corruption;
        this.gold = prof.startingGold || 100;
        this.floor = 1;
        this.relics = [];
        this.floorSnapshots = {};

        // 应用种族修正
        if (options.raceId && RaceConfig[options.raceId]) {
            this.race = RaceConfig[options.raceId];
            const mods = this.race.statMods;
            this.hp += mods.hp || 0;
            this.maxHp += mods.hp || 0;
            this.attack += mods.attack || 0;
            this.defense += mods.defense || 0;
            this.energy += mods.energy || 0;
            this.corruption += mods.corruption || 0;
        }

        // 保存身体属性
        if (options.bodyAttributes) {
            this.bodyAttributes = { ...options.bodyAttributes };
        }

        // 应用开局经历
        if (options.originId && OriginConfig[options.originId]) {
            this.origin = OriginConfig[options.originId];
            const mods = this.origin.statMods;
            if (mods.gold) this.gold += mods.gold;
            if (mods.hp) this.hp += mods.hp;
            if (mods.maxHp) this.maxHp += mods.maxHp;
            if (mods.attack) this.attack += mods.attack;
            if (mods.defense) this.defense += mods.defense;
            if (mods.energy) this.energy += mods.energy;
            if (mods.corruption) this.corruption += mods.corruption;
        }

        // 应用开局特殊状态
        this.startingStatuses = options.startingStatuses || [];
        this.startingStatuses.forEach(statusId => {
            const status = StartingStatusConfig[statusId];
            if (status && status.statusEffect) {
                const eff = status.statusEffect;
                if (eff.maxHp) this.maxHp += eff.maxHp;
                if (eff.hp) this.hp += eff.hp;
                if (eff.attack) this.attack += eff.attack;
                if (eff.defense) this.defense += eff.defense;
                if (eff.corruption) this.corruption += eff.corruption;
            }
        });

        // 确保HP不超过maxHp
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        // 确保HP不低于1
        if (this.hp < 1) this.hp = 1;
        // 确保金币不为负
        if (this.gold < 0) this.gold = 0;

        console.log('[玩家] 初始化完成:', this.name, '职业:', prof.name);
    },

    // 🔧 创建楼层快照（进入新楼层时调用）
    createFloorSnapshot: function () {
        const snapshot = {
            hp: this.hp,
            maxHp: this.maxHp,
            gold: this.gold,
            corruption: this.corruption,
            relics: [...this.relics],
            deck: CardDeckManager.getDeckData(),
            timestamp: Date.now()
        };
        this.floorSnapshots[this.floor] = snapshot;
        this.save();
        console.log('[玩家] 创建楼层快照: 第', this.floor, '层', snapshot);
    },

    // 🔧 回滚到指定楼层快照
    rollbackToFloor: function (targetFloor) {
        const snapshot = this.floorSnapshots[targetFloor];
        if (!snapshot) {
            console.error('[玩家] 找不到第', targetFloor, '层的快照');
            return false;
        }

        this.hp = snapshot.hp;
        this.maxHp = snapshot.maxHp;
        this.gold = snapshot.gold;
        this.corruption = snapshot.corruption;
        this.relics = [...snapshot.relics];
        this.floor = targetFloor;

        // 回滚卡组
        if (snapshot.deck) {
            CardDeckManager.init(snapshot.deck);
            saveCardDeck();
        }

        // 删除目标楼层之后的所有快照
        Object.keys(this.floorSnapshots).forEach(floor => {
            if (parseInt(floor) > targetFloor) {
                delete this.floorSnapshots[floor];
            }
        });

        this.save();
        this.updateDisplay();
        console.log('[玩家] 回滚到第', targetFloor, '层，堕落值:', this.corruption);
        return true;
    },

    // 保存状态
    save: function () {
        const data = {
            professionId: this.profession?.id,
            name: this.name,
            hp: this.hp,
            maxHp: this.maxHp,
            energy: this.energy,
            attack: this.attack,
            defense: this.defense,
            baseArmor: this.baseArmor,
            corruption: this.corruption,
            gold: this.gold,
            floor: this.floor,
            relics: this.relics,
            floorSnapshots: this.floorSnapshots || {}
        };
        localStorage.setItem('acjt_player_state', JSON.stringify(data));
    },

    // 加载状态
    load: function () {
        const saved = localStorage.getItem('acjt_player_state');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.professionId) {
                    this.profession = ProfessionConfig[data.professionId];
                }
                this.name = data.name || '旅行者';
                this.hp = data.hp || 70;
                this.maxHp = data.maxHp || 70;
                this.energy = data.energy || 3;
                this.attack = data.attack || 0;
                this.defense = data.defense || 0;
                this.baseArmor = data.baseArmor || 0;
                this.corruption = data.corruption || 0;
                this.gold = data.gold || 100;
                this.floor = typeof data.floor === 'number' ? data.floor : 1; // 🔧 正确处理floor=0
                this.relics = data.relics || [];
                this.floorSnapshots = data.floorSnapshots || {};
                return true;
            } catch (e) {
                console.error('[玩家] 加载状态失败:', e);
            }
        }
        return false;
    },

    // 更新状态栏显示
    updateDisplay: function () {
        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const setElHtml = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };

        // 🔧 获取诅咒效果修正
        const mods = this.statusEffects || { energyMod: 0, attackMod: 0, defenseMod: 0, maxHpMod: 0, damageTakenMod: 0 };

        // 计算实际值
        const actualMaxHp = Math.max(1, this.maxHp + mods.maxHpMod);
        const actualHp = Math.min(this.hp, actualMaxHp);
        const actualEnergy = Math.max(0, this.energy + mods.energyMod);
        const actualAttack = Math.max(0, this.attack + mods.attackMod);
        const actualDefense = Math.max(0, this.defense + mods.defenseMod);

        // 生成带修正的显示文本
        const formatWithMod = (base, mod) => {
            if (mod === 0) return base.toString();
            const modStr = mod > 0 ? `<span style="color:#2ed573">+${mod}</span>` : `<span style="color:#ff4757">${mod}</span>`;
            return `${base + mod}(${modStr})`;
        };

        // 更新隐藏数据容器（兼容旧逻辑）
        setEl('playerHp', `${actualHp}/${actualMaxHp}`);
        setEl('playerEnergy', actualEnergy);
        setEl('playerAttack', actualAttack);
        setEl('playerDefense', actualDefense);
        setEl('playerArmor', this.baseArmor);
        setEl('playerCorruption', this.corruption);
        setEl('playerGold', this.gold);
        setEl('playerFloor', this.floor);
        setEl('playerName', this.name);

        // 更新内联状态栏显示（带修正）
        setEl('inlinePlayerName', this.name);
        setEl('inlinePlayerFloor', this.floor);
        setEl('inlinePlayerGold', this.gold);

        // HP显示修正
        if (mods.maxHpMod !== 0) {
            setElHtml('inlinePlayerHp', `${actualHp}/${actualMaxHp}<span style="color:#ff4757;font-size:10px">(${mods.maxHpMod})</span>`);
        } else {
            setEl('inlinePlayerHp', `${this.hp}/${this.maxHp}`);
        }

        // 费用显示修正
        if (mods.energyMod !== 0) {
            setElHtml('inlinePlayerEnergy', formatWithMod(this.energy, mods.energyMod));
        } else {
            setEl('inlinePlayerEnergy', this.energy);
        }

        setEl('inlinePlayerCorruption', this.corruption);

        // 攻击显示修正
        if (mods.attackMod !== 0) {
            setElHtml('inlinePlayerAttack', formatWithMod(this.attack, mods.attackMod));
        } else {
            setEl('inlinePlayerAttack', this.attack);
        }

        // 防御显示修正
        if (mods.defenseMod !== 0) {
            setElHtml('inlinePlayerDefense', formatWithMod(this.defense, mods.defenseMod));
        } else {
            setEl('inlinePlayerDefense', this.defense);
        }

        setEl('inlinePlayerArmor', this.baseArmor);

        // 🔧 受伤加成显示（如果有）
        const damageTakenEl = document.getElementById('inlinePlayerDamageTaken');
        if (damageTakenEl) {
            if (mods.damageTakenMod > 0) {
                damageTakenEl.innerHTML = `<span style="color:#ff4757">受伤+${mods.damageTakenMod}%</span>`;
                damageTakenEl.style.display = 'inline';
            } else {
                damageTakenEl.style.display = 'none';
            }
        }

        // 更新圣遗物数量显示
        const relicCountEl = document.getElementById('relicCount');
        if (relicCountEl) {
            const count = this.relics?.length || 0;
            relicCountEl.textContent = count > 0 ? `圣遗物(${count})` : '圣遗物';
        }

        // 更新城镇按钮状态（第0层可用）
        if (typeof TownSystem !== 'undefined') {
            TownSystem.updateButtons();
        }
    }
};

// ==================== 怪物配置 ====================
const MonsterConfig = {
    // ========== 小怪 (12种) - 简单行为模式 ==========
    slime: {
        id: 'slime', name: '史莱姆', icon: 'img/monster/monster_020.png',
        hp: 25, attack: 5, defense: 0, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 70 },
            { type: 'defend', weight: 30 }
        ]
    },
    goblin: {
        id: 'goblin', name: '哥布林', icon: 'img/monster/monster_017.png',
        hp: 30, attack: 7, defense: 2, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 60 },
            { type: 'buff', weight: 25 },
            { type: 'defend', weight: 15 }
        ]
    },
    skeleton: {
        id: 'skeleton', name: '骷髅兵', icon: 'img/monster/monster_013.png',
        hp: 28, attack: 8, defense: 1, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 75 },
            { type: 'defend', weight: 25 }
        ]
    },
    imp: {
        id: 'imp', name: '小恶魔', icon: 'img/monster/monster_019.png',
        hp: 22, attack: 9, defense: 0, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 65 },
            { type: 'debuff', weight: 25 },
            { type: 'buff', weight: 10 }
        ]
    },
    bat: {
        id: 'bat', name: '蝙蝠群', icon: 'img/monster/monster_024.png',
        hp: 18, attack: 6, defense: 0, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 80 },
            { type: 'buff', weight: 20 }
        ]
    },
    spider: {
        id: 'spider', name: '巨型蜘蛛', icon: 'img/monster/monster_021.png',
        hp: 32, attack: 7, defense: 1, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'debuff', weight: 35 },
            { type: 'defend', weight: 15 }
        ]
    },
    zombie: {
        id: 'zombie', name: '僵尸', icon: 'img/monster/monster_022.png',
        hp: 35, attack: 6, defense: 2, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 70 },
            { type: 'heal', weight: 20 },
            { type: 'defend', weight: 10 }
        ]
    },
    rat: {
        id: 'rat', name: '鼠人', icon: 'img/monster/monster_023.png',
        hp: 20, attack: 8, defense: 0, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 85 },
            { type: 'buff', weight: 15 }
        ]
    },
    mushroom: {
        id: 'mushroom', name: '毒蘑菇', icon: 'img/monster/monster_025.png',
        hp: 24, attack: 5, defense: 3, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 40 },
            { type: 'defend', weight: 20 }
        ]
    },
    ghost: {
        id: 'ghost', name: '幽灵', icon: 'img/monster/monster_026.png',
        hp: 22, attack: 10, defense: 0, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 60 },
            { type: 'debuff', weight: 30 },
            { type: 'buff', weight: 10 }
        ]
    },
    wolf: {
        id: 'wolf', name: '饿狼', icon: 'img/monster/monster_027.png',
        hp: 28, attack: 9, defense: 1, type: 'monster',
        intentPattern: [
            { type: 'attack', weight: 70 },
            { type: 'charge', weight: 20 },
            { type: 'buff', weight: 10 }
        ]
    },
    tentacle: {
        id: 'tentacle', name: '触手怪', icon: 'img/monster/monster_028.png',
        hp: 30, attack: 7, defense: 2, type: 'monster', special: 'grab',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'debuff', weight: 35 },
            { type: 'defend', weight: 15 }
        ]
    },

    // ========== 精英怪 (15种) - 更复杂的行为模式 ==========
    orc: {
        id: 'orc', name: '兽人战士', icon: 'img/monster/monster_029.png',
        hp: 50, attack: 12, defense: 5, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 15 },
            { type: 'defend', weight: 10 }
        ]
    },
    darkMage: {
        id: 'darkMage', name: '黑暗法师', icon: 'img/monster/monster_030.png',
        hp: 40, attack: 15, defense: 3, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 30 },
            { type: 'buff', weight: 20 },
            { type: 'defend', weight: 10 }
        ]
    },
    succubus: {
        id: 'succubus', name: '魅魔', icon: 'img/monster/monster_001.png',
        hp: 45, attack: 10, defense: 4, type: 'elite', special: 'seduce',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 35 },
            { type: 'heal', weight: 20 },
            { type: 'buff', weight: 10 }
        ]
    },
    minotaur: {
        id: 'minotaur', name: '牛头人', icon: 'img/monster/monster_031.png',
        hp: 60, attack: 14, defense: 6, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 45 },
            { type: 'charge', weight: 30 },
            { type: 'buff', weight: 15 },
            { type: 'defend', weight: 10 }
        ]
    },
    vampire: {
        id: 'vampire', name: '吸血鬼', icon: 'img/monster/monster_032.png',
        hp: 48, attack: 11, defense: 4, type: 'elite', special: 'lifesteal',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'heal', weight: 25 },
            { type: 'debuff', weight: 15 },
            { type: 'buff', weight: 10 }
        ]
    },
    harpy: {
        id: 'harpy', name: '鹰身女妖', icon: 'img/monster/monster_002.png',
        hp: 38, attack: 13, defense: 2, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 55 },
            { type: 'debuff', weight: 25 },
            { type: 'buff', weight: 20 }
        ]
    },
    golem: {
        id: 'golem', name: '石像鬼', icon: 'img/monster/monster_003.png',
        hp: 70, attack: 10, defense: 8, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'defend', weight: 40 },
            { type: 'charge', weight: 20 }
        ]
    },
    slimeQueen: {
        id: 'slimeQueen', name: '史莱姆女王', icon: 'img/monster/monster_004.png',
        hp: 55, attack: 9, defense: 5, type: 'elite', special: 'split',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'heal', weight: 25 },
            { type: 'defend', weight: 20 },
            { type: 'buff', weight: 15 }
        ]
    },
    darkKnight: {
        id: 'darkKnight', name: '黑暗骑士', icon: 'img/monster/monster_005.png',
        hp: 58, attack: 13, defense: 7, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 45 },
            { type: 'defend', weight: 30 },
            { type: 'charge', weight: 15 },
            { type: 'buff', weight: 10 }
        ]
    },
    lamia: {
        id: 'lamia', name: '蛇女', icon: 'img/monster/monster_006.png',
        hp: 52, attack: 11, defense: 4, type: 'elite', special: 'poison',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 40 },
            { type: 'buff', weight: 20 }
        ]
    },
    werewolf: {
        id: 'werewolf', name: '狼人', icon: 'img/monster/monster_007.png',
        hp: 55, attack: 14, defense: 4, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 25 }
        ]
    },
    dullahan: {
        id: 'dullahan', name: '无头骑士', icon: 'img/monster/monster_008.png',
        hp: 62, attack: 12, defense: 6, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 45 },
            { type: 'charge', weight: 30 },
            { type: 'defend', weight: 25 }
        ]
    },
    banshee: {
        id: 'banshee', name: '报丧女妖', icon: 'img/monster/monster_009.png',
        hp: 42, attack: 16, defense: 2, type: 'elite', special: 'fear',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'debuff', weight: 40 },
            { type: 'buff', weight: 20 }
        ]
    },
    darkElf: {
        id: 'darkElf', name: '暗精灵', icon: 'img/monster/monster_010.png',
        hp: 45, attack: 13, defense: 3, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 50 },
            { type: 'debuff', weight: 25 },
            { type: 'buff', weight: 25 }
        ]
    },
    demonGuard: {
        id: 'demonGuard', name: '恶魔守卫', icon: 'img/monster/monster_011.png',
        hp: 65, attack: 11, defense: 7, type: 'elite',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'defend', weight: 35 },
            { type: 'buff', weight: 15 },
            { type: 'charge', weight: 10 }
        ]
    },

    // ========== Boss (12种) - 复杂行为 + 特殊机制 ==========
    // 魔族系
    demonLord: {
        id: 'demonLord', name: '恶魔领主', icon: 'img/monster/monster_033.png',
        hp: 100, attack: 18, defense: 8, type: 'boss',
        desc: '地狱的统治者，掌控黑暗之力',
        intentPattern: [
            { type: 'attack', weight: 40 },
            { type: 'charge', weight: 25 },
            { type: 'buff', weight: 20 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'enrage',
            name: '地狱狂怒',
            description: '血量低于50%时进入狂暴状态，攻击力+50%',
            trigger: 'hpBelow50',
            effect: { attackBonus: 0.5 }
        }
    },
    lilith: {
        id: 'lilith', name: '高等魅魔', icon: 'img/monster/monster_034.png',
        hp: 110, attack: 22, defense: 8, type: 'boss', special: 'charm',
        desc: '最初的魅魔，诱惑之母',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'debuff', weight: 30 },
            { type: 'special', weight: 25 },
            { type: 'heal', weight: 15 }
        ],
        specialMechanic: {
            id: 'charm',
            name: '魅惑',
            description: '每3回合释放魅惑，随机打出玩家1张手牌',
            trigger: 'turnCooldown',
            cooldown: 3,
            effect: { type: 'forcePlayCard' }
        }
    },
    succubusQueen: {
        id: 'succubusQueen', name: '魅魔女王', icon: 'img/monster/monster_035.png',
        hp: 95, attack: 20, defense: 6, type: 'boss', special: 'drain',
        desc: '魅魔一族的统领，吸取生命精华',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 25 },
            { type: 'heal', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'lifeSteal',
            name: '生命汲取',
            description: '每次攻击恢复造成伤害的30%生命',
            trigger: 'onAttack',
            effect: { healPercent: 0.3 }
        }
    },

    // 龙族系
    dragonQueen: {
        id: 'dragonQueen', name: '龙族女王', icon: 'img/monster/monster_036.png',
        hp: 150, attack: 20, defense: 12, type: 'boss',
        desc: '古老龙族的女王，威严无双',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'charge', weight: 30 },
            { type: 'defend', weight: 20 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'dragonBreath',
            name: '龙息',
            description: '血量低于50%时释放龙息，造成基础攻击200%伤害',
            trigger: 'hpBelow50',
            effect: { damageMultiplier: 2.0 }
        }
    },
    ancientDragon: {
        id: 'ancientDragon', name: '远古巨龙', icon: 'img/monster/monster_037.png',
        hp: 180, attack: 25, defense: 15, type: 'boss',
        desc: '沉睡万年的远古存在',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'charge', weight: 35 },
            { type: 'defend', weight: 25 },
            { type: 'special', weight: 10 }
        ],
        specialMechanic: {
            id: 'ancientRoar',
            name: '远古咆哮',
            description: '每5回合释放咆哮，使玩家下回合无法使用卡牌',
            trigger: 'turnCooldown',
            cooldown: 5,
            effect: { type: 'silence', duration: 1 }
        }
    },

    // 天界/堕落系
    fallenAngel: {
        id: 'fallenAngel', name: '堕落天使', icon: 'img/monster/monster_038.png',
        hp: 120, attack: 15, defense: 10, type: 'boss', special: 'corrupt',
        desc: '从天堂堕落的天使，渴望堕落',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'debuff', weight: 35 },
            { type: 'heal', weight: 20 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'corruptionAura',
            name: '堕落光环',
            description: '每次被攻击时增加玩家5点堕落值',
            trigger: 'onHit',
            effect: { corruptionGain: 5 }
        }
    },
    darkSeraph: {
        id: 'darkSeraph', name: '黑暗炽天使', icon: 'img/monster/monster_039.png',
        hp: 135, attack: 18, defense: 12, type: 'boss', special: 'holy',
        desc: '被黑暗侵蚀的最高天使',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'buff', weight: 25 },
            { type: 'heal', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'divineJudgment',
            name: '神圣审判',
            description: '血量低于30%时释放神圣审判，造成50点固定伤害',
            trigger: 'hpBelow30',
            effect: { fixedDamage: 50 }
        }
    },

    // 深渊系
    abyssMother: {
        id: 'abyssMother', name: '深渊之母', icon: 'img/monster/monster_040.png',
        hp: 130, attack: 16, defense: 15, type: 'boss', special: 'spawn',
        desc: '深渊的孕育者，无尽的子嗣',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'defend', weight: 25 },
            { type: 'heal', weight: 20 },
            { type: 'special', weight: 25 }
        ],
        specialMechanic: {
            id: 'spawn',
            name: '孕育',
            description: '每4回合召唤1只触手幼体(15HP,5攻击)',
            trigger: 'turnCooldown',
            cooldown: 4,
            effect: { type: 'summon', minionHp: 15, minionAttack: 5 }
        }
    },
    voidEmpress: {
        id: 'voidEmpress', name: '虚空女皇', icon: 'img/monster/monster_041.png',
        hp: 140, attack: 19, defense: 11, type: 'boss', special: 'void',
        desc: '来自虚空的存在，扭曲现实',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 30 },
            { type: 'special', weight: 25 },
            { type: 'defend', weight: 10 }
        ],
        specialMechanic: {
            id: 'voidRift',
            name: '虚空裂隙',
            description: '每次攻击20%几率移除玩家弃牌堆1张牌',
            trigger: 'onAttack',
            effect: { type: 'removeCard', chance: 0.2 }
        }
    },
    tentacleHorror: {
        id: 'tentacleHorror', name: '触手恐魔', icon: 'img/monster/monster_042.png',
        hp: 125, attack: 14, defense: 8, type: 'boss', special: 'bind',
        desc: '深渊的使者，无数触手',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 30 },
            { type: 'special', weight: 25 },
            { type: 'defend', weight: 10 }
        ],
        specialMechanic: {
            id: 'bind',
            name: '触手束缚',
            description: '每回合封锁玩家1张随机手牌2回合',
            trigger: 'everyTurn',
            effect: { type: 'lockCard', duration: 2 }
        }
    },

    // 自然/精灵系
    darkDryad: {
        id: 'darkDryad', name: '堕落树精', icon: 'img/monster/monster_043.png',
        hp: 105, attack: 16, defense: 10, type: 'boss', special: 'regen',
        desc: '被邪恶侵蚀的森林之灵',
        intentPattern: [
            { type: 'attack', weight: 30 },
            { type: 'heal', weight: 30 },
            { type: 'debuff', weight: 25 },
            { type: 'special', weight: 15 }
        ],
        specialMechanic: {
            id: 'regeneration',
            name: '自然再生',
            description: '每回合恢复最大生命值5%',
            trigger: 'everyTurn',
            effect: { healPercent: 0.05 }
        }
    },
    spiderQueen: {
        id: 'spiderQueen', name: '蜘蛛女皇', icon: 'img/monster/monster_044.png',
        hp: 115, attack: 17, defense: 9, type: 'boss', special: 'web',
        desc: '黑暗森林的统治者，织网为巢',
        intentPattern: [
            { type: 'attack', weight: 35 },
            { type: 'debuff', weight: 35 },
            { type: 'special', weight: 20 },
            { type: 'defend', weight: 10 }
        ],
        specialMechanic: {
            id: 'webTrap',
            name: '蛛网陷阱',
            description: '每3回合释放蛛网，使玩家下回合抽牌-2',
            trigger: 'turnCooldown',
            cooldown: 3,
            effect: { type: 'reduceDraw', value: 2, duration: 1 }
        }
    }
};


// ==================== 圣遗物配置 (72种) ====================
const RelicConfig = {
    // 生命类
    holyRing: { id: 'holyRing', name: '圣光戒指', icon: '💍', price: 150, effect: { maxHp: 10 }, desc: '最大生命值+10' },
    bloodPendant: { id: 'bloodPendant', name: '鲜血吊坠', icon: '🩸', price: 180, effect: { maxHp: 15 }, desc: '最大生命值+15' },
    heartOfGiant: { id: 'heartOfGiant', name: '巨人之心', icon: '❤️', price: 250, effect: { maxHp: 25 }, desc: '最大生命值+25' },
    lifeStone: { id: 'lifeStone', name: '生命之石', icon: '💚', price: 200, effect: { maxHp: 20, defense: -1 }, desc: '最大HP+20，防御-1' },
    phoenixFeather: { id: 'phoenixFeather', name: '凤凰羽毛', icon: '🪶', price: 350, effect: { maxHp: 30 }, desc: '最大生命值+30' },
    vitalityOrb: { id: 'vitalityOrb', name: '活力宝珠', icon: '🟢', price: 120, effect: { maxHp: 8 }, desc: '最大生命值+8' },

    // 攻击类
    powerGem: { id: 'powerGem', name: '力量宝石', icon: '💎', price: 200, effect: { attack: 3 }, desc: '攻击力+3' },
    demonClaw: { id: 'demonClaw', name: '恶魔之爪', icon: '🦷', price: 280, effect: { attack: 5 }, desc: '攻击力+5' },
    thunderBlade: { id: 'thunderBlade', name: '雷霆刃', icon: '⚡', price: 320, effect: { attack: 6 }, desc: '攻击力+6' },
    berserkerMask: { id: 'berserkerMask', name: '狂战士面具', icon: '🎭', price: 180, effect: { attack: 4, defense: -2 }, desc: '攻击+4，防御-2' },
    dragonFang: { id: 'dragonFang', name: '龙牙', icon: '🐉', price: 400, effect: { attack: 8 }, desc: '攻击力+8' },
    wrathEmblem: { id: 'wrathEmblem', name: '愤怒徽记', icon: '😡', price: 150, effect: { attack: 2 }, desc: '攻击力+2' },

    // 防御类
    shieldAmulet: { id: 'shieldAmulet', name: '护盾护符', icon: '🛡️', price: 180, effect: { baseArmor: 5 }, desc: '初始护甲+5' },
    defenseCloak: { id: 'defenseCloak', name: '防御斗篷', icon: '🧥', price: 150, effect: { defense: 3 }, desc: '防御力+3' },
    ironSkin: { id: 'ironSkin', name: '铁皮护符', icon: '🔩', price: 220, effect: { defense: 5 }, desc: '防御力+5' },
    turtleShell: { id: 'turtleShell', name: '龟甲', icon: '🐢', price: 200, effect: { baseArmor: 8, attack: -1 }, desc: '初始护甲+8，攻击-1' },
    guardianRing: { id: 'guardianRing', name: '守护之戒', icon: '⭕', price: 180, effect: { defense: 4 }, desc: '防御力+4' },
    steelPlate: { id: 'steelPlate', name: '钢铁胸甲', icon: '🪖', price: 250, effect: { baseArmor: 10 }, desc: '初始护甲+10' },

    // 能量类
    energyCrystal: { id: 'energyCrystal', name: '能量水晶', icon: '🔮', price: 300, effect: { energy: 1 }, desc: '每回合费用+1' },
    manaGem: { id: 'manaGem', name: '法力宝石', icon: '💠', price: 350, effect: { energy: 1 }, desc: '每回合费用+1' },
    spiritBead: { id: 'spiritBead', name: '灵力珠', icon: '🔵', price: 280, effect: { energy: 1, maxHp: -5 }, desc: '费用+1，最大HP-5' },

    // 堕落/诅咒类
    corruptedHeart: { id: 'corruptedHeart', name: '堕落之心', icon: '🖤', price: 100, effect: { attack: 5, corruption: 10 }, desc: '攻击+5，堕落值+10' },
    darkPact: { id: 'darkPact', name: '黑暗契约', icon: '📜', price: 80, effect: { attack: 7, corruption: 15 }, desc: '攻击+7，堕落值+15' },
    sinfulGem: { id: 'sinfulGem', name: '罪恶宝石', icon: '💜', price: 120, effect: { energy: 1, corruption: 20 }, desc: '费用+1，堕落值+20' },
    lustRing: { id: 'lustRing', name: '欲望之戒', icon: '💋', price: 90, effect: { maxHp: 15, corruption: 8 }, desc: 'HP+15，堕落+8' },
    demonSeal: { id: 'demonSeal', name: '恶魔封印', icon: '🔴', price: 150, effect: { attack: 4, defense: 2, corruption: 12 }, desc: '攻防+4/+2，堕落+12' },
    abyssalTear: { id: 'abyssalTear', name: '深渊之泪', icon: '💧', price: 100, effect: { defense: 5, corruption: 10 }, desc: '防御+5，堕落+10' },

    // 特殊效果类
    luckyCharm: { id: 'luckyCharm', name: '幸运护符', icon: '🍀', price: 200, effect: { goldBonus: 20 }, desc: '战斗金币奖励+20%' },
    healingTotem: { id: 'healingTotem', name: '治愈图腾', icon: '🗿', price: 220, effect: { healBonus: 3 }, desc: '所有治疗效果+3' },
    vampireFang: { id: 'vampireFang', name: '吸血鬼獠牙', icon: '🦷', price: 280, effect: { lifesteal: 2 }, desc: '攻击时回复2点HP' },
    windBoots: { id: 'windBoots', name: '疾风靴', icon: '👢', price: 180, effect: { drawBonus: 1 }, desc: '每回合额外抽1张牌' },
    mirrorShard: { id: 'mirrorShard', name: '镜像碎片', icon: '🪞', price: 250, effect: { reflect: 2 }, desc: '受击时反弹2点伤害' },
    ancientCoin: { id: 'ancientCoin', name: '古老金币', icon: '🪙', price: 150, effect: { shopDiscount: 15 }, desc: '商店价格-15%' },

    // 色情系圣遗物 (20种) - hDamageBonus是直接加成数值
    succubusKiss: { id: 'succubusKiss', name: '魅魔之吻', icon: '💋', price: 80, effect: { attack: 4, hDamageBonus: 3, corruption: 5 }, desc: '攻击+4，H伤害+3，堕落+5' },
    lustChains: { id: 'lustChains', name: '欲望锁链', icon: '⛓️', price: 100, effect: { defense: 3, hDamageBonus: 2, corruption: 8 }, desc: '防御+3，H伤害+2，堕落+8' },
    pinkCrystal: { id: 'pinkCrystal', name: '粉晶', icon: '💎', price: 120, effect: { hDamageBonus: 5, corruption: 10 }, desc: 'H伤害+5，堕落+10' },
    aphrodisiac: { id: 'aphrodisiac', name: '永久媚药', icon: '🧪', price: 60, effect: { attack: 6, defense: -2, corruption: 12 }, desc: '攻击+6，防御-2，堕落+12' },
    slutCollar: { id: 'slutCollar', name: '淫纹项圈', icon: '⭕', price: 90, effect: { energy: 1, corruption: 15 }, desc: '费用+1，堕落+15' },
    breedingMark: { id: 'breedingMark', name: '繁殖印记', icon: '🔥', price: 70, effect: { maxHp: 20, corruption: 10 }, desc: 'HP+20，堕落+10' },
    milkingCup: { id: 'milkingCup', name: '挤奶杯', icon: '🥛', price: 85, effect: { healBonus: 5, corruption: 8 }, desc: '治疗+5，堕落+8' },
    vibrator: { id: 'vibrator', name: '魔法振动棒', icon: '🔔', price: 95, effect: { hDamageBonus: 4, drawBonus: 1, corruption: 6 }, desc: 'H伤害+4，抽牌+1，堕落+6' },
    lewdTattoo: { id: 'lewdTattoo', name: '淫纹刺青', icon: '🌸', price: 110, effect: { attack: 3, hDamageBonus: 3, corruption: 12 }, desc: '攻击+3，H伤害+3，堕落+12' },
    tentacleSeed: { id: 'tentacleSeed', name: '触手种子', icon: '🐙', price: 130, effect: { attack: 5, reflect: 2, corruption: 15 }, desc: '攻击+5，反伤2，堕落+15' },
    demonWomb: { id: 'demonWomb', name: '恶魔子宫', icon: '💜', price: 150, effect: { maxHp: 30, hDamageBonus: 6, corruption: 20 }, desc: 'HP+30，H伤害+6，堕落+20' },
    slaveRing: { id: 'slaveRing', name: '奴隶戒指', icon: '💍', price: 75, effect: { defense: 4, corruption: 10 }, desc: '防御+4，堕落+10' },
    chastityKey: { id: 'chastityKey', name: '贞操带钥匙', icon: '🔑', price: 140, effect: { energy: 1, healBonus: 3, corruption: 8 }, desc: '费用+1，治疗+3，堕落+8' },
    brokenHeart: { id: 'brokenHeart', name: '破碎的心', icon: '💔', price: 65, effect: { attack: 5, maxHp: -10, corruption: 5 }, desc: '攻击+5，HP-10，堕落+5' },
    sinfulMirror: { id: 'sinfulMirror', name: '淫欲之镜', icon: '🪞', price: 100, effect: { hDamageBonus: 7, reflect: 1, corruption: 10 }, desc: 'H伤害+7，反伤1，堕落+10' },
    pleasureBell: { id: 'pleasureBell', name: '快感铃铛', icon: '🔔', price: 88, effect: { drawBonus: 1, hDamageBonus: 2, corruption: 6 }, desc: '抽牌+1，H伤害+2，堕落+6' },
    corruptedHalo: { id: 'corruptedHalo', name: '堕落光环', icon: '😇', price: 160, effect: { attack: 4, defense: 4, corruption: 18 }, desc: '攻防+4，堕落+18' },
    wombMark: { id: 'wombMark', name: '子宫印记', icon: '❤️', price: 115, effect: { hDamageBonus: 8, corruption: 15 }, desc: 'H伤害+8，堕落+15' },
    petEars: { id: 'petEars', name: '宠物耳朵', icon: '🐱', price: 70, effect: { defense: 2, goldBonus: 15, corruption: 5 }, desc: '防御+2，金币+15%，堕落+5' },
    tailPlug: { id: 'tailPlug', name: '尾巴塞', icon: '🐕', price: 95, effect: { attack: 3, hDamageBonus: 4, corruption: 10 }, desc: '攻击+3，H伤害+4，堕落+10' },

    // ==================== 新增普通圣遗物 (18种) ====================
    // 生命类
    angelTear: { id: 'angelTear', name: '天使之泪', icon: '💧', price: 280, effect: { maxHp: 20, healBonus: 2 }, desc: 'HP+20，治疗+2' },
    soulGem: { id: 'soulGem', name: '灵魂宝石', icon: '🔷', price: 320, effect: { maxHp: 35 }, desc: '最大生命值+35' },
    lifebloodAmulet: { id: 'lifebloodAmulet', name: '命脉护符', icon: '❣️', price: 180, effect: { maxHp: 12, defense: 1 }, desc: 'HP+12，防御+1' },

    // 攻击类
    shadowDagger: { id: 'shadowDagger', name: '暗影匕首', icon: '🗡️', price: 220, effect: { attack: 4, drawBonus: 1 }, desc: '攻击+4，抽牌+1' },
    flameSword: { id: 'flameSword', name: '烈焰剑', icon: '🔥', price: 350, effect: { attack: 7 }, desc: '攻击力+7' },
    venomFang: { id: 'venomFang', name: '毒蛇之牙', icon: '🐍', price: 200, effect: { attack: 3, lifesteal: 1 }, desc: '攻击+3，吸血1' },
    warBanner: { id: 'warBanner', name: '战旗', icon: '🚩', price: 160, effect: { attack: 2, defense: 2 }, desc: '攻防各+2' },

    // 防御类
    diamondShield: { id: 'diamondShield', name: '钻石盾', icon: '💎', price: 300, effect: { baseArmor: 12 }, desc: '初始护甲+12' },
    frostArmor: { id: 'frostArmor', name: '霜冻护甲', icon: '❄️', price: 240, effect: { defense: 6, attack: -1 }, desc: '防御+6，攻击-1' },
    holyShield: { id: 'holyShield', name: '圣盾', icon: '✝️', price: 280, effect: { defense: 5, maxHp: 10 }, desc: '防御+5，HP+10' },

    // 能量类
    arcaneOrb: { id: 'arcaneOrb', name: '奥术宝珠', icon: '🟣', price: 380, effect: { energy: 1, attack: 2 }, desc: '费用+1，攻击+2' },
    wisdomCrown: { id: 'wisdomCrown', name: '智慧王冠', icon: '👑', price: 400, effect: { energy: 1, drawBonus: 1 }, desc: '费用+1，抽牌+1' },

    // 特殊效果类
    treasureMap: { id: 'treasureMap', name: '藏宝图', icon: '🗺️', price: 180, effect: { goldBonus: 30 }, desc: '金币奖励+30%' },
    healingSpring: { id: 'healingSpring', name: '治愈之泉', icon: '⛲', price: 250, effect: { healBonus: 5 }, desc: '治疗效果+5' },
    thornyVine: { id: 'thornyVine', name: '荆棘藤蔓', icon: '🌿', price: 220, effect: { reflect: 3 }, desc: '反伤3点' },
    swiftBoots: { id: 'swiftBoots', name: '迅捷之靴', icon: '🥾', price: 200, effect: { drawBonus: 1, defense: 1 }, desc: '抽牌+1，防御+1' },
    merchantBadge: { id: 'merchantBadge', name: '商人徽章', icon: '🏷️', price: 120, effect: { shopDiscount: 20 }, desc: '商店折扣20%' },
    vampireCape: { id: 'vampireCape', name: '吸血鬼披风', icon: '🦇', price: 320, effect: { lifesteal: 3, maxHp: -10 }, desc: '吸血3，HP-10' },

    // ==================== 新增色情系圣遗物 (18种) ====================
    darkFeather: { id: 'darkFeather', name: '暗夜羽翼', icon: '🦋', price: 180, effect: { attack: 6, hDamageBonus: 5, corruption: 15 }, desc: '攻击+6，H伤害+5，堕落+15' },
    seductiveGaze: { id: 'seductiveGaze', name: '勾魂眼', icon: '👁️', price: 90, effect: { hDamageBonus: 6, corruption: 8 }, desc: 'H伤害+6，堕落+8' },
    sinfulTongue: { id: 'sinfulTongue', name: '淫舌', icon: '👅', price: 100, effect: { hDamageBonus: 4, healBonus: 2, corruption: 10 }, desc: 'H伤害+4，治疗+2，堕落+10' },
    pleasureNeedle: { id: 'pleasureNeedle', name: '快感针', icon: '💉', price: 75, effect: { attack: 3, hDamageBonus: 3, corruption: 6 }, desc: '攻击+3，H伤害+3，堕落+6' },
    lewdBracelet: { id: 'lewdBracelet', name: '淫欲手镯', icon: '📿', price: 85, effect: { defense: 3, hDamageBonus: 2, corruption: 7 }, desc: '防御+3，H伤害+2，堕落+7' },
    corruptedCrown: { id: 'corruptedCrown', name: '堕落王冠', icon: '👸', price: 200, effect: { energy: 1, hDamageBonus: 4, corruption: 18 }, desc: '费用+1，H伤害+4，堕落+18' },
    infernalCrown: { id: 'infernalCrown', name: '炼狱之冠', icon: '😈', price: 150, effect: { attack: 5, hDamageBonus: 5, corruption: 12 }, desc: '攻击+5，H伤害+5，堕落+12' },
    sinChains: { id: 'sinChains', name: '罪孽锁链', icon: '🔗', price: 110, effect: { defense: 4, hDamageBonus: 3, corruption: 9 }, desc: '防御+4，H伤害+3，堕落+9' },
    fleshRose: { id: 'fleshRose', name: '肉欲玫瑰', icon: '🌹', price: 95, effect: { maxHp: 15, hDamageBonus: 4, corruption: 8 }, desc: 'HP+15，H伤害+4，堕落+8' },
    hellfire: { id: 'hellfire', name: '地狱之火', icon: '🔥', price: 170, effect: { attack: 7, corruption: 20 }, desc: '攻击+7，堕落+20' },
    abyssalMark: { id: 'abyssalMark', name: '深渊印记', icon: '🌀', price: 130, effect: { hDamageBonus: 8, maxHp: -5, corruption: 12 }, desc: 'H伤害+8，HP-5，堕落+12' },
    serpentTail: { id: 'serpentTail', name: '蛇妖尾', icon: '🦎', price: 120, effect: { attack: 4, hDamageBonus: 4, corruption: 10 }, desc: '攻击+4，H伤害+4，堕落+10' },
    lustPotion: { id: 'lustPotion', name: '永恒媚药', icon: '🍷', price: 80, effect: { hDamageBonus: 5, defense: -1, corruption: 8 }, desc: 'H伤害+5，防御-1，堕落+8' },
    pleasureOrb: { id: 'pleasureOrb', name: '快感宝珠', icon: '🔮', price: 140, effect: { hDamageBonus: 6, drawBonus: 1, corruption: 10 }, desc: 'H伤害+6，抽牌+1，堕落+10' },
    sinfulNecklace: { id: 'sinfulNecklace', name: '罪恶项链', icon: '📿', price: 105, effect: { maxHp: 10, hDamageBonus: 5, corruption: 9 }, desc: 'HP+10，H伤害+5，堕落+9' },
    corruptedWomb: { id: 'corruptedWomb', name: '堕胎之子', icon: '🖤', price: 160, effect: { hDamageBonus: 10, corruption: 25 }, desc: 'H伤害+10，堕落+25' },
    succubusHeart: { id: 'succubusHeart', name: '魅魔之心', icon: '💗', price: 190, effect: { attack: 5, hDamageBonus: 7, lifesteal: 2, corruption: 15 }, desc: '攻击+5，H伤害+7，吸血2，堕落+15' },
    lustGem: { id: 'lustGem', name: '欲望晶石', icon: '💠', price: 145, effect: { hDamageBonus: 9, reflect: 1, corruption: 12 }, desc: 'H伤害+9，反伤1，堕落+12' }
};

// ==================== 特殊状态配置 (24种) ====================
const SpecialStatusConfig = {
    // 能量/费用影响
    跳蛋: { id: '跳蛋', icon: '🔔', effect: 'energy', value: -1, desc: '每场战斗开始时费用点-1', fullDesc: '体内被植入了震动的跳蛋，无法集中精神' },
    束缚锁链: { id: '束缚锁链', icon: '⛓️', effect: 'energy', value: -1, desc: '费用点-1', fullDesc: '手腕上的锁链限制了行动，难以施展全力' },
    精神污染: { id: '精神污染', icon: '🌀', effect: 'energy', value: -2, desc: '费用点-2', fullDesc: '深渊的低语不断侵蚀着意识，难以集中精神' },

    // 堕落值增加
    淫纹: { id: '淫纹', icon: '🔮', effect: 'corruptionPerRest', value: 5, desc: '每次休息堕落值+5', fullDesc: '身上被刻下了淫靡的魔纹，身体变得更加敏感' },
    羞耻衣: { id: '羞耻衣', icon: '👙', effect: 'corruptionPerBattle', value: 3, desc: '每场战斗开始堕落值+3', fullDesc: '被迫穿着暴露的羞耻服装' },
    魅魔契约: { id: '魅魔契约', icon: '💋', effect: 'corruptionPerRest', value: 8, desc: '休息时堕落值+8', fullDesc: '与魅魔签订了契约，每次休息都会被侵犯梦境' },
    淫欲诅咒: { id: '淫欲诅咒', icon: '💜', effect: 'corruptionPerBattle', value: 5, desc: '战斗开始堕落值+5', fullDesc: '被施加了淫欲诅咒，战斗时身体异常兴奋' },
    堕落种子: { id: '堕落种子', icon: '🌱', effect: 'corruptionPerRest', value: 10, desc: '休息时堕落值+10', fullDesc: '体内被植入了堕落的种子，正在缓慢侵蚀心智' },

    // 防御力影响
    乳环: { id: '乳环', icon: '⭕', effect: 'defense', value: -2, desc: '防御力-2', fullDesc: '乳头被穿上了银色的环，隐隐作痛' },
    肚脐钉: { id: '肚脐钉', icon: '📍', effect: 'defense', value: -1, desc: '防御力-1', fullDesc: '肚脐上的穿孔装饰，行动时会感到不适' },
    脚铐: { id: '脚铐', icon: '🔗', effect: 'defense', value: -3, desc: '防御力-3', fullDesc: '脚踝上的铁铐让移动变得困难' },

    // 生命值影响
    项圈: { id: '项圈', icon: '⚫', effect: 'maxHp', value: -10, desc: '最大HP-10', fullDesc: '脖子上被套上了奴隶项圈，象征着屈辱' },
    虚弱诅咒: { id: '虚弱诅咒', icon: '💀', effect: 'maxHp', value: -15, desc: '最大HP-15', fullDesc: '被施加了虚弱诅咒，生命力被不断抽取' },
    生命吸取: { id: '生命吸取', icon: '🩸', effect: 'maxHp', value: -20, desc: '最大HP-20', fullDesc: '有什么东西在持续吸取你的生命力' },

    // 治疗限制
    贞操带: { id: '贞操带', icon: '🔒', effect: 'healLimit', value: 50, desc: '无法恢复HP超过50%', fullDesc: '被锁上了贞操带，无法自由触碰自己' },
    诅咒伤口: { id: '诅咒伤口', icon: '🩹', effect: 'healLimit', value: 30, desc: '无法恢复HP超过30%', fullDesc: '身上的伤口被诅咒，无法正常愈合' },

    // 攻击力影响
    催情药: { id: '催情药', icon: '💊', effect: 'attack', value: -3, desc: '攻击力-3', fullDesc: '体内残留着催情药效，身体酥软无力' },
    媚药中毒: { id: '媚药中毒', icon: '🧪', effect: 'attack', value: -5, desc: '攻击力-5', fullDesc: '持续的媚药效果让身体无法用力' },
    肌肉萎缩: { id: '肌肉萎缩', icon: '💪', effect: 'attack', value: -4, desc: '攻击力-4', fullDesc: '长期囚禁导致肌肉萎缩，力量大减' },

    // 受伤增加
    烙印: { id: '烙印', icon: '🔥', effect: 'damageTaken', value: 50, desc: '受到的伤害+50%', fullDesc: '身上被烙上了主人的印记' },
    脆弱印记: { id: '脆弱印记', icon: '❌', effect: 'damageTaken', value: 30, desc: '受伤+30%', fullDesc: '被刻下了脆弱印记，防御力下降' },
    诅咒标记: { id: '诅咒标记', icon: '☠️', effect: 'damageTaken', value: 100, desc: '受伤+100%', fullDesc: '被深渊诅咒标记，伤害翻倍' },

    // 复合效果
    完全支配: { id: '完全支配', icon: '👑', effect: 'multiple', value: 0, desc: '攻击-2，防御-2，堕落+5/战斗', fullDesc: '已被完全支配，身心都不属于自己', effects: { attack: -2, defense: -2, corruptionPerBattle: 5 } },
    奴隶烙印: { id: '奴隶烙印', icon: '🔥', effect: 'multiple', value: 0, desc: 'HP-10，受伤+25%', fullDesc: '被烙上了奴隶烙印，标志着你的身份', effects: { maxHp: -10, damageTaken: 25 } },

    // 身体变化类
    小便失禁: { id: '小便失禁', icon: '💦', effect: 'multiple', value: 0, desc: '防御-2，战斗堕落+3', fullDesc: '无法控制尿意，战斗中经常失禁，羞耻不已', effects: { defense: -2, corruptionPerBattle: 3 } },
    大便失禁: { id: '大便失禁', icon: '💩', effect: 'multiple', value: 0, desc: '防御-3，战斗堕落+5', fullDesc: '括约肌已被调教到无法收缩，随时可能失禁', effects: { defense: -3, corruptionPerBattle: 5 } },
    巨乳化: { id: '巨乳化', icon: '🍈', effect: 'multiple', value: 0, desc: '费用-1，防御-2', fullDesc: '胸部被改造成I罩杯巨乳，大到行动受限，战斗时摇晃不已', effects: { energy: -1, defense: -2 } },
    子宫纹身: { id: '子宫纹身', icon: '❤️', effect: 'corruptionPerRest', value: 8, desc: '休息堕落+8', fullDesc: '小腹上被刻上了心形子宫纹身，象征着性奴身份' },
    敏感体质: { id: '敏感体质', icon: '💗', effect: 'damageTaken', value: 40, desc: '受伤+40%', fullDesc: '全身变得极度敏感，轻轻触碰就会颜抖' },
    发情期: { id: '发情期', icon: '🔥', effect: 'multiple', value: 0, desc: '攻击-2，战斗堕落+4', fullDesc: '被迭加了永久发情状态，身体持续燥热', effects: { attack: -2, corruptionPerBattle: 4 } },
    乳头肥大: { id: '乳头肥大', icon: '⭕', effect: 'defense', value: -2, desc: '防御-2', fullDesc: '乳头被改造得异常肥大，衣物都遮不住' },
    阴蒂肥大: { id: '阴蒂肥大', icon: '💎', effect: 'corruptionPerBattle', value: 5, desc: '战斗堕落+5', fullDesc: '阴蒂被改造得如拇指大小，稍有动作就会兴奋' },
    精神支配: { id: '精神支配', icon: '🧠', effect: 'energy', value: -2, desc: '费用-2', fullDesc: '精神被完全支配，无法自主思考' },
    性奴调教: { id: '性奴调教', icon: '👑', effect: 'multiple', value: 0, desc: '攻击-3，防御-3', fullDesc: '被调教成了顺从的性奴，失去了反抗的意志', effects: { attack: -3, defense: -3 } },
    子宫下垂: { id: '子宫下垂', icon: '⬇️', effect: 'maxHp', value: -20, desc: 'HP-20', fullDesc: '子宫被过度使用导致下垂，身体虚弱' },
    乳汁分泌: { id: '乳汁分泌', icon: '🍼', effect: 'corruptionPerRest', value: 6, desc: '休息堕落+6', fullDesc: '胸部持续分泌乳汁，无法止住' },
    永久发情: { id: '永久发情', icon: '💯', effect: 'multiple', value: 0, desc: '攻击-3，堕落+8/休息', fullDesc: '被施加了永久发情诅咒，无时无刻不在渴望', effects: { attack: -3, corruptionPerRest: 8 } },

    // 兽化类
    触手寄生: { id: '触手寄生', icon: '🐙', effect: 'multiple', value: 0, desc: '费用-2，战斗堕落+6', fullDesc: '体内被植入了触手生物，随时会从体内伸出触手', effects: { energy: -2, corruptionPerBattle: 6 } },
    史莱姆化: { id: '史莱姆化', icon: '🧫', effect: 'multiple', value: 0, desc: '防御-4，受伤+30%', fullDesc: '身体变得像史莱姆一样柔软，可以被随意揉捷', effects: { defense: -4, damageTaken: 30 } },

    // 特殊变化类
    扶她化: { id: '扶她化', icon: '🍆', effect: 'multiple', value: 0, desc: '攻击+3，战斗堕落+6', fullDesc: '小腹下方长出了肉棒，战斗时会异常兴奋', effects: { attack: 3, corruptionPerBattle: 6 } },
    小穴脱出: { id: '小穴脱出', icon: '🌸', effect: 'multiple', value: 0, desc: '防御-3，休息堕落+8', fullDesc: '阴道壁脱出了，粉嫩的肉壁露在外面', effects: { defense: -3, corruptionPerRest: 8 } },
    肛门脱出: { id: '肛门脱出', icon: '🔴', effect: 'multiple', value: 0, desc: '防御-4，休息堕落+10', fullDesc: '肛门脱出了，红色的肉花露在外面，行走都困难', effects: { defense: -4, corruptionPerRest: 10 } },
    子宫脱出: { id: '子宫脱出', icon: '❤️', effect: 'multiple', value: 0, desc: 'HP-25，休息堕落+12', fullDesc: '子宫完全脱出了，垂在两腿之间，身体极度虚弱', effects: { maxHp: -25, corruptionPerRest: 12 } }
};

// 特殊状态管理器
const SpecialStatusManager = {
    // 当前激活的特殊状态
    statuses: {},

    // 初始化
    init: function (savedStatuses = null) {
        if (savedStatuses) {
            this.statuses = { ...savedStatuses };
        } else {
            this.statuses = {};
        }
        this.updateDisplay();
    },

    // 添加特殊状态
    // source: 'curse'(诅咒卡), 'starting'(开局选择), 'blackmarket'(黑市)
    add: function (statusId, source = 'curse') {
        const config = SpecialStatusConfig[statusId];
        if (!config) return false;

        this.statuses[statusId] = {
            id: statusId,
            icon: config.icon,
            effect: config.effect,
            value: config.value,
            desc: config.desc,
            fullDesc: config.fullDesc,
            effects: config.effects || null, // 🔧 保存复合效果
            source: source, // 🔧 记录来源
            addedAt: Date.now()
        };

        this.save();
        this.updateDisplay();
        this.applyEffects();

        // 🔧 更新状态栏显示
        if (typeof PlayerState !== 'undefined') {
            PlayerState.updateDisplay();
        }

        console.log('[特殊状态] 添加:', statusId, '来源:', source);
        return true;
    },

    // 移除特殊状态
    remove: function (statusId) {
        if (this.statuses[statusId]) {
            delete this.statuses[statusId];
            this.save();
            this.updateDisplay();
            this.applyEffects();

            // 🔧 更新状态栏显示
            if (typeof PlayerState !== 'undefined') {
                PlayerState.updateDisplay();
            }

            console.log('[特殊状态] 移除:', statusId);
            return true;
        }
        return false;
    },

    // 获取所有激活状态
    getActive: function () {
        return Object.values(this.statuses);
    },

    // 检查是否有某状态
    has: function (statusId) {
        return !!this.statuses[statusId];
    },

    // 应用状态效果到玩家属性
    applyEffects: function () {
        // 重置受状态影响的属性
        let energyMod = 0;
        let attackMod = 0;
        let defenseMod = 0;
        let maxHpMod = 0;
        let damageTakenMod = 0;

        Object.values(this.statuses).forEach(status => {
            // 处理单一效果
            switch (status.effect) {
                case 'energy': energyMod += status.value; break;
                case 'attack': attackMod += status.value; break;
                case 'defense': defenseMod += status.value; break;
                case 'maxHp': maxHpMod += status.value; break;
                case 'damageTaken': damageTakenMod += status.value; break;
            }

            // 🔧 处理复合效果（multiple类型）
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.energy) energyMod += status.effects.energy;
                if (status.effects.attack) attackMod += status.effects.attack;
                if (status.effects.defense) defenseMod += status.effects.defense;
                if (status.effects.maxHp) maxHpMod += status.effects.maxHp;
                if (status.effects.damageTaken) damageTakenMod += status.effects.damageTaken;
            }
        });

        // 更新玩家属性（如果PlayerState已加载）
        if (typeof PlayerState !== 'undefined' && PlayerState.profession) {
            PlayerState.statusEffects = {
                energyMod, attackMod, defenseMod, maxHpMod, damageTakenMod
            };
            console.log('[特殊状态] 应用效果:', PlayerState.statusEffects);
        }
    },

    // 战斗开始时应用效果
    onBattleStart: function () {
        let corruptionGain = 0;
        let energyLoss = 0;

        Object.values(this.statuses).forEach(status => {
            // 单一效果
            if (status.effect === 'corruptionPerBattle') {
                corruptionGain += status.value;
            }
            if (status.effect === 'energy') {
                energyLoss += Math.abs(status.value);
            }

            // 🔧 复合效果
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.corruptionPerBattle) {
                    corruptionGain += status.effects.corruptionPerBattle;
                }
                if (status.effects.energy) {
                    energyLoss += Math.abs(status.effects.energy);
                }
            }
        });

        if (corruptionGain > 0) {
            PlayerState.corruption += corruptionGain;
            PlayerState.save();
            console.log('[特殊状态] 战斗开始，堕落值+' + corruptionGain);
        }

        return { energyLoss };
    },

    // 休息时应用效果
    onRest: function () {
        let corruptionGain = 0;

        Object.values(this.statuses).forEach(status => {
            // 单一效果
            if (status.effect === 'corruptionPerRest') {
                corruptionGain += status.value;
            }

            // 🔧 复合效果
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.corruptionPerRest) {
                    corruptionGain += status.effects.corruptionPerRest;
                }
            }
        });

        if (corruptionGain > 0) {
            PlayerState.corruption += corruptionGain;
            PlayerState.save();
            console.log('[特殊状态] 休息时，堕落值+' + corruptionGain);
        }
    },

    // 更新状态栏显示
    updateDisplay: function () {
        const container = document.getElementById('specialStatusList');
        if (!container) return;

        const statuses = this.getActive();
        if (statuses.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #666; padding: 10px;">暂无异常状态</div>';
            return;
        }

        let html = '';
        statuses.forEach(status => {
            // 🔧 兼容两种格式：普通状态用desc，身体改造用description
            const displayName = status.name || status.id;
            const displayDesc = status.desc || status.description || '';
            const displayFullDesc = status.fullDesc || status.description || '';

            html += `
                <div class="special-status-item" style="background: rgba(255,100,100,0.1); 
                     border: 1px solid rgba(255,100,100,0.3); border-radius: 6px; 
                     padding: 8px; margin-bottom: 6px; cursor: pointer;"
                     onclick="SpecialStatusManager.showDetail('${status.id}')"
                     title="${displayFullDesc}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #ff6b81;">${status.icon} ${displayName}</span>
                        <span style="color: #888; font-size: 10px;">${displayDesc}</span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    // 显示状态详情
    showDetail: function (statusId) {
        const status = this.statuses[statusId];
        if (!status) return;

        const displayName = status.name || status.id;
        const displayDesc = status.desc || status.description || '';
        const displayFullDesc = status.fullDesc || status.description || '';
        const isPermanent = status.permanent ? '\n\n（永久改造，无法清除）' : '\n\n（在温泉休息时可以选择清除此状态）';

        alert(`${status.icon} ${displayName}\n\n效果: ${displayDesc}\n\n${displayFullDesc}${isPermanent}`);
    },

    // 保存
    save: function () {
        localStorage.setItem('acjt_special_status', JSON.stringify(this.statuses));
    },

    // 加载
    load: function () {
        const saved = localStorage.getItem('acjt_special_status');
        if (saved) {
            try {
                this.statuses = JSON.parse(saved);
            } catch (e) {
                this.statuses = {};
            }
        }

        // 🔧 同步来自 gameState.variables.specialStatus 的数据
        if (typeof gameState !== 'undefined' && gameState.variables && gameState.variables.specialStatus) {
            const gameStateStatuses = gameState.variables.specialStatus;
            Object.keys(gameStateStatuses).forEach(key => {
                if (gameStateStatuses[key].active && !this.statuses[key]) {
                    // gameState 中有但 SpecialStatusManager 中没有，补充进来
                    const config = SpecialStatusConfig[key];
                    if (config) {
                        this.statuses[key] = {
                            id: key,
                            icon: config.icon,
                            effect: config.effect,
                            value: config.value,
                            desc: config.desc,
                            fullDesc: config.fullDesc,
                            addedAt: Date.now()
                        };
                    }
                }
            });
            this.save(); // 保存同步后的数据
        }

        this.updateDisplay();
        this.applyEffects();
    },

    // 🔧 强制清除所有特殊状态（调试用）
    clearAll: function () {
        this.statuses = {};
        this.save();

        // 同时清除 gameState 中的数据
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.specialStatus = {};
        }

        this.updateDisplay();
        this.applyEffects();
        console.log('[特殊状态] 已清除所有特殊状态');
    }
};

// ==================== 随机事件提示词 ====================
const RandomEventPrompts = {
    erotic: [
        '简单跳过之前的场景，生成新剧情：我在探索中发现了一个隐秘的洞穴，里面传来令人脸红的声音...',
        '简单跳过之前的场景，生成新剧情：一个衣着暴露的神秘女子拦住了我的去路，她的眼神中带着诱惑...',
        '简单跳过之前的场景，生成新剧情：我误入了魅魔的领地，空气中弥漫着令人迷醉的香气...'
    ],
    adventure: [
        '简单跳过之前的场景，生成新剧情：我发现了一个被遗忘的宝箱，里面似乎有什么东西在发光...',
        '简单跳过之前的场景，生成新剧情：一位受伤的旅行者向我求助，他说附近有一个藏宝地点...',
        '简单跳过之前的场景，生成新剧情：我遇到了一位神秘的商人，他愿意用特殊的方式进行交易...'
    ],
    misfortune: [
        '简单跳过之前的场景，生成新剧情：我不小心触发了一个陷阱，地面开始塌陷...',
        '简单跳过之前的场景，生成新剧情：一群强盗从暗处冲了出来，将我团团围住...',
        '简单跳过之前的场景，生成新剧情：我喝下的泉水似乎有问题，感觉身体开始发软...'
    ]
};

// 卡牌类型显示名称
const CardTypeNames = {
    [CardType.ATTACK]: '攻击',
    [CardType.H_ATTACK]: 'H攻击',
    [CardType.HEAL]: '治疗',
    [CardType.BUFF]: '增益',
    [CardType.DEBUFF]: '减益',
    [CardType.ARMOR]: '护甲',
    [CardType.CURSE]: '诅咒'
};

// 卡牌类型颜色
const CardTypeColors = {
    [CardType.ATTACK]: '#ff4757',       // 红色
    [CardType.H_ATTACK]: '#ff6b9d',     // 粉红色
    [CardType.HEAL]: '#2ed573',         // 绿色
    [CardType.BUFF]: '#ffa502',         // 橙色
    [CardType.DEBUFF]: '#9c88ff',       // 紫色
    [CardType.ARMOR]: '#70a1ff',        // 蓝色
    [CardType.CURSE]: '#8b0000'         // 暗红色
};

// ==================== 诅咒卡牌库（敌人H技能）====================
const CurseCardLibrary = [
    { id: 'curse_跳蛋', name: '跳蛋', type: CardType.CURSE, damage: 3, statusId: '跳蛋', icon: '🔔', description: '费用点-1。被植入震动的跳蛋，无法集中精神。' },
    { id: 'curse_束缚锁链', name: '束缚锁链', type: CardType.CURSE, damage: 4, statusId: '束缚锁链', icon: '⛓️', description: '费用点-1。手腕上的锁链限制行动。' },
    { id: 'curse_精神污染', name: '精神污染', type: CardType.CURSE, damage: 6, statusId: '精神污染', icon: '🌀', description: '费用点-2。深渊低语侵蚀意识。' },
    { id: 'curse_淫纹', name: '淫纹', type: CardType.CURSE, damage: 5, statusId: '淫纹', icon: '🔮', description: '每次休息堕落+5。身上被刻下淫靡魔纹。' },
    { id: 'curse_羞耻衣', name: '羞耻衣', type: CardType.CURSE, damage: 3, statusId: '羞耻衣', icon: '👙', description: '每场战斗堕落+3。被迫穿暴露服装。' },
    { id: 'curse_魅魔契约', name: '魅魔契约', type: CardType.CURSE, damage: 7, statusId: '魅魔契约', icon: '💋', description: '休息时堕落+8。与魅魔签订契约。' },
    { id: 'curse_淫欲诅咒', name: '淫欲诅咒', type: CardType.CURSE, damage: 5, statusId: '淫欲诅咒', icon: '💜', description: '战斗开始堕落+5。身体异常兴奋。' },
    { id: 'curse_堕落种子', name: '堕落种子', type: CardType.CURSE, damage: 8, statusId: '堕落种子', icon: '🌱', description: '休息时堕落+10。种子侵蚀心智。' },
    { id: 'curse_乳环', name: '乳环', type: CardType.CURSE, damage: 4, statusId: '乳环', icon: '⭕', description: '防御力-2。乳头被穿上银环。' },
    { id: 'curse_肚脐钉', name: '肚脐钉', type: CardType.CURSE, damage: 3, statusId: '肚脐钉', icon: '📍', description: '防御力-1。肚脐穿孔装饰。' },
    { id: 'curse_脚铐', name: '脚铐', type: CardType.CURSE, damage: 5, statusId: '脚铐', icon: '🔗', description: '防御力-3。脚踝铁铐限制移动。' },
    { id: 'curse_项圈', name: '项圈', type: CardType.CURSE, damage: 6, statusId: '项圈', icon: '⚫', description: '最大HP-10。被套上奴隶项圈。' },
    { id: 'curse_虚弱诅咒', name: '虚弱诅咒', type: CardType.CURSE, damage: 7, statusId: '虚弱诅咒', icon: '💀', description: '最大HP-15。生命力被抽取。' },
    { id: 'curse_生命吸取', name: '生命吸取', type: CardType.CURSE, damage: 9, statusId: '生命吸取', icon: '🩸', description: '最大HP-20。生命力持续流失。' },
    { id: 'curse_贞操带', name: '贞操带', type: CardType.CURSE, damage: 4, statusId: '贞操带', icon: '🔒', description: 'HP无法超过50%。被锁上贞操带。' },
    { id: 'curse_诅咒伤口', name: '诅咒伤口', type: CardType.CURSE, damage: 6, statusId: '诅咒伤口', icon: '🩹', description: 'HP无法超过30%。伤口无法愈合。' },
    { id: 'curse_催情药', name: '催情药', type: CardType.CURSE, damage: 4, statusId: '催情药', icon: '💊', description: '攻击力-3。身体酥软无力。' },
    { id: 'curse_媚药中毒', name: '媚药中毒', type: CardType.CURSE, damage: 6, statusId: '媚药中毒', icon: '🧪', description: '攻击力-5。无法用力。' },
    { id: 'curse_肌肉萎缩', name: '肌肉萎缩', type: CardType.CURSE, damage: 5, statusId: '肌肉萎缩', icon: '💪', description: '攻击力-4。力量大减。' },
    { id: 'curse_烙印', name: '烙印', type: CardType.CURSE, damage: 8, statusId: '烙印', icon: '🔥', description: '受伤+50%。被烙上主人印记。' },
    { id: 'curse_脆弱印记', name: '脆弱印记', type: CardType.CURSE, damage: 5, statusId: '脆弱印记', icon: '❌', description: '受伤+30%。被刻下脆弱印记。' },
    { id: 'curse_诅咒标记', name: '诅咒标记', type: CardType.CURSE, damage: 10, statusId: '诅咒标记', icon: '☠️', description: '受伤+100%。深渊诅咒标记。' },
    { id: 'curse_完全支配', name: '完全支配', type: CardType.CURSE, damage: 9, statusId: '完全支配', icon: '👑', description: '攻击-2，防御-2，堕落+5/战斗。身心不属于自己。' },
    { id: 'curse_奴隶烙印', name: '奴隶烙印', type: CardType.CURSE, damage: 7, statusId: '奴隶烙印', icon: '🔥', description: 'HP-10，受伤+25%。奴隶身份。' },
    // 新增身体变化类
    { id: 'curse_小便失禁', name: '小便失禁', type: CardType.CURSE, damage: 4, statusId: '小便失禁', icon: '💦', description: '防御-2，战斗堕落+3。无法控制尿意。' },
    { id: 'curse_大便失禁', name: '大便失禁', type: CardType.CURSE, damage: 5, statusId: '大便失禁', icon: '💩', description: '防御-3，战斗堕落+5。括约肌无法收缩。' },
    { id: 'curse_巨乳化', name: '巨乳化', type: CardType.CURSE, damage: 6, statusId: '巨乳化', icon: '🍈', description: '费用-1，防御-2。I罩杯巨乳，行动受限。' },
    { id: 'curse_子宫纹身', name: '子宫纹身', type: CardType.CURSE, damage: 5, statusId: '子宫纹身', icon: '❤️', description: '休息堕落+8。性奴纹身。' },
    { id: 'curse_敏感体质', name: '敏感体质', type: CardType.CURSE, damage: 6, statusId: '敏感体质', icon: '💗', description: '受伤+40%。全身极度敏感。' },
    { id: 'curse_发情期', name: '发情期', type: CardType.CURSE, damage: 5, statusId: '发情期', icon: '🔥', description: '攻击-2，战斗堕落+4。永久发情。' },
    { id: 'curse_乳头肥大', name: '乳头肥大', type: CardType.CURSE, damage: 4, statusId: '乳头肥大', icon: '⭕', description: '防御-2。乳头如葡萄大小。' },
    { id: 'curse_阴蒂肥大', name: '阴蒂肥大', type: CardType.CURSE, damage: 5, statusId: '阴蒂肥大', icon: '💎', description: '战斗堕落+5。阴蒂如拇指大小。' },
    { id: 'curse_精神支配', name: '精神支配', type: CardType.CURSE, damage: 8, statusId: '精神支配', icon: '🧠', description: '费用-2。无法自主思考。' },
    { id: 'curse_性奴调教', name: '性奴调教', type: CardType.CURSE, damage: 7, statusId: '性奴调教', icon: '👑', description: '攻击-3，防御-3。失去反抗意志。' },
    { id: 'curse_子宫下垂', name: '子宫下垂', type: CardType.CURSE, damage: 8, statusId: '子宫下垂', icon: '⬇️', description: 'HP-20。过度使用导致身体虚弱。' },
    { id: 'curse_乳汁分泌', name: '乳汁分泌', type: CardType.CURSE, damage: 4, statusId: '乳汁分泌', icon: '🍼', description: '休息堕落+6。胸部持续溢出乳汁。' },
    { id: 'curse_永久发情', name: '永久发情', type: CardType.CURSE, damage: 9, statusId: '永久发情', icon: '💯', description: '攻击-3，堕落+8/休息。无时无刻不在渴望。' },
    // 兽化类
    { id: 'curse_触手寄生', name: '触手寄生', type: CardType.CURSE, damage: 7, statusId: '触手寄生', icon: '🐙', description: '费用-2，战斗堕落+6。体内有触手生物。' },
    { id: 'curse_史莱姆化', name: '史莱姆化', type: CardType.CURSE, damage: 7, statusId: '史莱姆化', icon: '🧫', description: '防御-4，受伤+30%。身体变得柔软。' },
    // 特殊变化类
    { id: 'curse_扶她化', name: '扶她化', type: CardType.CURSE, damage: 6, statusId: '扶她化', icon: '🍆', description: '攻击+3，战斗堕落+6。小腹长出肉棒。' },
    { id: 'curse_小穴脱出', name: '小穴脱出', type: CardType.CURSE, damage: 7, statusId: '小穴脱出', icon: '🌸', description: '防御-3，休息堕落+8。阴道壁脱出。' },
    { id: 'curse_肛门脱出', name: '肛门脱出', type: CardType.CURSE, damage: 8, statusId: '肛门脱出', icon: '🔴', description: '防御-4，休息堕落+10。肛门脱出。' },
    { id: 'curse_子宫脱出', name: '子宫脱出', type: CardType.CURSE, damage: 10, statusId: '子宫脱出', icon: '❤️', description: 'HP-25，休息堕落+12。子宫完全脱出。' }
];

// 预设卡牌库 (75张)
const CardLibrary = [
    // ========== 攻击卡 (15张) ==========
    { id: 'attack_001', name: '普通攻击', type: CardType.ATTACK, value: 5, cost: 1, description: '对敌方造成5点伤害。' },
    { id: 'attack_002', name: '重击', type: CardType.ATTACK, value: 10, cost: 2, description: '蓄力一击，对敌方造成10点伤害。' },
    { id: 'attack_003', name: '致命一击', type: CardType.ATTACK, value: 18, cost: 3, description: '精准打击要害，对敌方造成18点伤害。' },
    { id: 'attack_004', name: '连击', type: CardType.ATTACK, value: 3, hitCount: 3, cost: 2, description: '连续攻击3次，每次造成3点伤害。' },
    { id: 'attack_005', name: '穿刺', type: CardType.ATTACK, value: 8, ignoreArmor: true, cost: 2, description: '无视护甲，直接造成8点伤害。' },
    { id: 'attack_006', name: '旋风斩', type: CardType.ATTACK, value: 7, cost: 1, description: '旋转攻击，造成7点伤害。' },
    { id: 'attack_007', name: '雷霆一击', type: CardType.ATTACK, value: 14, cost: 2, description: '雷电附体，造成14点伤害。' },
    { id: 'attack_008', name: '暴风连斩', type: CardType.ATTACK, value: 4, hitCount: 4, cost: 3, description: '狂风般的连续攻击，攻击4次，每次4点。' },
    { id: 'attack_009', name: '破甲斩', type: CardType.ATTACK, value: 6, ignoreArmor: true, cost: 1, description: '无视护甲造成6点伤害。' },
    { id: 'attack_010', name: '斩铁', type: CardType.ATTACK, value: 25, cost: 4, description: '凝聚全力的一击，造成25点伤害。' },
    { id: 'attack_011', name: '快速突刺', type: CardType.ATTACK, value: 4, cost: 0, description: '迅速的一刺，造成4点伤害。' },
    { id: 'attack_012', name: '双重打击', type: CardType.ATTACK, value: 5, hitCount: 2, cost: 1, description: '连续两次攻击，每次5点伤害。' },
    { id: 'attack_013', name: '处刑', type: CardType.ATTACK, value: 12, ignoreArmor: true, cost: 3, description: '处决之击，无视护甲造成12点伤害。' },
    { id: 'attack_014', name: '狂暴一击', type: CardType.ATTACK, value: 20, cost: 3, description: '疯狂的攻击，造成20点伤害。' },
    { id: 'attack_015', name: '精准打击', type: CardType.ATTACK, value: 9, cost: 1, description: '精准的攻击，造成9点伤害。' },

    // ========== H攻击卡 (54张) - 带堕落值解锁条件 ==========
    // corruptionRequired: 需要的堕落值才能解锁
    // --- 基础诱惑系 (堕落0-15) ---
    { id: 'h_attack_001', name: '媚眼', type: CardType.H_ATTACK, value: 5, cost: 0, debuffType: 'attack', debuffValue: 1, debuffDuration: 1, description: '抛个勾魂媚眼，連5伤害，敌人攻击-1(1回合)。', corruptionRequired: 0 },
    { id: 'h_attack_002', name: '撩人姿态', type: CardType.H_ATTACK, value: 4, cost: 0, debuffType: 'defense', debuffValue: 2, debuffDuration: 1, description: '摆出撩人的姿势，連4伤害，敌人防御-2(1回合)。', corruptionRequired: 3 },
    { id: 'h_attack_003', name: '娇喘', type: CardType.H_ATTACK, value: 6, cost: 1, debuffType: 'attack', debuffValue: 2, debuffDuration: 1, description: '发出诱人的娇喘声，連6伤害，敌人攻击-2(1回合)。', corruptionRequired: 5 },
    { id: 'h_attack_004', name: '抛媚眼', type: CardType.H_ATTACK, value: 7, cost: 1, description: '连续抛出数个媚眼，造成7点伤害。', corruptionRequired: 8 },
    { id: 'h_attack_005', name: '诱惑之舞', type: CardType.H_ATTACK, value: 8, cost: 1, debuffType: 'attack', debuffValue: 2, debuffDuration: 2, description: '扭动腰肢的色情舞蹈，連8伤害，敌人攻击-2(2回合)。', corruptionRequired: 10 },
    { id: 'h_attack_006', name: '玉足践踏', type: CardType.H_ATTACK, value: 9, cost: 1, description: '用白嫩的玉足踩踏敌人，造成9点伤害。', corruptionRequired: 12 },
    { id: 'h_attack_007', name: '轻抚挑逗', type: CardType.H_ATTACK, value: 6, cost: 1, description: '用纤细的手指轻轻抚摸，造成6点伤害。', corruptionRequired: 15 },

    // --- 亲吻系 (堕落15-25) ---
    { id: 'h_attack_008', name: '魅惑之吻', type: CardType.H_ATTACK, value: 8, cost: 1, dotDamage: 2, duration: 2, description: '湿润的嘴唇贴上去，連8伤害+持续2/回合。', corruptionRequired: 16 },
    { id: 'h_attack_009', name: '堕落之吻', type: CardType.H_ATTACK, value: 9, cost: 1, dotDamage: 2, duration: 2, description: '舌尖缠绕的深吻，連9伤害+持续2/回合。', corruptionRequired: 18 },
    { id: 'h_attack_010', name: '舌吻纠缠', type: CardType.H_ATTACK, value: 10, cost: 1, dotDamage: 3, duration: 2, debuffType: 'attack', debuffValue: 2, debuffDuration: 2, description: '用柔软的舌头深入纠缠，造成10点伤害+持续3点/回合，敌人攻击-2(2回合)。', corruptionRequired: 20 },
    { id: 'h_attack_011', name: '吸吮之吻', type: CardType.H_ATTACK, value: 11, cost: 1, dotDamage: 3, duration: 2, debuffType: 'defense', debuffValue: 2, debuffDuration: 2, description: '用力吸吮对方嘴唇，造成11点伤害+持续3点/回合，敌人防御-2(2回合)。', corruptionRequired: 22 },
    { id: 'h_attack_012', name: '淫靡低语', type: CardType.H_ATTACK, value: 10, duration: 2, dotDamage: 2, cost: 2, description: '在耳边吐出淫荡的话语，造成10点+持续2点/回合。', corruptionRequired: 25 },

    // --- 胸部系 (堕落20-45) ---
    { id: 'h_attack_013', name: '乳头挑逗', type: CardType.H_ATTACK, value: 8, cost: 1, debuffType: 'defense', debuffValue: 2, debuffDuration: 2, description: '用挺立的乳头轻轻摩擦，連8伤害，敌人防御-2(2回合)。', corruptionRequired: 20 },
    { id: 'h_attack_014', name: '乳摇诱惑', type: CardType.H_ATTACK, value: 10, cost: 1, description: '晃动饱满的双乳，造成10点伤害。', corruptionRequired: 24 },
    { id: 'h_attack_015', name: '巨乳压制', type: CardType.H_ATTACK, value: 12, cost: 2, debuffType: 'attack', debuffValue: 3, debuffDuration: 2, description: '用丰满的胸部压住敌人，連12伤害，敌人攻击-3(2回合)。', corruptionRequired: 28 },
    { id: 'h_attack_016', name: '乳首夹击', type: CardType.H_ATTACK, value: 6, hitCount: 2, cost: 2, description: '用硬挺的乳首攻击，攻击2次每次6点。', corruptionRequired: 32 },
    { id: 'h_attack_017', name: '乳交攻势', type: CardType.H_ATTACK, value: 14, cost: 2, dotDamage: 3, duration: 2, description: '用丰满的双乳夹住摩擦，連14伤害+持续3/回合。', corruptionRequired: 38 },
    { id: 'h_attack_018', name: '泌乳喷射', type: CardType.H_ATTACK, value: 8, hitCount: 2, cost: 2, description: '喷射出乳汁攻击，攻击2次每次8点。', corruptionRequired: 42 },
    { id: 'h_attack_019', name: '乳肉绞杀', type: CardType.H_ATTACK, value: 16, cost: 2, description: '用柔软的乳肉紧紧包裹绞杀，造成16点伤害。', corruptionRequired: 45 },

    // --- 口舌系 (堕落25-50) ---
    { id: 'h_attack_020', name: '口舌侍奉', type: CardType.H_ATTACK, value: 10, cost: 1, description: '用灵巧的舌头舔舐，造成10点伤害。', corruptionRequired: 26 },
    { id: 'h_attack_021', name: '舔舐攻击', type: CardType.H_ATTACK, value: 11, cost: 2, description: '用舌头反复舔舐敏感处，造成11点伤害。', corruptionRequired: 30 },
    { id: 'h_attack_022', name: '含吮吸取', type: CardType.H_ATTACK, value: 12, cost: 2, description: '将敌人含入口中用力吸吮，造成12点伤害。', corruptionRequired: 34 },
    { id: 'h_attack_023', name: '深喉侵入', type: CardType.H_ATTACK, value: 15, cost: 2, description: '让敌人深入喉咙深处，造成15点伤害。', corruptionRequired: 40 },
    { id: 'h_attack_024', name: '口内绞杀', type: CardType.H_ATTACK, value: 18, cost: 3, description: '用口腔内壁紧紧绞杀，造成18点伤害。', corruptionRequired: 48 },

    // --- 臀部系 (堕落30-55) ---
    { id: 'h_attack_025', name: '臀部摩擦', type: CardType.H_ATTACK, value: 10, cost: 1, debuffType: 'defense', debuffValue: 2, debuffDuration: 1, description: '用丰满的臀部蹭向敌人，連10伤害，敌人防御-2(1回合)。', corruptionRequired: 28 },
    { id: 'h_attack_026', name: '蜜臀诱惑', type: CardType.H_ATTACK, value: 11, cost: 2, description: '扭动蜜桃般的臀部，造成11点伤害。', corruptionRequired: 32 },
    { id: 'h_attack_027', name: '臀击', type: CardType.H_ATTACK, value: 13, cost: 2, description: '用丰臀狠狠撞击敌人，造成13点伤害。', corruptionRequired: 36 },
    { id: 'h_attack_028', name: '臀交夹击', type: CardType.H_ATTACK, value: 14, cost: 2, description: '用臀肉紧紧夹住摩擦，造成14点伤害。', corruptionRequired: 42 },
    { id: 'h_attack_029', name: '骑脸窒息', type: CardType.H_ATTACK, value: 16, cost: 2, debuffType: 'attack', debuffValue: 4, debuffDuration: 2, description: '骑在敌人脸上让其窒息，連16伤害，敌人攻击-4(2回合)。', corruptionRequired: 50 },

    // --- 腿足系 (堕落15-40) ---
    { id: 'h_attack_030', name: '大腿夹击', type: CardType.H_ATTACK, value: 10, cost: 1, debuffType: 'attack', debuffValue: 2, debuffDuration: 1, description: '用白皙的大腿紧紧夹住，連10伤害，敌人攻击-2(1回合)。', corruptionRequired: 18 },
    { id: 'h_attack_031', name: '足交羞辱', type: CardType.H_ATTACK, value: 12, cost: 2, description: '用玉足夹住敌人要害揉搓，造成12点伤害。', corruptionRequired: 28 },
    { id: 'h_attack_032', name: '腿交缠绕', type: CardType.H_ATTACK, value: 14, cost: 2, description: '用双腿紧紧缠绕摩擦，造成14点伤害。', corruptionRequired: 35 },
    { id: 'h_attack_033', name: '丝袜摩擦', type: CardType.H_ATTACK, value: 11, cost: 2, description: '用丝袜包裹的美腿摩擦，造成11点伤害。', corruptionRequired: 30 },

    // --- 下体系 (堕落40-70) ---
    { id: 'h_attack_034', name: '羞耻攻击', type: CardType.H_ATTACK, value: 12, cost: 2, description: '用私密部位蹭向敌人，造成12点伤害。', corruptionRequired: 35 },
    { id: 'h_attack_035', name: '阴蒂刺激', type: CardType.H_ATTACK, value: 10, duration: 2, dotDamage: 3, cost: 2, description: '刺激敏感的阴蒂，造成10点+持续3点/回合。', corruptionRequired: 40 },
    { id: 'h_attack_036', name: '蜜穴收缩', type: CardType.H_ATTACK, value: 14, cost: 2, dotDamage: 3, duration: 2, description: '用小穴有节奏地收缩，連14伤害+持续3/回合。', corruptionRequired: 45 },
    { id: 'h_attack_037', name: '淫水喷射', type: CardType.H_ATTACK, value: 8, hitCount: 2, cost: 2, description: '喷出大量淫水攻击，攻击2次每次8点。', corruptionRequired: 48 },
    { id: 'h_attack_038', name: '潮吹攻击', type: CardType.H_ATTACK, value: 10, hitCount: 3, cost: 3, description: '激烈潮吹喷溅敌人，攻击3次每次10点。', corruptionRequired: 55 },
    { id: 'h_attack_039', name: '蜜穴绞杀', type: CardType.H_ATTACK, value: 18, cost: 3, dotDamage: 4, duration: 2, description: '用湿润的小穴紧紧夹住，連18伤害+持续4/回合。', corruptionRequired: 60 },
    { id: 'h_attack_040', name: '子宫口吸附', type: CardType.H_ATTACK, value: 20, cost: 3, description: '用子宫口紧紧吸住，造成20点伤害。', corruptionRequired: 68 },

    // --- 后庭系 (堕落50-75) ---
    { id: 'h_attack_041', name: '菊穴挑逗', type: CardType.H_ATTACK, value: 12, cost: 2, description: '用紧致的菊穴轻轻挑逗，造成12点伤害。', corruptionRequired: 48 },
    { id: 'h_attack_042', name: '菊穴吞噬', type: CardType.H_ATTACK, value: 15, cost: 2, description: '用紧致的菊穴吞入，造成15点伤害。', corruptionRequired: 55 },
    { id: 'h_attack_043', name: '后庭调教', type: CardType.H_ATTACK, value: 14, duration: 2, dotDamage: 4, cost: 3, description: '让敌人侵犯我的后庭，造成14点+持续4点/回合。', corruptionRequired: 60 },
    { id: 'h_attack_044', name: '菊穴绞杀', type: CardType.H_ATTACK, value: 18, cost: 3, description: '用菊穴紧紧绞杀，造成18点伤害。', corruptionRequired: 70 },

    // --- 高级技 (堕落60-90) ---
    { id: 'h_attack_045', name: '肉棒插入', type: CardType.H_ATTACK, value: 20, cost: 3, description: '让敌人的肉棒插入体内，夹断它，造成20点。', corruptionRequired: 65 },
    { id: 'h_attack_046', name: '骑乘攻势', type: CardType.H_ATTACK, value: 6, hitCount: 4, cost: 3, description: '骑在敌人身上激烈扭动，攻击4次每次6点。', corruptionRequired: 62 },
    { id: 'h_attack_047', name: '摇臀狂舞', type: CardType.H_ATTACK, value: 5, hitCount: 5, cost: 3, description: '疯狂摇动臀部，攻击5次每次5点。', corruptionRequired: 58 },
    { id: 'h_attack_048', name: '全身缠绕', type: CardType.H_ATTACK, value: 22, cost: 3, debuffType: 'attack', debuffValue: 5, debuffDuration: 2, description: '用全身紧紧缠绕敌人，連22伤害，敌人攻击-5(2回合)。', corruptionRequired: 70 },
    { id: 'h_attack_049', name: '致命诱惑', type: CardType.H_ATTACK, value: 20, cost: 3, description: '展露胴体的极致诱惑，造成20点伤害。', corruptionRequired: 55 },
    { id: 'h_attack_050', name: '禁忌之触', type: CardType.H_ATTACK, value: 16, duration: 2, dotDamage: 4, cost: 3, description: '手指探入禁忌之处，造成16点+持续4点/回合。', corruptionRequired: 50 },

    // --- 终极技 (堕落75-100) ---
    { id: 'h_attack_051', name: '双穴齐开', type: CardType.H_ATTACK, value: 28, cost: 4, dotDamage: 5, duration: 2, debuffType: 'attack', debuffValue: 4, debuffDuration: 2, description: '同时用小穴和菊穴吞噬，連28伤害+持续5/回合，敌人攻击-4(2回合)。', corruptionRequired: 80 },
    { id: 'h_attack_052', name: '终极诱惑', type: CardType.H_ATTACK, value: 25, cost: 4, description: '全裸展示完美身材，造成25点伤害。', corruptionRequired: 75 },
    { id: 'h_attack_053', name: '肉体献祭', type: CardType.H_ATTACK, value: 30, cost: 4, description: '献出整个身体进行攻击，造成30点伤害。', corruptionRequired: 88 },
    { id: 'h_attack_054', name: '淫堕之极', type: CardType.H_ATTACK, value: 35, cost: 5, dotDamage: 6, duration: 3, debuffType: 'attack', debuffValue: 6, debuffDuration: 3, description: '堕落至极的终极攻击，連35伤害+持续6/回合，敌人攻击-6(3回合)。', corruptionRequired: 100 },

    // ========== 修女专属卡 (30张) - 特性：每张卡都带回血或防御buff ==========
    // --- 基础攻击系 (带回血/护甲) ---
    { id: 'nun_001', name: '圣光审判', type: CardType.ATTACK, value: 10, cost: 1, healSelf: 5, description: '神圣光芒裁决邪恶，造成10点伤害，恢复5HP。', professionRequired: 'nun' },
    { id: 'nun_002', name: '净化之焰', type: CardType.ATTACK, value: 8, ignoreArmor: true, cost: 2, armorGain: 6, description: '圣火焚烧污秽，无视护甲造成8点伤害，获得6护甲。', professionRequired: 'nun' },
    { id: 'nun_003', name: '神罚', type: CardType.ATTACK, value: 16, cost: 2, healSelf: 8, description: '召唤神圣惩罚，造成16点伤害，恢复8HP。', professionRequired: 'nun' },
    { id: 'nun_004', name: '圣光洗礼', type: CardType.ATTACK, value: 12, cost: 2, healSelf: 10, description: '神圣光芒净化敌人，造成12伤害，恢复10HP。', professionRequired: 'nun' },
    { id: 'nun_005', name: '天堂制裁', type: CardType.ATTACK, value: 20, cost: 3, armorGain: 10, description: '天堂的制裁降临，造成20点伤害，获得10护甲。', professionRequired: 'nun' },
    { id: 'nun_006', name: '圣印烙刻', type: CardType.ATTACK, value: 6, hitCount: 2, cost: 2, healSelf: 6, description: '烙下神圣印记，攻击2次各6点，恢复6HP。', professionRequired: 'nun' },

    // --- 治疗系 (带护甲) ---
    { id: 'nun_007', name: '十字架祝福', type: CardType.HEAL, value: 15, cost: 1, armorGain: 5, description: '十字架散发神圣光芒，恢复15HP，获得5护甲。', professionRequired: 'nun' },
    { id: 'nun_008', name: '圣水洗礼', type: CardType.HEAL, value: 8, duration: 3, cost: 2, armorGain: 8, description: '圣水持续治愈，每回合恢复8HP持续3回合，获得8护甲。', professionRequired: 'nun' },
    { id: 'nun_009', name: '救赎之光', type: CardType.HEAL, value: 25, cost: 2, armorGain: 10, description: '神圣救赎之光，恢复25HP，获得10护甲。', professionRequired: 'nun' },
    { id: 'nun_010', name: '忏悔之泪', type: CardType.HEAL, value: 12, removeDebuff: true, cost: 2, armorGain: 6, description: '流下忏悔之泪，恢复12HP，解除负面状态，获得6护甲。', professionRequired: 'nun' },
    { id: 'nun_011', name: '神恩降临', type: CardType.HEAL, value: 30, cost: 3, armorGain: 15, description: '神的恩典降临，恢复30HP，获得15护甲。', professionRequired: 'nun' },
    { id: 'nun_012', name: '治愈祷言', type: CardType.HEAL, value: 10, cost: 0, armorGain: 3, description: '低声祷告，恢复10HP，获得3护甲。', professionRequired: 'nun' },

    // --- 护甲系 (带回血) ---
    { id: 'nun_013', name: '神圣护盾', type: CardType.ARMOR, value: 12, cost: 1, healValue: 5, description: '神圣力量形成护盾，获得12护甲，恢复5HP。', professionRequired: 'nun' },
    { id: 'nun_014', name: '神圣领域', type: CardType.ARMOR, value: 18, cost: 2, healValue: 10, description: '展开神圣领域，获得18护甲，恢复10HP。', professionRequired: 'nun' },
    { id: 'nun_015', name: '天使之翼', type: CardType.ARMOR, value: 15, cost: 2, healValue: 8, description: '天使羽翼环绕护体，获得15护甲，恢复8HP。', professionRequired: 'nun' },
    { id: 'nun_016', name: '圣光壁垒', type: CardType.ARMOR, value: 25, cost: 3, healValue: 12, description: '召唤圣光壁垒，获得25护甲，恢复12HP。', professionRequired: 'nun' },
    { id: 'nun_017', name: '信仰之盾', type: CardType.ARMOR, value: 10, cost: 1, healValue: 6, description: '信仰凝聚成盾，获得10护甲，恢复6HP。', professionRequired: 'nun' },

    // --- Buff系 (带回血/护甲) ---
    { id: 'nun_018', name: '忏悔祷告', type: CardType.BUFF, value: 3, duration: 3, buffType: 'defense', cost: 1, healSelf: 5, description: '虔诚祷告，防御+3持续3回合，恢复5HP。', professionRequired: 'nun' },
    { id: 'nun_019', name: '圣歌咏唱', type: CardType.BUFF, value: 3, duration: 3, buffType: 'attack', cost: 1, armorGain: 6, description: '吟唱圣歌，攻击+3持续3回合，获得6护甲。', professionRequired: 'nun' },
    { id: 'nun_020', name: '天使降临', type: CardType.BUFF, value: 4, duration: 3, buffType: 'attack', cost: 2, armorGain: 10, healSelf: 8, description: '召唤天使庇护，攻击+4持续3回合，获得10护甲，恢复8HP。', professionRequired: 'nun' },
    { id: 'nun_021', name: '神圣祝福', type: CardType.BUFF, value: 2, duration: 4, buffType: 'defense', cost: 1, healSelf: 8, description: '神圣祝福加身，防御+2持续4回合，恢复8HP。', professionRequired: 'nun' },
    { id: 'nun_022', name: '圣光庇护', type: CardType.BUFF, value: 5, duration: 2, buffType: 'defense', cost: 2, armorGain: 12, description: '圣光庇护，防御+5持续2回合，获得12护甲。', professionRequired: 'nun' },

    // --- Debuff系 (带回血/护甲) ---
    { id: 'nun_023', name: '驱魔术', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'attack', cost: 1, armorGain: 5, description: '驱散邪恶力量，敌人攻击-3持续3回合，获得5护甲。', professionRequired: 'nun' },
    { id: 'nun_024', name: '神圣封印', type: CardType.DEBUFF, value: 4, duration: 2, debuffType: 'attack', cost: 2, healSelf: 8, description: '封印敌人力量，敌人攻击-4持续2回合，恢复8HP。', professionRequired: 'nun' },
    { id: 'nun_025', name: '净化诅咒', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'defense', cost: 2, armorGain: 8, healSelf: 5, description: '净化诅咒，敌人防御-3持续3回合，获得8护甲，恢复5HP。', professionRequired: 'nun' },

    // --- 堕落H技能系 (带回血/护甲) ---
    { id: 'nun_026', name: '堕落救赎', type: CardType.H_ATTACK, value: 14, cost: 2, healSelf: 12, corruptionRequired: 30, description: '用堕落的身体救赎敌人，造成14伤害，恢复12HP。', professionRequired: 'nun' },
    { id: 'nun_027', name: '禁忌祈祷', type: CardType.H_ATTACK, value: 18, cost: 2, armorGain: 10, corruptionRequired: 40, description: '以肉体向神祈祷，造成18伤害，获得10护甲。', professionRequired: 'nun' },
    { id: 'nun_028', name: '圣女堕落', type: CardType.H_ATTACK, value: 22, cost: 3, healSelf: 15, armorGain: 8, corruptionRequired: 50, description: '圣女的堕落之姿，造成22伤害，恢复15HP，获得8护甲。', professionRequired: 'nun' },
    { id: 'nun_029', name: '背德告解', type: CardType.H_ATTACK, value: 16, cost: 2, healSelf: 10, armorGain: 6, corruptionRequired: 35, description: '用身体进行告解，造成16伤害，恢复10HP，获得6护甲。', professionRequired: 'nun' },
    { id: 'nun_030', name: '神罚与救赎', type: CardType.H_ATTACK, value: 28, cost: 4, healSelf: 20, armorGain: 15, corruptionRequired: 60, description: '神罚与救赎合一，造成28伤害，恢复20HP，获得15护甲。', professionRequired: 'nun' },

    // ========== 妓女专属卡 (25张) - 特性：削弱敌人攻防，少数控制技能 ==========
    // --- 削弱攻击系 ---
    { id: 'courtesan_001', name: '魅惑之吻', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'attack', cost: 1, description: '送上迷人一吻，敌人攻击-4，持续3回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_002', name: '春药涂抹', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'attack', cost: 1, description: '涂抹特制春药，敌人攻击-5，持续3回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_003', name: '夺魂摄魄', type: CardType.DEBUFF, value: 6, duration: 2, debuffType: 'attack', cost: 2, description: '用摄魂术迷惑敌人，攻击-6，持续2回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_004', name: '销魂蚀骨', type: CardType.DEBUFF, value: 8, duration: 2, debuffType: 'attack', cost: 2, description: '销魂的手段侵蚀敌人，攻击-8，持续2回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_005', name: '醉生梦死', type: CardType.DEBUFF, value: 4, duration: 4, debuffType: 'attack', cost: 2, description: '让敌人沉醉其中，攻击-4，持续4回合。', professionRequired: 'courtesan' },

    // --- 削弱防御系 ---
    { id: 'courtesan_006', name: '媚眼如丝', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'defense', cost: 1, description: '媚眼挑逗敌人，防御-4，持续3回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_007', name: '勾魂夺魄', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'defense', cost: 1, description: '勾魂的眼神瓦解防线，防御-5，持续3回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_008', name: '酥骨散', type: CardType.DEBUFF, value: 6, duration: 2, debuffType: 'defense', cost: 2, description: '让敌人骨酥筋软，防御-6，持续2回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_009', name: '蚀心香', type: CardType.DEBUFF, value: 4, duration: 4, debuffType: 'defense', cost: 2, description: '蚀心的香气弥漫，防御-4，持续4回合。', professionRequired: 'courtesan' },

    // --- 双削系（同时削攻防） ---
    { id: 'courtesan_010', name: '迷情香', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'both', cost: 2, description: '释放迷情香，敌人攻防各-3，持续3回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_011', name: '温柔陷阱', type: CardType.DEBUFF, value: 4, duration: 2, debuffType: 'both', cost: 2, description: '温柔的陷阱，敌人攻防各-4，持续2回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_012', name: '花间迷梦', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'both', cost: 3, description: '让敌人陷入花间迷梦，攻防各-5，持续2回合。', professionRequired: 'courtesan' },

    // --- 控制系（让敌人无法行动） ---
    { id: 'courtesan_013', name: '魅惑术', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'stun', cost: 3, description: '强力魅惑，敌人下回合无法行动。', professionRequired: 'courtesan' },
    { id: 'courtesan_014', name: '极乐销魂', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'stun', cost: 4, description: '让敌人沉浸在极乐中，下回合无法行动。', professionRequired: 'courtesan' },
    { id: 'courtesan_015', name: '花魁禁术', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'stun', cost: 4, corruptionRequired: 40, description: '花魁秘传禁术，敌人下回合无法行动。', professionRequired: 'courtesan' },

    // --- 自身Buff系 ---
    { id: 'courtesan_016', name: '风月无边', type: CardType.BUFF, value: 5, duration: 3, buffType: 'attack', cost: 2, description: '展现风月手段，攻击+5，持续3回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_017', name: '红袖添香', type: CardType.BUFF, value: 4, duration: 3, buffType: 'defense', cost: 1, description: '优雅的身段增加防御，防御+4，持续3回合。', professionRequired: 'courtesan' },
    { id: 'courtesan_018', name: '千娇百媚', type: CardType.BUFF, value: 6, duration: 2, buffType: 'attack', cost: 2, description: '展现千娇百媚，攻击+6，持续2回合。', professionRequired: 'courtesan' },

    // --- 治疗系 ---
    { id: 'courtesan_019', name: '温柔乡', type: CardType.HEAL, value: 12, cost: 1, description: '用温柔的方式恢复精力，恢复12HP。', professionRequired: 'courtesan' },
    { id: 'courtesan_020', name: '艳福齐天', type: CardType.HEAL, value: 18, cost: 2, armorGain: 5, description: '艳福无边，恢复18HP，获得5护甲。', professionRequired: 'courtesan' },

    // --- H攻击系 ---
    { id: 'courtesan_021', name: '销魂一击', type: CardType.H_ATTACK, value: 14, cost: 2, debuffType: 'attack', debuffValue: 3, debuffDuration: 2, description: '销魂的技巧，造成14伤害，敌人攻击-3(2回合)。', professionRequired: 'courtesan' },
    { id: 'courtesan_022', name: '青楼绝技', type: CardType.H_ATTACK, value: 18, cost: 2, debuffType: 'defense', debuffValue: 4, debuffDuration: 2, description: '青楼秘传绝技，造成18伤害，敌人防御-4(2回合)。', professionRequired: 'courtesan' },
    { id: 'courtesan_023', name: '床榻之术', type: CardType.H_ATTACK, value: 10, hitCount: 2, cost: 2, debuffType: 'attack', debuffValue: 2, debuffDuration: 2, description: '床榻间的技巧，攻击2次各10点，敌人攻击-2(2回合)。', professionRequired: 'courtesan' },
    { id: 'courtesan_024', name: '花间一夜', type: CardType.H_ATTACK, value: 22, cost: 3, debuffType: 'both', debuffValue: 3, debuffDuration: 2, corruptionRequired: 35, description: '一夜春宵，造成22伤害，敌人攻防各-3(2回合)。', professionRequired: 'courtesan' },
    { id: 'courtesan_025', name: '花魁秘术', type: CardType.H_ATTACK, value: 30, cost: 4, debuffType: 'stun', debuffDuration: 1, corruptionRequired: 50, description: '花魁终极秘术，造成30伤害，敌人下回合无法行动。', professionRequired: 'courtesan' },

    // ========== 平民专属卡 (20张) - 特性：低费高效、抽牌、金币获取、万金油 ==========
    // --- 0费技能（省钱高效） ---
    { id: 'commoner_001', name: '小聪明', type: CardType.ATTACK, value: 5, drawCards: 1, cost: 0, description: '灵机一动，造成5伤害并抽1张牌。', professionRequired: 'commoner' },
    { id: 'commoner_002', name: '喘息', type: CardType.HEAL, value: 6, cost: 0, description: '趁机喘口气，恢复6HP。', professionRequired: 'commoner' },
    { id: 'commoner_003', name: '躲闪', type: CardType.ARMOR, value: 6, cost: 0, description: '本能地躲开，获得6护甲。', professionRequired: 'commoner' },

    // --- 低费抽牌系 ---
    { id: 'commoner_004', name: '急中生智', type: CardType.ATTACK, value: 8, drawCards: 1, cost: 1, description: '急中生智的一击，造成8伤害并抽1张牌。', professionRequired: 'commoner' },
    { id: 'commoner_005', name: '随机应变', type: CardType.BUFF, value: 2, duration: 2, buffType: 'attack', drawCards: 2, cost: 1, description: '随机应变，攻击+2持续2回合，抽2张牌。', professionRequired: 'commoner' },
    { id: 'commoner_006', name: '见机行事', type: CardType.ARMOR, value: 8, drawCards: 1, cost: 1, description: '见机行事，获得8护甲并抽1张牌。', professionRequired: 'commoner' },
    { id: 'commoner_007', name: '灵光一闪', type: CardType.BUFF, drawCards: 3, cost: 1, description: '灵光一闪，抽3张牌。', professionRequired: 'commoner' },

    // --- 金币获取系 ---
    { id: 'commoner_008', name: '捡漏', type: CardType.ATTACK, value: 6, goldGain: 15, cost: 1, description: '趁乱捡漏，造成6伤害并获得15金币。', professionRequired: 'commoner' },
    { id: 'commoner_009', name: '讨价还价', type: CardType.DEBUFF, value: 3, duration: 2, debuffType: 'attack', goldGain: 20, cost: 1, description: '讨价还价分散注意，敌人攻击-3(2回合)，获得20金币。', professionRequired: 'commoner' },
    { id: 'commoner_010', name: '市井求生', type: CardType.HEAL, value: 10, goldGain: 25, cost: 2, description: '市井中求生的智慧，恢复10HP，获得25金币。', professionRequired: 'commoner' },

    // --- 生存韧性系 ---
    { id: 'commoner_011', name: '坚强意志', type: CardType.ARMOR, value: 12, cost: 1, description: '普通人的坚强意志，获得12护甲。', professionRequired: 'commoner' },
    { id: 'commoner_012', name: '生存本能', type: CardType.HEAL, value: 10, armorGain: 6, cost: 1, description: '生存本能觉醒，恢复10HP并获得6护甲。', professionRequired: 'commoner' },
    { id: 'commoner_013', name: '逆境求生', type: CardType.BUFF, value: 4, duration: 3, buffType: 'defense', cost: 1, description: '逆境中的求生本能，防御+4，持续3回合。', professionRequired: 'commoner' },
    { id: 'commoner_014', name: '绝处逢生', type: CardType.HEAL, value: 20, armorGain: 10, cost: 2, description: '绝处逢生，恢复20HP并获得10护甲。', professionRequired: 'commoner' },

    // --- 万金油攻击系 ---
    { id: 'commoner_015', name: '奋力一击', type: CardType.ATTACK, value: 12, cost: 1, description: '拼尽全力的一击，造成12伤害。', professionRequired: 'commoner' },
    { id: 'commoner_016', name: '孤注一掷', type: CardType.ATTACK, value: 18, armorGain: 5, cost: 2, description: '孤注一掷，造成18伤害并获得5护甲。', professionRequired: 'commoner' },
    { id: 'commoner_017', name: '背水一战', type: CardType.ATTACK, value: 10, hitCount: 2, cost: 2, description: '背水一战，攻击2次各10点伤害。', professionRequired: 'commoner' },

    // --- 堕落H技能系 ---
    { id: 'commoner_018', name: '委身求存', type: CardType.H_ATTACK, value: 12, healSelf: 8, goldGain: 20, cost: 1, corruptionRequired: 25, description: '委身求存，造成12伤害，恢复8HP，获得20金币。', professionRequired: 'commoner' },
    { id: 'commoner_019', name: '出卖肉体', type: CardType.H_ATTACK, value: 16, goldGain: 40, cost: 2, corruptionRequired: 40, description: '出卖肉体换取生存，造成16伤害，获得40金币。', professionRequired: 'commoner' },
    { id: 'commoner_020', name: '堕落求生', type: CardType.H_ATTACK, value: 22, healSelf: 15, armorGain: 8, goldGain: 30, cost: 3, corruptionRequired: 50, description: '彻底堕落以求生存，造成22伤害，恢复15HP，获得8护甲和30金币。', professionRequired: 'commoner' },

    // ========== 盗贼专属卡 (25张) - 特性：持续伤害DOT、低费抽牌 ==========
    // --- 0费/低费抽牌系 ---
    { id: 'thief_001', name: '暗中观察', type: CardType.BUFF, drawCards: 2, cost: 0, description: '暗中观察敌人，抽2张牌。', professionRequired: 'thief' },
    { id: 'thief_002', name: '偷袭', type: CardType.ATTACK, value: 8, drawCards: 1, cost: 1, description: '快速偷袭，造成8伤害并抽1张牌。', professionRequired: 'thief' },
    { id: 'thief_003', name: '消失', type: CardType.ARMOR, value: 10, drawCards: 1, cost: 1, description: '消失在暗影中，获得10护甲并抽1张牌。', professionRequired: 'thief' },
    { id: 'thief_004', name: '潜行', type: CardType.BUFF, value: 3, duration: 2, buffType: 'attack', drawCards: 1, cost: 1, description: '潜入暗影，攻击+3持续2回合，抽1张牌。', professionRequired: 'thief' },
    { id: 'thief_005', name: '疾风步', type: CardType.ARMOR, value: 6, drawCards: 2, cost: 1, description: '疾风般移动，获得6护甲并抽2张牌。', professionRequired: 'thief' },

    // --- 毒系DOT ---
    { id: 'thief_006', name: '淬毒', type: CardType.DEBUFF, dotDamage: 3, duration: 3, debuffType: 'dot', cost: 1, description: '涂抹毒药，敌人每回合受3点毒伤，持续3回合。', professionRequired: 'thief' },
    { id: 'thief_007', name: '毒刃', type: CardType.ATTACK, value: 6, dotDamage: 4, duration: 3, cost: 1, description: '淬毒的匕首，造成6伤害，敌人每回合受4点毒伤持续3回合。', professionRequired: 'thief' },
    { id: 'thief_008', name: '剧毒匕首', type: CardType.ATTACK, value: 4, dotDamage: 5, duration: 4, cost: 2, description: '剧毒匕首，造成4伤害，敌人每回合受5点剧毒持续4回合。', professionRequired: 'thief' },
    { id: 'thief_009', name: '蛇毒涂抹', type: CardType.DEBUFF, dotDamage: 6, duration: 3, debuffType: 'dot', cost: 2, description: '涂抹蛇毒，敌人每回合受6点毒伤，持续3回合。', professionRequired: 'thief' },
    { id: 'thief_010', name: '致命剧毒', type: CardType.DEBUFF, dotDamage: 8, duration: 3, debuffType: 'dot', cost: 3, description: '致命剧毒侵蚀，敌人每回合受8点毒伤，持续3回合。', professionRequired: 'thief' },

    // --- 流血系DOT ---
    { id: 'thief_011', name: '割裂', type: CardType.ATTACK, value: 5, dotDamage: 3, duration: 3, cost: 1, description: '割裂伤口，造成5伤害，敌人每回合流血3点持续3回合。', professionRequired: 'thief' },
    { id: 'thief_012', name: '放血', type: CardType.DEBUFF, dotDamage: 4, duration: 4, debuffType: 'dot', cost: 1, description: '造成深深的伤口，敌人每回合流血4点，持续4回合。', professionRequired: 'thief' },
    { id: 'thief_013', name: '连环割', type: CardType.ATTACK, value: 3, hitCount: 2, dotDamage: 3, duration: 3, cost: 2, description: '连续割裂，攻击2次各3点，敌人每回合流血3点持续3回合。', professionRequired: 'thief' },
    { id: 'thief_014', name: '动脉切割', type: CardType.ATTACK, value: 8, dotDamage: 6, duration: 3, cost: 2, description: '切割动脉，造成8伤害，敌人每回合流血6点持续3回合。', professionRequired: 'thief' },

    // --- 复合DOT（毒+流血） ---
    { id: 'thief_015', name: '毒血双刃', type: CardType.ATTACK, value: 6, dotDamage: 4, duration: 4, cost: 2, drawCards: 1, description: '毒血双刃，造成6伤害，敌人每回合受4点伤害持续4回合，抽1张牌。', professionRequired: 'thief' },
    { id: 'thief_016', name: '腐蚀之刃', type: CardType.ATTACK, value: 10, dotDamage: 5, duration: 3, cost: 2, description: '腐蚀之刃，造成10伤害，敌人每回合受5点腐蚀持续3回合。', professionRequired: 'thief' },

    // --- 爆发攻击系 ---
    { id: 'thief_017', name: '背刺', type: CardType.ATTACK, value: 15, ignoreArmor: true, cost: 2, description: '从背后偷袭，无视护甲造成15点伤害。', professionRequired: 'thief' },
    { id: 'thief_018', name: '致命一击', type: CardType.ATTACK, value: 20, cost: 2, description: '瞄准要害的致命一击，造成20点伤害。', professionRequired: 'thief' },
    { id: 'thief_019', name: '连环刺', type: CardType.ATTACK, value: 5, hitCount: 4, cost: 2, description: '快速的连续攻击，攻击4次各5点伤害。', professionRequired: 'thief' },

    // --- 生存/防御系 ---
    { id: 'thief_020', name: '烟雾弹', type: CardType.ARMOR, value: 12, drawCards: 1, cost: 1, description: '投掷烟雾弹，获得12护甲并抽1张牌。', professionRequired: 'thief' },
    { id: 'thief_021', name: '影遁', type: CardType.ARMOR, value: 15, cost: 1, description: '遁入暗影，获得15护甲。', professionRequired: 'thief' },

    // --- 堕落H技能系 ---
    { id: 'thief_022', name: '色诱暗杀', type: CardType.H_ATTACK, value: 14, dotDamage: 4, duration: 3, cost: 2, corruptionRequired: 30, description: '用身体引诱后暗杀，造成14伤害，敌人每回合受4点伤害持续3回合。', professionRequired: 'thief' },
    { id: 'thief_023', name: '致命诱惑', type: CardType.H_ATTACK, value: 12, dotDamage: 5, duration: 3, drawCards: 1, cost: 2, corruptionRequired: 35, description: '致命的诱惑，造成12伤害，敌人每回合受5点伤害持续3回合，抽1张牌。', professionRequired: 'thief' },
    { id: 'thief_024', name: '蛇蝎美人', type: CardType.H_ATTACK, value: 18, dotDamage: 6, duration: 4, cost: 3, corruptionRequired: 45, description: '蛇蝎美人的毒吻，造成18伤害，敌人每回合受6点剧毒持续4回合。', professionRequired: 'thief' },
    { id: 'thief_025', name: '夺命销魂', type: CardType.H_ATTACK, value: 25, dotDamage: 8, duration: 3, cost: 4, corruptionRequired: 55, description: '销魂夺命，造成25伤害，敌人每回合受8点伤害持续3回合。', professionRequired: 'thief' },

    // ========== 战士专属卡 (15张) ==========
    { id: 'warrior_001', name: '重击', type: CardType.ATTACK, value: 16, cost: 2, description: '力量型重击，造成16点伤害。', professionRequired: 'warrior' },
    { id: 'warrior_002', name: '盾击', type: CardType.ATTACK, value: 10, armorGain: 10, cost: 2, description: '用盾牌攻击，造成10伤害并获得10护甲。', professionRequired: 'warrior' },
    { id: 'warrior_003', name: '铁壁', type: CardType.ARMOR, value: 20, cost: 2, description: '如铁壁般的防御，获得20点护甲。', professionRequired: 'warrior' },
    { id: 'warrior_004', name: '战吼', type: CardType.BUFF, value: 6, duration: 3, buffType: 'attack', cost: 2, description: '发出战吼鼓舞自己，攻击+6，持续3回合。', professionRequired: 'warrior' },
    { id: 'warrior_005', name: '破甲斩', type: CardType.ATTACK, value: 12, ignoreArmor: true, cost: 2, description: '破甲的一斩，无视护甲造成12点伤害。', professionRequired: 'warrior' },
    { id: 'warrior_006', name: '坚守', type: CardType.ARMOR, value: 25, cost: 3, description: '坚守阵地，获得25点护甲。', professionRequired: 'warrior' },
    { id: 'warrior_007', name: '狂战士之怒', type: CardType.BUFF, value: 10, duration: 2, buffType: 'attack', cost: 2, description: '进入狂战状态，攻击+10，持续2回合。', professionRequired: 'warrior' },
    { id: 'warrior_008', name: '反击姿态', type: CardType.ARMOR, value: 12, counterDamage: 6, cost: 2, description: '进入反击姿态，获得12护甲，被攻击时反弹6点伤害。', professionRequired: 'warrior' },
    { id: 'warrior_009', name: '冲锋', type: CardType.ATTACK, value: 14, armorGain: 5, cost: 2, description: '勇猛冲锋，造成14伤害并获得5护甲。', professionRequired: 'warrior' },
    { id: 'warrior_010', name: '钢铁之躯', type: CardType.BUFF, value: 8, duration: 3, buffType: 'defense', armorGain: 15, cost: 3, description: '钢铁之躯，防御+8持续3回合，获得15护甲。', professionRequired: 'warrior' },
    { id: 'warrior_011', name: '横扫千军', type: CardType.ATTACK, value: 20, cost: 3, description: '横扫一切的强力攻击，造成20点伤害。', professionRequired: 'warrior' },
    { id: 'warrior_012', name: '不动如山', type: CardType.ARMOR, value: 30, cost: 3, description: '不动如山的防御姿态，获得30点护甲。', professionRequired: 'warrior' },
    { id: 'warrior_013', name: '战神附体', type: CardType.BUFF, value: 8, duration: 3, buffType: 'attack', armorGain: 20, cost: 4, description: '战神附体，攻击+8持续3回合，获得20护甲。', professionRequired: 'warrior' },
    { id: 'warrior_014', name: '终结技', type: CardType.ATTACK, value: 30, cost: 4, description: '战士的终结技，造成30点伤害。', professionRequired: 'warrior' },
    { id: 'warrior_015', name: '英勇无畏', type: CardType.BUFF, value: 5, duration: 4, buffType: 'attack', healSelf: 20, cost: 3, description: '英勇无畏，攻击+5持续4回合，恢复20HP。', professionRequired: 'warrior' },

    // ========== 女法师专属卡 (25张) - 特性：高伤害法术、抽牌、能量获取 ==========
    // --- 火系法术 ---
    { id: 'mage_001', name: '火球术', type: CardType.ATTACK, value: 10, cost: 1, description: '发射一颗火球，造成10点伤害。', professionRequired: 'mage' },
    { id: 'mage_002', name: '烈焰冲击', type: CardType.ATTACK, value: 14, cost: 1, description: '烈焰冲击敌人，造成14点伤害。', professionRequired: 'mage' },
    { id: 'mage_003', name: '炎爆术', type: CardType.ATTACK, value: 22, cost: 2, description: '引爆火焰能量，造成22点伤害。', professionRequired: 'mage' },
    { id: 'mage_004', name: '陨石坠落', type: CardType.ATTACK, value: 30, cost: 3, description: '召唤陨石从天而降，造成30点伤害。', professionRequired: 'mage' },

    // --- 冰系法术 ---
    { id: 'mage_005', name: '冰锥术', type: CardType.ATTACK, value: 8, cost: 1, drawCards: 1, description: '召唤冰锥攻击，造成8伤害并抽1张牌。', professionRequired: 'mage' },
    { id: 'mage_006', name: '寒冰箭', type: CardType.ATTACK, value: 12, cost: 1, drawCards: 1, description: '发射寒冰箭，造成12伤害并抽1张牌。', professionRequired: 'mage' },
    { id: 'mage_007', name: '暴风雪', type: CardType.ATTACK, value: 7, hitCount: 3, cost: 2, drawCards: 1, description: '召唤暴风雪，攻击3次各7点，抽1张牌。', professionRequired: 'mage' },
    { id: 'mage_008', name: '冰封', type: CardType.ATTACK, value: 16, cost: 2, debuffType: 'attack', debuffValue: 3, debuffDuration: 2, description: '冰封敌人，造成16伤害，敌人攻击-3(2回合)。', professionRequired: 'mage' },

    // --- 雷系法术 ---
    { id: 'mage_009', name: '雷击术', type: CardType.ATTACK, value: 12, ignoreArmor: true, cost: 1, description: '召唤雷电打击，无视护甲造成12点伤害。', professionRequired: 'mage' },
    { id: 'mage_010', name: '连锁闪电', type: CardType.ATTACK, value: 6, hitCount: 3, ignoreArmor: true, cost: 2, description: '连锁闪电，无视护甲攻击3次各6点。', professionRequired: 'mage' },
    { id: 'mage_011', name: '雷霆万钧', type: CardType.ATTACK, value: 20, ignoreArmor: true, cost: 3, description: '雷霆万钧，无视护甲造成20点伤害。', professionRequired: 'mage' },

    // --- 奥术系 ---
    { id: 'mage_012', name: '奥术飞弹', type: CardType.ATTACK, value: 4, hitCount: 3, cost: 1, description: '发射3枚奥术飞弹，每枚造成4点伤害。', professionRequired: 'mage' },
    { id: 'mage_013', name: '奥术冲击', type: CardType.ATTACK, value: 8, cost: 0, description: '奥术能量冲击，造成8点伤害。', professionRequired: 'mage' },
    { id: 'mage_014', name: '元素爆发', type: CardType.ATTACK, value: 12, hitCount: 3, cost: 4, description: '元素之力大爆发，攻击3次各12点伤害。', professionRequired: 'mage' },

    // --- 能量/抽牌系 ---
    { id: 'mage_015', name: '魔力涌动', type: CardType.BUFF, gainEnergy: 2, drawCards: 1, cost: 0, description: '魔力涌动，获得2点能量并抽1张牌。', professionRequired: 'mage' },
    { id: 'mage_016', name: '法力汲取', type: CardType.ATTACK, value: 8, cost: 1, gainEnergy: 1, description: '汲取敌人魔力，造成8伤害并获得1能量。', professionRequired: 'mage' },
    { id: 'mage_017', name: '时间扭曲', type: CardType.BUFF, drawCards: 3, cost: 1, description: '扭曲时间，抽3张牌。', professionRequired: 'mage' },
    { id: 'mage_018', name: '奥术智慧', type: CardType.BUFF, drawCards: 2, gainEnergy: 1, cost: 1, description: '奥术智慧，抽2张牌并获得1能量。', professionRequired: 'mage' },

    // --- 护盾系 ---
    { id: 'mage_019', name: '魔力护盾', type: CardType.ARMOR, value: 10, cost: 1, description: '召唤魔力护盾，获得10点护甲。', professionRequired: 'mage' },
    { id: 'mage_020', name: '寒冰屏障', type: CardType.ARMOR, value: 16, cost: 2, description: '召唤寒冰屏障，获得16点护甲。', professionRequired: 'mage' },
    { id: 'mage_021', name: '元素护盾', type: CardType.ARMOR, value: 12, drawCards: 1, cost: 1, description: '元素护盾，获得12护甲并抽1张牌。', professionRequired: 'mage' },

    // --- Buff/Debuff系 ---
    { id: 'mage_022', name: '元素精通', type: CardType.BUFF, value: 5, duration: 3, buffType: 'attack', cost: 1, description: '精通元素之力，攻击+5，持续3回合。', professionRequired: 'mage' },
    { id: 'mage_023', name: '魔法反制', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'attack', armorGain: 8, cost: 2, description: '魔法反制，敌人攻击-5持续2回合，获得8护甲。', professionRequired: 'mage' },

    // --- 堕落H技能系 ---
    { id: 'mage_024', name: '禁忌魔法', type: CardType.H_ATTACK, value: 20, cost: 2, drawCards: 1, corruptionRequired: 35, description: '禁忌的魔法，造成20伤害并抽1张牌。', professionRequired: 'mage' },
    { id: 'mage_025', name: '堕落奥义', type: CardType.H_ATTACK, value: 28, cost: 3, gainEnergy: 2, corruptionRequired: 50, description: '堕落的奥义，造成28伤害并获得2能量。', professionRequired: 'mage' },

    // ========== 魅魔专属卡 (20张) - 特性：造成伤害同时回血（吸血） ==========
    // --- 基础吸血攻击 ---
    { id: 'succubus_p_001', name: '生命汲取', type: CardType.H_ATTACK, value: 10, cost: 1, healSelf: 6, description: '吸取敌人生命，造成10伤害并恢复6HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_002', name: '精华吸收', type: CardType.H_ATTACK, value: 8, cost: 1, healSelf: 8, description: '吸收敌人精华，造成8伤害并恢复8HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_003', name: '诱惑之吻', type: CardType.H_ATTACK, value: 12, cost: 1, healSelf: 6, description: '用致命的吻攻击，造成12伤害并恢复6HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_004', name: '魅魔之触', type: CardType.H_ATTACK, value: 6, cost: 0, healSelf: 4, description: '魅魔的轻触，造成6伤害并恢复4HP。', professionRequired: 'succubus_player' },

    // --- 中级吸血攻击 ---
    { id: 'succubus_p_005', name: '精华吞噬', type: CardType.H_ATTACK, value: 16, cost: 2, healSelf: 10, description: '吞噬敌人精华，造成16伤害并恢复10HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_006', name: '生命虹吸', type: CardType.H_ATTACK, value: 14, cost: 2, healSelf: 14, description: '强力虹吸生命，造成14伤害并恢复14HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_007', name: '魅魔之舞', type: CardType.H_ATTACK, value: 6, hitCount: 3, cost: 2, healSelf: 9, description: '妖艳的舞蹈，攻击3次各6点，恢复9HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_008', name: '欲望侵蚀', type: CardType.H_ATTACK, value: 18, cost: 2, healSelf: 8, description: '用欲望侵蚀敌人，造成18伤害并恢复8HP。', professionRequired: 'succubus_player' },

    // --- 高级吸血攻击 ---
    { id: 'succubus_p_009', name: '深渊凝视', type: CardType.H_ATTACK, value: 22, cost: 3, healSelf: 12, description: '深渊的凝视，造成22伤害并恢复12HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_010', name: '灵魂吸取', type: CardType.H_ATTACK, value: 20, cost: 3, healSelf: 20, description: '吸取敌人灵魂，造成20伤害并恢复20HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_011', name: '深渊绽放', type: CardType.H_ATTACK, value: 30, cost: 4, healSelf: 18, description: '深渊之力绽放，造成30伤害并恢复18HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_012', name: '魅魔真身', type: CardType.H_ATTACK, value: 25, cost: 4, healSelf: 25, description: '展现魅魔真身，造成25伤害并恢复25HP。', professionRequired: 'succubus_player' },

    // --- 吸血+护甲 ---
    { id: 'succubus_p_013', name: '暗影拥抱', type: CardType.ARMOR, value: 10, healValue: 6, cost: 1, description: '暗影环绕护体，获得10护甲并恢复6HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_014', name: '堕落之翼', type: CardType.ARMOR, value: 14, healValue: 8, cost: 2, description: '展开堕落之翼，获得14护甲并恢复8HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_015', name: '魔翼护体', type: CardType.ARMOR, value: 18, healValue: 10, cost: 2, description: '魔翼环绕护体，获得18护甲并恢复10HP。', professionRequired: 'succubus_player' },

    // --- 吸血+Buff ---
    { id: 'succubus_p_016', name: '欲望觉醒', type: CardType.BUFF, value: 5, duration: 3, buffType: 'attack', healSelf: 8, cost: 2, description: '觉醒内心欲望，攻击+5持续3回合，恢复8HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_017', name: '堕天使降临', type: CardType.BUFF, value: 6, duration: 3, buffType: 'attack', healSelf: 12, armorGain: 10, cost: 3, description: '化身堕天使，攻击+6持续3回合，恢复12HP，获得10护甲。', professionRequired: 'succubus_player' },

    // --- 吸血+Debuff ---
    { id: 'succubus_p_018', name: '魅惑之眼', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'attack', healSelf: 6, cost: 1, description: '魅惑的眼神，敌人攻击-4持续3回合，恢复6HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_019', name: '心灵支配', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'attack', healSelf: 10, cost: 2, description: '支配敌人心灵，攻击-5持续2回合，恢复10HP。', professionRequired: 'succubus_player' },
    { id: 'succubus_p_020', name: '魔性诱惑', type: CardType.DEBUFF, value: 4, duration: 3, debuffType: 'defense', healSelf: 8, cost: 2, description: '魔性的诱惑，敌人防御-4持续3回合，恢复8HP。', professionRequired: 'succubus_player' },

    // ========== 治疗卡 (12张) ==========
    { id: 'heal_001', name: '急救包', type: CardType.HEAL, value: 8, cost: 1, description: '快速治疗，恢复8点生命值。' },
    { id: 'heal_002', name: '医疗箱', type: CardType.HEAL, value: 15, cost: 2, description: '使用医疗箱，恢复15点生命值。' },
    { id: 'heal_003', name: '生命药剂', type: CardType.HEAL, value: 25, cost: 3, description: '饮用珍贵的生命药剂，恢复25点生命值。' },
    { id: 'heal_004', name: '持续恢复', type: CardType.HEAL, value: 3, duration: 4, cost: 2, description: '4回合内每回合恢复3点生命值。' },
    { id: 'heal_005', name: '绷带', type: CardType.HEAL, value: 5, cost: 0, description: '简单包扎，恢复5点生命值。' },
    { id: 'heal_006', name: '圣光治疗', type: CardType.HEAL, value: 12, cost: 1, description: '神圣之光，恢复12点生命值。' },
    { id: 'heal_007', name: '再生术', type: CardType.HEAL, value: 5, duration: 3, cost: 2, description: '3回合内每回合恢复5点生命值。' },
    { id: 'heal_008', name: '神圣之泉', type: CardType.HEAL, value: 35, cost: 4, description: '神圣泉水，恢复35点生命值。' },
    { id: 'heal_009', name: '急速恢复', type: CardType.HEAL, value: 10, cost: 1, description: '快速恢复10点生命值。' },
    { id: 'heal_010', name: '生命汲取', type: CardType.HEAL, value: 8, cost: 1, description: '从大地汲取生命，恢复8点HP。' },
    { id: 'heal_011', name: '治愈之风', type: CardType.HEAL, value: 18, cost: 2, description: '治愈之风吹拂，恢复18点HP。' },
    { id: 'heal_012', name: '完全恢复', type: CardType.HEAL, value: 50, cost: 5, description: '强力治疗，恢复50点生命值。' },

    // ========== 增益卡 (15张) ==========
    { id: 'buff_001', name: '力量增幅', type: CardType.BUFF, value: 3, duration: 3, buffType: 'attack', cost: 1, description: '增加3点攻击力，持续3回合。' },
    { id: 'buff_002', name: '战意高昂', type: CardType.BUFF, value: 5, duration: 2, buffType: 'attack', cost: 2, description: '大幅提升攻击力+5，持续2回合。' },
    { id: 'buff_003', name: '铁壁', type: CardType.BUFF, value: 5, duration: 3, buffType: 'defense', cost: 2, description: '增加5点防御力，持续3回合。' },
    { id: 'buff_004', name: '加速', type: CardType.BUFF, value: 1, duration: 2, buffType: 'extraAction', cost: 3, description: '获得额外行动机会，持续2回合。' },
    { id: 'buff_005', name: '专注', type: CardType.BUFF, value: 2, duration: 3, buffType: 'draw', cost: 1, description: '每回合额外抽2张牌，持续3回合。' },
    { id: 'buff_006', name: '狂暴', type: CardType.BUFF, value: 8, duration: 2, buffType: 'attack', cost: 3, description: '进入狂暴状态，攻击+8，持续2回合。' },
    { id: 'buff_007', name: '钢铁意志', type: CardType.BUFF, value: 8, duration: 2, buffType: 'defense', cost: 3, description: '钢铁般的意志，防御+8，持续2回合。' },
    { id: 'buff_008', name: '轻盈', type: CardType.BUFF, value: 1, duration: 3, buffType: 'draw', cost: 1, description: '每回合额外抽1张牌，持续3回合。' },
    { id: 'buff_009', name: '蓄力', type: CardType.BUFF, value: 2, duration: 4, buffType: 'attack', cost: 1, description: '攻击+2，持续4回合。' },
    { id: 'buff_010', name: '坚韧', type: CardType.BUFF, value: 3, duration: 4, buffType: 'defense', cost: 1, description: '防御+3，持续4回合。' },
    { id: 'buff_011', name: '嗜血', type: CardType.BUFF, value: 10, duration: 1, buffType: 'attack', cost: 2, description: '爆发攻击+10，仅1回合。' },
    { id: 'buff_012', name: '神圣庇护', type: CardType.BUFF, value: 6, duration: 3, buffType: 'defense', cost: 2, description: '神圣庇护，防御+6，持续3回合。' },
    { id: 'buff_013', name: '全力以赴', type: CardType.BUFF, value: 4, duration: 5, buffType: 'attack', cost: 2, description: '全力以赴，攻击+4，持续5回合。' },
    { id: 'buff_014', name: '闪避姿态', type: CardType.BUFF, value: 4, duration: 2, buffType: 'defense', cost: 1, description: '进入闪避姿态，防御+4，持续2回合。' },
    { id: 'buff_015', name: '战术天才', type: CardType.BUFF, value: 3, duration: 2, buffType: 'draw', cost: 2, description: '每回合额外抽3张牌，持续2回合。' },

    // ========== 减益卡 (12张) ==========
    { id: 'debuff_001', name: '虚弱', type: CardType.DEBUFF, value: 3, duration: 2, debuffType: 'attack', cost: 1, description: '使敌方攻击力降低3点，持续2回合。' },
    { id: 'debuff_002', name: '腐蚀', type: CardType.DEBUFF, value: 3, duration: 3, debuffType: 'dot', cost: 2, description: '对敌方施加腐蚀，每回合造成3点伤害，持续3回合。' },
    { id: 'debuff_003', name: '束缚', type: CardType.DEBUFF, value: 5, duration: 2, debuffType: 'defense', cost: 2, description: '束缚敌人，降低5点防御力，持续2回合。' },
    { id: 'debuff_004', name: '致盲', type: CardType.DEBUFF, value: 50, duration: 2, debuffType: 'accuracy', cost: 2, description: '使敌方命中率降低50%，持续2回合。' },
    { id: 'debuff_005', name: '恐惧', type: CardType.DEBUFF, value: 1, duration: 1, debuffType: 'skip', cost: 3, description: '使敌方陷入恐惧，跳过下一回合行动。' },
    { id: 'debuff_006', name: '剧毒', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'dot', cost: 3, description: '剧毒效果，每回合造成5点伤害，持续3回合。' },
    { id: 'debuff_007', name: '衰弱', type: CardType.DEBUFF, value: 5, duration: 3, debuffType: 'attack', cost: 2, description: '使敌方攻击降低5点，持续3回合。' },
    { id: 'debuff_008', name: '破甲', type: CardType.DEBUFF, value: 8, duration: 2, debuffType: 'defense', cost: 2, description: '破坏护甲，降低8点防御力，持续2回合。' },
    { id: 'debuff_009', name: '迷惑', type: CardType.DEBUFF, value: 80, duration: 1, debuffType: 'accuracy', cost: 2, description: '使敌方命中率降低80%，持续1回合。' },
    { id: 'debuff_010', name: '瘫痪', type: CardType.DEBUFF, value: 1, duration: 2, debuffType: 'skip', cost: 4, description: '使敌方瘫痪，跳过2回合行动。' },
    { id: 'debuff_011', name: '灼烧', type: CardType.DEBUFF, value: 4, duration: 4, debuffType: 'dot', cost: 2, description: '灼烧效果，每回合造成4点伤害，持续4回合。' },
    { id: 'debuff_012', name: '诅咒', type: CardType.DEBUFF, value: 6, duration: 2, debuffType: 'attack', cost: 2, description: '诅咒敌人，攻击力降低6点，持续2回合。' },

    // ========== 护甲卡 (9张) ==========
    { id: 'armor_001', name: '格挡', type: CardType.ARMOR, value: 5, cost: 1, description: '获得5点护甲，可抵挡5点伤害。' },
    { id: 'armor_002', name: '钢铁之墙', type: CardType.ARMOR, value: 12, cost: 2, description: '获得12点护甲，大幅提高防御能力。' },
    { id: 'armor_003', name: '反射护盾', type: CardType.ARMOR, value: 8, reflect: 3, cost: 2, description: '获得8点护甲，受到攻击时反弹3点伤害。' },
    { id: 'armor_004', name: '能量护盾', type: CardType.ARMOR, value: 6, duration: 3, cost: 2, description: '每回合获得6点护甲，持续3回合。' },
    { id: 'armor_005', name: '绝对防御', type: CardType.ARMOR, value: 20, cost: 3, description: '获得20点强力护甲。' },
    { id: 'armor_006', name: '轻盾', type: CardType.ARMOR, value: 3, cost: 0, description: '获得3点护甲。' },
    { id: 'armor_007', name: '圣光护盾', type: CardType.ARMOR, value: 10, cost: 2, description: '神圣护盾，获得10点护甲。' },
    { id: 'armor_008', name: '荆棘护甲', type: CardType.ARMOR, value: 6, reflect: 5, cost: 2, description: '获得6点护甲，反弹5点伤害。' },
    { id: 'armor_009', name: '不灭壁垒', type: CardType.ARMOR, value: 30, cost: 4, description: '终极防御，获得30点护甲。' }
];

// 玩家卡组管理器
const CardDeckManager = {
    // 玩家当前卡组
    deck: [],

    // 当前手牌
    hand: [],

    // 弃牌堆
    discard: [],

    // 初始化卡组（从保存数据或默认卡组）
    init: function (savedDeck = null) {
        if (savedDeck && savedDeck.length > 0) {
            // 检查保存的数据格式（兼容旧版只保存ID的格式）
            if (typeof savedDeck[0] === 'string') {
                // 旧格式：只有ID
                this.deck = savedDeck.map(cardId => {
                    const original = CardLibrary.find(c => c.id === cardId);
                    return original ? { ...original } : null;
                }).filter(c => c !== null);
            } else {
                // 新格式：完整卡牌对象（包含升级后的属性）
                // 🔧 合并原始卡牌属性，确保新增属性不丢失
                this.deck = savedDeck.map(cardData => {
                    const original = CardLibrary.find(c => c.id === cardData.id);
                    if (original) {
                        // 先复制原始卡牌，再覆盖保存的数据（保留升级等修改）
                        return { ...original, ...cardData };
                    }
                    return { ...cardData };
                }).filter(c => c !== null && c.id);
            }
        } else {
            // 默认初始卡组
            this.deck = [
                CardLibrary.find(c => c.id === 'attack_001'),
                CardLibrary.find(c => c.id === 'attack_001'),
                CardLibrary.find(c => c.id === 'attack_002'),
                CardLibrary.find(c => c.id === 'heal_001'),
                CardLibrary.find(c => c.id === 'heal_001'),
                CardLibrary.find(c => c.id === 'armor_001'),
                CardLibrary.find(c => c.id === 'armor_001'),
                CardLibrary.find(c => c.id === 'buff_001'),
                CardLibrary.find(c => c.id === 'debuff_001')
            ].filter(c => c !== null);
        }

        this.hand = [];
        this.discard = [];

        console.log('[卡牌系统] 卡组初始化完成，卡组数量:', this.deck.length);
    },

    // 添加卡牌到卡组
    addCard: function (cardId) {
        const card = CardLibrary.find(c => c.id === cardId);
        if (card) {
            this.deck.push({ ...card });
            console.log('[卡牌系统] 添加卡牌:', card.name);
            this.renderDeck();
            saveCardDeck(); // 🔧 添加卡牌后自动保存
            return true;
        }
        return false;
    },

    // 从卡组移除卡牌
    removeCard: function (cardId) {
        const index = this.deck.findIndex(c => c.id === cardId);
        if (index > -1) {
            const removed = this.deck.splice(index, 1)[0];
            console.log('[卡牌系统] 移除卡牌:', removed.name);
            this.renderDeck();
            saveCardDeck(); // 🔧 移除卡牌后自动保存
            return true;
        }
        return false;
    },

    // 获取卡组数据用于保存（保存完整卡牌对象，包括升级后的属性）
    getDeckData: function () {
        return this.deck.map(c => ({
            id: c.id,
            name: c.name,
            type: c.type,
            value: c.value,
            cost: c.cost,
            description: c.description,
            duration: c.duration,
            upgraded: c.upgraded || false,
            // 攻击相关
            hitCount: c.hitCount,
            hits: c.hits,
            ignoreArmor: c.ignoreArmor,
            // 特殊效果
            drawCards: c.drawCards,
            armorGain: c.armorGain,
            reflect: c.reflect,
            // 毒伤效果
            poisonDamage: c.poisonDamage,
            poisonDuration: c.poisonDuration,
            // Buff/Debuff
            healType: c.healType,
            buffType: c.buffType,
            debuffType: c.debuffType,
            // 职业限定
            professionRequired: c.professionRequired
        }));
    },

    // 渲染卡组到UI
    renderDeck: function () {
        const container = document.getElementById('cardDeckList');
        if (!container) return;

        // 更新卡组数量显示
        const countEl = document.getElementById('cardDeckCount');
        if (countEl) {
            countEl.textContent = this.deck.length + '张';
        }

        if (this.deck.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #999; padding: 20px;">
                    <div style="font-size: 36px; margin-bottom: 10px;">🃏</div>
                    <div>暂无卡牌</div>
                    <div style="font-size: 11px; margin-top: 5px; color: #666;">卡牌将在游戏中获取</div>
                </div>`;
            return;
        }

        // 按类型分组统计
        const typeCount = {};
        this.deck.forEach(card => {
            if (!typeCount[card.type]) {
                typeCount[card.type] = [];
            }
            typeCount[card.type].push(card);
        });

        let html = `<div class="card-deck-summary" style="margin-bottom: 10px; font-size: 12px; color: #888;">卡组总数: ${this.deck.length} 张</div>`;

        // 渲染每张卡（用grid布局，一行3个）
        html += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">`;
        this.deck.forEach((card, index) => {
            html += this.renderCard(card, index);
        });
        html += `</div>`;

        container.innerHTML = html;
    },

    // 渲染单张卡牌
    renderCard: function (card, index = 0) {
        const typeColor = CardTypeColors[card.type] || '#666';
        const typeName = CardTypeNames[card.type] || '未知';

        // 根据卡牌类型生成效果文本
        let effectText = '';
        if (card.type === CardType.ATTACK || card.type === CardType.H_ATTACK) {
            effectText = `伤害: ${card.value}`;
            if (card.hitCount) effectText += ` x${card.hitCount}次`;
            if (card.ignoreArmor) effectText += ' (无视护甲)';
        } else if (card.type === CardType.HEAL) {
            effectText = `恢复: +${card.value}HP`;
            if (card.duration) effectText += ` (${card.duration}回合)`;
        } else if (card.type === CardType.BUFF) {
            // BUFF类型需要根据具体效果显示
            if (card.drawCards) {
                effectText = `📜 抽${card.drawCards}张牌`;
            } else if (card.gainEnergy) {
                effectText = `⚡ +${card.gainEnergy}能量`;
            } else if (card.value) {
                effectText = `效果: +${card.value}`;
            } else {
                effectText = `✨ 增益效果`;
            }
            if (card.duration) effectText += ` (${card.duration}回合)`;
        } else if (card.type === CardType.DEBUFF) {
            effectText = `效果: -${card.value}`;
            if (card.duration) effectText += ` (${card.duration}回合)`;
        } else if (card.type === CardType.ARMOR) {
            effectText = `护甲: +${card.value}`;
            if (card.reflect) effectText += ` (反伤${card.reflect})`;
            if (card.duration) effectText += ` (${card.duration}回合)`;
        }

        return `
            <div class="card-item" data-card-id="${card.id}" data-card-index="${index}" 
                 style="background: linear-gradient(135deg, rgba(30,30,50,0.9) 0%, rgba(20,20,35,0.95) 100%);
                        border: 1px solid ${typeColor}40;
                        border-left: 3px solid ${typeColor};
                        border-radius: 6px;
                        padding: 10px;
                        cursor: pointer;
                        transition: all 0.2s ease;"
                 onmouseover="this.style.transform='translateX(3px)';this.style.boxShadow='0 2px 8px ${typeColor}30';"
                 onmouseout="this.style.transform='translateX(0)';this.style.boxShadow='none';"
                 onclick="CardDeckManager.showCardDetail(${index})">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: bold; color: #fff; font-size: 13px;"><span style="color:#ffd700;font-size:11px;">${card.cost}⚡</span> ${card.name}</span>
                    <span style="background: ${typeColor}; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 10px;">${typeName}</span>
                </div>
                <div style="font-size: 11px; color: #aaa; margin-bottom: 4px;">${effectText}</div>
                <div style="font-size: 12px; color: #999; line-height: 1.4;">${card.description}</div>
            </div>
        `;
    },

    // 显示卡牌详情弹窗（通过索引获取，支持升级后的卡牌）
    showCardDetail: function (index) {
        const card = this.deck[index];
        if (!card) return;

        const typeColor = CardTypeColors[card.type] || '#666';
        const typeName = CardTypeNames[card.type] || '未知';

        // 创建弹窗
        const modal = document.createElement('div');
        modal.id = 'cardDetailModal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        border: 2px solid ${typeColor}; border-radius: 12px;
                        padding: 25px; max-width: 350px; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #fff; font-size: 18px;">${card.name}</h3>
                    <span style="background: ${typeColor}; color: #fff; padding: 4px 12px; border-radius: 15px; font-size: 12px;">${typeName}</span>
                </div>
                
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                        <div><span style="color: #888;">数值：</span><span style="color: ${typeColor}; font-weight: bold;">${card.value}</span></div>
                        <div><span style="color: #888;">消耗：</span><span style="color: #ffd700;">${card.cost || 1} 点</span></div>
                        ${card.duration ? `<div style="grid-column: span 2;"><span style="color: #888;">持续：</span><span style="color: #2ed573;">${card.duration} 回合</span></div>` : ''}
                    </div>
                </div>
                
                <div style="color: #ccc; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
                    ${card.description}
                </div>
                
                <button onclick="document.getElementById('cardDetailModal').remove()"
                        style="width: 100%; padding: 10px; background: ${typeColor}; color: #fff;
                               border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    关闭
                </button>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }
};

// AI生成卡牌的解析器
const AICardParser = {
    /**
     * 解析AI生成的卡牌文本
     * 期望格式：
     * 【卡名】xxx
     * 【类型】攻击/H攻击/治疗/增益/减益/护甲
     * 【数值】+5
     * 【持续】2回合（可选）
     * 【描述】xxx
     */
    parse: function (text) {
        const cards = [];

        // 匹配卡牌块
        const cardPattern = /【卡名】([^\n【]+)[\s\S]*?【类型】([^\n【]+)[\s\S]*?【数值】([^\n【]+)(?:[\s\S]*?【持续】([^\n【]+))?[\s\S]*?【描述】([^\n【]+)/g;

        let match;
        while ((match = cardPattern.exec(text)) !== null) {
            const card = {
                id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: match[1].trim(),
                type: this.parseType(match[2].trim()),
                value: this.parseValue(match[3].trim()),
                duration: match[4] ? this.parseDuration(match[4].trim()) : null,
                description: match[5].trim(),
                cost: 1, // 默认消耗
                isAIGenerated: true
            };

            // 根据数值调整消耗
            if (card.value >= 15) card.cost = 3;
            else if (card.value >= 8) card.cost = 2;

            cards.push(card);
        }

        return cards;
    },

    // 解析类型
    parseType: function (typeText) {
        const typeMap = {
            '攻击': CardType.ATTACK,
            'h攻击': CardType.H_ATTACK,
            'H攻击': CardType.H_ATTACK,
            '治疗': CardType.HEAL,
            '增益': CardType.BUFF,
            '我方增益': CardType.BUFF,
            '减益': CardType.DEBUFF,
            'debuff': CardType.DEBUFF,
            '给对方debuff': CardType.DEBUFF,
            '护甲': CardType.ARMOR
        };
        return typeMap[typeText] || CardType.ATTACK;
    },

    // 解析数值
    parseValue: function (valueText) {
        const num = parseInt(valueText.replace(/[^0-9-]/g, ''));
        return isNaN(num) ? 5 : Math.abs(num);
    },

    // 解析持续回合
    parseDuration: function (durationText) {
        const num = parseInt(durationText.replace(/[^0-9]/g, ''));
        return isNaN(num) ? null : num;
    }
};

// ==================== 路线系统 ====================
const RouteSystem = {
    currentRoutes: [],

    // 生成3张路线卡
    generateRoutes: function (floor = 1) {
        const routes = [];
        const types = [RouteType.UNKNOWN, RouteType.MONSTER, RouteType.ELITE, RouteType.BOSS, RouteType.SHOP, RouteType.REST];

        // 🔧 修复：floor 为 0 或未定义时，使用默认值 1
        const actualFloor = floor || 1;

        // 根据层数调整权重
        let weights;
        if (actualFloor > 0 && actualFloor % 10 === 0) {
            // 每10层必出BOSS（但不是第0层）
            weights = { [RouteType.BOSS]: 100 };
        } else if (actualFloor % 5 === 0) {
            // 每5层出精英
            weights = {
                [RouteType.ELITE]: 40,
                [RouteType.MONSTER]: 20,
                [RouteType.SHOP]: 20,
                [RouteType.REST]: 20
            };
        } else {
            weights = {
                [RouteType.UNKNOWN]: 20,
                [RouteType.MONSTER]: 35,
                [RouteType.ELITE]: 10,
                [RouteType.SHOP]: 15,
                [RouteType.REST]: 20
            };
        }

        // 生成3张不同的路线卡
        const usedTypes = new Set();
        for (let i = 0; i < 3; i++) {
            let type = this.weightedRandom(weights);
            // 避免重复（除非只有一种选择）
            let attempts = 0;
            while (usedTypes.has(type) && attempts < 10) {
                type = this.weightedRandom(weights);
                attempts++;
            }
            usedTypes.add(type);
            routes.push({ type, id: 'route_' + Date.now() + '_' + i });
        }

        this.currentRoutes = routes;
        return routes;
    },

    // 权重随机
    weightedRandom: function (weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        for (const [type, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return type;
        }
        return Object.keys(weights)[0];
    },

    // 显示路线选择弹窗
    showRouteSelection: function () {
        // 🔧 预览下一层，但不增加层数（关闭弹窗不会增加层数）
        const nextFloor = (PlayerState.floor || 0) + 1;

        // 🔧 同步堕落值到变量表单
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }

        console.log('[路线系统] 预览第', nextFloor, '层，堕落值:', PlayerState.corruption);

        const routes = this.generateRoutes(nextFloor);

        const modal = document.createElement('div');
        modal.id = 'routeSelectionModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
        `;

        // 路线卡片图片映射
        const RouteImageConfig = {
            'unknown': 'img/icon/route_1.png',
            'monster': 'img/icon/route_2.png',
            'elite': 'img/icon/route_3.png',
            'boss': 'img/icon/route_6.png',
            'shop': 'img/icon/route_4.png',
            'rest': 'img/icon/route_5.png'
        };

        let cardsHtml = '';
        routes.forEach((route, index) => {
            const imgSrc = RouteImageConfig[route.type] || 'img/icon/route_1.png';
            cardsHtml += `
                <div class="route-card route-${route.type}" onclick="RouteSystem.selectRoute('${route.type}', ${index})">
                    <img src="${imgSrc}" alt="${route.type}" class="route-img">
                </div>
            `;
        });

        modal.innerHTML = `
            <div style="position: absolute; top: 20px; right: 20px;">
                <button onclick="document.getElementById('routeSelectionModal')?.remove()"
                        style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3);
                               color: #fff; width: 40px; height: 40px; border-radius: 50%;
                               cursor: pointer; font-size: 20px; transition: all 0.2s;"
                        onmouseover="this.style.background='rgba(255,100,100,0.3)'"
                        onmouseout="this.style.background='rgba(255,255,255,0.1)'">✕</button>
            </div>
            <div style="color: #fff; font-size: 24px; margin-bottom: 30px; text-align: center;">
                <div>第 ${nextFloor} 层</div>
                <div style="font-size: 14px; color: #888; margin-top: 5px;">选择你的道路</div>
            </div>
            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                ${cardsHtml}
            </div>
            <div style="margin-top: 30px;">
                <button onclick="RouteSystem.leaveDungeon()"
                        style="background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
                               border: 2px solid #b2bec3; border-radius: 12px; padding: 15px 30px;
                               color: #fff; cursor: pointer; font-size: 16px; transition: all 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 5px 20px rgba(0,0,0,0.4)';"
                        onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none';">
                    🚪 离开尖塔
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // 选择路线
    selectRoute: function (routeType, index) {
        document.getElementById('routeSelectionModal')?.remove();

        // 🔧 选择路线时才增加层数（关闭弹窗不增加）
        PlayerState.floor += 1;
        PlayerState.createFloorSnapshot();
        PlayerState.save();
        PlayerState.updateDisplay();

        switch (routeType) {
            case RouteType.MONSTER:
                BattleSystem.startBattle('monster');
                break;
            case RouteType.ELITE:
                BattleSystem.startBattle('elite');
                break;
            case RouteType.BOSS:
                BattleSystem.startBattle('boss');
                break;
            case RouteType.SHOP:
                ShopSystem.openShop();
                break;
            case RouteType.REST:
                RestSystem.openRest();
                break;
            case RouteType.UNKNOWN:
                this.handleRandomEvent();
                break;
        }
    },

    // 离开尖塔
    leaveDungeon: function () {
        document.getElementById('routeSelectionModal')?.remove();

        // 显示选择弹窗
        const modal = document.createElement('div');
        modal.id = 'leaveDungeonModal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10001;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                        border: 2px solid #667eea; border-radius: 16px; padding: 30px;
                        max-width: 400px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">🚪</div>
                <div style="color: #fff; font-size: 20px; font-weight: bold; margin-bottom: 10px;">离开尖塔</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 25px;">
                    当前层数: 第 ${PlayerState.floor} 层<br>
                    金币: ${PlayerState.gold} 💰
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="RouteSystem.confirmLeaveDungeon(true)"
                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                   border: none; border-radius: 8px; padding: 12px 25px;
                                   color: #fff; cursor: pointer; font-size: 14px; transition: all 0.3s;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        ✨ 生成剧情
                    </button>
                    <button onclick="RouteSystem.confirmLeaveDungeon(false)"
                            style="background: linear-gradient(135deg, #636e72 0%, #2d3436 100%);
                                   border: none; border-radius: 8px; padding: 12px 25px;
                                   color: #fff; cursor: pointer; font-size: 14px; transition: all 0.3s;"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        ⏭️ 跳过剧情
                    </button>
                </div>
                <button onclick="document.getElementById('leaveDungeonModal')?.remove()"
                        style="margin-top: 20px; background: transparent; border: 1px solid #666;
                               border-radius: 6px; padding: 8px 20px; color: #888; cursor: pointer;">
                    取消
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // 确认离开尖塔
    confirmLeaveDungeon: function (generateStory) {
        document.getElementById('leaveDungeonModal')?.remove();

        if (generateStory) {
            // 生成剧情：发送给AI
            const prompt = `【离开尖塔】
我带着在尖塔获得的战利品，决定暂时离开这个危险的地方。
当前状态：
- 探索层数: 第 ${PlayerState.floor} 层
- 金币: ${PlayerState.gold}
- 生命值: ${PlayerState.hp}/${PlayerState.maxHp}
- 堕落值: ${PlayerState.corruption}

请描写我离开尖塔的场景，以及回到安全区域后的感受。`;

            // 重置到第0层
            PlayerState.floor = 0;
            PlayerState.save();

            // 🔧 更新内联状态栏显示
            PlayerState.updateDisplay();
            if (typeof updateStatusPanel === 'function') {
                updateStatusPanel();
            }

            // 发送给AI
            if (typeof ACJTGame !== 'undefined' && ACJTGame.sendToAI) {
                ACJTGame.sendToAI(prompt);
            }
        } else {
            // 跳过剧情：直接重置到第0层
            PlayerState.floor = 0;
            PlayerState.save();

            // 🔧 更新内联状态栏显示（inlinePlayerFloor等）
            PlayerState.updateDisplay();

            // 显示简单提示
            if (typeof showNotification === 'function') {
                showNotification('你离开了尖塔，回到了第0层', 'info');
            } else {
                alert('你离开了尖塔，回到了第0层');
            }

            // 更新状态面板
            if (typeof updateStatusPanel === 'function') {
                updateStatusPanel();
            }
        }
    },

    // 处理随机事件（问号牌）- 移除了trap事件，特殊状态现在通过敌人H技能获得
    handleRandomEvent: function () {
        const eventTypes = ['erotic', 'adventure', 'misfortune'];
        const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

        const prompts = RandomEventPrompts[selectedType];
        const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        // 发送给AI
        ACJTGame.sendToAI(selectedPrompt);
    },

    // 处理陷阱事件
    handleTrapEvent: function () {
        // 从 SpecialStatusConfig 中随机选一个
        const statusKeys = Object.keys(SpecialStatusConfig);
        const randomKey = statusKeys[Math.floor(Math.random() * statusKeys.length)];
        const status = SpecialStatusConfig[randomKey];

        // 添加到 SpecialStatusManager
        SpecialStatusManager.add(randomKey);

        // 同时添加到 gameState.variables.specialStatus
        if (typeof gameState !== 'undefined') {
            if (!gameState.variables.specialStatus) {
                gameState.variables.specialStatus = {};
            }
            gameState.variables.specialStatus[randomKey] = {
                active: true,
                effect: status.desc,
                description: status.fullDesc
            };
            console.log('[陷阱] 添加特殊状态到变量表单:', randomKey);
        }

        // 更新状态面板
        if (typeof updateStatusPanel === 'function') {
            updateStatusPanel();
        }

        // 发送提示词给AI
        const floor = PlayerState.floor || 1;
        const prompt = `简单跳过之前的场景，生成新剧情：【尖塔第${floor}层】我中了陷阱，被塞上了无法取下的${randomKey}。${status.fullDesc}`;
        ACJTGame.recordToHistory(`陷阱：被塞上${randomKey}`);
        ACJTGame.sendToAI(prompt);
    }
};

// ==================== 战斗系统 ====================
const BattleSystem = {
    currentEnemy: null,
    playerArmor: 0,
    enemyArmor: 0,
    currentEnergy: 3,
    hand: [],
    drawPile: [],
    discardPile: [],
    turn: 1,
    playerBuffs: [],
    playerDebuffs: [],    // 🆕 玩家debuff列表
    enemyBuffs: [],       // 🆕 敌人buff列表
    enemyDebuffs: [],
    isPlayerTurn: true,
    battleLog: [],

    // 🆕 意图系统
    currentIntent: null,      // 当前意图
    chargeLevel: 0,           // 蓄力层数
    mechanicCooldowns: {},    // Boss机制冷却计数
    minions: [],              // 召唤物列表
    isSilenced: false,        // 是否被沉默
    drawReduction: 0,         // 抽牌减少

    // 📝 添加战斗日志
    addLog: function (text) {
        // 如果text已经包含 [回合X] 则不再添加
        const hasPrefix = text.startsWith('[回合');
        const logText = hasPrefix ? text : `[回合${this.turn}] ${text}`;
        this.battleLog.push(logText);
        console.log('[战斗日志]', text);
    },

    lastBossId: null, // 记录上次遇到的Boss，避免重复

    // 开始战斗
    startBattle: function (enemyType) {
        // 根据类型随机选择怪物
        let monsters = Object.values(MonsterConfig).filter(m => m.type === enemyType);
        if (monsters.length === 0) {
            console.error('[战斗] 没有找到对应类型的怪物:', enemyType);
            return;
        }

        // 🔧 Boss战避免连续遇到同一个Boss
        if (enemyType === 'boss' && monsters.length > 1 && this.lastBossId) {
            monsters = monsters.filter(m => m.id !== this.lastBossId);
        }

        this.currentEnemy = { ...monsters[Math.floor(Math.random() * monsters.length)] };

        // 记录本次Boss
        if (enemyType === 'boss') {
            this.lastBossId = this.currentEnemy.id;
        }

        // 🔧 根据层数缩放怪物属性：每5层增加1.3倍
        const floor = PlayerState.floor || 1;
        const scaleTier = Math.floor((floor - 1) / 5); // 0-4层=0, 5-9层=1, 10-14层=2...
        const scaleMultiplier = Math.pow(1.3, scaleTier);

        this.currentEnemy.hp = Math.round(this.currentEnemy.hp * scaleMultiplier);
        this.currentEnemy.attack = Math.round(this.currentEnemy.attack * scaleMultiplier);
        this.currentEnemy.defense = Math.round(this.currentEnemy.defense * scaleMultiplier);
        this.currentEnemy.currentHp = this.currentEnemy.hp;

        if (scaleTier > 0) {
            console.log(`[战斗] 层数${floor}，怪物属性缩放 x${scaleMultiplier.toFixed(2)}`);
        }

        this.playerArmor = PlayerState.baseArmor;
        this.enemyArmor = 0;
        this.turn = 1;
        this.playerBuffs = [];
        this.playerDebuffs = [];    // 🆕 重置玩家debuff
        this.enemyBuffs = [];       // 🆕 重置敌人buff
        this.enemyDebuffs = [];
        this.isPlayerTurn = true;
        this.battleLog = [];

        // 🆕 重置意图系统
        this.currentIntent = null;
        this.chargeLevel = 0;
        this.mechanicCooldowns = {};
        this.minions = [];
        this.isSilenced = false;
        this.drawReduction = 0;

        // 📝 记录战斗开始
        this.battleLog.push(`━━━ 战斗开始 ━━━`);
        this.battleLog.push(`敌人: ${this.currentEnemy.name} (HP:${this.currentEnemy.hp} 攻:${this.currentEnemy.attack} 防:${this.currentEnemy.defense})`);
        this.battleLog.push(`玩家: ${PlayerState.name} (HP:${PlayerState.hp}/${PlayerState.maxHp} 攻:${PlayerState.attack} 防:${PlayerState.defense})`);

        // 🆕 如果是Boss，显示特殊机制信息
        if (this.currentEnemy.specialMechanic) {
            const mech = this.currentEnemy.specialMechanic;
            this.battleLog.push(`⭐ Boss机制: ${mech.name} - ${mech.description}`);
        }

        // 🔧 应用特殊状态效果
        const statusEffects = SpecialStatusManager.onBattleStart();
        this.currentEnergy = Math.max(0, PlayerState.energy - (statusEffects.energyLoss || 0));

        // 🔧 应用特殊状态的属性修正
        this.applySpecialStatusEffects();

        // 初始化牌组
        this.drawPile = [...CardDeckManager.deck].sort(() => Math.random() - 0.5);
        this.discardPile = [];
        this.hand = [];

        // 抽初始手牌（基础5张 + 遗物抽卡加成）
        let initialDraw = 5;
        if (this.relicMods?.drawBonus > 0) {
            initialDraw += this.relicMods.drawBonus;
            console.log('[战斗] 遗物抽牌加成:', this.relicMods.drawBonus);
        }
        this.drawCards(initialDraw);

        // 🆕 生成敌人第一回合意图
        this.generateNextIntent();

        // 显示战斗UI
        this.showBattleUI();

        console.log('[战斗] 开始战斗:', this.currentEnemy.name);
    },

    // 🔧 应用特殊状态效果到战斗属性
    applySpecialStatusEffects: function () {
        // 初始化所有可能的状态修正
        this.statusMods = {
            attack: 0, defense: 0, maxHp: 0, damageTaken: 0,
            hDamageBonus: 0, hpPerTurn: 0, hpOnHit: 0, enemyAttackReduce: 0
        };

        // 从 SpecialStatusManager 获取激活的状态（诅咒卡牌的）
        Object.values(SpecialStatusManager.statuses || {}).forEach(status => {
            // 处理单一效果
            switch (status.effect) {
                case 'attack': this.statusMods.attack += status.value; break;
                case 'defense': this.statusMods.defense += status.value; break;
                case 'maxHp': this.statusMods.maxHp += status.value; break;
                case 'damageTaken': this.statusMods.damageTaken += status.value; break;
            }

            // 🔧 处理复合效果（multiple类型）
            if (status.effect === 'multiple' && status.effects) {
                if (status.effects.attack) this.statusMods.attack += status.effects.attack;
                if (status.effects.defense) this.statusMods.defense += status.effects.defense;
                if (status.effects.maxHp) this.statusMods.maxHp += status.effects.maxHp;
                if (status.effects.damageTaken) this.statusMods.damageTaken += status.effects.damageTaken;
            }
        });

        console.log('[战斗] 特殊状态修正:', this.statusMods);

        // 🔧 从角色创建时选择的开局状态获取效果
        const charStatuses = ACJTGame.charData?.startingStatuses || [];
        charStatuses.forEach(statusId => {
            const config = StartingStatusConfig[statusId];
            if (config && config.statusEffect) {
                const eff = config.statusEffect;
                if (eff.attack) this.statusMods.attack += eff.attack;
                if (eff.defense) this.statusMods.defense += eff.defense;
                if (eff.maxHp) this.statusMods.maxHp += eff.maxHp;
                if (eff.hDamageBonus) this.statusMods.hDamageBonus += eff.hDamageBonus;
                if (eff.hpPerTurn) this.statusMods.hpPerTurn += eff.hpPerTurn;
                if (eff.hpOnHit) this.statusMods.hpOnHit += eff.hpOnHit;
                if (eff.enemyAttackReduce) this.statusMods.enemyAttackReduce += eff.enemyAttackReduce;
            }
        });

        // 🔧 从遗物获取战斗效果
        this.relicMods = { lifesteal: 0, healBonus: 0, drawBonus: 0, reflect: 0, hDamageBonus: 0 };
        Object.values(typeof RelicManager !== 'undefined' ? RelicManager.owned : {}).forEach(relic => {
            if (relic.effect) {
                if (relic.effect.lifesteal) this.relicMods.lifesteal += relic.effect.lifesteal;
                if (relic.effect.healBonus) this.relicMods.healBonus += relic.effect.healBonus;
                if (relic.effect.drawBonus) this.relicMods.drawBonus += relic.effect.drawBonus;
                if (relic.effect.reflect) this.relicMods.reflect += relic.effect.reflect;
                if (relic.effect.hDamageBonus) this.relicMods.hDamageBonus += relic.effect.hDamageBonus; // 🔧 H伤害加成
            }
        });

        console.log('[战斗] 特殊状态修正:', this.statusMods);
        console.log('[战斗] 遗物修正:', this.relicMods);
    },

    // 🆕 生成下一回合意图
    generateNextIntent: function () {
        const enemy = this.currentEnemy;
        if (!enemy) return;

        const pattern = enemy.intentPattern || [{ type: 'attack', weight: 100 }];

        // 如果正在蓄力，第二回合释放
        if (this.chargeLevel > 0) {
            this.currentIntent = {
                type: EnemyIntentType.CHARGE,
                value: Math.floor(enemy.attack * (1.5 + this.chargeLevel * 0.5)),
                isRelease: true
            };
            return;
        }

        // 根据权重随机选择意图
        const totalWeight = pattern.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;

        for (const p of pattern) {
            random -= p.weight;
            if (random <= 0) {
                this.currentIntent = this.createIntent(p.type, enemy);
                return;
            }
        }

        // 默认攻击
        this.currentIntent = { type: EnemyIntentType.ATTACK, value: enemy.attack };
    },

    // 🆕 创建具体意图
    createIntent: function (type, enemy) {
        const baseAttack = enemy.attack;
        const baseHp = enemy.hp;

        switch (type) {
            case 'attack':
                return { type: EnemyIntentType.ATTACK, value: baseAttack };
            case 'defend':
                return { type: EnemyIntentType.DEFEND, value: Math.floor(baseAttack * 0.8) };
            case 'buff':
                return {
                    type: EnemyIntentType.BUFF,
                    value: Math.max(2, Math.floor(baseAttack * 0.2)),
                    buffType: 'attack',
                    duration: 2
                };
            case 'debuff':
                return {
                    type: EnemyIntentType.DEBUFF,
                    value: Math.max(2, Math.floor(baseAttack * 0.15)),
                    debuffType: 'attack',
                    duration: 2
                };
            case 'charge':
                this.chargeLevel = 1;
                return {
                    type: EnemyIntentType.CHARGE,
                    value: Math.floor(baseAttack * 2),
                    isRelease: false
                };
            case 'heal':
                return {
                    type: EnemyIntentType.HEAL,
                    value: Math.max(5, Math.floor(baseHp * 0.1))
                };
            case 'special':
                return {
                    type: EnemyIntentType.SPECIAL,
                    mechanic: enemy.specialMechanic
                };
            default:
                return { type: EnemyIntentType.ATTACK, value: baseAttack };
        }
    },

    // 🆕 获取意图显示HTML
    getIntentDisplay: function () {
        const intent = this.currentIntent;
        if (!intent) return '';

        const config = EnemyIntentConfig[intent.type];
        if (!config) return '';

        let valueText = '';
        let extraInfo = '';

        if (intent.type === EnemyIntentType.ATTACK) {
            valueText = ` ${intent.value}`;
        } else if (intent.type === EnemyIntentType.CHARGE) {
            valueText = intent.isRelease ? ` ${intent.value}` : '';
            extraInfo = intent.isRelease ? ' (释放!)' : ' (蓄力中...)';
        } else if (intent.type === EnemyIntentType.DEFEND) {
            valueText = ` +${intent.value}`;
        } else if (intent.type === EnemyIntentType.HEAL) {
            valueText = ` +${intent.value}`;
        } else if (intent.type === EnemyIntentType.BUFF) {
            valueText = ` +${intent.value}`;
        } else if (intent.type === EnemyIntentType.DEBUFF) {
            valueText = ` -${intent.value}`;
        } else if (intent.type === EnemyIntentType.SPECIAL && intent.mechanic) {
            extraInfo = ` (${intent.mechanic.name})`;
        }

        return `
            <div style="margin-top: 10px; padding: 8px 12px; background: rgba(0,0,0,0.5); 
                        border-radius: 6px; border: 1px solid ${config.color}60;
                        display: inline-block;">
                <div style="color: ${config.color}; font-size: 13px; font-weight: bold;">
                    意图: ${config.icon} ${config.name}${valueText}${extraInfo}
                </div>
            </div>
        `;
    },

    // 抽牌
    drawCards: function (count) {
        for (let i = 0; i < count; i++) {
            if (this.drawPile.length === 0) {
                // 洗牌
                this.drawPile = [...this.discardPile].sort(() => Math.random() - 0.5);
                this.discardPile = [];
            }
            if (this.drawPile.length > 0) {
                this.hand.push(this.drawPile.pop());
            }
        }
    },

    // 显示战斗UI
    showBattleUI: function () {
        const modal = document.createElement('div');
        modal.id = 'battleModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, rgba(25, 18, 15, 0.99) 0%, rgba(15, 10, 8, 1) 50%, rgba(20, 14, 12, 0.99) 100%);
            display: flex; flex-direction: column; z-index: 10000;
            padding: 20px; box-sizing: border-box;
            border: 3px solid #3d2f24;
            box-shadow: inset 0 0 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(139,0,0,0.15);
            font-family: 'Cinzel', 'Microsoft YaHei', serif;
        `;

        modal.innerHTML = this.generateBattleHTML();
        document.body.appendChild(modal);
    },

    // 生成战斗HTML
    generateBattleHTML: function () {
        const enemy = this.currentEnemy;
        const enemyHpPercent = (enemy.currentHp / enemy.hp) * 100;
        const playerHpPercent = (PlayerState.hp / PlayerState.maxHp) * 100;

        // 生成手牌HTML - 克苏鲁风格
        let handHtml = '';
        this.hand.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            const isCurse = card.type === CardType.CURSE;
            const canPlay = !isCurse && card.cost <= this.currentEnergy;

            // 🔧 根据卡牌类型显示不同的主要数值
            let mainValue = '';
            if (isCurse) {
                mainValue = card.icon || '💀';
            } else if (card.type === CardType.ATTACK) {
                mainValue = card.value || 0;
            } else if (card.type === CardType.ARMOR) {
                mainValue = '🛡️' + (card.value || 0);
            } else if (card.type === CardType.HEAL) {
                mainValue = '❤️' + (card.value || 0);
            } else if (card.type === CardType.BUFF) {
                // BUFF卡显示效果图标
                if (card.drawCards) mainValue = '📜' + card.drawCards;
                else if (card.gainEnergy) mainValue = '⚡+' + card.gainEnergy;
                else mainValue = '✨';
            } else if (card.type === CardType.DEBUFF) {
                mainValue = '💀-' + (card.value || 0);
            } else {
                mainValue = card.value || '?';
            }

            handHtml += `
                <div class="battle-card ${canPlay ? 'playable' : 'disabled'}" 
                     onclick="${canPlay ? `BattleSystem.playCard(${index})` : ''}"
                     style="background: linear-gradient(180deg, rgba(25,18,15,0.95) 0%, rgba(15,10,8,0.98) 100%);
                            border: 2px solid ${canPlay ? '#6b5241' : '#2a1f18'}; border-radius: 4px;
                            padding: 12px; width: 100px; cursor: ${canPlay ? 'pointer' : 'not-allowed'};
                            transition: all 0.2s; opacity: ${canPlay ? 1 : 0.5};
                            flex-shrink: 0; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), ${canPlay ? '0 0 10px rgba(139,0,0,0.3)' : 'none'};"
                     ${canPlay ? `onmouseover="this.style.transform='translateY(-15px)';this.style.boxShadow='inset 0 0 15px rgba(0,0,0,0.5), 0 0 20px rgba(139,0,0,0.5)';this.style.borderColor='#8b5a2b'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px rgba(139,0,0,0.3)';this.style.borderColor='#6b5241'"` : ''}>
                    <div style="color: ${isCurse ? '#8b0000' : '#c9b896'}; font-size: 11px; text-align: right; margin-bottom: 5px;">${isCurse ? '诅咒' : card.cost + '⚡'}</div>
                    <div style="color: #c9b896; font-size: 12px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${isCurse ? '#8b0000' : typeColor}; font-size: 18px; font-weight: bold; margin-bottom: 5px;">${mainValue}</div>
                    <div style="color: #6b5d4d; font-size: 9px; line-height: 1.3; word-break: break-all;">${card.description}</div>
                </div>
            `;
        });

        return `
            <!-- 🔥 打击感动画样式 -->
            <style>
                @keyframes damageFloat {
                    0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
                    50% { opacity: 1; transform: translate(-50%, -30px) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -60px) scale(0.8); }
                }
                @keyframes battleShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(calc(-1 * var(--shake-intensity, 5px))); }
                    20%, 40%, 60%, 80% { transform: translateX(var(--shake-intensity, 5px)); }
                }
                @keyframes hitFlash {
                    0%, 100% { filter: brightness(1); }
                    50% { filter: brightness(2) saturate(0.5); background: rgba(255,71,87,0.3); }
                }
                .battle-area-player, .battle-area-enemy {
                    transition: filter 0.1s, background 0.1s;
                }
            </style>
            
            <!-- 顶部信息栏 - 克苏鲁风格 -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px 15px; background: linear-gradient(180deg, rgba(139,0,0,0.15) 0%, transparent 100%); border-bottom: 2px solid rgba(139,0,0,0.3); border-radius: 4px;">
                <div style="color: #c9b896; font-size: 18px; font-family: 'Cinzel', serif; text-shadow: 0 0 10px rgba(139,0,0,0.4);">҉ 回合 ${this.turn}</div>
                <div style="color: #c9b896; font-size: 16px; text-shadow: 0 0 10px rgba(139,0,0,0.4);">⚡ ${this.currentEnergy}/${PlayerState.energy}</div>
            </div>
            
            <!-- 战斗区域 -->
            <div style="flex: 1; display: flex; justify-content: space-around; align-items: center;background: url(img/background/bg_001.png); margin-bottom: 20px; padding-top: 10px;">
                <!-- 玩家 -->
                <div id="playerArea" class="battle-area-player" style="text-align: center; min-width: 150px;">
                    ${PlayerState.profession?.icon?.startsWith('img/') ? `<img src="${PlayerState.profession.icon}" style="width: 220px; height: 220px; margin-bottom: 8px; object-fit: contain;" onerror="this.outerHTML='<div style=font-size:50px;margin-bottom:8px;>🧙‍♀️</div>'">` : `<div style="font-size: 50px; margin-bottom: 8px;">${PlayerState.profession?.icon || '🧙‍♀️'}</div>`}
                    <div style="color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">${PlayerState.name}</div>
                    
                    <!-- 玩家血条 -->
                    <div style="width: 140px; height: 14px; background: #333; border-radius: 7px; overflow: hidden; margin: 0 auto 8px;">
                        <div style="width: ${playerHpPercent}%; height: 100%; background: linear-gradient(90deg, #ff4757, #ff6b81); transition: width 0.3s;"></div>
                    </div>
                    <div style="color: #ff6b81; font-size: 13px; font-weight: bold; margin-bottom: 10px;">❤️ ${PlayerState.hp}/${PlayerState.maxHp}</div>
                    
                    <!-- 玩家属性面板 - 克苏鲁风格 -->
                    <div style="background: linear-gradient(180deg, rgba(25,18,15,0.9) 0%, rgba(15,10,8,0.95) 100%); border: 2px solid #3d2f24; border-radius: 4px; padding: 10px; text-align: left; font-size: 12px; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="color: #6b5d4d;">🛡️ 护甲: <span style="color: #c9b896; font-weight: bold;">${this.playerArmor}</span></div>
                            <div style="color: #6b5d4d;">⚔️ 攻击: <span style="color: #c9b896;">${this.getPlayerEffectiveAttack()}</span></div>
                            <div style="color: #6b5d4d;">🔰 防御: <span style="color: #c9b896;">${this.getPlayerEffectiveDefense()}</span></div>
                            <div style="color: #6b5d4d;">💜 堕落: <span style="color: #8b0000; font-weight: bold;">${PlayerState.corruption}</span></div>
                        </div>
                        ${this.getPlayerBuffDisplay()}
                    </div>
                </div>
                
                <!-- VS -->
                <div style="color: #ff4757; font-size: 28px; font-weight: bold; align-self: center;">⚔️</div>
                
                <!-- 敌人 -->
                <div id="enemyArea" class="battle-area-enemy" style="text-align: center; min-width: 150px;">
                    ${enemy.icon && enemy.icon.startsWith('img/') ? `<img src="${enemy.icon}" style="width: 120px; height: 120px; margin-bottom: 8px; object-fit: contain;" onerror="this.outerHTML='<div style=font-size:50px;margin-bottom:8px;>👹</div>'">` : `<div style="font-size: 50px; margin-bottom: 8px;">${enemy.icon}</div>`}
                    <div style="color: ${enemy.type === 'boss' ? '#ff4757' : '#ffa502'}; font-size: 16px; font-weight: bold; margin-bottom: 4px;">
                        ${enemy.type === 'boss' ? '👑 ' : ''}${enemy.name}
                    </div>
                    ${enemy.desc ? `<div style="color: #888; font-size: 10px; margin-bottom: 8px; font-style: italic;">${enemy.desc}</div>` : ''}
                    
                    <!-- 敌人血条 -->
                    <div style="width: 140px; height: 14px; background: #333; border-radius: 7px; overflow: hidden; margin: 0 auto 8px;">
                        <div style="width: ${enemyHpPercent}%; height: 100%; background: linear-gradient(90deg, #ffa502, #ff6348); transition: width 0.3s;"></div>
                    </div>
                    <div style="color: #ffa502; font-size: 13px; font-weight: bold; margin-bottom: 10px;">❤️ ${enemy.currentHp}/${enemy.hp}</div>
                    
                    <!-- 敌人属性面板 - 克苏鲁风格 -->
                    <div style="background: linear-gradient(180deg, rgba(25,18,15,0.9) 0%, rgba(15,10,8,0.95) 100%); border: 2px solid #3d2f24; border-radius: 4px; padding: 10px; text-align: left; font-size: 12px; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="color: #6b5d4d;">🛡️ 护甲: <span style="color: #c9b896; font-weight: bold;">${this.enemyArmor}</span></div>
                            <div style="color: #6b5d4d;">⚔️ 攻击: <span style="color: #c9b896; font-weight: bold;">${this.getEnemyEffectiveAttack()}</span></div>
                            <div style="color: #6b5d4d;">🔰 防御: <span style="color: #c9b896; font-weight: bold;">${this.getEnemyEffectiveDefense()}</span></div>
                        </div>
                        ${this.getEnemyDebuffDisplay()}
                        ${this.getIntentDisplay()}
                    </div>
                </div>
            </div>
            
            <!-- 🔧 玩家特殊状态显示 -->
            ${this.getPlayerStatusDisplay()}
            
            <!-- 手牌区域 - 克苏鲁风格 -->
            <div style="background: linear-gradient(180deg, rgba(25,18,15,0.9) 0%, rgba(15,10,8,0.95) 100%); border: 2px solid #3d2f24; border-radius: 4px; padding: 15px; margin-bottom: 15px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
                <div style="color: #6b5d4d; font-size: 12px; margin-bottom: 10px;">҉ 手牌 (${this.hand.length}) | 牌库 (${this.drawPile.length}) | 弃牌堆 (${this.discardPile.length})</div>
                <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
                    ${handHtml || '<div style="color: #6b5d4d; text-align: center; width: 100%;">没有手牌</div>'}
                </div>
            </div>
            
            <!-- 操作按钮 - 克苏鲁风格 -->
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="BattleSystem.endTurn()" 
                        style="padding: 12px 30px; background: linear-gradient(180deg, #3d2f24 0%, #2a1f18 50%, #1a1310 100%);
                               color: #c9b896; border: 2px solid #6b5241; border-radius: 4px; cursor: pointer; font-size: 14px;
                               font-family: 'Cinzel', serif; box-shadow: inset 0 1px 0 rgba(107,82,65,0.4), 0 0 15px rgba(139,0,0,0.4);
                               text-shadow: 0 1px 2px rgba(0,0,0,0.8); transition: all 0.2s;"
                        onmouseover="this.style.boxShadow='inset 0 1px 0 rgba(139,107,74,0.5), 0 0 25px rgba(139,0,0,0.6)'; this.style.borderColor='#8b5a2b'"
                        onmouseout="this.style.boxShadow='inset 0 1px 0 rgba(107,82,65,0.4), 0 0 15px rgba(139,0,0,0.4)'; this.style.borderColor='#6b5241'">
                    ҉ 结束回合
                </button>
            </div>
        `;
    },

    // 出牌
    playCard: function (handIndex) {
        const card = this.hand[handIndex];
        if (!card || card.cost > this.currentEnergy) return;

        // 🔧 诅咒卡牌无法打出
        if (card.type === CardType.CURSE) {
            this.addLog(`[回合${this.turn}] ❌ 诅咒卡【${card.name}】无法使用！`);
            return;
        }

        this.currentEnergy -= card.cost;
        this.hand.splice(handIndex, 1);
        this.discardPile.push(card);

        // 📝 简化日志：H技能详细记录，普通技能简化
        if (card.type === CardType.H_ATTACK) {
            this.addLog(`[回合${this.turn}] 💋 使用H技能【${card.name}】：${card.description}`);
        } else {
            // 普通技能不单独记录，只统计
            if (!this.turnActions) this.turnActions = [];
            this.turnActions.push(card.name);
        }

        // 执行卡牌效果
        this.executeCard(card);

        // 检查战斗是否结束
        if (this.checkBattleEnd()) return;

        // 刷新UI
        this.updateBattleUI();
    },

    // 执行卡牌效果
    executeCard: function (card) {
        // 🔧 应用特殊状态攻击力修正
        let attackMod = this.statusMods?.attack || 0;

        // 🆕 诅咒词缀的伤害加成
        let affixDamageBonus = 1.0;
        if (card.affix && card.affix.effect?.type === 'empower') {
            affixDamageBonus = 1.0 + (card.affix.effect.bonus || 0.5);
        }

        // 🔧 加上 playerBuffs 中的攻击加成（如战意高昂）
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'attack') {
                attackMod += b.value;
            }
        });

        const totalAttack = Math.max(0, card.value + PlayerState.attack + attackMod);
        let totalDamageDealt = 0; // 用于计算生命汲取

        switch (card.type) {
            case CardType.ATTACK:
            case CardType.H_ATTACK:
                // 🆕 应用词缀伤害加成
                let damage = Math.floor(totalAttack * affixDamageBonus);

                // 🔧 H技能伤害加成（开局状态 + 身体改造效果 + 圣遗物）+ 堕落值+1
                if (card.type === CardType.H_ATTACK) {
                    let hBonus = this.statusMods?.hDamageBonus || 0;
                    const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
                    if (bodyMods.hDamageBonus > 0) hBonus += bodyMods.hDamageBonus;
                    // 🔧 圣遗物H伤害加成
                    if (this.relicMods?.hDamageBonus > 0) hBonus += this.relicMods.hDamageBonus;
                    if (hBonus > 0) {
                        damage += hBonus; // 直接加数值
                        this.addLog(`[回合${this.turn}] 💗 H伤害+${hBonus}`);
                    }
                    // H技能使用时堕落值+1
                    PlayerState.corruption += 1;
                    PlayerState.save();
                    PlayerState.updateDisplay();
                    this.addLog(`[回合${this.turn}] 💜 堕落值+1 (${PlayerState.corruption})`);
                }

                // 🔧 应用敌人防御力debuff（束缚）
                let enemyDefense = this.currentEnemy.defense || 0;
                this.enemyDebuffs.forEach(d => {
                    if (d.debuffType === 'defense') {
                        enemyDefense = Math.max(0, enemyDefense - d.value);
                    }
                });
                damage = Math.max(0, damage - enemyDefense);

                let armorAbsorbed = 0;
                if (!card.ignoreArmor && this.enemyArmor > 0) {
                    armorAbsorbed = Math.min(this.enemyArmor, damage);
                    this.enemyArmor -= armorAbsorbed;
                    damage -= armorAbsorbed;
                }
                this.currentEnemy.currentHp -= damage;
                totalDamageDealt += damage;

                // 🔥 显示打击效果
                if (damage > 0) {
                    this.showHitEffect(damage, damage >= 15);
                }

                // 🔧 多段攻击处理（支持 hitCount 和 hits）
                const hitCount = card.hitCount || card.hits || 1;
                if (hitCount > 1) {
                    for (let i = 1; i < hitCount; i++) {
                        let extraDmg = Math.max(0, totalAttack - enemyDefense);
                        this.currentEnemy.currentHp -= extraDmg;
                        totalDamageDealt += extraDmg;
                    }
                }

                // 🔧 毒伤效果
                if (card.poisonDamage && card.poisonDuration) {
                    this.enemyDebuffs.push({
                        name: '中毒',
                        debuffType: 'poison',
                        value: card.poisonDamage,
                        remainingTurns: card.poisonDuration
                    });
                    this.addLog(`[回合${this.turn}] 🧪 敌人中毒 ${card.poisonDamage}伤害/${card.poisonDuration}回合`);
                }

                // 🔧 攻击/H攻击卡附带的debuff效果（如减攻击、减防御）
                if (card.debuffType && card.debuffValue && card.debuffDuration) {
                    this.enemyDebuffs.push({
                        name: card.debuffType === 'attack' ? '攻击削弱' : (card.debuffType === 'defense' ? '防御削弱' : '削弱'),
                        debuffType: card.debuffType,
                        value: card.debuffValue,
                        remainingTurns: card.debuffDuration
                    });
                    const debuffName = card.debuffType === 'attack' ? '攻击' : (card.debuffType === 'defense' ? '防御' : card.debuffType);
                    this.addLog(`[回合${this.turn}] 💫 敌人${debuffName}-${card.debuffValue} (${card.debuffDuration}回合)`);
                }

                // 🔧 生命汲取（遗物效果）
                if (this.relicMods?.lifesteal > 0 && totalDamageDealt > 0) {
                    const heal = this.relicMods.lifesteal;
                    PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + heal);
                    this.addLog(`[回合${this.turn}] 🦷 生命汲取+${heal}HP`);
                }
                break;

            case CardType.HEAL:
                let healAmount = card.value;
                // 🔧 治疗加成（遗物效果）
                if (this.relicMods?.healBonus > 0) {
                    healAmount += this.relicMods.healBonus;
                }
                PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + healAmount);
                // 🔧 治疗卡也可能附带护甲
                if (card.armorGain) {
                    this.playerArmor += card.armorGain;
                    this.addLog(`[回合${this.turn}] 🛡️ 额外护甲+${card.armorGain}`);
                }
                break;

            case CardType.ARMOR:
                this.playerArmor += card.value;
                // 🔧 反伤护甲
                if (card.reflect) {
                    this.playerBuffs.push({
                        name: '反伤',
                        buffType: 'reflect',
                        value: card.reflect,
                        remainingTurns: 1
                    });
                    this.addLog(`[回合${this.turn}] 🪞 反伤${card.reflect}已激活`);
                }
                break;

            case CardType.BUFF:
                this.playerBuffs.push({ ...card, remainingTurns: card.duration || 1 });
                // 🔧 Buff卡也可能附带护甲
                if (card.armorGain) {
                    this.playerArmor += card.armorGain;
                }
                // 🔧 draw类型buff立即抽牌
                if (card.buffType === 'draw' && card.value > 0) {
                    this.drawCards(card.value);
                    this.addLog(`[回合${this.turn}] 🃏 额外抽${card.value}张牌`);
                }
                break;

            case CardType.DEBUFF:
                this.enemyDebuffs.push({ ...card, remainingTurns: card.duration || 1 });
                // 🔧 Debuff卡也可能附带护甲
                if (card.armorGain) {
                    this.playerArmor += card.armorGain;
                }
                break;
        }

        // 🔧 通用：造成伤害后抽牌
        if (card.drawCards && card.drawCards > 0) {
            this.drawCards(card.drawCards);
            this.addLog(`[回合${this.turn}] 🃏 抽${card.drawCards}张牌`);
        }

        // 🆕 应用卡牌词缀效果
        if (card.affix) {
            this.applyCardAffix(card, totalDamageDealt);
        }
    },

    // 结束回合
    endTurn: function () {
        // 🔧 毒伤处理（在敌人行动前）
        let poisonDamage = 0;
        this.enemyDebuffs.forEach(d => {
            if (d.debuffType === 'poison') {
                poisonDamage += d.value;
            }
        });
        if (poisonDamage > 0) {
            this.currentEnemy.currentHp -= poisonDamage;
            this.addLog(`[回合${this.turn}] 🧪 毒伤造成${poisonDamage}点伤害`);
        }

        // 检查敌人是否死亡
        if (this.checkBattleEnd()) return;

        // 敌人回合
        this.enemyTurn();

        // 检查战斗是否结束
        if (this.checkBattleEnd()) return;

        // 🔧 汇总本回合使用的普通技能
        if (this.turnActions && this.turnActions.length > 0) {
            const actionSummary = this.turnActions.join('、');
            this.addLog(`[回合${this.turn}] ⚔️ 使用了：${actionSummary}`);
            this.turnActions = []; // 清空
        }

        // 新回合
        this.turn++;
        this.currentEnergy = PlayerState.energy;
        this.playerArmor = 0; // 玩家护甲每回合重置
        this.enemyArmor = 0;  // 🔧 敌人护甲也每回合重置

        // 🔧 每回合回复HP（开局状态效果）
        let hpRegen = this.statusMods?.hpPerTurn || 0;
        // 加上身体改造效果
        const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
        if (bodyMods.hpPerTurn > 0) hpRegen += bodyMods.hpPerTurn;

        if (hpRegen > 0) {
            PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + hpRegen);
            this.addLog(`[回合${this.turn}] ♻️ 回合恢复+${hpRegen}HP`);
            this.showHealEffect(hpRegen, true); // 🔥 显示治疗效果
        }

        // 🔧 抽牌（基础2张 + 遗物加成 + draw buff加成）
        let drawCount = 2;
        // draw类型buff加成
        this.playerBuffs.forEach(b => {
            if (b.buffType === 'draw' && b.value > 0) {
                drawCount += b.value;
            }
        });
        if (this.relicMods?.drawBonus > 0) {
            drawCount += this.relicMods.drawBonus;
        }
        this.drawCards(drawCount);

        // 更新Buff/Debuff
        this.updateBuffs();

        // 刷新UI
        this.updateBattleUI();
    },

    // 敌人回合（基于意图系统）
    enemyTurn: function () {
        // 🔧 检查是否被冻结/跳过回合
        const skipDebuff = this.enemyDebuffs.find(d => d.debuffType === 'skip' || d.debuffType === 'freeze');
        if (skipDebuff) {
            this.addLog(`[回合${this.turn}] ❄️ ${this.currentEnemy.name}被冻结，跳过回合`);
            this.generateNextIntent();
            return;
        }

        // 🆕 处理Boss每回合触发的特殊机制
        this.processBossMechanics();

        // 🆕 召唤物攻击
        this.processMinionsAttack();

        const intent = this.currentIntent;
        if (!intent) {
            // 如果没有意图，默认攻击
            this.executeEnemyAttack(this.currentEnemy.attack);
            this.generateNextIntent();
            return;
        }

        // 🆕 根据意图类型执行行动
        switch (intent.type) {
            case EnemyIntentType.ATTACK:
                this.executeEnemyAttack(intent.value);
                break;

            case EnemyIntentType.DEFEND:
                this.enemyArmor += intent.value;
                this.addLog(`[回合${this.turn}] 🛡️ ${this.currentEnemy.name}进入防御姿态，护甲+${intent.value}`);
                break;

            case EnemyIntentType.BUFF:
                this.enemyBuffs.push({
                    name: '狂暴',
                    buffType: intent.buffType || 'attack',
                    value: intent.value,
                    remainingTurns: intent.duration || 2
                });
                this.addLog(`[回合${this.turn}] 💪 ${this.currentEnemy.name}增强了自己，攻击+${intent.value}(${intent.duration}回合)`);
                break;

            case EnemyIntentType.DEBUFF:
                this.playerDebuffs.push({
                    name: '虚弱',
                    debuffType: intent.debuffType || 'attack',
                    value: intent.value,
                    remainingTurns: intent.duration || 2
                });
                this.addLog(`[回合${this.turn}] 💫 你被削弱了，${intent.debuffType === 'defense' ? '防御' : '攻击'}-${intent.value}(${intent.duration}回合)`);
                break;

            case EnemyIntentType.CHARGE:
                if (intent.isRelease) {
                    // 蓄力释放 - 造成大伤害
                    this.addLog(`[回合${this.turn}] 🔥 ${this.currentEnemy.name}释放蓄力攻击！`);
                    this.executeEnemyAttack(intent.value);
                    this.chargeLevel = 0;
                } else {
                    // 开始蓄力
                    this.addLog(`[回合${this.turn}] 🔥 ${this.currentEnemy.name}开始蓄力，下回合将释放大招！`);
                }
                break;

            case EnemyIntentType.HEAL:
                const healAmount = Math.min(intent.value, this.currentEnemy.hp - this.currentEnemy.currentHp);
                this.currentEnemy.currentHp += healAmount;
                this.addLog(`[回合${this.turn}] ❤️ ${this.currentEnemy.name}恢复了${healAmount}点生命`);
                break;

            case EnemyIntentType.SPECIAL:
                this.executeSpecialMechanic(intent.mechanic);
                break;

            default:
                this.executeEnemyAttack(this.currentEnemy.attack);
        }

        // 🔧 敌人释放H技能（诅咒卡牌）
        this.enemyHSkill();

        // 🆕 生成下回合意图
        this.generateNextIntent();
    },

    // 🆕 执行敌人攻击（提取出来复用）
    executeEnemyAttack: function (baseDamage) {
        let damage = baseDamage;

        // 应用敌人buff加成
        (this.enemyBuffs || []).forEach(buff => {
            if (buff.buffType === 'attack') {
                damage += buff.value;
            }
        });

        // 🔧 检查命中率（致盲）
        const accuracyDebuff = this.enemyDebuffs.find(d => d.debuffType === 'accuracy');
        if (accuracyDebuff) {
            const hitChance = 100 - accuracyDebuff.value;
            if (Math.random() * 100 > hitChance) {
                this.addLog(`[回合${this.turn}] 💨 敌人攻击落空`);
                return;
            }
        }

        // 应用debuff减攻
        this.enemyDebuffs.forEach(debuff => {
            if (debuff.debuffType === 'attack') {
                damage = Math.max(0, damage - debuff.value);
            }
        });

        // 🔧 应用开局状态效果：敌人攻击减少
        if (this.statusMods?.enemyAttackReduce > 0) {
            damage = Math.max(0, damage - this.statusMods.enemyAttackReduce);
        }

        // 🔧 应用身体改造效果：敌人攻击减少
        const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
        if (bodyMods.enemyAttackReduce > 0) {
            damage = Math.max(0, damage - bodyMods.enemyAttackReduce);
        }

        // 计算护甲吸收
        if (this.playerArmor > 0) {
            const absorbed = Math.min(this.playerArmor, damage);
            this.playerArmor -= absorbed;
            damage -= absorbed;
        }

        // 🔧 应用玩家防御
        let defenseMod = this.statusMods?.defense || 0;
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'defense') {
                defenseMod += b.value;
            }
        });
        // 应用玩家debuff减防
        (this.playerDebuffs || []).forEach(d => {
            if (d.debuffType === 'defense') {
                defenseMod -= d.value;
            }
        });
        const defenseWithMod = Math.max(0, PlayerState.defense + defenseMod);
        damage = Math.max(0, damage - defenseWithMod);

        // 🔧 应用特殊状态受伤增加
        if (this.statusMods?.damageTaken > 0) {
            damage = Math.floor(damage * (1 + this.statusMods.damageTaken / 100));
        }

        // 🔧 应用身体改造效果：受伤增加
        if (bodyMods.damageTaken > 0) {
            damage = Math.floor(damage * (1 + bodyMods.damageTaken / 100));
        }

        // 🔧 反伤处理
        let reflectDamage = this.relicMods?.reflect || 0;
        const reflectBuff = this.playerBuffs.find(b => b.buffType === 'reflect');
        if (reflectBuff) {
            reflectDamage += reflectBuff.value;
        }
        if (reflectDamage > 0 && damage > 0) {
            this.currentEnemy.currentHp -= reflectDamage;
            this.addLog(`[回合${this.turn}] 🪞 反伤${reflectDamage}点`);
        }

        PlayerState.hp -= damage;

        // 🔥 显示玩家受伤效果
        if (damage > 0) {
            this.showPlayerHitEffect(damage);
        }

        // 🔧 Boss吸血机制
        const mech = this.currentEnemy.specialMechanic;
        if (mech && mech.trigger === 'onAttack' && mech.effect?.healPercent > 0) {
            const healAmount = Math.floor(damage * mech.effect.healPercent);
            if (healAmount > 0) {
                this.currentEnemy.currentHp = Math.min(this.currentEnemy.hp, this.currentEnemy.currentHp + healAmount);
                this.addLog(`[回合${this.turn}] 🩸 ${mech.name}恢复${healAmount}HP`);
            }
        }

        // 🔧 受伤时回复HP（开局状态 + 身体改造）
        if (damage > 0) {
            let hpOnHit = this.statusMods?.hpOnHit || 0;
            if (bodyMods.hpOnHit > 0) hpOnHit += bodyMods.hpOnHit;
            if (hpOnHit > 0) {
                PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + hpOnHit);
                this.addLog(`[回合${this.turn}] 😵 受虐回复+${hpOnHit}HP`);
            }
        }
    },

    // 🆕 处理Boss特殊机制
    processBossMechanics: function () {
        const mech = this.currentEnemy.specialMechanic;
        if (!mech) return;

        // 初始化冷却
        if (this.mechanicCooldowns[mech.id] === undefined) {
            this.mechanicCooldowns[mech.id] = 0;
        }

        // 回合冷却触发
        if (mech.trigger === 'turnCooldown') {
            this.mechanicCooldowns[mech.id]++;
            if (this.mechanicCooldowns[mech.id] >= mech.cooldown) {
                this.executeSpecialMechanic(mech);
                this.mechanicCooldowns[mech.id] = 0;
            }
        }
        // 每回合触发
        else if (mech.trigger === 'everyTurn') {
            this.executeSpecialMechanic(mech);
        }
        // 血量触发
        else if (mech.trigger === 'hpBelow50' && !this.currentEnemy.mechanicTriggered50) {
            if (this.currentEnemy.currentHp <= this.currentEnemy.hp * 0.5) {
                this.currentEnemy.mechanicTriggered50 = true;
                this.executeSpecialMechanic(mech);
            }
        }
        else if (mech.trigger === 'hpBelow30' && !this.currentEnemy.mechanicTriggered30) {
            if (this.currentEnemy.currentHp <= this.currentEnemy.hp * 0.3) {
                this.currentEnemy.mechanicTriggered30 = true;
                this.executeSpecialMechanic(mech);
            }
        }
    },

    // 🆕 执行Boss特殊机制
    executeSpecialMechanic: function (mech) {
        if (!mech || !mech.effect) return;

        const effect = mech.effect;

        switch (mech.id) {
            case 'charm': // 魅惑：随机打出玩家手牌
                if (this.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.hand.length);
                    const card = this.hand[randomIndex];
                    this.addLog(`[回合${this.turn}] 💋 ${mech.name}触发！你不由自主地使用了【${card.name}】`);
                    // 强制使用（不消耗能量）
                    this.currentEnergy += card.cost; // 补回消耗
                    this.playCard(randomIndex);
                }
                break;

            case 'bind': // 束缚：封锁手牌
                if (this.hand.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.hand.length);
                    const card = this.hand[randomIndex];
                    if (!card.locked) {
                        card.locked = true;
                        card.lockedTurns = effect.duration || 2;
                        this.addLog(`[回合${this.turn}] 🐙 ${mech.name}触发！【${card.name}】被封锁${card.lockedTurns}回合`);
                    }
                }
                break;

            case 'spawn': // 召唤
                this.minions.push({
                    name: '触手幼体',
                    hp: effect.minionHp || 15,
                    attack: effect.minionAttack || 5,
                    icon: '🐙'
                });
                this.addLog(`[回合${this.turn}] 🌱 ${mech.name}触发！召唤了一只触手幼体`);
                break;

            case 'enrage': // 狂暴
                if (effect.attackBonus > 0) {
                    const bonus = Math.floor(this.currentEnemy.attack * effect.attackBonus);
                    this.currentEnemy.attack += bonus;
                    this.addLog(`[回合${this.turn}] 🔥 ${mech.name}触发！${this.currentEnemy.name}进入狂暴状态，攻击+${bonus}！`);
                }
                break;

            case 'dragonBreath': // 龙息
                if (effect.damageMultiplier > 0) {
                    const breathDamage = Math.floor(this.currentEnemy.attack * effect.damageMultiplier);
                    this.addLog(`[回合${this.turn}] 🔥 ${mech.name}触发！造成${breathDamage}点伤害！`);
                    this.executeEnemyAttack(breathDamage);
                }
                break;

            case 'corruptionAura': // 堕落光环（在onHit触发时处理）
                break;

            case 'divineJudgment': // 神圣审判
                if (effect.fixedDamage > 0) {
                    PlayerState.hp -= effect.fixedDamage;
                    this.addLog(`[回合${this.turn}] ✝️ ${mech.name}触发！造成${effect.fixedDamage}点固定伤害！`);
                    this.showPlayerHitEffect(effect.fixedDamage);
                }
                break;

            case 'ancientRoar': // 远古咆哮
                this.isSilenced = true;
                this.addLog(`[回合${this.turn}] 📢 ${mech.name}触发！你被震慑，下回合无法使用卡牌！`);
                break;

            case 'regeneration': // 自然再生
                const healAmount = Math.floor(this.currentEnemy.hp * (effect.healPercent || 0.05));
                this.currentEnemy.currentHp = Math.min(this.currentEnemy.hp, this.currentEnemy.currentHp + healAmount);
                this.addLog(`[回合${this.turn}] 🌿 ${mech.name}触发！恢复${healAmount}HP`);
                break;

            case 'webTrap': // 蛛网陷阱
                this.drawReduction = effect.value || 2;
                this.addLog(`[回合${this.turn}] 🕸️ ${mech.name}触发！下回合抽牌-${this.drawReduction}`);
                break;

            case 'voidRift': // 虚空裂隙
                if (Math.random() < (effect.chance || 0.2) && this.discardPile.length > 0) {
                    const removedCard = this.discardPile.splice(Math.floor(Math.random() * this.discardPile.length), 1)[0];
                    this.addLog(`[回合${this.turn}] 🌀 ${mech.name}触发！【${removedCard.name}】被虚空吞噬！`);
                }
                break;

            case 'lifeSteal': // 生命汲取（在攻击时处理）
                break;
        }
    },

    // 🆕 处理召唤物攻击
    processMinionsAttack: function () {
        if (!this.minions || this.minions.length === 0) return;

        this.minions.forEach((minion, index) => {
            if (minion.hp > 0) {
                const damage = Math.max(0, minion.attack - PlayerState.defense);
                PlayerState.hp -= damage;
                this.addLog(`[回合${this.turn}] ${minion.icon} ${minion.name}攻击，造成${damage}点伤害`);
            }
        });

        // 移除死亡的召唤物
        this.minions = this.minions.filter(m => m.hp > 0);
    },

    // 敌人释放H技能
    enemyHSkill: function () {
        // 🔧 每回合15%几率释放H技能
        if (Math.random() > 0.15) return;

        // 随机选择一张诅咒卡
        const curseCard = CurseCardLibrary[Math.floor(Math.random() * CurseCardLibrary.length)];
        if (!curseCard) return;

        // 计算诅咒伤害（诅咒是魔法攻击，护甲只能挡一半）
        let curseDamage = curseCard.damage;

        // 护甲只能吸收一半诅咒伤害
        if (this.playerArmor > 0) {
            const maxAbsorb = Math.floor(curseDamage / 2);
            const absorbed = Math.min(this.playerArmor, maxAbsorb);
            this.playerArmor -= absorbed;
            curseDamage -= absorbed;
        }

        // 防御减伤（诅咒穿透50%防御）
        let defenseMod = this.statusMods?.defense || 0;
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'defense') defenseMod += b.value;
        });
        const defenseWithMod = Math.floor((PlayerState.defense + defenseMod) / 2);
        curseDamage = Math.max(0, curseDamage - defenseWithMod);

        // 造成伤害
        PlayerState.hp -= curseDamage;

        // 🔥 诅咒伤害效果（紫色特效）
        if (curseDamage > 0) {
            this.showDamageNumber(curseDamage, true, false, false);
            this.shakeScreen(5);
        }

        // 获取详细描述
        const statusConfig = SpecialStatusConfig[curseCard.statusId];
        const fullDesc = statusConfig?.fullDesc || curseCard.description;

        // 记录战斗日志 - 详细显示诅咒效果
        this.addLog(`[回合${this.turn}] ${curseCard.icon} 敌人释放诅咒【${curseCard.name}】`);

        // 🔧 即使伤害为0，50%几率仍然生效（诅咒是魔法效果）
        const curseSucceeds = curseDamage > 0 || Math.random() < 0.5;
        if (curseSucceeds) {
            const newCurseCard = { ...curseCard, cost: 999 }; // 设置超高费用防止打出

            // 添加到当前手牌
            this.hand.push(newCurseCard);

            // 添加到卡组
            CardDeckManager.deck.push({ ...newCurseCard });
            saveCardDeck();
            CardDeckManager.renderDeck(); // 🔧 刷新卡组显示

            // 添加特殊状态效果
            SpecialStatusManager.add(curseCard.statusId);

            // 🔧 详细显示诅咒效果
            this.addLog(`[回合${this.turn}] 💀 中了诅咒！${fullDesc}`);
        } else {
            this.addLog(`[回合${this.turn}] 🛡️ 完全格挡！诅咒未生效`);
        }
    },

    // 更新Buff/Debuff
    updateBuffs: function () {
        this.playerBuffs = this.playerBuffs.filter(b => {
            b.remainingTurns--;
            return b.remainingTurns > 0;
        });

        this.enemyDebuffs = this.enemyDebuffs.filter(d => {
            d.remainingTurns--;
            // DOT伤害（不记录日志）
            if (d.debuffType === 'dot' && d.remainingTurns >= 0) {
                // 🔧 修复：DOT类型使用dotDamage字段而不是value
                const dotDmg = d.dotDamage || d.value || 0;
                this.currentEnemy.currentHp -= dotDmg;
            }
            return d.remainingTurns > 0;
        });
    },

    // 检查战斗是否结束
    checkBattleEnd: function () {
        if (this.currentEnemy.currentHp <= 0) {
            this.victory();
            return true;
        }
        if (PlayerState.hp <= 0) {
            this.defeat();
            return true;
        }
        return false;
    },

    // 胜利
    victory: function () {
        const reward = this.currentEnemy.type === 'boss' ? 100 : (this.currentEnemy.type === 'elite' ? 50 : 25);
        PlayerState.gold += reward;
        // 注：floor++ 已移至 showRouteSelection，此处不再增加
        PlayerState.save();
        saveCardDeck(); // 🔧 战斗胜利后保存卡组
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        // 🔧 计算战斗难度
        const hpLostPercent = Math.round((1 - PlayerState.hp / PlayerState.maxHp) * 100);
        let difficultyText = '轻松取胜';
        if (hpLostPercent >= 70) difficultyText = '险胜，差点没命';
        else if (hpLostPercent >= 50) difficultyText = '苦战后取胜';
        else if (hpLostPercent >= 30) difficultyText = '艰难取胜';
        else if (hpLostPercent >= 10) difficultyText = '小有波折';

        // 📝 简化战斗日志：只记录结果
        this.battleLog.push(`--- 战斗结果: 胜利 ---`);
        this.battleLog.push(`击败${this.currentEnemy.name}，共${this.turn}回合，${difficultyText}`);

        // 🆕 词缀卡奖励（普通10%，精英50%，Boss100%保底）
        let affixCardReward = null;
        const affixChance = this.currentEnemy.type === 'boss' ? 1.0 : (this.currentEnemy.type === 'elite' ? 0.5 : 0.1);
        console.log('[词缀] 敌人类型:', this.currentEnemy.type, '词缀几率:', affixChance);

        if (Math.random() < affixChance) {
            // 🔧 修复：从ProfessionConfig或CardLibrary获取可用卡牌
            let professionCards = [];

            // 先尝试从PlayerState.profession获取
            if (PlayerState.profession?.availableCards?.length > 0) {
                professionCards = PlayerState.profession.availableCards;
            }
            // 如果没有，尝试从ProfessionConfig获取
            else if (PlayerState.profession?.id && ProfessionConfig[PlayerState.profession.id]?.availableCards) {
                professionCards = ProfessionConfig[PlayerState.profession.id].availableCards;
            }
            // 最后尝试使用通用卡牌库
            else {
                // 从CardLibrary中获取所有攻击和技能卡（排除诅咒和怪物卡）
                professionCards = Object.keys(CardLibrary).filter(id => {
                    const card = CardLibrary[id];
                    return card && card.type !== CardType.CURSE &&
                        card.type !== CardType.MONSTER &&
                        card.type !== CardType.ELITE &&
                        card.type !== CardType.BOSS;
                });
            }

            console.log('[词缀] 职业可用卡牌数:', professionCards.length);

            if (professionCards.length > 0) {
                const randomCardId = professionCards[Math.floor(Math.random() * professionCards.length)];
                const cardTemplate = CardLibrary[randomCardId];
                console.log('[词缀] 选中卡牌ID:', randomCardId, '模板:', cardTemplate?.name);

                if (cardTemplate) {
                    affixCardReward = { ...cardTemplate };
                    this.addRandomAffixToCard(affixCardReward);
                    console.log('[词缀] 生成词缀卡:', affixCardReward.name, '词缀:', affixCardReward.affix);

                    // 🔧 不再自动添加，而是等玩家选择
                    this.pendingAffixCard = affixCardReward;
                    this.battleLog.push(`🌟 发现词缀卡牌【${affixCardReward.name}】！`);
                } else {
                    console.warn('[词缀] 卡牌模板不存在:', randomCardId);
                }
            } else {
                console.warn('[词缀] 没有找到可用卡牌');
            }
        } else {
            console.log('[词缀] 随机未触发词缀奖励');
        }

        // 保存战斗结果信息
        this.lastBattleResult = {
            enemyName: this.currentEnemy.name,
            reward: reward,
            difficulty: difficultyText,
            hpLostPercent: hpLostPercent,
            totalTurns: this.turn,
            affixCard: affixCardReward
        };

        // 🆕 词缀卡选择UI
        const affixCardHtml = affixCardReward ? `
            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(251, 191, 36, 0.2)); 
                        border: 2px solid #a855f7; border-radius: 12px; padding: 20px; margin: 15px 0; text-align: center;">
                <div style="color: #fbbf24; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                    🌟 发现词缀卡牌！
                </div>
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                    <div style="color: #fff; font-size: 18px; font-weight: bold;">${affixCardReward.name}</div>
                    <div style="color: #a855f7; font-size: 12px; margin-top: 5px;">词缀: ${affixCardReward.affix?.icon || ''} ${affixCardReward.affix?.name || ''}</div>
                    <div style="color: #888; font-size: 11px; margin-top: 5px;">${affixCardReward.affix?.description || ''}</div>
                    <div style="color: #aaa; font-size: 11px; margin-top: 8px; border-top: 1px solid #444; padding-top: 8px;">
                        费用: ${affixCardReward.cost}⚡ | ${affixCardReward.description || ''}
                    </div>
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="BattleSystem.learnAffixCard()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        ✓ 学习
                    </button>
                    <button onclick="BattleSystem.skipAffixCard()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #666, #444);
                                   color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        ✗ 跳过
                    </button>
                </div>
            </div>
        ` : '';

        document.getElementById('battleModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">🎉</div>
                <div style="color: #2ed573; font-size: 32px; font-weight: bold; margin-bottom: 15px;">胜利!</div>
                <div style="color: #ffd700; font-size: 18px; margin-bottom: 10px;">战胜了 ${this.currentEnemy.name}</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">${difficultyText}，获得 ${reward} 金币</div>
                ${affixCardHtml}
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="BattleSystem.skipBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="BattleSystem.generateBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 🆕 学习词缀卡
    learnAffixCard: function () {
        if (this.pendingAffixCard) {
            CardDeckManager.deck.push(this.pendingAffixCard);
            saveCardDeck();
            CardDeckManager.renderDeck();

            // 更新UI显示
            const cardName = this.pendingAffixCard.name;
            this.pendingAffixCard = null;

            // 显示成功提示
            if (typeof showNotification === 'function') {
                showNotification(`成功学习 ${cardName}！`, 'success');
            }

            // 刷新胜利界面，移除词缀卡选择区域
            this.refreshVictoryUI();
        }
    },

    // 🆕 跳过词缀卡
    skipAffixCard: function () {
        if (this.pendingAffixCard) {
            const cardName = this.pendingAffixCard.name;
            this.pendingAffixCard = null;

            if (typeof showNotification === 'function') {
                showNotification(`放弃了 ${cardName}`, 'info');
            }

            // 刷新胜利界面
            this.refreshVictoryUI();
        }
    },

    // 🆕 刷新胜利界面（移除词缀卡选择）
    refreshVictoryUI: function () {
        const result = this.lastBattleResult;
        document.getElementById('battleModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">🎉</div>
                <div style="color: #2ed573; font-size: 32px; font-weight: bold; margin-bottom: 15px;">胜利!</div>
                <div style="color: #ffd700; font-size: 18px; margin-bottom: 10px;">战胜了 ${result.enemyName}</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">${result.difficulty}，获得 ${result.reward} 金币</div>
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="BattleSystem.skipBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="BattleSystem.generateBattleStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 🔧 跳过战斗剧情，记录到历史
    skipBattleStory: function () {
        const result = this.lastBattleResult;
        const historyText = `战胜了${result.enemyName}，${result.difficulty}，获得${result.reward}金币`;
        ACJTGame.recordToHistory(historyText);
        this.closeBattle(true);
    },

    // 🔧 生成战斗剧情（包含战斗日志）
    generateBattleStory: function () {
        const result = this.lastBattleResult;

        // 📝 构建包含战斗日志的提示词
        const floor = PlayerState.floor || 1;
        const battleLogText = this.battleLog.join('\n');
        const prompt = `简单跳过之前的场景，根据以下战斗日志生成战斗剧情：

【尖塔第${floor}层】
【战斗日志】
${battleLogText}

请根据上述战斗过程，生成一段生动的战斗剧情描写，不要直接描述数值，用剧情表达。`;

        // 🔧 生成剧情时不记录到重要历史和矩阵
        this.closeBattle(false);
        ACJTGame.sendToAI(prompt);
    },

    // 失败
    defeat: function () {
        // 📝 简化战斗日志：只记录结果
        this.battleLog.push(`--- 战斗结果: 失败 ---`);
        this.battleLog.push(`被${this.currentEnemy.name}击败，共${this.turn}回合`);

        // 保存失败信息
        this.lastBattleResult = {
            enemyName: this.currentEnemy.name,
            victory: false,
            totalTurns: this.turn,
            enemyRemainingHp: this.currentEnemy.currentHp
        };

        document.getElementById('battleModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">💀</div>
                <div style="color: #ff4757; font-size: 32px; font-weight: bold; margin-bottom: 20px;">战败...</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 30px;">你倒在了${this.currentEnemy.name}面前</div>
                <div style="display: flex; gap: 20px;">
                    <button onclick="BattleSystem.triggerAiChao()"
                            style="padding: 15px 40px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        艾超
                    </button>
                    <button onclick="BattleSystem.triggerBeg()"
                            style="padding: 15px 40px; background: linear-gradient(135deg, #ffd700, #ff9500);
                                   color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        求饶
                    </button>
                </div>
            </div>
        `;
    },

    // 触发艾超（发送给AI，包含战斗日志）
    triggerAiChao: function () {
        const enemyName = this.currentEnemy?.name || '未知敌人';

        // 📝 构建包含战斗日志的提示词
        const floor = PlayerState.floor || 1;
        const battleLogText = this.battleLog.join('\n');
        const prompt = `简单跳过当前场景，根据以下战斗日志生成战败剧情：

【尖塔第${floor}层】
【战斗日志】
${battleLogText}

我被${enemyName}击败了。请根据上述战斗过程，生成一段战败后的剧情描写（被操场景）。`;

        // 📝 记录到重要历史
        ACJTGame.recordToHistory(`战败：被${enemyName}击败，遭到侵犯`);

        document.getElementById('battleModal')?.remove();
        ACJTGame.sendToAI(prompt);
    },

    // 触发求饶（发送给AI，包含战斗日志）
    triggerBeg: function () {
        const enemyName = this.currentEnemy?.name || '未知敌人';

        // 📝 构建包含战斗日志的提示词
        const floor = PlayerState.floor || 1;
        const battleLogText = this.battleLog.join('\n');
        const prompt = `简单跳过当前场景，根据以下战斗日志生成战败剧情：

【尖塔第${floor}层】
【战斗日志】
${battleLogText}

我被${enemyName}击败了。请根据上述战斗过程，生成一段战败后的剧情描写（求饶场景）。`;

        // 📝 记录到重要历史
        ACJTGame.recordToHistory(`战败：被${enemyName}击败，向其求饶`);

        document.getElementById('battleModal')?.remove();
        ACJTGame.sendToAI(prompt);
    },

    // 关闭战斗
    closeBattle: function (showRoutes = false) {
        document.getElementById('battleModal')?.remove();
        if (showRoutes) {
            RouteSystem.showRouteSelection();
        }
    },

    // 更新战斗UI
    updateBattleUI: function () {
        const modal = document.getElementById('battleModal');
        if (modal) {
            modal.innerHTML = this.generateBattleHTML();
        }
    },

    // ==================== 🔥 打击感效果系统 ====================

    // 显示伤害数字飘字
    showDamageNumber: function (damage, isPlayer = false, isCrit = false, isHeal = false) {
        const container = document.getElementById('battleModal');
        if (!container) return;

        const floatNum = document.createElement('div');
        floatNum.className = 'damage-float-number';

        // 根据类型设置颜色和文字
        let color = '#ff4757'; // 默认红色（伤害）
        let text = `-${damage}`;
        let size = isCrit ? '36px' : '28px';

        if (isHeal) {
            color = '#2ed573';
            text = `+${damage}`;
        } else if (isCrit) {
            color = '#ffd700';
            text = `💥${damage}`;
        }

        // 根据目标位置调整
        const xPos = isPlayer ? '25%' : '75%';
        const yOffset = Math.random() * 40 - 20;

        floatNum.style.cssText = `
            position: absolute;
            left: ${xPos};
            top: 30%;
            transform: translate(-50%, ${yOffset}px);
            font-size: ${size};
            font-weight: bold;
            color: ${color};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px ${color};
            z-index: 10001;
            pointer-events: none;
            animation: damageFloat 1s ease-out forwards;
        `;
        floatNum.textContent = text;
        container.appendChild(floatNum);

        // 动画结束后移除
        setTimeout(() => floatNum.remove(), 1000);
    },

    // 屏幕震动效果
    shakeScreen: function (intensity = 5, duration = 200) {
        const container = document.getElementById('battleModal');
        if (!container) return;

        container.style.animation = `battleShake ${duration}ms ease-in-out`;
        container.style.setProperty('--shake-intensity', `${intensity}px`);

        setTimeout(() => {
            container.style.animation = '';
        }, duration);
    },

    // 目标闪烁效果
    flashTarget: function (isPlayer = false) {
        const targetId = isPlayer ? 'playerArea' : 'enemyArea';
        const target = document.getElementById(targetId);
        if (!target) return;

        target.style.animation = 'hitFlash 0.3s ease-in-out';
        setTimeout(() => {
            target.style.animation = '';
        }, 300);
    },

    // 综合打击效果（攻击敌人）
    showHitEffect: function (damage, isCrit = false) {
        this.showDamageNumber(damage, false, isCrit);
        this.shakeScreen(isCrit ? 8 : 4);
        this.flashTarget(false);
    },

    // 综合受伤效果（玩家受伤）
    showPlayerHitEffect: function (damage) {
        this.showDamageNumber(damage, true);
        this.shakeScreen(6);
        this.flashTarget(true);
    },

    // 治疗效果
    showHealEffect: function (amount, isPlayer = true) {
        this.showDamageNumber(amount, isPlayer, false, true);
    },

    // 🔧 获取敌人debuff显示
    getEnemyDebuffDisplay: function () {
        if (!this.enemyDebuffs || this.enemyDebuffs.length === 0) return '';

        const debuffIcons = {
            'attack': '⚔️↓',
            'defense': '🛡️↓',
            'dot': '🩸',
            'poison': '🧪',
            'accuracy': '👁️↓',
            'skip': '😱'
        };

        const debuffColors = {
            'attack': '#ffa502',
            'defense': '#70a1ff',
            'dot': '#ff4757',
            'poison': '#2ed573',
            'accuracy': '#f7b731',
            'skip': '#9c88ff'
        };

        let html = '<div style="display: flex; gap: 4px; justify-content: center; margin-top: 8px; flex-wrap: wrap;">';
        this.enemyDebuffs.forEach(d => {
            const icon = debuffIcons[d.debuffType] || '❌';
            const color = debuffColors[d.debuffType] || '#ff4757';
            const valueText = d.debuffType === 'poison' ? `${d.value}伤` : '';
            html += `<div style="background: rgba(0,0,0,0.4); border: 1px solid ${color}; 
                     border-radius: 6px; padding: 3px 8px; font-size: 10px; color: ${color};"
                     title="${d.name || d.debuffType}: ${d.value}">
                ${icon}${valueText} ${d.remainingTurns}回合
            </div>`;
        });
        html += '</div>';
        return html;
    },

    // 🔧 获取玩家特殊状态显示
    getPlayerStatusDisplay: function () {
        const mods = this.statusMods || {};
        const relicMods = this.relicMods || {};

        const effects = [];
        // 基础属性修正
        if (mods.attack !== 0) {
            effects.push(`<span style="color: ${mods.attack > 0 ? '#2ed573' : '#ff4757'};">⚔️${mods.attack > 0 ? '+' : ''}${mods.attack}</span>`);
        }
        if (mods.defense !== 0) {
            effects.push(`<span style="color: ${mods.defense > 0 ? '#2ed573' : '#ff4757'};">🛡️${mods.defense > 0 ? '+' : ''}${mods.defense}</span>`);
        }
        if (mods.damageTaken !== 0) {
            effects.push(`<span style="color: #ff4757;">受伤+${mods.damageTaken}%</span>`);
        }
        // H伤害加成
        if (mods.hDamageBonus > 0) {
            effects.push(`<span style="color: #ff6b9d;">💗H伤+${mods.hDamageBonus}%</span>`);
        }
        // 每回合回血
        if (mods.hpPerTurn > 0) {
            effects.push(`<span style="color: #2ed573;">♻️回合+${mods.hpPerTurn}HP</span>`);
        }
        // 受伤回血
        if (mods.hpOnHit > 0) {
            effects.push(`<span style="color: #ffa502;">😵受击+${mods.hpOnHit}HP</span>`);
        }
        // 敌人攻击减少
        if (mods.enemyAttackReduce > 0) {
            effects.push(`<span style="color: #70a1ff;">🌺敌攻-${mods.enemyAttackReduce}</span>`);
        }
        // 遗物效果
        if (relicMods.lifesteal > 0) {
            effects.push(`<span style="color: #ff6b81;">🦷吸血+${relicMods.lifesteal}</span>`);
        }
        if (relicMods.healBonus > 0) {
            effects.push(`<span style="color: #2ed573;">💚治疗+${relicMods.healBonus}</span>`);
        }
        if (relicMods.drawBonus > 0) {
            effects.push(`<span style="color: #ffd700;">🃏抽牌+${relicMods.drawBonus}</span>`);
        }
        if (relicMods.reflect > 0) {
            effects.push(`<span style="color: #70a1ff;">🪞反伤${relicMods.reflect}</span>`);
        }

        if (effects.length === 0) return '';

        return `
            <div style="background: linear-gradient(135deg, rgba(102,126,234,0.1), rgba(255,107,157,0.1)); 
                 border: 1px solid rgba(102,126,234,0.3); border-radius: 10px; padding: 10px; margin-bottom: 12px; text-align: center;">
                <div style="color: #888; font-size: 11px; margin-bottom: 6px;">✨ 特殊效果</div>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; font-size: 11px;">
                    ${effects.join(' ')}
                </div>
            </div>
        `;
    },

    // 🔧 获取玩家有效攻击力（基础 + 状态修正 + buff）
    getPlayerEffectiveAttack: function () {
        let base = PlayerState.attack || 0;
        let bonus = this.statusMods?.attack || 0;

        // 加上 buff 的攻击加成
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'attack') {
                bonus += b.value;
            }
        });

        const total = base + bonus;
        if (bonus !== 0) {
            const color = bonus > 0 ? '#2ed573' : '#ff4757';
            return `<span style="color: #fff; font-weight: bold;">${total}</span><span style="color: ${color}; font-size: 10px;">(${base}${bonus > 0 ? '+' : ''}${bonus})</span>`;
        }
        return `<span style="color: #fff; font-weight: bold;">${total}</span>`;
    },

    // 🔧 获取玩家有效防御力（基础 + 状态修正 + buff）
    getPlayerEffectiveDefense: function () {
        let base = PlayerState.defense || 0;
        let bonus = this.statusMods?.defense || 0;

        // 加上 buff 的防御加成
        (this.playerBuffs || []).forEach(b => {
            if (b.buffType === 'defense') {
                bonus += b.value;
            }
        });

        const total = base + bonus;
        if (bonus !== 0) {
            const color = bonus > 0 ? '#2ed573' : '#ff4757';
            return `<span style="color: #fff; font-weight: bold;">${total}</span><span style="color: ${color}; font-size: 10px;">(${base}${bonus > 0 ? '+' : ''}${bonus})</span>`;
        }
        return `<span style="color: #fff; font-weight: bold;">${total}</span>`;
    },

    // 🔧 获取玩家增益显示（战斗属性面板内）
    getPlayerBuffDisplay: function () {
        const buffs = this.playerBuffs || [];
        if (buffs.length === 0) return '';

        let html = '<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">';
        html += '<div style="color: #2ed573; font-size: 10px; margin-bottom: 4px;">✨ 增益效果</div>';
        buffs.forEach(b => {
            html += `<div style="color: #2ed573; font-size: 10px;">• ${b.name} (${b.remainingTurns}回合)</div>`;
        });
        html += '</div>';
        return html;
    },

    // 🔧 获取敌人有效攻击力（考虑 debuff）
    getEnemyEffectiveAttack: function () {
        let attack = this.currentEnemy?.attack || 0;
        const originalAttack = attack;

        // 应用攻击力 debuff
        (this.enemyDebuffs || []).forEach(d => {
            if (d.debuffType === 'attack') {
                attack = Math.max(0, attack - d.value);
            }
        });

        // 应用身体改造效果：敌人攻击减少
        const bodyMods = typeof BlackMarketSystem !== 'undefined' ? BlackMarketSystem.getBattleMods() : {};
        if (bodyMods.enemyAttackReduce > 0) {
            attack = Math.max(0, attack - bodyMods.enemyAttackReduce);
        }

        // 如果有变化，显示带减益的格式
        if (attack !== originalAttack) {
            return `${attack}<span style="color: #2ed573; font-size: 10px;">(↓${originalAttack - attack})</span>`;
        }
        return attack;
    },

    // 🔧 获取敌人有效防御力（考虑 debuff）
    getEnemyEffectiveDefense: function () {
        let defense = this.currentEnemy?.defense || 0;
        const originalDefense = defense;

        // 应用防御力 debuff
        (this.enemyDebuffs || []).forEach(d => {
            if (d.debuffType === 'defense') {
                defense = Math.max(0, defense - d.value);
            }
        });

        // 如果有变化，显示带减益的格式
        if (defense !== originalDefense) {
            return `${defense}<span style="color: #2ed573; font-size: 10px;">(↓${originalDefense - defense})</span>`;
        }
        return defense;
    },

    // 🔧 获取敌人 debuff 显示（战斗属性面板内）
    getEnemyDebuffDisplay: function () {
        if (!this.enemyDebuffs || this.enemyDebuffs.length === 0) return '';

        const debuffIcons = {
            'attack': '⚔️↓',
            'defense': '🛡️↓',
            'dot': '🩸',
            'accuracy': '👁️↓',
            'skip': '😱'
        };

        let html = '<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">';
        html += '<div style="color: #ff4757; font-size: 10px; margin-bottom: 4px;">💀 负面效果</div>';
        this.enemyDebuffs.forEach(d => {
            const icon = debuffIcons[d.debuffType] || '❌';
            // 🔧 修复：DOT类型显示dotDamage，其他类型显示value
            const displayValue = d.debuffType === 'dot' ? (d.dotDamage || d.value || 0) : (d.value || 0);
            html += `<div style="color: #ffa502; font-size: 10px;" title="${d.description}">• ${icon} ${d.name} -${displayValue} (${d.remainingTurns}回合)</div>`;
        });
        html += '</div>';
        return html;
    },

    // ==================== 🆕 卡牌词缀系统 ====================

    // 应用词缀效果
    applyCardAffix: function (card, damageDealt = 0) {
        if (!card.affix) return;

        const affix = card.affix;
        const effect = affix.effect;

        switch (effect.type) {
            case 'dot': // 持续伤害
                this.enemyDebuffs.push({
                    name: affix.name,
                    debuffType: 'dot',
                    value: effect.damage,
                    dotDamage: effect.damage,
                    remainingTurns: effect.duration,
                    description: affix.description
                });
                this.addLog(`[词缀] ${affix.icon} ${affix.name}触发，造成${effect.damage}点持续伤害/${effect.duration}回合`);
                break;

            case 'freeze': // 冻结
                if (Math.random() < effect.chance) {
                    this.enemyDebuffs.push({
                        name: '冻结',
                        debuffType: 'freeze',
                        value: 1,
                        remainingTurns: effect.duration || 1,
                        description: '无法行动'
                    });
                    this.addLog(`[词缀] ${affix.icon} 冰冻触发！敌人被冻结${effect.duration}回合！`);
                }
                break;

            case 'lifesteal': // 吸血
                if (damageDealt > 0) {
                    const heal = Math.floor(damageDealt * effect.percent);
                    if (heal > 0) {
                        PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + heal);
                        this.addLog(`[词缀] ${affix.icon} 吸血${heal}HP`);
                        this.showHealEffect(heal, true);
                    }
                }
                break;

            case 'draw': // 抽牌
                this.drawCards(effect.count);
                this.addLog(`[词缀] ${affix.icon} 迅捷触发，抽${effect.count}张牌`);
                break;

            case 'armor': // 护甲
                this.playerArmor += effect.value;
                this.addLog(`[词缀] ${affix.icon} 坚固触发，护甲+${effect.value}`);
                break;

            case 'heal': // 治疗
                PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + effect.value);
                this.addLog(`[词缀] ${affix.icon} 祝福触发，恢复${effect.value}HP`);
                this.showHealEffect(effect.value, true);
                break;

            case 'empower': // 强化（增加效果但增加堕落）
                PlayerState.corruption += effect.corruption;
                PlayerState.save();
                PlayerState.updateDisplay();
                this.addLog(`[词缀] ${affix.icon} 诅咒触发，效果+50%，堕落+${effect.corruption}`);
                break;

            case 'echo': // 回响
                if (Math.random() < effect.chance) {
                    this.addLog(`[词缀] ${affix.icon} 回响触发！效果再次发动！`);
                    // 创建卡牌副本并移除词缀，防止无限循环
                    const cardCopy = { ...card, affix: null };
                    this.executeCard(cardCopy);
                }
                break;

            case 'random': // 混沌
                const otherAffixes = Object.values(CardAffixConfig).filter(a => a.id !== 'chaos');
                if (otherAffixes.length > 0) {
                    const randomAffix = otherAffixes[Math.floor(Math.random() * otherAffixes.length)];
                    this.addLog(`[词缀] 🌀 混沌触发 ${randomAffix.icon}${randomAffix.name}效果！`);
                    // 使用随机词缀效果
                    const tempCard = { affix: randomAffix };
                    this.applyCardAffix(tempCard, damageDealt);
                }
                break;
        }
    },

    // 为随机卡牌添加词缀（战斗奖励时调用）
    addRandomAffixToCard: function (card) {
        console.log('[词缀] addRandomAffixToCard被调用, 卡牌:', card?.name);

        // 已有词缀的卡牌不再添加
        if (card.affix) {
            console.log('[词缀] 卡牌已有词缀，跳过');
            return card;
        }

        // 诅咒卡不能获得词缀
        if (card.type === CardType.CURSE) {
            console.log('[词缀] 诅咒卡不能获得词缀');
            return card;
        }

        // 按稀有度权重选择词缀
        const affix = this.rollRandomAffix();
        console.log('[词缀] rollRandomAffix返回:', affix);

        if (affix) {
            card.affix = affix;
            // 在名称前添加词缀图标
            card.originalName = card.name;
            card.name = `${affix.icon}${card.name}`;
            console.log('[词缀] 成功添加词缀! 新名称:', card.name);
        } else {
            console.warn('[词缀] rollRandomAffix返回null!');
        }
        return card;
    },

    // 按权重随机词缀
    rollRandomAffix: function () {
        const affixes = Object.values(CardAffixConfig);
        const totalWeight = Object.values(AffixRarityWeights).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        // 先确定稀有度
        let selectedRarity = 'common';
        for (const [rarity, weight] of Object.entries(AffixRarityWeights)) {
            random -= weight;
            if (random <= 0) {
                selectedRarity = rarity;
                break;
            }
        }

        // 从该稀有度中随机选一个
        const rarityAffixes = affixes.filter(a => a.rarity === selectedRarity);
        if (rarityAffixes.length === 0) return null;

        return rarityAffixes[Math.floor(Math.random() * rarityAffixes.length)];
    },

    // 获取词缀显示文本
    getAffixDisplayText: function (affix) {
        if (!affix) return '';
        const rarityColors = {
            common: '#aaa',
            rare: '#4a9eff',
            epic: '#a855f7',
            legendary: '#fbbf24'
        };
        const color = rarityColors[affix.rarity] || '#aaa';
        return `<span style="color: ${color}; font-size: 9px;">${affix.icon} ${affix.name}</span>`;
    }
};

// ==================== 商店系统 ====================
const ShopSystem = {
    currentCards: [],
    currentRelics: [],
    purchasedItems: [], // 🔧 记录本次购买的物品

    // 打开商店
    openShop: function () {
        // 随机生成商品（只卖圣遗物，不卖卡牌）
        this.currentCards = [];
        this.currentRelics = this.generateShopRelics(5);
        this.purchasedItems = []; // 🔧 清空购买记录

        const modal = document.createElement('div');
        modal.id = 'shopModal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
            align-items: center; justify-content: flex-start; z-index: 10000;
            padding: 30px; box-sizing: border-box; overflow-y: auto;
        `;

        modal.innerHTML = this.generateShopHTML();
        document.body.appendChild(modal);
    },

    // 生成商店卡牌（根据职业和堕落值过滤）
    generateShopCards: function (count) {
        const cards = [];
        const playerCorruption = PlayerState.corruption || 0;
        const playerProfession = PlayerState.profession?.id;

        // 过滤可用卡牌
        const available = CardLibrary.filter(card => {
            // 检查职业限制
            if (card.professionRequired && card.professionRequired !== playerProfession) {
                return false;
            }
            // 检查堕落值解锁条件（H技能卡）
            if (card.corruptionRequired !== undefined && card.corruptionRequired > playerCorruption) {
                return false;
            }
            return true;
        });

        // 如果是修女职业，额外添加修女专属卡到池子
        if (playerProfession === 'nun') {
            const prof = ProfessionConfig.nun;
            if (prof.professionCardPool) {
                prof.professionCardPool.forEach(cardId => {
                    const card = CardLibrary.find(c => c.id === cardId);
                    if (card && !available.find(c => c.id === cardId)) {
                        available.push(card);
                    }
                });
            }
        }

        // 随机选择卡牌
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        for (let i = 0; i < count && shuffled.length > 0; i++) {
            const card = { ...shuffled.splice(0, 1)[0] };
            card.shopPrice = (card.cost || 1) * 30 + Math.floor(Math.random() * 20);
            cards.push(card);
        }
        return cards;
    },

    // 生成商店圣遗物
    generateShopRelics: function (count) {
        const relics = [];
        const available = Object.values(RelicConfig).filter(r => !PlayerState.relics.includes(r.id));
        for (let i = 0; i < count && available.length > 0; i++) {
            const index = Math.floor(Math.random() * available.length);
            relics.push(available.splice(index, 1)[0]);
        }
        return relics;
    },

    // 生成商店HTML
    generateShopHTML: function () {
        let cardsHtml = '';
        this.currentCards.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            const canBuy = PlayerState.gold >= card.shopPrice;
            cardsHtml += `
                <div style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                           border: 2px solid ${canBuy ? typeColor : '#333'}; border-radius: 8px;
                           padding: 15px; width: 120px; text-align: center; opacity: ${canBuy ? 1 : 0.5};">
                    <div style="color: #ffd700; font-size: 11px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 20px; font-weight: bold; margin-bottom: 8px;">${card.value}</div>
                    <div style="color: #888; font-size: 11px; margin-bottom: 10px;">${card.description.substring(0, 25)}...</div>
                    <button onclick="ShopSystem.buyCard(${index})" ${!canBuy ? 'disabled' : ''}
                            style="padding: 6px 15px; background: ${canBuy ? '#ffd700' : '#333'}; color: ${canBuy ? '#000' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canBuy ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        💰 ${card.shopPrice}
                    </button>
                </div>
            `;
        });

        let relicsHtml = '';
        this.currentRelics.forEach((relic, index) => {
            const canBuy = PlayerState.gold >= relic.price;
            relicsHtml += `
                <div style="background: linear-gradient(135deg, rgba(50,30,50,0.95) 0%, rgba(35,20,35,0.98) 100%);
                           border: 2px solid ${canBuy ? '#ffd700' : '#333'}; border-radius: 8px;
                           padding: 15px; width: 140px; text-align: center; opacity: ${canBuy ? 1 : 0.5};">
                    <div style="font-size: 36px; margin-bottom: 10px;">${relic.icon}</div>
                    <div style="color: #ffd700; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${relic.name}</div>
                    <div style="color: #aaa; font-size: 11px; margin-bottom: 10px;">${relic.desc}</div>
                    <button onclick="ShopSystem.buyRelic(${index})" ${!canBuy ? 'disabled' : ''}
                            style="padding: 6px 15px; background: ${canBuy ? '#ffd700' : '#333'}; color: ${canBuy ? '#000' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canBuy ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        💰 ${relic.price}
                    </button>
                </div>
            `;
        });

        return `
            <div style="color: #2ed573; font-size: 28px; font-weight: bold; margin-bottom: 10px;">🏪 商店</div>
            <div style="color: #ffd700; font-size: 16px; margin-bottom: 30px;">💰 金币: ${PlayerState.gold}</div>
            
            <div style="color: #fff; font-size: 18px; margin-bottom: 15px;">🏆 圣遗物</div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; margin-bottom: 30px; max-width: 800px;">
                ${relicsHtml || '<div style="color: #666;">没有圣遗物出售</div>'}
            </div>
            
            <button onclick="ShopSystem.closeShop()"
                    style="padding: 12px 40px; background: linear-gradient(135deg, #667eea, #764ba2);
                           color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                离开商店
            </button>
        `;
    },

    // 购买卡牌
    buyCard: function (index) {
        const card = this.currentCards[index];
        if (!card || PlayerState.gold < card.shopPrice) return;

        PlayerState.gold -= card.shopPrice;
        CardDeckManager.deck.push({ ...card });
        this.currentCards.splice(index, 1);
        this.purchasedItems.push(card.name); // 🔧 记录购买

        saveCardDeck();
        PlayerState.save();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        this.refreshShopUI();
    },

    // 购买圣遗物
    buyRelic: function (index) {
        const relic = this.currentRelics[index];
        if (!relic || PlayerState.gold < relic.price) return;

        PlayerState.gold -= relic.price;
        PlayerState.relics.push(relic.id);
        this.purchasedItems.push(relic.name); // 🔧 记录购买

        // 应用效果
        if (relic.effect.maxHp) PlayerState.maxHp += relic.effect.maxHp;
        if (relic.effect.attack) PlayerState.attack += relic.effect.attack;
        if (relic.effect.defense) PlayerState.defense += relic.effect.defense;
        if (relic.effect.baseArmor) PlayerState.baseArmor += relic.effect.baseArmor;
        if (relic.effect.energy) PlayerState.energy += relic.effect.energy;
        if (relic.effect.corruption) PlayerState.corruption += relic.effect.corruption;

        this.currentRelics.splice(index, 1);

        PlayerState.save();
        PlayerState.updateDisplay();

        this.refreshShopUI();
    },

    // 刷新商店UI
    refreshShopUI: function () {
        const modal = document.getElementById('shopModal');
        if (modal) modal.innerHTML = this.generateShopHTML();
    },

    // 关闭商店
    closeShop: function () {
        // 🔧 如果有购买物品，显示两个按钮
        if (this.purchasedItems.length > 0) {
            const modal = document.getElementById('shopModal');
            if (modal) {
                const itemsText = this.purchasedItems.join('、');
                modal.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                        <div style="font-size: 72px; margin-bottom: 20px;">🛒</div>
                        <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">购物完成!</div>
                        <div style="color: #ffd700; font-size: 14px; margin-bottom: 20px;">购买了: ${itemsText}</div>
                        <div style="display: flex; gap: 15px; margin-top: 20px;">
                            <button onclick="ShopSystem.skipShopStory()"
                                    style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                           color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                                跳过剧情
                            </button>
                            <button onclick="ShopSystem.generateShopStory()"
                                    style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                           color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                                生成剧情
                            </button>
                        </div>
                    </div>
                `;
                return;
            }
        }
        document.getElementById('shopModal')?.remove();
        RouteSystem.showRouteSelection();
    },

    // 🔧 跳过商店剧情
    skipShopStory: function () {
        const itemsText = this.purchasedItems.join('、');
        const historyText = `在尖塔商店购买了${itemsText}`;
        ACJTGame.recordToHistory(historyText);
        document.getElementById('shopModal')?.remove();
        RouteSystem.showRouteSelection();
    },

    // 🔧 生成商店剧情
    generateShopStory: function () {
        const itemsText = this.purchasedItems.join('、');
        const floor = PlayerState.floor || 1;
        const prompt = `简单跳过之前的场景，生成新剧情：【尖塔第${floor}层】我在神秘商店购买了${itemsText}`;
        // 🔧 生成剧情时不记录到重要历史和矩阵
        document.getElementById('shopModal')?.remove();
        ACJTGame.sendToAI(prompt);
    }
};

// ==================== 温泉/休息系统 ====================
const RestSystem = {
    // 打开温泉
    openRest: function () {
        // 检查是否已有modal，有则更新内容，无则创建新的
        let modal = document.getElementById('restModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'restModal';
            modal.style.cssText = `
                position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
                align-items: center; justify-content: center; z-index: 10000;
            `;
            document.body.appendChild(modal);
        }

        // 检查是否有诅咒卡牌可删除
        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        const hasCurseCards = curseCards.length > 0;
        const canAfford = PlayerState.gold >= 50;
        const canPurify = hasCurseCards && canAfford;

        modal.innerHTML = `
            <div style="font-size: 72px; margin-bottom: 20px;">♨️</div>
            <div style="color: #70a1ff; font-size: 28px; font-weight: bold; margin-bottom: 10px;">温泉</div>
            <div style="color: #888; font-size: 14px; margin-bottom: 40px;">选择你想做的事情</div>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                <div class="route-card" onclick="RestSystem.rest()">
                    <div class="route-icon">😴</div>
                    <div class="route-name">休息</div>
                    <div class="route-desc">恢复 30% 最大HP</div>
                </div>
                
                <div class="route-card" onclick="RestSystem.showUpgradeCards()">
                    <div class="route-icon">⬆️</div>
                    <div class="route-name">升级卡牌</div>
                    <div class="route-desc">强化一张卡牌</div>
                </div>
                
                <div class="route-card" onclick="${canPurify ? 'RestSystem.showPurifyCards()' : ''}" 
                     style="${canPurify ? '' : 'opacity: 0.5; cursor: not-allowed;'}">
                    <div class="route-icon">🧹</div>
                    <div class="route-name">净化 (50💰)</div>
                    <div class="route-desc">${!hasCurseCards ? '无诅咒卡牌' : (!canAfford ? '金币不足' : '删除一张诅咒卡')}</div>
                </div>
            </div>
            
            <button onclick="RestSystem.closeRest()" 
                    style="margin-top: 30px; padding: 10px 40px; background: #333; color: #888; border: 1px solid #444; border-radius: 6px; cursor: pointer; font-size: 14px;">
                关闭
            </button>
        `;
    },

    // 显示净化诅咒卡牌界面
    showPurifyCards: function () {
        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        if (curseCards.length === 0 || PlayerState.gold < 50) return;

        let cardsHtml = '';
        curseCards.forEach((card, idx) => {
            // 找到在deck中的实际索引
            const deckIndex = CardDeckManager.deck.findIndex(c => c.id === card.id && c.type === CardType.CURSE);
            cardsHtml += `
                <div onclick="RestSystem.purifyCard(${deckIndex})" 
                     style="background: linear-gradient(135deg, rgba(139,0,0,0.2) 0%, rgba(100,0,0,0.3) 100%);
                            border: 2px solid #8b0000; border-radius: 8px; padding: 15px; width: 140px;
                            text-align: center; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.transform='translateY(-5px)';this.style.boxShadow='0 5px 20px rgba(139,0,0,0.3)'" 
                     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'">
                    <div style="font-size: 32px; margin-bottom: 8px;">${card.icon || '💀'}</div>
                    <div style="color: #ff6b81; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: #888; font-size: 10px;">${card.description || ''}</div>
                </div>
            `;
        });

        document.getElementById('restModal').innerHTML = `
            <div style="color: #ff6b81; font-size: 24px; font-weight: bold; margin-bottom: 10px;">🧹 净化仪式</div>
            <div style="color: #ffd700; font-size: 14px; margin-bottom: 10px;">💰 花费50金币删除一张诅咒卡牌</div>
            <div style="color: #888; font-size: 12px; margin-bottom: 30px;">当前金币: ${PlayerState.gold}</div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; max-width: 600px; margin-bottom: 30px;">
                ${cardsHtml}
            </div>
            <button onclick="RestSystem.openRest()"
                    style="padding: 10px 30px; background: #333; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                返回
            </button>
        `;
    },

    // 净化（删除）诅咒卡牌
    purifyCard: function (deckIndex) {
        if (PlayerState.gold < 50) return;

        const card = CardDeckManager.deck[deckIndex];
        if (!card || card.type !== CardType.CURSE) return;

        // 扣除金币
        PlayerState.gold -= 50;
        PlayerState.save();

        // 移除卡牌
        CardDeckManager.deck.splice(deckIndex, 1);
        saveCardDeck();

        // 🔧 检查卡组中是否还有相同的诅咒卡
        const hasSameCurse = CardDeckManager.deck.some(c => c.statusId === card.statusId && c.type === CardType.CURSE);

        // 🔧 只有当卡组中没有相同诅咒卡时，才移除特殊状态
        if (card.statusId && !hasSameCurse) {
            const status = SpecialStatusManager.statuses[card.statusId];
            if (status && status.source === 'curse') {
                SpecialStatusManager.remove(card.statusId);
                console.log('[温泉净化] 清除特殊状态:', card.statusId);
            }
        } else if (hasSameCurse) {
            console.log('[温泉净化] 卡组中还有相同诅咒卡，保留特殊状态:', card.statusId);
        }

        // 保存净化信息
        this.lastPurifyCard = card;

        // 记录到重要历史
        const historyText = `在温泉中净化了诅咒卡【${card.name}】`;
        ACJTGame.recordToHistory(historyText);

        // 🔧 显示跳过/生成剧情选项
        document.getElementById('restModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">✨</div>
                <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">净化成功!</div>
                <div style="color: #fff; font-size: 16px; margin-bottom: 10px;">${card.icon || '💀'} ${card.name} 已被清除</div>
                <div style="color: #ffd700; font-size: 14px; margin-bottom: 20px;">-50💰 剩余: ${PlayerState.gold}金币</div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="RestSystem.skipPurifyStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="RestSystem.generatePurifyStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 跳过净化剧情
    skipPurifyStory: function () {
        const card = this.lastPurifyCard;
        this.closeRest();
        // 🔧 刷新所有显示
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        if (typeof showNotification === 'function') {
            showNotification(`✨ 净化了诅咒【${card?.name || '未知'}】`, 'success');
        }
    },

    // 生成净化剧情
    generatePurifyStory: function () {
        const card = this.lastPurifyCard;
        const statusConfig = card?.statusId ? SpecialStatusConfig[card.statusId] : null;
        const fullDesc = statusConfig?.fullDesc || card?.description || '';
        this.closeRest();
        // 🔧 刷新所有显示
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        const prompt = `简单跳过之前的场景，开始新剧情：【温泉净化】我在温泉中进行了净化仪式，花费50金币清除了身上的诅咒【${card?.name || '未知'}】。该诅咒的效果是：${fullDesc}。请生成一段净化过程的剧情，描写诅咒被清除时的感觉。`;
        ACJTGame.sendToAI(prompt);
    },

    // 休息恢复
    rest: function () {
        // 应用特殊状态的休息效果（如淫纹增加堕落值）
        SpecialStatusManager.onRest();

        const healAmount = Math.floor(PlayerState.maxHp * 0.3);
        PlayerState.hp = Math.min(PlayerState.maxHp, PlayerState.hp + healAmount);
        PlayerState.save();
        PlayerState.updateDisplay();

        // 检查是否有堕落值增加
        let extraInfo = '';
        const corruptionStatuses = SpecialStatusManager.getActive().filter(s => s.effect === 'corruptionPerRest');
        if (corruptionStatuses.length > 0) {
            const totalCorruption = corruptionStatuses.reduce((sum, s) => sum + s.value, 0);
            extraInfo = `<div style="color: #9c88ff; font-size: 12px; margin-top: 10px;">⚠️ 特殊状态影响：堕落值 +${totalCorruption}</div>`;
        }

        // 🔧 保存休息结果
        this.lastRestResult = { healAmount };

        document.getElementById('restModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">💚</div>
                <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">恢复了 ${healAmount} 点生命值</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 10px;">当前生命: ${PlayerState.hp}/${PlayerState.maxHp}</div>
                ${extraInfo}
                <div style="display: flex; gap: 15px; margin-top: 20px;">
                    <button onclick="RestSystem.skipRestStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="RestSystem.generateRestStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 🔧 跳过温泉剧情
    skipRestStory: function () {
        const result = this.lastRestResult;
        const historyText = `在温泉中休息，恢复了${result.healAmount}点生命值`;
        ACJTGame.recordToHistory(historyText);
        this.closeRest();
    },

    // 🔧 生成温泉剧情
    generateRestStory: function () {
        const result = this.lastRestResult;
        const floor = PlayerState.floor || 1;
        const prompt = `简单跳过之前的场景，生成新剧情：【尖塔第${floor}层】我在温泉中泡澡休息，恢复了${result.healAmount}点体力，感觉神清气爽`;
        // 🔧 生成剧情时不记录到重要历史和矩阵
        this.closeRest();
        ACJTGame.sendToAI(prompt);
    },

    // 显示升级卡牌
    showUpgradeCards: function () {
        let cardsHtml = '';
        CardDeckManager.deck.forEach((card, index) => {
            if (card.upgraded) return; // 已升级的跳过
            const typeColor = CardTypeColors[card.type] || '#666';
            cardsHtml += `
                <div onclick="RestSystem.upgradeCard(${index})" 
                     style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                            border: 2px solid ${typeColor}; border-radius: 8px; padding: 12px; width: 100px;
                            text-align: center; cursor: pointer; transition: all 0.2s;"
                     onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    <div style="color: #ffd700; font-size: 10px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 12px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 16px; font-weight: bold;">${card.value} → ${card.value + 3}</div>
                </div>
            `;
        });

        document.getElementById('restModal').innerHTML = `
            <div style="color: #ffa502; font-size: 24px; font-weight: bold; margin-bottom: 20px;">选择要升级的卡牌</div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; max-width: 500px; margin-bottom: 30px;">
                ${cardsHtml || '<div style="color: #666;">没有可升级的卡牌</div>'}
            </div>
            <button onclick="RestSystem.closeRest()"
                    style="padding: 10px 30px; background: #333; color: #fff; border: none; border-radius: 6px; cursor: pointer;">
                取消
            </button>
        `;
    },

    // 升级卡牌
    upgradeCard: function (index) {
        const card = CardDeckManager.deck[index];
        if (!card || card.upgraded) return;

        // 根据卡牌类型进行不同的升级
        let upgradeMsg = '';
        if (card.type === CardType.BUFF) {
            // BUFF类型：抽牌类增加抽牌数，能量类增加能量数
            if (card.drawCards) {
                card.drawCards += 1;
                upgradeMsg = `抽牌数提升至 ${card.drawCards}张`;
            } else if (card.gainEnergy) {
                card.gainEnergy += 1;
                upgradeMsg = `能量获取提升至 +${card.gainEnergy}`;
            } else if (card.value) {
                card.value += 3;
                upgradeMsg = `数值提升至 ${card.value}`;
            } else {
                upgradeMsg = `效果增强`;
            }
        } else if (card.value !== undefined) {
            // 其他有value字段的卡牌：增加3点数值
            card.value += 3;
            upgradeMsg = `数值提升至 ${card.value}`;
        } else {
            upgradeMsg = `效果增强`;
        }

        card.upgraded = true;
        card.name = card.name + '+';

        saveCardDeck();
        CardDeckManager.renderDeck();

        document.getElementById('restModal').innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div style="font-size: 72px; margin-bottom: 20px;">⬆️</div>
                <div style="color: #ffa502; font-size: 24px; font-weight: bold; margin-bottom: 15px;">升级成功!</div>
                <div style="color: #fff; font-size: 16px; margin-bottom: 30px;">${card.name} ${upgradeMsg}</div>
                <button onclick="RestSystem.closeRest()"
                        style="padding: 12px 40px; background: linear-gradient(135deg, #667eea, #764ba2);
                               color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                    继续前进
                </button>
            </div>
        `;
    },

    // 关闭温泉
    closeRest: function () {
        document.getElementById('restModal')?.remove();
        RouteSystem.showRouteSelection();
    }
};

// ==================== 城镇系统（旅馆/妓院） ====================
const TownSystem = {
    // 打开旅馆
    openHotel: function () {
        if (PlayerState.floor > 1) {
            alert('只有在城镇（第0-1层）才能使用旅馆！');
            return;
        }
        if (PlayerState.gold < 25) {
            alert('金币不足！需要25金币。');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'hotelModal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #2d3436, #636e72); border-radius: 16px; padding: 30px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">🏨</div>
                <div style="color: #fff; font-size: 24px; font-weight: bold; margin-bottom: 10px;">旅馆休息</div>
                <div style="color: #ffd700; font-size: 16px; margin-bottom: 20px;">支付 25 金币，完全恢复体力</div>
                <div style="color: #888; font-size: 14px; margin-bottom: 25px;">
                    当前HP: ${PlayerState.hp}/${PlayerState.maxHp}<br>
                    当前金币: ${PlayerState.gold}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.confirmHotel()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #2ed573, #26de81);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        确认入住
                    </button>
                    <button onclick="TownSystem.closeModal('hotelModal')"
                            style="padding: 12px 30px; background: #555; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        取消
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 确认入住旅馆
    confirmHotel: function () {
        PlayerState.gold -= 25;
        const healedAmount = PlayerState.maxHp - PlayerState.hp;
        PlayerState.hp = PlayerState.maxHp;
        PlayerState.save();
        PlayerState.updateDisplay();

        document.getElementById('hotelModal').innerHTML = `
            <div style="background: linear-gradient(135deg, #2d3436, #636e72); border-radius: 16px; padding: 30px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">😴</div>
                <div style="color: #2ed573; font-size: 24px; font-weight: bold; margin-bottom: 15px;">休息完毕!</div>
                <div style="color: #fff; font-size: 16px; margin-bottom: 25px;">
                    恢复了 ${healedAmount} 点体力<br>
                    当前HP: ${PlayerState.hp}/${PlayerState.maxHp}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipHotelStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="TownSystem.generateHotelStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 跳过旅馆剧情
    skipHotelStory: function () {
        ACJTGame.recordToHistory('在旅馆休息了一晚，恢复了全部体力');
        this.closeModal('hotelModal');
    },

    // 生成旅馆剧情
    generateHotelStory: function () {
        this.closeModal('hotelModal');
        const prompt = `简单跳过当前场景，开始新剧情：【尖塔城镇】我在旅馆休息了一晚，恢复了全部体力。请生成一段旅馆休息的剧情，可以描写旅馆的环境、休息的过程，或者发生的小插曲。`;
        // 🔧 生成剧情时不记录到重要历史和矩阵
        ACJTGame.sendToAI(prompt);
    },

    // 妓院配置数据
    brothelConfig: {
        genders: ['男', '女', '扶她'],
        races: [
            // 人类系
            '人类', '混血人类', '贵族人类', '平民人类', '流浪人类',
            // 精灵系
            '精灵', '暗精灵', '高等精灵', '木精灵', '血精灵', '月精灵', '星精灵',
            // 兽人系
            '兽人', '猪人', '牛头人', '狗头人', '狼人', '虎人', '狮人', '豹人', '熊人', '狐人',
            // 爬行系
            '蜥蜴人', '龙人', '蛇人', '鳄鱼人', '变色龙人',
            // 水生系
            '鱼人', '鲨鱼人', '章鱼人', '海妖', '人鱼',
            // 魔物系
            '哥布林', '半身人', '矮人', '巨魔', '食人魔', '地精',
            // 恶魔系
            '魅魔', '梦魔', '恶魔', '堕天使', '地狱犬人',
            // 不死系
            '吸血鬼', '幽灵', '骷髅人', '僵尸',
            // 其他
            '史莱姆人', '元素人', '机械人', '半机械人', '触手怪', '昆虫人', '蜘蛛人', '蝎人'
        ],
        fetishes: [
            // 基础性爱
            '舔小穴', '足交', '肛交', '插入小穴', '口交', '乳交', '手交', '腋交', '股交', '腹交',
            '深喉', '颜射', '内射', '舔脚', '舔肛', '舔腋下', '舔乳头', '吸吮乳头', '咬乳头',

            // 体位
            '69式', '骑乘位', '后入式', '传教士', '侧位', '站立位', '倒立位', '压迫位', '背德位',

            // BDSM
            '束缚play', '滴蜡', '鞭打', '窒息play', '绳缚', '手铐', '脚镣', '口球', '眼罩', '项圈',
            '调教', '羞辱', '惩罚', '奴隶play', '主仆play', '宠物play', '踩踏', '践踏', '窒息',

            // 角色扮演
            '角色扮演', '制服诱惑', '护士装', '女仆装', '学生装', '教师装', '警察装', '囚犯装',
            '修女装', '和服', '旗袍', '兔女郎', '猫女装', '狗女装',

            // 特殊play
            '多人运动', '3P', '4P', '群交', '轮奸', '观看自慰', '被观看', '偷窥', '露出',
            '野外play', '公共场所', '车震', '浴室play', '厨房play',

            // 体液
            '吞精', '饮尿', '潮吹', '喷奶', '流口水', '吐舌', '舔汗',

            // 强度
            '连续高潮', '强制高潮', '高潮忍耐', '粗暴对待', '温柔爱抚', '缓慢折磨', '快速抽插',
            '深度插入', '浅层摩擦', '边缘控制',

            // 特殊癖好
            '恋足', '恋乳', '恋臀', '恋腋', '恋发', '恋袜', '恋鞋', '恋内衣',
            '闻体味', '舔体味', '汗臭', '脚臭', '腋臭',

            // 道具
            '震动棒', '跳蛋', '假阳具', '肛塞', '乳夹', '阴夹', '扩张器', '贞操带',

            // 极端
            '窒息', '电击', '针刺', '灌肠', '扩张', '拳交', '双穴', '三穴齐开',
            '兽交幻想', '触手play', '产卵play', '膨腹', '催眠', '药物',

            // 心理
            '羞耻play', '言语羞辱', '强制表演', '拍照', '录像', '直播', '展示',
            '服从训练', '破处', '夺取初吻', '禁欲后释放'
        ]
    },

    // 生成随机客人
    generateRandomClient: function () {
        const config = this.brothelConfig;
        const gender = config.genders[Math.floor(Math.random() * config.genders.length)];
        const race = config.races[Math.floor(Math.random() * config.races.length)];

        // 随机选择3个不重复的性癖
        const shuffled = [...config.fetishes].sort(() => 0.5 - Math.random());
        const selectedFetishes = shuffled.slice(0, 3);

        // 随机出价 50-500
        const price = Math.floor(Math.random() * 451) + 50;

        return {
            gender,
            race,
            fetishes: selectedFetishes,
            price
        };
    },

    // 打开妓院
    openBrothel: function () {
        if (PlayerState.floor > 1) {
            alert('只有在城镇（第0-1层）才能使用妓院！');
            return;
        }

        // 生成3个随机客人
        const clients = [
            this.generateRandomClient(),
            this.generateRandomClient(),
            this.generateRandomClient()
        ];

        // 保存客人信息
        this.currentClients = clients;

        const modal = document.createElement('div');
        modal.id = 'brothelModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex; flex-direction: column;
            align-items: center; justify-content: center; z-index: 10000;
            overflow-y: auto; padding: 20px; box-sizing: border-box;
            backdrop-filter: blur(5px);
        `;

        const cardsHTML = clients.map((client, index) => `
            <div style="background: linear-gradient(135deg, rgba(80, 40, 60, 0.95), rgba(100, 50, 70, 0.95)); 
                        border-radius: 16px; padding: 20px; 
                        border: 3px solid rgba(255, 215, 0, 0.6);
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1);
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;"
                 onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 12px 40px rgba(255, 215, 0, 0.4), inset 0 0 30px rgba(255, 215, 0, 0.2)'; this.style.borderColor='rgba(255, 215, 0, 0.9)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.1)'; this.style.borderColor='rgba(255, 215, 0, 0.6)'">
                
                <!-- 装饰性光晕 -->
                <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; 
                            background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
                            pointer-events: none;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="color: #ffd700; font-size: 18px; font-weight: bold; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);">客人 ${index + 1}</div>
                        <div style="color: #ffd700; font-size: 20px; font-weight: bold; 
                                    background: rgba(0, 0, 0, 0.4); padding: 4px 12px; border-radius: 20px;
                                    border: 2px solid rgba(255, 215, 0, 0.5);
                                    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);">💰 ${client.price}</div>
                    </div>
                    
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 8px; margin-bottom: 10px;
                                border: 1px solid rgba(255, 215, 0, 0.2);">
                        <div style="color: #fff; margin-bottom: 6px; font-size: 14px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);">
                            <span style="color: #ffd700; font-weight: bold;">性别：</span><span style="color: #ffe4b5;">${client.gender}</span>
                            <span style="color: #ffd700; font-weight: bold; margin-left: 15px;">种族：</span><span style="color: #ffe4b5;">${client.race}</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <div style="color: #ffd700; margin-bottom: 8px; font-size: 14px; font-weight: bold; text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);">性癖偏好：</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${client.fetishes.map(f => `
                                <span style="background: linear-gradient(135deg, rgba(255, 107, 157, 0.4), rgba(255, 71, 87, 0.4)); 
                                             padding: 6px 12px; border-radius: 20px; font-size: 12px;
                                             color: #fff; font-weight: bold;
                                             border: 1px solid rgba(255, 107, 157, 0.6);
                                             box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
                                             text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);">${f}</span>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button onclick="TownSystem.selectClient(${index})"
                            style="width: 100%; padding: 12px; 
                                   background: linear-gradient(135deg, #ff4757, #ff6b81);
                                   color: #fff; border: none; border-radius: 12px; cursor: pointer; 
                                   font-size: 15px; font-weight: bold;
                                   box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);
                                   border: 2px solid rgba(255, 255, 255, 0.3);
                                   text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                                   transition: all 0.3s ease;"
                            onmouseover="this.style.background='linear-gradient(135deg, #ff6b81, #ff4757)'; this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(255, 71, 87, 0.6)'"
                            onmouseout="this.style.background='linear-gradient(135deg, #ff4757, #ff6b81)'; this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 71, 87, 0.4)'">
                        选择此客人
                    </button>
                </div>
            </div>
        `).join('');

        modal.innerHTML = `
            <div style="background: url(img/background/jy_bg.png) center center / cover no-repeat;
                        border-radius: 20px;
                        padding: 80px 40px 40px 40px;
                        max-width: 1200px;
                        width: 95%;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                        border: 3px solid rgba(255, 215, 0, 0.4);
                        position: relative;
                        overflow: hidden;">
                
                <!-- 顶部遮罩渐变 -->
                <div style="position: absolute; top: 0; left: 0; right: 0; height: 150px;
                            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
                            pointer-events: none; z-index: 0;"></div>
                
                <!-- 底部遮罩渐变 -->
                <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 100px;
                            background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
                            pointer-events: none; z-index: 0;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="text-align: center; margin-bottom: 30px; 
                                background: rgba(0, 0, 0, 0.6); padding: 20px; border-radius: 16px;
                                border: 2px solid rgba(255, 215, 0, 0.4);
                                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
                        <div style="font-size: 72px; margin-bottom: 10px; filter: drop-shadow(0 0 20px rgba(255, 107, 157, 0.8));">🏮</div>
                        <div style="color: #ffd700; font-size: 32px; font-weight: bold; margin-bottom: 10px;
                                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.8);
                                    font-family: 'STKaiti', 'KaiTi', serif;">妓院接客</div>
                        <div style="color: #ffe4b5; font-size: 16px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);">请选择一位客人进行服务</div>
                    </div>
                    
                    <style>
                        .brothel-cards-grid {
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 20px;
                            margin-bottom: 25px;
                        }
                        @media (max-width: 900px) {
                            .brothel-cards-grid {
                                grid-template-columns: repeat(2, 1fr);
                            }
                        }
                        @media (max-width: 600px) {
                            .brothel-cards-grid {
                                grid-template-columns: 1fr;
                            }
                        }
                    </style>
                    
                    <div class="brothel-cards-grid">
                        ${cardsHTML}
                    </div>
                    
                    <button onclick="TownSystem.closeModal('brothelModal')"
                            style="width: 100%; padding: 15px; 
                                   background: rgba(0, 0, 0, 0.7); 
                                   color: #ffd700; border: 2px solid rgba(255, 215, 0, 0.5); 
                                   border-radius: 12px; cursor: pointer; font-size: 16px; font-weight: bold;
                                   text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
                                   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                                   transition: all 0.3s ease;"
                            onmouseover="this.style.background='rgba(0, 0, 0, 0.85)'; this.style.borderColor='rgba(255, 215, 0, 0.8)'; this.style.boxShadow='0 6px 20px rgba(255, 215, 0, 0.3)'"
                            onmouseout="this.style.background='rgba(0, 0, 0, 0.7)'; this.style.borderColor='rgba(255, 215, 0, 0.5)'; this.style.boxShadow='0 4px 15px rgba(0, 0, 0, 0.5)'">
                        离开妓院
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 选择客人
    selectClient: function (index) {
        const client = this.currentClients[index];
        this.selectedClient = client;

        const modal = document.getElementById('brothelModal');
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #c44569, #ff6b9d); border-radius: 16px; padding: 25px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">💰</div>
                <div style="color: #ffd700; font-size: 22px; font-weight: bold; margin-bottom: 12px;">接客完成!</div>
                <div style="color: #fff; font-size: 14px; margin-bottom: 8px;">
                    客人信息: ${client.gender} · ${client.race}
                </div>
                <div style="color: #fff; font-size: 13px; margin-bottom: 8px;">
                    性癖: ${client.fetishes.join('、')}
                </div>
                <div style="color: #fff; font-size: 15px; margin-bottom: 20px;">
                    获得 ${client.price} 金币<br>
                    堕落值 +5 | 当前金币: ${PlayerState.gold + client.price}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="TownSystem.generateBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;

        // 更新玩家状态
        PlayerState.gold += client.price;
        PlayerState.corruption += 5;
        PlayerState.save();
        PlayerState.updateDisplay();

        // 同步堕落值到变量表单
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }
    },

    // 更新卖春预览
    updateBrothelPreview: function () {
        const vaginal = parseInt(document.getElementById('brothelVaginal')?.value) || 0;
        const anal = parseInt(document.getElementById('brothelAnal')?.value) || 0;
        const breast = parseInt(document.getElementById('brothelBreast')?.value) || 0;
        const oral = parseInt(document.getElementById('brothelOral')?.value) || 0;
        const foot = parseInt(document.getElementById('brothelFoot')?.value) || 0;
        const hand = parseInt(document.getElementById('brothelHand')?.value) || 0;
        const total = vaginal + anal + breast + oral + foot + hand;
        const preview = document.getElementById('brothelPreview');
        if (preview) {
            preview.innerHTML = `总计: ${total} 次 | 预计获得: ${40 * total} 金币 | 堕落值 +${5 * total}`;
        }
    },

    // 获取卖春详情
    getBrothelDetails: function () {
        return {
            vaginal: parseInt(document.getElementById('brothelVaginal')?.value) || 0,
            anal: parseInt(document.getElementById('brothelAnal')?.value) || 0,
            breast: parseInt(document.getElementById('brothelBreast')?.value) || 0,
            oral: parseInt(document.getElementById('brothelOral')?.value) || 0,
            foot: parseInt(document.getElementById('brothelFoot')?.value) || 0,
            hand: parseInt(document.getElementById('brothelHand')?.value) || 0
        };
    },

    // 生成卖春描述文本
    getBrothelDescription: function (details) {
        const parts = [];
        if (details.vaginal > 0) parts.push(`小穴${details.vaginal}次`);
        if (details.anal > 0) parts.push(`菊穴${details.anal}次`);
        if (details.breast > 0) parts.push(`乳交${details.breast}次`);
        if (details.oral > 0) parts.push(`口交${details.oral}次`);
        if (details.foot > 0) parts.push(`足交${details.foot}次`);
        if (details.hand > 0) parts.push(`手交${details.hand}次`);
        return parts.length > 0 ? parts.join('、') : '无';
    },

    // 确认卖春
    confirmBrothel: function () {
        const details = this.getBrothelDetails();
        const times = details.vaginal + details.anal + details.breast + details.oral + details.foot + details.hand;

        if (times <= 0) {
            if (typeof showNotification === 'function') {
                showNotification('❗ 请至少选择一种服务', 'warning');
            }
            return;
        }

        const goldGain = 40 * times;
        const corruptionGain = 5 * times;

        PlayerState.gold += goldGain;
        PlayerState.corruption += corruptionGain;
        PlayerState.save();
        PlayerState.updateDisplay();

        // 同步堕落值到变量表单
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }

        // 保存详情用于后续剧情
        this.lastBrothelDetails = details;
        this.lastBrothelTimes = times;
        this.lastBrothelGold = goldGain;
        this.lastBrothelCorruption = corruptionGain;

        const descText = this.getBrothelDescription(details);

        document.getElementById('brothelModal').innerHTML = `
            <div style="background: linear-gradient(135deg, #c44569, #ff6b9d); border-radius: 16px; padding: 25px; max-width: 400px; text-align: center;">
                <div style="font-size: 64px; margin-bottom: 15px;">💰</div>
                <div style="color: #ffd700; font-size: 22px; font-weight: bold; margin-bottom: 12px;">交易完成!</div>
                <div style="color: #fff; font-size: 14px; margin-bottom: 8px;">
                    服务内容: ${descText}
                </div>
                <div style="color: #fff; font-size: 15px; margin-bottom: 20px;">
                    共计 ${times} 次 | 获得 ${goldGain} 金币<br>
                    堕落值 +${corruptionGain} | 当前金币: ${PlayerState.gold}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="TownSystem.generateBrothelStory()"
                            style="padding: 10px 25px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 跳过妓院剧情
    skipBrothelStory: function () {
        const client = this.selectedClient;
        if (!client) {
            this.closeModal('brothelModal');
            return;
        }

        const description = `接待了喜欢${client.fetishes.join('、')}的${client.race}${client.gender}，赚了${client.price}金币`;
        ACJTGame.recordToHistory(description);

        // 记录到矩阵（如果有矩阵系统）
        if (typeof window.matrixManager !== 'undefined' && window.matrixManager.addEvent) {
            window.matrixManager.addEvent({
                type: 'brothel',
                description: description,
                timestamp: Date.now()
            });
        }

        this.closeModal('brothelModal');
    },

    // 生成妓院剧情
    generateBrothelStory: function () {
        const client = this.selectedClient;
        if (!client) {
            this.closeModal('brothelModal');
            return;
        }

        this.closeModal('brothelModal');

        const prompt = `简单跳过当前场景，开始新剧情：【妓院卖春】我在妓院接待了一位客人。客人信息：性别${client.gender}、种族${client.race}、喜欢的性癖有${client.fetishes.join('、')}。我为这位客人提供了服务，获得了${client.price}金币。请生成一段详细的卖春剧情，描写服务过程中的细节、客人的反应以及主角的心理变化。堕落值增加了5点。`;

        // 生成剧情时记录到重要历史和矩阵
        ACJTGame.sendToAI(prompt);
    },

    // 关闭弹窗
    closeModal: function (modalId) {
        document.getElementById(modalId)?.remove();
    },

    // 更新按钮状态（第0层和第1层可用）
    updateButtons: function () {
        const hotelBtn = document.getElementById('hotelBtn');
        const brothelBtn = document.getElementById('brothelBtn');
        const blackMarketBtn = document.getElementById('blackMarketBtn');
        const churchBtn = document.getElementById('churchBtn');
        const isInTown = PlayerState.floor <= 1;

        if (hotelBtn) {
            hotelBtn.style.opacity = isInTown ? '1' : '0.5';
            hotelBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
        if (brothelBtn) {
            brothelBtn.style.opacity = isInTown ? '1' : '0.5';
            brothelBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
        if (blackMarketBtn) {
            blackMarketBtn.style.opacity = isInTown ? '1' : '0.5';
            blackMarketBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
        if (churchBtn) {
            churchBtn.style.opacity = isInTown ? '1' : '0.5';
            churchBtn.style.pointerEvents = isInTown ? 'auto' : 'none';
        }
    },

    // ==================== 教堂系统 ====================

    // 获取可清除的诅咒状态数量
    getCurseStatusCount: function () {
        let count = 0;
        Object.keys(SpecialStatusManager.statuses).forEach(statusId => {
            const status = SpecialStatusManager.statuses[statusId];
            const isStartingStatus = statusId.startsWith('start_');
            const isBodyMod = statusId.startsWith('mod_');
            const isProtectedSource = status.source === 'starting' || status.source === 'blackmarket';
            const isProtected = isStartingStatus || isBodyMod || isProtectedSource;
            if (!isProtected) count++;
        });
        return count;
    },

    openChurch: function () {
        if (PlayerState.floor > 1) {
            if (typeof showNotification === 'function') {
                showNotification('❗ 只能在城镇(第0-1层)访问教堂', 'warning');
            }
            return;
        }

        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        const curseStatusCount = this.getCurseStatusCount();
        // 可以洗礼的条件：有诅咒卡或有诅咒状态，且有足够金币
        const canPurify = (curseCards.length > 0 || curseStatusCount > 0) && PlayerState.gold >= 300;

        // 创建教堂弹窗
        const modal = document.createElement('div');
        modal.id = 'churchModal';
        modal.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; max-width: 500px; text-align: center;">
                <div style="font-size: 60px; margin-bottom: 15px;">⛪</div>
                <div style="color: #ffd700; font-size: 24px; font-weight: bold; margin-bottom: 10px;">教堂 - 洗礼仪式</div>
                <div style="color: #aaa; font-size: 14px; margin-bottom: 20px;">
                    花费300金币，清除所有诅咒卡牌和负面状态
                </div>
                <div style="color: #ff6b81; font-size: 16px; margin-bottom: 5px;">
                    诅咒卡牌: ${curseCards.length} 张
                </div>
                <div style="color: #ff6b81; font-size: 16px; margin-bottom: 10px;">
                    诅咒状态: ${curseStatusCount} 个
                </div>
                <div style="color: #ffd700; font-size: 14px; margin-bottom: 25px;">
                    当前金币: ${PlayerState.gold}
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.confirmChurch()" ${canPurify ? '' : 'disabled'}
                            style="padding: 12px 30px; background: ${canPurify ? 'linear-gradient(135deg, #ffd700, #ffb347)' : '#555'};
                                   color: ${canPurify ? '#000' : '#888'}; border: none; border-radius: 8px; 
                                   cursor: ${canPurify ? 'pointer' : 'not-allowed'}; font-size: 14px; font-weight: bold;">
                        洗礼仪式 (300💰)
                    </button>
                    <button onclick="TownSystem.closeModal('churchModal')"
                            style="padding: 12px 30px; background: #555; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        取消
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // 确认洗礼
    confirmChurch: function () {
        const curseCards = CardDeckManager.deck.filter(c => c.type === CardType.CURSE);
        const curseStatusCount = this.getCurseStatusCount();
        // 必须有诅咒卡或诅咒状态才能洗礼
        if ((curseCards.length === 0 && curseStatusCount === 0) || PlayerState.gold < 300) return;

        // 扣除金币
        PlayerState.gold -= 300;

        // 收集所有诅咒卡的 statusId
        const curseStatusIds = new Set();
        const removedCurses = [];
        curseCards.forEach(card => {
            removedCurses.push(card.name);
            if (card.statusId) {
                curseStatusIds.add(card.statusId);
            }
        });

        // 🔧 清除所有诅咒相关的特殊状态（更可靠的逻辑）
        const removedStatuses = [];
        Object.keys(SpecialStatusManager.statuses).forEach(statusId => {
            const status = SpecialStatusManager.statuses[statusId];

            // 保护条件：
            // 1. ID以 start_ 开头（开局选择的状态）
            // 2. ID以 mod_ 开头（黑市改造）
            // 3. source 是 'starting' 或 'blackmarket'
            const isStartingStatus = statusId.startsWith('start_');
            const isBodyMod = statusId.startsWith('mod_');
            const isProtectedSource = status.source === 'starting' || status.source === 'blackmarket';
            const isProtected = isStartingStatus || isBodyMod || isProtectedSource;

            // 清除条件（非保护状态且满足以下任一）：
            // 1. statusId 在诅咒卡列表中
            // 2. source 是 'curse'
            // 3. source 未定义（旧数据兼容，教堂洗礼清除所有非保护的旧状态）
            const isFromCurseCard = curseStatusIds.has(statusId);
            const isCurseSource = status.source === 'curse';
            const isOldData = status.source === undefined;

            if (!isProtected && (isFromCurseCard || isCurseSource || isOldData)) {
                removedStatuses.push(statusId);
            }
        });

        // 移除收集到的状态
        removedStatuses.forEach(statusId => {
            SpecialStatusManager.remove(statusId);
        });

        console.log('[教堂洗礼] 清除了诅咒卡:', removedCurses);
        console.log('[教堂洗礼] 清除了特殊状态:', removedStatuses);

        // 从卡组中移除所有诅咒卡
        CardDeckManager.deck = CardDeckManager.deck.filter(c => c.type !== CardType.CURSE);
        saveCardDeck();
        CardDeckManager.renderDeck();

        PlayerState.save();
        PlayerState.updateDisplay();

        // 保存洗礼信息
        this.lastChurchCurses = removedCurses;
        this.lastChurchStatuses = removedStatuses;

        // 记录到重要历史
        const allRemoved = [...removedCurses, ...removedStatuses.filter(s => !removedCurses.includes(s))];
        const historyText = `在教堂进行洗礼仪式，清除了${removedCurses.length}张诅咒卡和${removedStatuses.length}个诅咒状态：${allRemoved.join('、')}`;
        ACJTGame.recordToHistory(historyText);

        // 显示跳过/生成选项
        const cursesText = removedCurses.length > 0 ? removedCurses.join('、') : '无';
        const statusesText = removedStatuses.length > 0 ? removedStatuses.join('、') : '无';

        document.getElementById('churchModal').innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 30px; max-width: 500px; text-align: center;">
                <div style="font-size: 72px; margin-bottom: 20px;">✨</div>
                <div style="color: #ffd700; font-size: 24px; font-weight: bold; margin-bottom: 15px;">洗礼完成!</div>
                <div style="color: #2ed573; font-size: 16px; margin-bottom: 5px;">
                    清除诅咒卡: ${removedCurses.length} 张
                </div>
                <div style="color: #2ed573; font-size: 16px; margin-bottom: 10px;">
                    清除诅咒状态: ${removedStatuses.length} 个
                </div>
                <div style="color: #ff6b81; font-size: 11px; margin-bottom: 5px; max-height: 60px; overflow-y: auto;">
                    ${statusesText}
                </div>
                <div style="color: #ffd700; font-size: 14px; margin-bottom: 20px;">
                    -300💰 剩余: ${PlayerState.gold}金币
                </div>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button onclick="TownSystem.skipChurchStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        跳过剧情
                    </button>
                    <button onclick="TownSystem.generateChurchStory()"
                            style="padding: 12px 30px; background: linear-gradient(135deg, #ffd700, #ffb347);
                                   color: #000; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 跳过教堂剧情
    skipChurchStory: function () {
        const curseCount = this.lastChurchCurses?.length || 0;
        const statusCount = this.lastChurchStatuses?.length || 0;
        this.closeModal('churchModal');
        // 🔧 刷新所有显示
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        if (typeof showNotification === 'function') {
            showNotification(`✨ 洗礼完成，清除了${curseCount}张诅咒卡和${statusCount}个诅咒状态`, 'success');
        }
    },

    // 生成教堂剧情
    generateChurchStory: function () {
        const curses = this.lastChurchCurses || [];
        const statuses = this.lastChurchStatuses || [];
        const allRemoved = [...curses, ...statuses.filter(s => !curses.includes(s))];
        this.closeModal('churchModal');
        // 🔧 刷新所有显示
        CardDeckManager.renderDeck();
        SpecialStatusManager.updateDisplay();
        PlayerState.updateDisplay();
        const prompt = `简单跳过之前的场景，开始新剧情：【教堂洗礼仪式】我在教堂花费300金币进行了洗礼仪式，清除了身上的${curses.length}张诅咒卡和${statuses.length}个诅咒状态：${allRemoved.join('、')}。请生成一段洗礼过程的剧情，描写牧师如何帮我驱除诅咒，以及诅咒被清除时的感觉。`;
        ACJTGame.sendToAI(prompt);
    }
};

// ==================== 身体改造配置（40种） ====================
const BodyModConfig = {
    // ========== 魔族系 (8种) ==========
    succubus: {
        id: 'succubus', name: '魅魔化', icon: '😈', price: 200,
        description: '将身体改造为魅魔体质，散发诱惑气息',
        effects: { corruption: 50, attack: 3, defense: 3 },
        effectText: '堕落+50, 攻击+3, 防御+3'
    },
    demon_blood: {
        id: 'demon_blood', name: '淫魔血脉', icon: '🩸', price: 300,
        description: '注入淫魔血液，获得强大的魔族力量',
        effects: { corruption: 60, attack: 5, defense: 5 },
        effectText: '堕落+60, 攻击+5, 防御+5'
    },
    demon_tail: {
        id: 'demon_tail', name: '尾巴移植', icon: '🦯', price: 120,
        description: '移植魔族尾巴，增强平衡和战斗能力',
        effects: { corruption: 25, attack: 2, defense: 2 },
        effectText: '堕落+25, 攻击+2, 防御+2'
    },
    demon_horns: {
        id: 'demon_horns', name: '角质生长', icon: '🦌', price: 100,
        description: '头顶长出魔族犄角，增加攻击力',
        effects: { corruption: 30, attack: 4 },
        effectText: '堕落+30, 攻击+4'
    },
    demon_wings: {
        id: 'demon_wings', name: '翅膀移植', icon: '🦇', price: 180,
        description: '移植魔族翅膀，可以短距离飞行',
        effects: { corruption: 35, attack: 3, defense: 3 },
        effectText: '堕落+35, 攻击+3, 防御+3'
    },
    demon_eyes: {
        id: 'demon_eyes', name: '魔眼移植', icon: '👁️', price: 150,
        description: '获得魔族的妖异双眸，可以魅惑敌人',
        effects: { corruption: 35, enemyAttackReduce: 3 },
        effectText: '堕落+35, 敌人攻击-3'
    },
    demon_claws: {
        id: 'demon_claws', name: '魔爪改造', icon: '🖐️', price: 140,
        description: '手指变为锐利的魔爪',
        effects: { corruption: 30, attack: 5 },
        effectText: '堕落+30, 攻击+5'
    },
    full_demon: {
        id: 'full_demon', name: '完全魔化', icon: '👿', price: 500,
        description: '完全变成魔族，获得极大力量但堕落到底',
        effects: { corruption: 100, attack: 10, defense: 5, maxHp: 30 },
        effectText: '堕落+100, 攻击+10, 防御+5, HP+30'
    },

    // ========== 胸部改造 (6种) ==========
    breast_enlarge: {
        id: 'breast_enlarge', name: '丰胸手术', icon: '🍈', price: 80,
        description: '使用魔法药剂增大胸部',
        effects: { corruption: 20, defense: 2 },
        effectText: '堕落+20, 防御+2'
    },
    magic_breast: {
        id: 'magic_breast', name: '魔乳改造', icon: '🥛', price: 150,
        description: '使胸部能够分泌魔力乳汁',
        effects: { corruption: 30, defense: 4 },
        effectText: '堕落+30, 防御+4'
    },
    nipple_ring: {
        id: 'nipple_ring', name: '乳环穿刺', icon: '💎', price: 90,
        description: '在乳头穿上银色的环饰',
        effects: { corruption: 20, hDamageBonus: 15 },
        effectText: '堕落+20, H伤害+15%'
    },
    lactation: {
        id: 'lactation', name: '永久泌乳', icon: '🍼', price: 130,
        description: '使胸部永久分泌乳汁',
        effects: { corruption: 30, hpPerTurn: 1, defense: 2 },
        effectText: '堕落+30, 每回合+1HP, 防御+2'
    },
    breast_tattoo: {
        id: 'breast_tattoo', name: '胸部淫纹', icon: '🎀', price: 100,
        description: '在胸部刻上淫靡的纹路',
        effects: { corruption: 25, hDamageBonus: 10 },
        effectText: '堕落+25, H伤害+10%'
    },
    mega_breast: {
        id: 'mega_breast', name: '巨乳化', icon: '🎈', price: 200,
        description: '使胸部增大到极限',
        effects: { corruption: 40, defense: 5, attack: -1 },
        effectText: '堕落+40, 防御+5, 攻击-1'
    },

    // ========== 下体改造 (8种) ==========
    pussy_enhance: {
        id: 'pussy_enhance', name: '蜜穴强化', icon: '🌸', price: 160,
        description: '强化阴道肌肉，提升H技能威力',
        effects: { corruption: 40, hDamageBonus: 30 },
        effectText: '堕落+40, H技能伤害+30%'
    },
    anal_develop: {
        id: 'anal_develop', name: '菊穴开发', icon: '🍑', price: 140,
        description: '开发后穴，获得新的快感来源',
        effects: { corruption: 35, defense: 3 },
        effectText: '堕落+35, 防御+3'
    },
    womb_corrupt: {
        id: 'womb_corrupt', name: '子宫堕落', icon: '💜', price: 200,
        description: '使子宫完全堕落，获得魔族繁殖力',
        effects: { corruption: 50, maxHp: 20 },
        effectText: '堕落+50, 最大HP+20'
    },
    clit_enhance: {
        id: 'clit_enhance', name: '阴蒂强化', icon: '💢', price: 120,
        description: '使阴蒂变得更加敏感',
        effects: { corruption: 30, hDamageBonus: 20, hpOnHit: 1 },
        effectText: '堕落+30, H伤害+20%, 受伤+1HP'
    },
    double_pussy: {
        id: 'double_pussy', name: '双穴改造', icon: '🔮', price: 250,
        description: '改造出第二个阴道',
        effects: { corruption: 55, hDamageBonus: 40 },
        effectText: '堕落+55, H伤害+40%'
    },
    tentacle_womb: {
        id: 'tentacle_womb', name: '触手子宫', icon: '🦑', price: 280,
        description: '子宫内植入触手，可主动捕获',
        effects: { corruption: 60, attack: 4, hDamageBonus: 25 },
        effectText: '堕落+60, 攻击+4, H伤害+25%'
    },
    egg_laying: {
        id: 'egg_laying', name: '产卵体质', icon: '🥚', price: 180,
        description: '获得魔族产卵能力',
        effects: { corruption: 45, maxHp: 15, hpPerTurn: 1 },
        effectText: '堕落+45, HP+15, 每回合+1HP'
    },
    virgin_restore: {
        id: 'virgin_restore', name: '处女膜再生', icon: '🌹', price: 100,
        description: '使处女膜能够自动再生',
        effects: { corruption: 20, defense: 2 },
        effectText: '堕落+20, 防御+2'
    },

    // ========== 体质改造 (10种) ==========
    lewd_tattoo: {
        id: 'lewd_tattoo', name: '淫纹刻印', icon: '🔯', price: 120,
        description: '在身体刻上淫纹，增强H技能',
        effects: { corruption: 30, hDamageBonus: 20 },
        effectText: '堕落+30, H技能伤害+20%'
    },
    charm_body: {
        id: 'charm_body', name: '媚体改造', icon: '💃', price: 180,
        description: '全身改造为充满魅力的身体',
        effects: { corruption: 40, attack: 5 },
        effectText: '堕落+40, 攻击+5'
    },
    sensitive_body: {
        id: 'sensitive_body', name: '敏感体质', icon: '💗', price: 100,
        description: '增加身体敏感度，战斗中恢复体力',
        effects: { corruption: 25, hpPerTurn: 2 },
        effectText: '堕落+25, 每回合回复2HP'
    },
    heat_body: {
        id: 'heat_body', name: '发情体质', icon: '🔥', price: 150,
        description: '身体永远处于微微发情状态',
        effects: { corruption: 35, attack: 4 },
        effectText: '堕落+35, 攻击+4'
    },
    body_enhance: {
        id: 'body_enhance', name: '肉体强化', icon: '💪', price: 100,
        description: '强化肉体，提升生命上限',
        effects: { corruption: 20, maxHp: 15 },
        effectText: '堕落+20, 最大HP+15'
    },
    elastic_body: {
        id: 'elastic_body', name: '柔韧身体', icon: '🤸', price: 130,
        description: '身体变得极其柔软灵活',
        effects: { corruption: 25, defense: 4 },
        effectText: '堕落+25, 防御+4'
    },
    regeneration: {
        id: 'regeneration', name: '再生能力', icon: '♻️', price: 200,
        description: '获得缓慢的再生能力',
        effects: { corruption: 35, hpPerTurn: 3 },
        effectText: '堕落+35, 每回合+3HP'
    },
    pain_pleasure: {
        id: 'pain_pleasure', name: '痛觉转换', icon: '😵', price: 170,
        description: '将痛苦转化为快感',
        effects: { corruption: 40, hpOnHit: 4, defense: -2 },
        effectText: '堕落+40, 受伤+4HP, 防御-2'
    },
    immortal_body: {
        id: 'immortal_body', name: '不死之躯', icon: '☠️', price: 350,
        description: '获得近乎不死的身体',
        effects: { corruption: 70, maxHp: 40, hpPerTurn: 2 },
        effectText: '堕落+70, HP+40, 每回合+2HP'
    },
    slime_body: {
        id: 'slime_body', name: '史莱姆化', icon: '🫧', price: 220,
        description: '身体变得像史莱姆一样柔软',
        effects: { corruption: 45, defense: 6, attack: -2 },
        effectText: '堕落+45, 防御+6, 攻击-2'
    },

    // ========== 特殊改造 (8种) ==========
    tentacle_implant: {
        id: 'tentacle_implant', name: '触手植入', icon: '🐙', price: 220,
        description: '在体内植入触手器官，可自主攻击',
        effects: { corruption: 45, attack: 6 },
        effectText: '堕落+45, 攻击+6'
    },
    pheromone_gland: {
        id: 'pheromone_gland', name: '媚香腺体', icon: '🌺', price: 130,
        description: '植入媚香腺体，散发迷惑敌人的气息',
        effects: { corruption: 30, enemyAttackReduce: 2 },
        effectText: '堕落+30, 敌人攻击-2'
    },
    pleasure_nerve: {
        id: 'pleasure_nerve', name: '快感神经', icon: '⚡', price: 170,
        description: '改造神经系统，将痛苦转化为快感',
        effects: { corruption: 45, hpOnHit: 3 },
        effectText: '堕落+45, 受伤时回复3HP'
    },
    mind_corrupt: {
        id: 'mind_corrupt', name: '精神污染', icon: '🧠', price: 160,
        description: '接受精神污染，加速堕落',
        effects: { corruption: 40, corruptionPerRest: 5 },
        effectText: '堕落+40, 每次休息堕落+5'
    },
    eternal_heat: {
        id: 'eternal_heat', name: '永久发情', icon: '❤️‍🔥', price: 250,
        description: '身体永久处于发情状态，大幅提升攻击',
        effects: { corruption: 55, attack: 8, damageTaken: 10 },
        effectText: '堕落+55, 攻击+8, 受伤+10%'
    },
    parasite_core: {
        id: 'parasite_core', name: '寄生核心', icon: '🦠', price: 280,
        description: '植入魔族寄生核心，获得额外生命',
        effects: { corruption: 50, maxHp: 30, corruptionPerRest: 3 },
        effectText: '堕落+50, HP+30, 休息堕落+3'
    },
    charm_voice: {
        id: 'charm_voice', name: '魅音改造', icon: '🎤', price: 140,
        description: '声音变得充满魅惑',
        effects: { corruption: 30, enemyAttackReduce: 3, attack: 2 },
        effectText: '堕落+30, 敌人攻击-3, 攻击+2'
    },
    symbiote: {
        id: 'symbiote', name: '共生体', icon: '🖤', price: 400,
        description: '与魔族共生体融合',
        effects: { corruption: 80, attack: 8, defense: 4, hDamageBonus: 30 },
        effectText: '堕落+80, 攻击+8, 防御+4, H伤害+30%'
    }
};

// ==================== 黑市系统 ====================
const BlackMarketSystem = {
    purchasedMods: [], // 已购买的改造

    // 打开黑市
    open: function () {
        if (PlayerState.floor > 1) {
            alert('只有在城镇（第0-1层）才能进入黑市！');
            return;
        }

        // 加载已购买的改造
        this.loadPurchased();

        const modal = document.createElement('div');
        modal.id = 'blackMarketModal';
        modal.className = 'black-market-modal';

        modal.innerHTML = this.generateShopHTML();
        document.body.appendChild(modal);
    },

    // 生成商店HTML
    generateShopHTML: function () {
        let itemsHtml = '';

        Object.values(BodyModConfig).forEach(mod => {
            const isPurchased = this.purchasedMods.includes(mod.id);
            const canAfford = PlayerState.gold >= mod.price;

            itemsHtml += `
                <div class="market-item ${isPurchased ? 'purchased' : ''}">
                    <div class="market-item-icon">${mod.icon}</div>
                    <div class="market-item-name">${mod.name}</div>
                    <div class="market-item-desc">${mod.description}</div>
                    <div class="market-item-effect">${mod.effectText}</div>
                    <div class="market-item-price">💰 ${mod.price}</div>
                    ${isPurchased ?
                    `<div style="color: #888; font-size: 12px; margin-top: auto;">已购买</div>` :
                    `<button onclick="BlackMarketSystem.purchase('${mod.id}')"
                                 class="market-btn-buy"
                                 ${canAfford ? '' : 'disabled'}>
                            购买
                        </button>`
                }
                </div>
            `;
        });

        // 属性强化区域
        const canAffordStat = PlayerState.gold >= 200;
        const statUpgradeHtml = `
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                <div class="market-item market-stat-card attack" style="width: 220px;">
                    <div class="market-item-icon">⚔️</div>
                    <div class="market-item-name" style="color: #ff6b6b;">攻击强化</div>
                    <div class="market-item-desc" style="color: #ccc;">当前攻击: ${PlayerState.attack}</div>
                    <div class="market-item-price">💰 200 → +1攻击</div>
                    <button onclick="BlackMarketSystem.purchaseStat('attack')"
                            class="market-btn-buy"
                            style="background: linear-gradient(135deg, #ff6b6b, #ee5a5a);"
                            ${canAffordStat ? '' : 'disabled'}>
                        强化
                    </button>
                </div>
                <div class="market-item market-stat-card defense" style="width: 220px;">
                    <div class="market-item-icon">🛡️</div>
                    <div class="market-item-name" style="color: #74b9ff;">防御强化</div>
                    <div class="market-item-desc" style="color: #ccc;">当前防御: ${PlayerState.defense}</div>
                    <div class="market-item-price">💰 200 → +1防御</div>
                    <button onclick="BlackMarketSystem.purchaseStat('defense')"
                            class="market-btn-buy"
                            style="background: linear-gradient(135deg, #74b9ff, #5da4e8);"
                            ${canAffordStat ? '' : 'disabled'}>
                        强化
                    </button>
                </div>
            </div>
        `;

        return `
            <div class="market-header">
                <div class="market-title">🔮 黑市交易</div>
                <div class="market-status-bar">
                    <div class="market-status-item">💰 金币 <span style="color: #ffd700;">${PlayerState.gold}</span></div>
                    <div class="market-status-item">⚔️ 攻击 <span style="color: #ff6b6b;">${PlayerState.attack}</span></div>
                    <div class="market-status-item">🛡️ 防御 <span style="color: #74b9ff;">${PlayerState.defense}</span></div>
                    <div class="market-status-item">💜 堕落 <span style="color: #ff6b9d;">${PlayerState.corruption}</span></div>
                </div>
            </div>
            
            <div class="market-content-scroll">
                <div class="market-section-title">💪 属性强化 (无限购买)</div>
                ${statUpgradeHtml}
                
                <div class="market-section-title">🧬 身体改造 (一次性)</div>
                <div class="market-grid">
                    ${itemsHtml}
                </div>
            </div>
            
            <div class="market-footer">
                <button onclick="BlackMarketSystem.close()" class="market-btn-close">
                    离开黑市
                </button>
            </div>
        `;
    },

    // 购买改造
    purchase: function (modId) {
        const mod = BodyModConfig[modId];
        if (!mod || this.purchasedMods.includes(modId)) return;
        if (PlayerState.gold < mod.price) {
            alert('金币不足！');
            return;
        }

        // 扣除金币
        PlayerState.gold -= mod.price;
        this.purchasedMods.push(modId);
        this.savePurchased();

        // 应用效果
        this.applyModEffects(mod);

        PlayerState.save();
        PlayerState.updateDisplay();

        // 显示确认界面
        const modal = document.getElementById('blackMarketModal');
        modal.innerHTML = `
            <div style="margin: auto; background: linear-gradient(145deg, rgba(30, 20, 40, 0.98), rgba(20, 10, 20, 0.99)); 
                        border: 2px solid #9b59b6; border-radius: 12px; padding: 40px; width: 500px; text-align: center;
                        box-shadow: 0 0 30px rgba(155, 89, 182, 0.3);">
                <div style="font-size: 64px; margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(155, 89, 182, 0.6)); animation: pulse 2s infinite;">${mod.icon}</div>
                <div style="color: #9b59b6; font-size: 28px; font-weight: bold; margin-bottom: 15px; text-shadow: 0 0 10px rgba(155, 89, 182, 0.4);">改造完成!</div>
                <div style="color: #fff; font-size: 20px; margin-bottom: 15px;">${mod.name}</div>
                <div style="color: #ff6b9d; font-size: 14px; margin-bottom: 20px; background: rgba(255, 107, 157, 0.1); padding: 8px; border-radius: 4px;">${mod.effectText}</div>
                <div style="color: #aaa; font-size: 13px; margin-bottom: 30px; line-height: 1.6;">${mod.description}</div>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button onclick="BlackMarketSystem.skipStory('${modId}')"
                            class="market-btn-buy" style="width: auto; padding: 10px 30px; background: linear-gradient(135deg, #667eea, #764ba2);">
                        跳过剧情
                    </button>
                    <button onclick="BlackMarketSystem.generateStory('${modId}')"
                            class="market-btn-buy" style="width: auto; padding: 10px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);">
                        生成剧情
                    </button>
                </div>
            </div>
        `;
    },

    // 应用改造效果
    applyModEffects: function (mod) {
        const effects = mod.effects;

        // 堕落值
        if (effects.corruption) {
            PlayerState.corruption += effects.corruption;
            if (typeof gameState !== 'undefined' && gameState.variables) {
                gameState.variables.corruption = PlayerState.corruption;
            }
        }

        // 攻击力
        if (effects.attack) {
            PlayerState.attack += effects.attack;
        }

        // 防御力
        if (effects.defense) {
            PlayerState.defense += effects.defense;
        }

        // 最大HP
        if (effects.maxHp) {
            PlayerState.maxHp += effects.maxHp;
            PlayerState.hp += effects.maxHp; // 同时回复
        }

        // 🔧 所有改造都添加到特殊状态中显示
        const statusId = 'mod_' + mod.id;
        SpecialStatusManager.statuses[statusId] = {
            id: statusId,
            name: mod.name,
            icon: mod.icon,
            description: mod.effectText,
            permanent: true,
            effect: 'bodyMod',  // 标记为身体改造
            // 战斗效果
            hDamageBonus: effects.hDamageBonus || 0,
            hpPerTurn: effects.hpPerTurn || 0,
            enemyAttackReduce: effects.enemyAttackReduce || 0,
            hpOnHit: effects.hpOnHit || 0,
            corruptionPerRest: effects.corruptionPerRest || 0,
            damageTaken: effects.damageTaken || 0
        };
        SpecialStatusManager.save();
        SpecialStatusManager.updateDisplay();

        console.log('[黑市] 应用改造效果:', mod.name, effects);
    },

    // 跳过剧情
    skipStory: function (modId) {
        const mod = BodyModConfig[modId];
        ACJTGame.recordToHistory(`在黑市完成了"${mod.name}"身体改造，${mod.effectText}`);
        this.close();
    },

    // 生成剧情
    generateStory: function (modId) {
        const mod = BodyModConfig[modId];
        this.close();
        const prompt = `简单跳过当前场景，开始新剧情：【尖塔城镇黑市】我接受了“${mod.name}”身体改造。改造描述：${mod.description}。效果：${mod.effectText}。请生成一段详细的改造过程剧情，描写改造的细节、主角的感受和身体的变化。`;
        ACJTGame.sendToAI(prompt);
    },

    // 🔧 购买属性强化（无限次数）
    purchaseStat: function (statType) {
        if (PlayerState.gold < 200) {
            alert('金币不足！需要200金币');
            return;
        }

        // 扣除金币
        PlayerState.gold -= 200;

        // 增加属性
        if (statType === 'attack') {
            PlayerState.attack += 1;
            console.log('[黑市] 购买攻击强化，当前攻击:', PlayerState.attack);
        } else if (statType === 'defense') {
            PlayerState.defense += 1;
            console.log('[黑市] 购买防御强化，当前防御:', PlayerState.defense);
        }

        // 保存并更新显示
        PlayerState.save();
        PlayerState.updateDisplay();

        // 刷新黑市界面
        const modal = document.getElementById('blackMarketModal');
        if (modal) {
            modal.innerHTML = this.generateShopHTML();
        }
    },

    // 关闭黑市
    close: function () {
        document.getElementById('blackMarketModal')?.remove();
    },

    // 保存已购买的改造
    savePurchased: function () {
        localStorage.setItem('acjt_body_mods', JSON.stringify(this.purchasedMods));
    },

    // 加载已购买的改造
    loadPurchased: function () {
        const saved = localStorage.getItem('acjt_body_mods');
        if (saved) {
            try {
                this.purchasedMods = JSON.parse(saved);
                // 🔧 同步已购买的改造到特殊状态（确保显示）
                this.syncModsToStatus();
            } catch (e) {
                this.purchasedMods = [];
            }
        }
    },

    // 同步已购买的改造到特殊状态
    syncModsToStatus: function () {
        this.purchasedMods.forEach(modId => {
            const mod = BodyModConfig[modId];
            // 🔧 如果已经有 start_ 前缀的同款状态，就不要再添加 mod_ 版本
            const hasStartVersion = Object.keys(SpecialStatusManager.statuses).some(key =>
                key.startsWith('start_') && key.includes(modId)
            );
            if (mod && !SpecialStatusManager.statuses['mod_' + modId] && !hasStartVersion) {
                const effects = mod.effects;
                SpecialStatusManager.statuses['mod_' + modId] = {
                    id: 'mod_' + modId,
                    name: mod.name,
                    icon: mod.icon,
                    description: mod.effectText,
                    permanent: true,
                    effect: 'bodyMod',
                    source: 'blackmarket', // 🔧 标记来源
                    hDamageBonus: effects.hDamageBonus || 0,
                    hpPerTurn: effects.hpPerTurn || 0,
                    enemyAttackReduce: effects.enemyAttackReduce || 0,
                    hpOnHit: effects.hpOnHit || 0,
                    corruptionPerRest: effects.corruptionPerRest || 0,
                    damageTaken: effects.damageTaken || 0
                };
            }
        });
        if (this.purchasedMods.length > 0) {
            SpecialStatusManager.save();
            SpecialStatusManager.updateDisplay();
        }
    },

    // 获取战斗修正值
    getBattleMods: function () {
        let mods = {
            hDamageBonus: 0,
            hpPerTurn: 0,
            enemyAttackReduce: 0,
            hpOnHit: 0,
            damageTaken: 0
        };

        // 从特殊状态中收集改造效果
        Object.values(SpecialStatusManager.statuses).forEach(status => {
            if (status.id?.startsWith('mod_')) {
                mods.hDamageBonus += status.hDamageBonus || 0;
                mods.hpPerTurn += status.hpPerTurn || 0;
                mods.enemyAttackReduce += status.enemyAttackReduce || 0;
                mods.hpOnHit += status.hpOnHit || 0;
                mods.damageTaken += status.damageTaken || 0;
            }
        });

        return mods;
    }
};

// ==================== 修行系统（购买卡牌/摒弃卡牌） ====================
const CultivationSystem = {
    // 记录本次修行操作
    learnedCards: [],    // 习得的卡牌名称
    discardedCards: [],  // 摒弃的卡牌名称

    // 打开修行界面
    open: function () {
        // 重置记录
        this.learnedCards = [];
        this.discardedCards = [];

        const modal = document.createElement('div');
        modal.id = 'cultivationModal';
        // Remove valid inline styles and use CSS class for control
        modal.className = 'cultivation-modal';
        // Only keep minimal styles if absolutely needed, or rely entirely on CSS
        // Attempting to rely purely on CSS for dimensions and positioning
        // modal.style.cssText = ... removed

        modal.innerHTML = this.generateHTML();
        document.body.appendChild(modal);
    },

    // 生成修行界面HTML
    generateHTML: function () {
        const playerCorruption = PlayerState.corruption || 0;
        const playerProfession = PlayerState.profession?.id;

        // 获取所有可购买的卡牌（根据职业和堕落值过滤）
        // 规则：通用卡和H技能卡所有职业都能买，职业卡只有对应职业能买
        const availableCards = CardLibrary.filter(card => {
            // 检查堕落值解锁条件（H技能卡）
            if (card.corruptionRequired !== undefined && card.corruptionRequired > playerCorruption) {
                return false;
            }
            // H技能卡：所有职业都能买（只要堕落值够）
            if (card.type === CardType.H_ATTACK) {
                return true;
            }
            // 职业专属卡：只有对应职业能买
            if (card.professionRequired) {
                return card.professionRequired === playerProfession;
            }
            // 通用卡：所有职业都能买
            return true;
        });

        // 生成可购买卡牌列表
        let buyCardsHtml = '';
        availableCards.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            // 计算价格：最低100，基于费用计算
            const price = Math.max(100, (card.cost || 1) * 50 + (card.value || 0) * 3);
            const canBuy = PlayerState.gold >= price;

            buyCardsHtml += `
                <div style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                           border: 2px solid ${canBuy ? typeColor : '#333'}; border-radius: 8px;
                           padding: 12px; width: 140px; text-align: center; opacity: ${canBuy ? 1 : 0.5};
                           flex-shrink: 0;">
                    <div style="color: #ffd700; font-size: 12px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 16px; font-weight: bold; margin-bottom: 6px;">${card.value || '-'}</div>
                    <div style="color: #aaa; font-size: 11px; margin-bottom: 10px; line-height: 1.4;">${card.description}</div>
                    <button onclick="CultivationSystem.buyCard('${card.id}', ${price})" ${!canBuy ? 'disabled' : ''}
                            style="padding: 5px 12px; background: ${canBuy ? '#2ed573' : '#333'}; color: ${canBuy ? '#fff' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canBuy ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        💰 ${price}
                    </button>
                </div>
            `;
        });

        // 生成当前卡组（可摒弃的卡牌）
        let deckCardsHtml = '';
        CardDeckManager.deck.forEach((card, index) => {
            const typeColor = CardTypeColors[card.type] || '#666';
            const isCurse = card.type === CardType.CURSE;
            const canDiscard = !isCurse && PlayerState.gold >= 300;

            deckCardsHtml += `
                <div style="background: linear-gradient(135deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.98) 100%);
                           border: 2px solid ${isCurse ? '#8b0000' : typeColor}; border-radius: 8px;
                           padding: 12px; width: 140px; text-align: center; opacity: ${canDiscard ? 1 : 0.6};
                           flex-shrink: 0; position: relative;">
                    ${isCurse ? '<div style="position:absolute;top:5px;left:5px;font-size:11px;color:#ff4757;">诅咒</div>' : ''}
                    <div style="color: #ffd700; font-size: 12px; text-align: right;">${card.cost}⚡</div>
                    <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${card.name}</div>
                    <div style="color: ${typeColor}; font-size: 16px; font-weight: bold; margin-bottom: 6px;">${card.value || '-'}</div>
                    <div style="color: #aaa; font-size: 11px; margin-bottom: 10px; line-height: 1.4;">${card.description}</div>
                    <button onclick="CultivationSystem.discardCard(${index})" ${!canDiscard ? 'disabled' : ''}
                            style="padding: 5px 12px; background: ${canDiscard ? '#ff4757' : '#333'}; color: ${canDiscard ? '#fff' : '#666'};
                                   border: none; border-radius: 4px; cursor: ${canDiscard ? 'pointer' : 'not-allowed'}; font-size: 12px;">
                        ${isCurse ? '无法摒弃' : '💰 300 摒弃'}
                    </button>
                </div>
            `;
        });

        return `
            <!-- Compact Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 5px; width: 100%; border-bottom: 1px solid rgba(107, 82, 65, 0.3); padding-bottom: 5px;">
                <div style="color: #9c88ff; font-size: 24px; font-weight: bold;">🧘 修行</div>
                <div style="color: #ffd700; font-size: 16px; font-weight: bold;">💰 金币: ${PlayerState.gold}</div>
            </div>
            
            <!-- Tab Navigation (More compact) -->
            <div style="display: flex; gap: 0; margin-bottom: 10px; border-bottom: 1px solid #6b5241; width: 100%;">
                <div id="tab-buy" onclick="CultivationSystem.switchTab('buy')" 
                     style="padding: 8px 30px; cursor: pointer; background: #8b0000; color: #fff; border: 1px solid #6b5241; border-bottom: none; border-radius: 6px 6px 0 0; font-weight: bold; flex: 1; text-align: center; transition: all 0.3s; font-size: 14px;">
                    📚 购买卡牌
                </div>
                <div id="tab-delete" onclick="CultivationSystem.switchTab('delete')" 
                     style="padding: 8px 30px; cursor: pointer; background: rgba(0,0,0,0.3); color: #888; border: 1px solid #6b5241; border-bottom: none; border-radius: 6px 6px 0 0; border-left: none; flex: 1; text-align: center; transition: all 0.3s; font-size: 14px;">
                    🗑️ 删除卡牌
                </div>
            </div>

            <!-- Content Area: Buy Cards (Maximized width, reduced padding) -->
            <div id="content-buy" style="display: flex; width: 100%; flex: 1; overflow: hidden; flex-direction: column;">
                <div style="color: #2ed573; font-size: 13px; margin-bottom: 5px; text-align: center;">👇 点击购买习得新技能 (最低售价100金币)</div>
                <div class="cultivation-scroll-area" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; overflow-y: auto; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 0 0 5px 5px; border: 1px solid #6b5241; border-top: none;">
                    ${buyCardsHtml || '<div style="color: #666; width: 100%; text-align: center; padding-top: 50px;">暂无可习得的功法</div>'}
                </div>
            </div>

            <!-- Content Area: Delete Cards -->
            <div id="content-delete" style="display: none; width: 100%; flex: 1; overflow: hidden; flex-direction: column;">
                 <div style="color: #ff6b9d; font-size: 13px; margin-bottom: 5px; text-align: center;">👇 点击删除摒弃杂念 (花费300金币)</div>
                <div class="cultivation-scroll-area" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; overflow-y: auto; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 0 0 5px 5px; border: 1px solid #6b5241; border-top: none;">
                    ${deckCardsHtml || '<div style="color: #666; width: 100%; text-align: center; padding-top: 50px;">卡组为空</div>'}
                </div>
            </div>
            
            <div style="margin-top: 15px; display: flex; justify-content: center;">
                <button onclick="CultivationSystem.leave()"
                        style="padding: 10px 50px; background: linear-gradient(135deg, #667eea, #764ba2);
                               color: #fff; border: 2px solid #a29bfe; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: bold; box-shadow: 0 0 10px rgba(108, 92, 231, 0.4);">
                    🚪 离开修行
                </button>
            </div>
        `;
    },

    // 购买卡牌
    buyCard: function (cardId, price) {
        if (PlayerState.gold < price) return;

        const card = CardLibrary.find(c => c.id === cardId);
        if (!card) return;

        PlayerState.gold -= price;
        CardDeckManager.deck.push({ ...card });
        this.learnedCards.push(card.name);

        saveCardDeck();
        PlayerState.save();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        this.refreshUI();
    },

    // 摒弃卡牌
    discardCard: function (index) {
        const card = CardDeckManager.deck[index];
        if (!card || card.type === CardType.CURSE) return;
        if (PlayerState.gold < 300) return;

        PlayerState.gold -= 300;
        const removedCard = CardDeckManager.deck.splice(index, 1)[0];
        this.discardedCards.push(removedCard.name);

        saveCardDeck();
        PlayerState.save();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        this.refreshUI();
    },

    // 刷新界面
    refreshUI: function () {
        // 保存当前tab状态
        const activeTab = document.querySelector('#content-buy')?.style.display !== 'none' ? 'buy' : 'delete';

        const modal = document.getElementById('cultivationModal');
        if (modal) {
            modal.innerHTML = this.generateHTML();
            // 恢复tab状态
            this.switchTab(activeTab);
        }
    },

    // Tab切换逻辑
    switchTab: function (tabName) {
        const tabBuy = document.getElementById('tab-buy');
        const tabDelete = document.getElementById('tab-delete');
        const contentBuy = document.getElementById('content-buy');
        const contentDelete = document.getElementById('content-delete');

        if (!tabBuy || !tabDelete || !contentBuy || !contentDelete) return;

        if (tabName === 'buy') {
            // 激活购买Tab
            tabBuy.style.background = '#8b0000';
            tabBuy.style.color = '#fff';
            tabBuy.style.borderBottom = 'none';

            tabDelete.style.background = 'rgba(0,0,0,0.3)';
            tabDelete.style.color = '#888';
            tabDelete.style.borderBottom = '1px solid #6b5241';

            contentBuy.style.display = 'flex';
            contentDelete.style.display = 'none';
        } else {
            // 激活删除Tab
            tabDelete.style.background = '#8b0000';
            tabDelete.style.color = '#fff';
            tabDelete.style.borderBottom = 'none';

            tabBuy.style.background = 'rgba(0,0,0,0.3)';
            tabBuy.style.color = '#888';
            tabBuy.style.borderBottom = '1px solid #6b5241';

            contentDelete.style.display = 'flex';
            contentBuy.style.display = 'none';
        }
    },

    // 离开修行
    leave: function () {
        // 如果没有任何操作，直接关闭
        if (this.learnedCards.length === 0 && this.discardedCards.length === 0) {
            this.close();
            return;
        }

        // 显示跳过/生成剧情选项
        const modal = document.getElementById('cultivationModal');
        if (modal) {
            const learnedText = this.learnedCards.length > 0 ? this.learnedCards.join('、') : '无';
            const discardedText = this.discardedCards.length > 0 ? this.discardedCards.join('、') : '无';

            modal.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <div style="font-size: 72px; margin-bottom: 20px;">🧘</div>
                    <div style="color: #9c88ff; font-size: 24px; font-weight: bold; margin-bottom: 15px;">修行完成!</div>
                    <div style="color: #2ed573; font-size: 14px; margin-bottom: 10px;">习得：${learnedText}</div>
                    <div style="color: #ff6b9d; font-size: 14px; margin-bottom: 20px;">摒弃：${discardedText}</div>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button onclick="CultivationSystem.skipStory()"
                                style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2);
                                       color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                            跳过剧情
                        </button>
                        <button onclick="CultivationSystem.generateStory()"
                                style="padding: 12px 30px; background: linear-gradient(135deg, #ff6b9d, #c44569);
                                       color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                            生成剧情
                        </button>
                    </div>
                </div>
            `;
        }
    },

    // 跳过剧情
    skipStory: function () {
        const learnedText = this.learnedCards.length > 0 ? this.learnedCards.join('、') : '';
        const discardedText = this.discardedCards.length > 0 ? this.discardedCards.join('、') : '';

        let historyText = '修行：';
        if (learnedText) historyText += `习得了${learnedText}`;
        if (learnedText && discardedText) historyText += '；';
        if (discardedText) historyText += `摒弃了${discardedText}`;

        ACJTGame.recordToHistory(historyText);
        this.close();

        if (typeof showNotification === 'function') {
            showNotification('🧘 修行完成', 'success');
        }
    },

    // 生成剧情
    generateStory: function () {
        const learnedText = this.learnedCards.length > 0 ? this.learnedCards.join('、') : '';
        const discardedText = this.discardedCards.length > 0 ? this.discardedCards.join('、') : '';
        const floor = PlayerState.floor || 1;

        let historyText = '修行：';
        if (learnedText) historyText += `习得了${learnedText}`;
        if (learnedText && discardedText) historyText += '；';
        if (discardedText) historyText += `摒弃了${discardedText}`;

        // 🔧 生成剧情时不记录到重要历史和矩阵

        let promptParts = [];
        if (learnedText) promptParts.push(`我习得了${learnedText}`);
        if (discardedText) promptParts.push(`我摒弃了${discardedText}`);

        const prompt = `简单跳过之前的场景，生成新剧情：【尖塔第${floor}层修行】${promptParts.join('；')}。请生成一段修行过程的剧情，描写我在修行中领悟新招式、或摒弃旧技能时的心境变化和感悟。`;

        this.close();
        ACJTGame.sendToAI(prompt);
    },

    // 关闭修行界面
    close: function () {
        document.getElementById('cultivationModal')?.remove();
    }
};

// ==================== 游戏主流程 ====================
const ACJTGame = {
    isGameStarted: false,
    creationPoints: 100,      // 角色创建点数
    currentStep: 1,           // 当前创建步骤 (1-5)

    // 角色创建数据
    charData: {
        name: '塞莱斯汀',
        age: 16,
        professionId: 'nun',
        raceId: 'human',
        isVirgin: true,
        bodyAttributes: {
            height: 'average',
            weight: 'average',
            chest: 'C',
            hips: 'average',
            vagina: 'pink_bud'
        },
        startingStatuses: [],
        originId: 'adventurer',
        customBackground: ''
    },

    // 显示角色创建界面（多步骤流程）
    showCharacterCreation: function () {
        const modal = document.createElement('div');
        modal.id = 'acjtCharCreationModal';
        modal.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(180deg, rgba(25, 18, 15, 0.99) 0%, rgba(15, 10, 8, 1) 50%, rgba(20, 14, 12, 0.99) 100%);
            display: flex; align-items: center; justify-content: center; z-index: 10000;
            padding: 15px; box-sizing: border-box; overflow: hidden;
            font-family: 'Cinzel', 'Microsoft YaHei', serif;
            border: 3px solid #3d2f24;
            box-shadow: inset 0 0 50px rgba(0,0,0,0.8), inset 0 0 100px rgba(139,0,0,0.1);
        `;

        // 重置创建数据
        this.creationPoints = 100;
        this.currentStep = 1;
        this.charData = {
            name: '塞莱斯汀', age: 16, professionId: 'nun', raceId: 'human', isVirgin: true,
            bodyAttributes: { height: 'average', weight: 'average', chest: 'C', hips: 'average', vagina: 'pink_bud' },
            startingStatuses: [], originId: 'adventurer', customBackground: ''
        };
        CardDeckManager.deck = [];

        modal.innerHTML = this.generateStepHTML();
        document.body.appendChild(modal);
    },

    // 切换步骤
    goToStep: function (step) {
        if (step < 1 || step > 5) return;
        this.currentStep = step;
        const modal = document.getElementById('acjtCharCreationModal');
        if (modal) modal.innerHTML = this.generateStepHTML();
    },

    // 计算当前点数
    calculatePoints: function () {
        let points = 100;
        // 特殊状态点数
        this.charData.startingStatuses.forEach(sid => {
            const status = StartingStatusConfig[sid];
            if (status) points += status.points;
        });
        // 开局经历点数
        const origin = OriginConfig[this.charData.originId];
        if (origin) points += origin.points;
        // Roll消耗
        points -= (this.charData._rollCount || 0) * 10;
        return points;
    },

    // 生成步骤HTML
    generateStepHTML: function () {
        const points = this.calculatePoints();
        const stepTitles = ['', '职业与基础信息', '身体属性设定', '特殊状态选择', '出身背景经历', '卡组抽取与确认'];
        const stepIcons = ['', '⚔️', '💃', '✨', '📜', '🃏'];

        // 步骤指示器 - 克苏鲁风格
        let stepsHtml = '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;padding:0 10px;">';
        for (let i = 1; i <= 5; i++) {
            const active = i === this.currentStep;
            const done = i < this.currentStep;
            const canClick = done || active;

            // 步骤圆圈
            if (i > 1) {
                const lineColor = done ? '#6b5241' : 'rgba(107,82,65,0.3)';
                stepsHtml += `<div style="width:30px;height:2px;background:${lineColor};border-radius:1px;"></div>`;
            }

            const bg = active ? 'linear-gradient(135deg, #8b0000, #5a0000)' : done ? 'linear-gradient(135deg, #6b5241, #4a3828)' : 'rgba(26,19,16,0.8)';
            const shadow = active ? '0 0 15px rgba(139,0,0,0.6)' : done ? '0 0 8px rgba(107,82,65,0.4)' : 'none';
            const scale = active ? 'scale(1.1)' : 'scale(1)';

            stepsHtml += `<div onclick="${canClick ? `ACJTGame.goToStep(${i})` : ''}" style="width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;
                font-size:${done ? '14px' : '13px'};font-weight:bold;cursor:${canClick ? 'pointer' : 'default'};transition:all 0.3s;
                background:${bg}; box-shadow:${shadow}; transform:${scale};
                color:#c9b896;border:2px solid ${active ? 'rgba(139,0,0,0.5)' : 'rgba(107,82,65,0.3)'};">${done ? '҉' : i}</div>`;
        }
        stepsHtml += '</div>';

        // 点数显示 - 克苏鲁风格
        const pointsColor = points >= 0 ? '#c9b896' : '#8b0000';
        const pointsGlow = points >= 0 ? 'rgba(139,0,0,0.4)' : 'rgba(139,0,0,0.6)';
        const pointsHtml = `
            <div style="text-align:center;margin-bottom:15px;">
                <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 25px;background:linear-gradient(135deg,rgba(25,18,15,0.8),rgba(15,10,8,0.9));border-radius:4px;border:2px solid #3d2f24;box-shadow:inset 0 0 10px rgba(0,0,0,0.5);">
                    <span style="color:#6b5d4d;font-size:13px;">҉ 剩余点数</span>
                    <span style="color:${pointsColor};font-size:22px;font-weight:bold;text-shadow:0 0 10px ${pointsGlow};">${points}</span>
                </div>
            </div>`;

        // 根据步骤生成内容
        let contentHtml = '';
        switch (this.currentStep) {
            case 1: contentHtml = this.generateStep1HTML(); break;
            case 2: contentHtml = this.generateStep2HTML(); break;
            case 3: contentHtml = this.generateStep3HTML(); break;
            case 4: contentHtml = this.generateStep4HTML(); break;
            case 5: contentHtml = this.generateStep5HTML(); break;
        }

        return `
            <style>
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                #charCreationContent::-webkit-scrollbar { width: 6px; }
                #charCreationContent::-webkit-scrollbar-track { background: rgba(26,19,16,0.8); border-radius: 3px; }
                #charCreationContent::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #6b5241, #3d2f24); border-radius: 3px; }
                #charCreationContent::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #8b6b4a, #6b5241); }
            </style>
            <div style="max-width:800px;width:100%;max-height:calc(100vh - 30px);display:flex;flex-direction:column;background:linear-gradient(180deg, rgba(25,18,15,0.98) 0%, rgba(15,10,8,0.99) 50%, rgba(20,14,12,0.98) 100%);border-radius:4px;box-shadow:0 15px 50px rgba(0,0,0,0.8),inset 0 0 30px rgba(0,0,0,0.5),0 0 20px rgba(139,0,0,0.2);border:3px solid #3d2f24;overflow:hidden;position:relative;">
                
                <!-- 固定头部 -->
                <div style="padding:20px 25px 15px;background:linear-gradient(180deg, rgba(139,0,0,0.1) 0%, transparent 100%);border-bottom:2px solid rgba(139,0,0,0.3);flex-shrink:0;">
                    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;">
                        <span style="font-size:28px;filter:drop-shadow(0 0 5px rgba(139,0,0,0.5));">${stepIcons[this.currentStep]}</span>
                        <span style="color:#c9b896;font-size:22px;font-weight:bold;text-shadow:0 0 15px rgba(139,0,0,0.4);font-family:'Cinzel',serif;">${stepTitles[this.currentStep]}</span>
                    </div>
                    <div style="height:2px;width:80px;background:linear-gradient(90deg, transparent, #8b0000, transparent);margin:0 auto 15px;"></div>
                    ${stepsHtml}
                    ${pointsHtml}
                </div>
                
                <!-- 可滚动内容区 -->
                <div id="charCreationContent" style="flex:1;overflow-y:auto;padding:20px 25px 25px;animation:fadeIn 0.4s ease-out;color:#c9b896;">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    // 步骤1: 职业与基础信息
    generateStep1HTML: function () {
        // 职业选择
        let profHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:25px;">';
        Object.values(ProfessionConfig).forEach(prof => {
            const selected = this.charData.professionId === prof.id;
            const bg = selected ? 'linear-gradient(135deg,rgba(255,107,157,0.2),rgba(196,69,105,0.2))' : 'rgba(255,255,255,0.03)';
            const border = selected ? '#ff6b9d' : 'rgba(255,255,255,0.1)';
            const shadow = selected ? '0 5px 15px rgba(255,107,157,0.2)' : 'none';

            profHtml += `
                <div onclick="ACJTGame.selectProfession('${prof.id}')" style="cursor:pointer;padding:15px 10px;text-align:center;
                    background:${bg}; border:1px solid ${border}; border-radius:12px; transition:all 0.3s;
                    box-shadow:${shadow}; transform:${selected ? 'translateY(-2px)' : 'none'}; position:relative; overflow:hidden;">
                    ${selected ? '<div style="position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 25px 25px 0;border-color:transparent #ff6b9d transparent transparent;"></div><div style="position:absolute;top:2px;right:2px;color:#fff;font-size:10px;font-weight:bold;">✓</div>' : ''}
                    ${prof.icon && prof.icon.startsWith('img/') ? `<img src="${prof.icon}" style="width:120px;height:120px;margin-bottom:8px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(255,255,255,0.3));">` : `<div style="font-size:32px;margin-bottom:8px;text-shadow:0 0 10px rgba(255,255,255,0.3);">${prof.icon}</div>`}
                    <div style="color:#fff;font-size:14px;font-weight:bold;margin-bottom:5px;">${prof.name}</div>
                    <div style="color:#aaa;font-size:11px;line-height:1.4;">${prof.description}</div>
                </div>`;
        });
        profHtml += '</div>';

        // 种族选择
        let raceHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-bottom:25px;">';
        Object.values(RaceConfig).forEach(race => {
            const selected = this.charData.raceId === race.id;
            const bg = selected ? 'linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2))' : 'rgba(255,255,255,0.03)';
            const border = selected ? '#667eea' : 'rgba(255,255,255,0.1)';
            const mods = race.statMods;
            let modText = [];
            if (mods.hp) modText.push(`HP${mods.hp > 0 ? '+' : ''}${mods.hp}`);
            if (mods.attack) modText.push(`攻${mods.attack > 0 ? '+' : ''}${mods.attack}`);
            if (mods.defense) modText.push(`防${mods.defense > 0 ? '+' : ''}${mods.defense}`);
            if (mods.corruption) modText.push(`堕${mods.corruption > 0 ? '+' : ''}${mods.corruption}`);

            raceHtml += `
                <div onclick="ACJTGame.selectRace('${race.id}')" style="cursor:pointer;padding:10px;text-align:center;
                    background:${bg}; border:1px solid ${border}; border-radius:10px; transition:all 0.3s;
                    transform:${selected ? 'scale(1.05)' : 'none'};">
                    ${race.icon && race.icon.startsWith('img/') ? `<img src="${race.icon}" style="width:50px;height:50px;margin-bottom:4px;object-fit:contain;">` : `<div style="font-size:26px;margin-bottom:4px;">${race.icon}</div>`}
                    <div style="color:#fff;font-size:13px;font-weight:bold;margin-bottom:2px;">${race.name}</div>
                    <div style="color:#888;font-size:10px;transform:scale(0.9);">${modText.join(' ') || '无修正'}</div>
                </div>`;
        });
        raceHtml += '</div>';

        return `
            <!-- 职业选择 -->
            <div style="margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:4px;height:20px;background:linear-gradient(180deg,#ff6b9d,#c44569);border-radius:2px;"></div>
                    <span style="color:#ff6b9d;font-size:15px;font-weight:bold;">选择职业</span>
                </div>
                ${profHtml}
            </div>
            
            <!-- 种族选择 -->
            <div style="margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:4px;height:20px;background:linear-gradient(180deg,#667eea,#764ba2);border-radius:2px;"></div>
                    <span style="color:#667eea;font-size:15px;font-weight:bold;">选择种族</span>
                </div>
                ${raceHtml}
            </div>
            
            <!-- 基础信息 -->
            <div style="margin-bottom:20px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                    <div style="width:4px;height:20px;background:linear-gradient(180deg,#ffd700,#f39c12);border-radius:2px;"></div>
                    <span style="color:#ffd700;font-size:15px;font-weight:bold;">基础信息</span>
                </div>
                <div style="background:rgba(255,255,255,0.02);padding:18px;border-radius:12px;display:flex;gap:25px;flex-wrap:wrap;justify-content:center;border:1px solid rgba(255,255,255,0.05);">
                    <div style="text-align:center;">
                        <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">姓名</div>
                        <input type="text" id="charNameInput" value="${this.charData.name}" placeholder="请输入姓名"
                            onchange="ACJTGame.charData.name=this.value"
                            style="padding:10px 14px;width:130px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;text-align:center;outline:none;transition:all 0.3s;font-size:14px;"
                            onfocus="this.style.borderColor='#ff6b9d';this.style.boxShadow='0 0 10px rgba(255,107,157,0.2)'"
                            onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">
                    </div>
                    <div style="text-align:center;">
                        <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">年龄</div>
                        <input type="number" id="charAgeInput" value="${this.charData.age}" min="14" max="35"
                            onchange="ACJTGame.charData.age=parseInt(this.value)||18"
                            style="padding:10px 14px;width:70px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;text-align:center;outline:none;transition:all 0.3s;font-size:14px;"
                            onfocus="this.style.borderColor='#ff6b9d';this.style.boxShadow='0 0 10px rgba(255,107,157,0.2)'"
                            onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">
                    </div>
                    <div style="text-align:center;">
                        <div style="color:#888;font-size:11px;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">贞操</div>
                        <div style="display:flex;gap:0;background:rgba(0,0,0,0.4);border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                            <div onclick="ACJTGame.charData.isVirgin=true;ACJTGame.refreshStep();" 
                                 style="padding:10px 18px;cursor:pointer;font-size:13px;transition:all 0.3s;
                                 background:${this.charData.isVirgin ? 'linear-gradient(135deg,#ff6b9d,#c44569)' : 'transparent'};
                                 color:${this.charData.isVirgin ? '#fff' : '#666'};">处女</div>
                            <div onclick="ACJTGame.charData.isVirgin=false;ACJTGame.refreshStep();" 
                                 style="padding:10px 18px;cursor:pointer;font-size:13px;transition:all 0.3s;
                                 background:${!this.charData.isVirgin ? 'linear-gradient(135deg,#ff4757,#c0392b)' : 'transparent'};
                                 color:${!this.charData.isVirgin ? '#fff' : '#666'};">非处</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 导航按钮 -->
            <div style="text-align:center;padding-top:10px;">
                <button onclick="ACJTGame.goToStep(2)" 
                    style="padding:14px 60px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:16px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;letter-spacing:1px;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    下一步 →
                </button>
            </div>
        `;
    },

    // 步骤2: 身体属性设定
    generateStep2HTML: function () {
        const genSelect = (type, label, icon) => {
            const items = BodyConfig[type];
            let html = `<div style="margin-bottom:18px;">
                <div style="color:#888;font-size:12px;margin-bottom:8px;display:flex;align-items:center;gap:5px;">
                    <span>${icon}</span><span>${label}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
            items.forEach(item => {
                const selected = this.charData.bodyAttributes[type] === item.id;
                const bg = selected ? 'linear-gradient(135deg,#ff6b9d,#c44569)' : 'rgba(255,255,255,0.03)';
                const border = selected ? 'rgba(255,107,157,0.5)' : 'rgba(255,255,255,0.08)';

                html += `<div onclick="ACJTGame.setBodyAttr('${type}','${item.id}')" 
                    style="cursor:pointer;padding:8px 14px;font-size:12px;border-radius:18px;transition:all 0.2s;
                    background:${bg}; border:1px solid ${border}; color:${selected ? '#fff' : '#999'};
                    box-shadow:${selected ? '0 3px 12px rgba(255,107,157,0.25)' : 'none'};"
                    onmouseover="if(!${selected})this.style.background='rgba(255,255,255,0.06)'"
                    onmouseout="if(!${selected})this.style.background='rgba(255,255,255,0.03)'">
                    ${item.name}
                </div>`;
            });
            html += '</div></div>';
            return html;
        };

        return `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
                <!-- 基础体型 -->
                <div style="background:linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));padding:18px;border-radius:14px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:15px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:18px;">📏</span>
                        <span style="color:#fff;font-size:14px;font-weight:bold;">基础体型</span>
                    </div>
                    ${genSelect('height', '身高', '📐')}
                    ${genSelect('weight', '体重', '⚖️')}
                </div>
                <!-- 身材特征 -->
                <div style="background:linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));padding:18px;border-radius:14px;border:1px solid rgba(255,255,255,0.05);">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:15px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);">
                        <span style="font-size:18px;">💃</span>
                        <span style="color:#fff;font-size:14px;font-weight:bold;">身材特征</span>
                    </div>
                    ${genSelect('chest', '胸围', '🍒')}
                    ${genSelect('hips', '臀部', '🍑')}
                    ${genSelect('vagina', '私处', '🌸')}
                </div>
            </div>
            
            <!-- 导航按钮 -->
            <div style="display:flex;gap:15px;justify-content:center;margin-top:25px;">
                <button onclick="ACJTGame.goToStep(1)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← 上一步
                </button>
                <button onclick="ACJTGame.goToStep(3)" 
                    style="padding:12px 50px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    下一步 →
                </button>
            </div>
        `;
    },

    // 步骤3: 特殊状态选择
    generateStep3HTML: function () {
        let html = '<div style="color:#888;font-size:12px;margin-bottom:18px;text-align:center;background:linear-gradient(135deg,rgba(0,0,0,0.3),rgba(0,0,0,0.2));padding:12px 15px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">💡 <span style="color:#2ed573">负面状态</span> 给予点数 | <span style="color:#ff6b9d">正面状态</span> 消耗点数（可多选）</div>';

        // 分类显示状态
        const categories = {
            negative: { title: '⛓️ 负面束缚', items: [], color: '#ff4757' },
            demon: { title: '😈 魔族血统', items: [], color: '#a55eea' },
            body: { title: '💗 身体改造', items: [], color: '#ff6b9d' },
            special: { title: '✨ 特殊能力', items: [], color: '#f7b731' }
        };

        Object.values(StartingStatusConfig).forEach(status => {
            if (status.points > 0) {
                categories.negative.items.push(status);
            } else if (status.id.includes('demon') || status.id.includes('succubus')) {
                categories.demon.items.push(status);
            } else if (status.id.includes('breast') || status.id.includes('nipple') || status.id.includes('pussy') || status.id.includes('anal') || status.id.includes('womb')) {
                categories.body.items.push(status);
            } else {
                categories.special.items.push(status);
            }
        });

        // 生成各分类HTML
        Object.values(categories).forEach(cat => {
            if (cat.items.length === 0) return;

            html += `<div style="margin-bottom:20px;">
                <div style="color:${cat.color};font-size:15px;font-weight:bold;margin-bottom:10px;border-bottom:1px solid ${cat.color}40;padding-bottom:5px;">${cat.title}</div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">`;

            cat.items.forEach(status => {
                const selected = this.charData.startingStatuses.includes(status.id);
                const isNegative = status.points > 0;
                const pointText = status.points > 0 ? `+${status.points}` : status.points;
                const bg = selected ? (isNegative ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.2)') : 'rgba(255,255,255,0.03)';
                const border = selected ? (isNegative ? '#ff4757' : '#2ed573') : 'rgba(255,255,255,0.1)';

                html += `
                    <div onclick="ACJTGame.toggleStatus('${status.id}')" style="cursor:pointer;padding:10px;text-align:center;
                        background:${bg}; border:1px solid ${border}; border-radius:8px; transition:all 0.2s; position:relative;
                        transform:${selected ? 'translateY(-2px)' : 'none'};">
                        ${selected ? '<div style="position:absolute;top:2px;right:5px;color:' + (isNegative ? '#ff4757' : '#2ed573') + ';font-size:12px;">✓</div>' : ''}
                        <div style="font-size:24px;margin-bottom:5px;">${status.icon}</div>
                        <div style="color:#fff;font-size:13px;font-weight:bold;margin-bottom:3px;">${status.name}</div>
                        <div style="color:${isNegative ? '#ff6b6b' : '#2ed573'};font-size:12px;font-weight:bold;margin-bottom:3px;">${pointText}点</div>
                        <div style="color:#888;font-size:10px;line-height:1.2;">${status.effect}</div>
                    </div>`;
            });
            html += '</div></div>';
        });

        html += `
            <div style="display:flex;gap:15px;justify-content:center;margin-top:20px;">
                <button onclick="ACJTGame.goToStep(2)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← 上一步
                </button>
                <button onclick="ACJTGame.goToStep(4)" 
                    style="padding:12px 50px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    下一步 →
                </button>
            </div>`;
        return html;
    },

    // 步骤4: 开局经历选择
    generateStep4HTML: function () {
        let html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:25px;">';

        Object.values(OriginConfig).forEach(origin => {
            const selected = this.charData.originId === origin.id;
            const pointText = origin.points > 0 ? `+${origin.points}` : (origin.points < 0 ? origin.points : '±0');
            const bg = selected ? 'linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2))' : 'rgba(255,255,255,0.03)';
            const border = selected ? '#667eea' : 'rgba(255,255,255,0.1)';
            const shadow = selected ? '0 5px 15px rgba(102,126,234,0.2)' : 'none';

            html += `
                <div onclick="ACJTGame.selectOrigin('${origin.id}')" style="cursor:pointer;padding:15px;text-align:center;
                    background:${bg}; border:1px solid ${border}; border-radius:10px; transition:all 0.3s;
                    box-shadow:${shadow}; transform:${selected ? 'translateY(-2px)' : 'none'};">
                    <div style="font-size:32px;margin-bottom:8px;">${origin.icon}</div>
                    <div style="color:#fff;font-size:14px;font-weight:bold;margin-bottom:4px;">${origin.name}</div>
                    <div style="color:#ffd700;font-size:12px;margin-bottom:6px;font-weight:bold;">${pointText}点</div>
                    <div style="color:#aaa;font-size:11px;line-height:1.3;">${origin.effect}</div>
                </div>`;
        });
        html += '</div>';

        // 自定义背景
        html += `
            <div style="margin-bottom:20px;background:linear-gradient(135deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01));padding:18px;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">
                <div style="color:#888;font-size:12px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
                    <span>📝</span><span>自定义背景故事（可选）</span>
                </div>
                <textarea id="customBgInput" placeholder="例如：曾是名门望族的千金，因为家族被陷害而流落街头..." 
                    onchange="ACJTGame.charData.customBackground=this.value"
                    style="padding:12px;width:100%;height:70px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:13px;resize:none;box-sizing:border-box;font-family:'Microsoft YaHei';transition:all 0.3s;outline:none;"
                    onfocus="this.style.borderColor='#667eea';this.style.boxShadow='0 0 15px rgba(102,126,234,0.2)'"
                    onblur="this.style.borderColor='rgba(255,255,255,0.1)';this.style.boxShadow='none'">${this.charData.customBackground}</textarea>
            </div>
            <div style="display:flex;gap:15px;justify-content:center;">
                <button onclick="ACJTGame.goToStep(3)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← 上一步
                </button>
                <button onclick="ACJTGame.goToStep(5)" 
                    style="padding:12px 50px;background:linear-gradient(135deg,#2ed573,#26de81);color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;box-shadow:0 5px 20px rgba(46,213,115,0.3);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(46,213,115,0.4)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(46,213,115,0.3)'">
                    下一步 →
                </button>
            </div>`;
        return html;
    },

    // 步骤5: Roll卡组
    generateStep5HTML: function () {
        const points = this.calculatePoints();
        const prof = ProfessionConfig[this.charData.professionId];

        // 初始化已选职业卡数组
        if (!this.charData.selectedProfCards) {
            this.charData.selectedProfCards = [];
        }

        // 固定基础卡（8张）
        const baseCards = [
            { id: 'attack_001', name: '普通攻击', type: CardType.ATTACK },
            { id: 'attack_001', name: '普通攻击', type: CardType.ATTACK },
            { id: 'attack_001', name: '普通攻击', type: CardType.ATTACK },
            { id: 'attack_001', name: '普通攻击', type: CardType.ATTACK },
            { id: 'armor_001', name: '格挡', type: CardType.ARMOR },
            { id: 'armor_001', name: '格挡', type: CardType.ARMOR },
            { id: 'armor_001', name: '格挡', type: CardType.ARMOR },
            { id: 'h_attack_001', name: '媚眼', type: CardType.H_ATTACK }
        ];

        // 基础卡显示
        let baseCardsHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:15px;">';
        baseCards.forEach(card => {
            const color = CardTypeColors[card.type] || '#666';
            const fullCard = CardLibrary.find(c => c.id === card.id) || card;
            baseCardsHtml += `<div style="padding:6px 10px;background:rgba(0,0,0,0.4);border:1px solid ${color};border-radius:6px;font-size:11px;color:#aaa;"><span style="color:#ffd700;">${fullCard.cost || 1}⚡</span> ${card.name}</div>`;
        });
        baseCardsHtml += '</div>';

        // 已选职业卡显示（可点击删除）
        let selectedCardsHtml = '';
        if (this.charData.selectedProfCards.length > 0) {
            selectedCardsHtml = '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(255,255,255,0.1);"><div style="color:#ff6b9d;font-size:11px;margin-bottom:8px;text-align:center;">✨ 已选职业卡 (点击可删除)</div><div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">';
            this.charData.selectedProfCards.forEach((card, index) => {
                const color = CardTypeColors[card.type] || '#ff6b9d';
                selectedCardsHtml += `<div onclick="ACJTGame.removeSelectedCard(${index})" style="padding:6px 10px;background:rgba(255,107,157,0.2);border:1px solid ${color};border-radius:6px;font-size:11px;color:#fff;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(255,0,0,0.3)';this.style.borderColor='#ff4757'" onmouseout="this.style.background='rgba(255,107,157,0.2)';this.style.borderColor='${color}'"><span style="color:#ffd700;">${card.cost}⚡</span> ${card.name} ✕</div>`;
            });
            selectedCardsHtml += '</div></div>';
        }

        const totalCards = 8 + this.charData.selectedProfCards.length;
        const selectedCount = this.charData.selectedProfCards.length;
        const canSelectMore = selectedCount < 2;
        const canStart = selectedCount >= 2 && this.charData.name.trim();

        // Roll出的卡牌显示
        let rolledCardsHtml = '';
        if (this.charData.rolledCards && this.charData.rolledCards.length > 0) {
            rolledCardsHtml = `
                <div style="margin-bottom:20px;padding:15px;background:linear-gradient(135deg,rgba(102,126,234,0.15),rgba(118,75,162,0.15));border-radius:12px;border:1px solid rgba(102,126,234,0.3);">
                    <div style="color:#667eea;font-size:12px;margin-bottom:10px;text-align:center;">🎲 选择一张加入卡组 ${canSelectMore ? `(还可选${2 - selectedCount}张)` : '(已选满)'}</div>
                    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
                        ${this.charData.rolledCards.map((card, index) => {
                const color = CardTypeColors[card.type] || '#667eea';
                const canSelect = canSelectMore;
                return `<div onclick="${canSelect ? `ACJTGame.selectRolledCard(${index})` : ''}" 
                                style="padding:12px 15px;background:rgba(0,0,0,0.5);border:2px solid ${color};border-radius:10px;
                                cursor:${canSelect ? 'pointer' : 'not-allowed'};transition:all 0.2s;min-width:100px;text-align:center;
                                opacity:${canSelect ? '1' : '0.5'};"
                                ${canSelect ? `onmouseover="this.style.transform='scale(1.05)';this.style.boxShadow='0 5px 15px ${color}50'"
                                onmouseout="this.style.transform='scale(1)';this.style.boxShadow='none'"` : ''}>
                                <div style="color:#ffd700;font-size:11px;text-align:right;margin-bottom:2px;">${card.cost}⚡</div>
                                <div style="color:${color};font-size:13px;font-weight:bold;margin-bottom:4px;">${card.name}</div>
                                <div style="color:#888;font-size:10px;">${card.type}</div>
                                <div style="color:#666;font-size:11px;margin-top:4px;line-height:1.3;">${card.description}</div>
                            </div>`;
            }).join('')}
                    </div>
                </div>`;
        }

        return `
            <!-- 职业预览 -->
            <div style="background:linear-gradient(135deg,rgba(255,107,157,0.08),rgba(102,126,234,0.08));padding:20px;border-radius:14px;margin-bottom:20px;text-align:center;border:1px solid rgba(255,255,255,0.05);position:relative;overflow:hidden;">
                <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#ff6b9d,#667eea,#2ed573);"></div>
                ${prof.icon && prof.icon.startsWith('img/') ? `<img src="${prof.icon}" style="width:80px;height:80px;margin-bottom:10px;object-fit:contain;filter:drop-shadow(0 5px 10px rgba(0,0,0,0.3));">` : `<div style="font-size:50px;margin-bottom:10px;filter:drop-shadow(0 5px 10px rgba(0,0,0,0.3));">${prof.icon}</div>`}
                <div style="color:#fff;font-size:18px;font-weight:bold;margin-bottom:6px;">${prof.name}</div>
                <div style="color:#888;font-size:12px;line-height:1.4;">${prof.description}</div>
            </div>
            
            <!-- 卡组预览 -->
            <div style="margin-bottom:20px;padding:18px;background:linear-gradient(135deg,rgba(0,0,0,0.3),rgba(0,0,0,0.2));border-radius:14px;border:1px solid rgba(255,255,255,0.05);">
                <div style="color:#888;font-size:12px;margin-bottom:12px;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;">
                    <span>🃏</span>
                    <span>初始卡组</span>
                    <span style="background:rgba(255,107,157,0.2);color:#ff6b9d;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:bold;">${totalCards}/10</span>
                    <span style="color:#666;font-size:10px;">(基础8张 + 职业卡${selectedCount}/2张)</span>
                </div>
                ${baseCardsHtml}
                ${selectedCardsHtml}
            </div>
            
            ${rolledCardsHtml}
            
            <!-- Roll按钮 -->
            <div style="text-align:center;margin-bottom:25px;">
                <button onclick="ACJTGame.rollDeck()"
                    style="padding:14px 45px;background:linear-gradient(135deg,#667eea,#764ba2);
                    color:#fff;border:none;border-radius:25px;cursor:pointer;font-size:15px;font-weight:bold;
                    box-shadow:0 5px 20px rgba(102,126,234,0.4);transition:all 0.3s;"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 25px rgba(102,126,234,0.5)'"
                    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 5px 20px rgba(102,126,234,0.4)'">
                    🎲 Roll职业卡 <span style="opacity:0.8;font-size:13px;">(出3选1)</span>
                </button>
            </div>
            
            <!-- 导航按钮 -->
            <div style="display:flex;gap:15px;justify-content:center;">
                <button onclick="ACJTGame.goToStep(4)" 
                    style="padding:12px 35px;background:rgba(255,255,255,0.05);color:#888;border:1px solid rgba(255,255,255,0.1);border-radius:25px;cursor:pointer;font-size:14px;transition:all 0.3s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.1)';this.style.color='#fff'"
                    onmouseout="this.style.background='rgba(255,255,255,0.05)';this.style.color='#888'">
                    ← 上一步
                </button>
                <button onclick="ACJTGame.confirmCreation()" ${!canStart ? 'disabled' : ''}
                    style="padding:14px 55px;background:${canStart ? 'linear-gradient(135deg,#2ed573,#26de81)' : 'rgba(255,255,255,0.05)'};
                    color:${canStart ? '#fff' : '#666'};border:none;border-radius:25px;cursor:${canStart ? 'pointer' : 'not-allowed'};font-size:16px;font-weight:bold;
                    box-shadow:${canStart ? '0 5px 25px rgba(46,213,115,0.4)' : 'none'};opacity:${canStart ? '1' : '0.6'};transition:all 0.3s;"
                    ${canStart ? `onmouseover="this.style.transform='translateY(-2px) scale(1.02)';this.style.boxShadow='0 8px 30px rgba(46,213,115,0.5)'"
                    onmouseout="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='0 5px 25px rgba(46,213,115,0.4)'"` : ''}>
                    🎮 开始冒险
                </button>
            </div>
        `;
    },

    // 辅助函数
    refreshStep: function () {
        const modal = document.getElementById('acjtCharCreationModal');
        if (modal) modal.innerHTML = this.generateStepHTML();
    },

    selectProfession: function (profId) {
        this.charData.professionId = profId;
        this.refreshStep();
    },

    selectRace: function (raceId) {
        this.charData.raceId = raceId;
        this.refreshStep();
    },

    setBodyAttr: function (type, value) {
        this.charData.bodyAttributes[type] = value;
        this.refreshStep();
    },

    toggleStatus: function (statusId) {
        const idx = this.charData.startingStatuses.indexOf(statusId);
        if (idx >= 0) {
            this.charData.startingStatuses.splice(idx, 1);
        } else {
            // 检查点数是否足够（正面状态消耗点数）
            const status = StartingStatusConfig[statusId];
            if (status.points < 0 && this.calculatePoints() + status.points < 10) {
                alert('点数不足！至少需要保留10点用于Roll卡组');
                return;
            }
            this.charData.startingStatuses.push(statusId);
        }
        this.refreshStep();
    },

    selectOrigin: function (originId) {
        // 检查点数
        const oldOrigin = OriginConfig[this.charData.originId];
        const newOrigin = OriginConfig[originId];
        const pointsDiff = (newOrigin?.points || 0) - (oldOrigin?.points || 0);
        if (this.calculatePoints() + pointsDiff < 10) {
            alert('点数不足！');
            return;
        }
        this.charData.originId = originId;
        this.refreshStep();
    },

    // Roll卡组 - 出3张职业卡供选择
    rollDeck: function () {
        // 检查点数是否足够（每次Roll消耗10点）
        const currentPoints = this.calculatePoints();
        if (currentPoints < 10) {
            alert('点数不足！每次Roll需要消耗10点，当前剩余' + currentPoints + '点');
            return;
        }

        const prof = ProfessionConfig[this.charData.professionId];

        // 获取职业专属卡池
        const profCards = prof.professionCardPool || [];
        if (profCards.length === 0) {
            console.warn('该职业没有专属卡池');
            return;
        }

        // 增加roll次数计数（每次roll消耗10点）
        this.charData._rollCount = (this.charData._rollCount || 0) + 1;

        // 随机抽3张不重复的职业卡
        const shuffled = [...profCards].sort(() => Math.random() - 0.5);
        const rolledIds = shuffled.slice(0, 3);

        // 转换为卡牌对象
        this.charData.rolledCards = rolledIds.map(cardId => {
            const card = CardLibrary.find(c => c.id === cardId);
            return card ? { ...card } : null;
        }).filter(c => c);

        // 刷新界面
        this.refreshStep();
    },

    // 选择Roll出的卡牌
    selectRolledCard: function (index) {
        if (!this.charData.selectedProfCards) {
            this.charData.selectedProfCards = [];
        }

        // 最多选2张
        if (this.charData.selectedProfCards.length >= 2) {
            return;
        }

        // 获取选中的卡
        const card = this.charData.rolledCards[index];
        if (!card) return;

        // 添加到已选列表
        this.charData.selectedProfCards.push(card);

        // 清空当前roll的卡
        this.charData.rolledCards = [];

        // 刷新界面
        this.refreshStep();
    },

    // 删除已选的职业卡
    removeSelectedCard: function (index) {
        if (!this.charData.selectedProfCards) return;

        // 删除指定卡
        this.charData.selectedProfCards.splice(index, 1);

        // 刷新界面
        this.refreshStep();
    },

    // 确认创建
    confirmCreation: function () {
        // 检查是否选满2张职业卡
        const selectedCount = this.charData.selectedProfCards?.length || 0;
        if (selectedCount < 2) {
            alert('请先Roll并选择2张职业卡！');
            return;
        }

        // 验证姓名
        const playerName = this.charData.name.trim();
        if (!playerName) {
            alert('请输入角色姓名！');
            this.goToStep(1);
            return;
        }

        // 构建最终卡组：8张基础卡 + 2张已选职业卡
        CardDeckManager.deck = [];

        // 添加4张普通攻击
        for (let i = 0; i < 4; i++) {
            const card = CardLibrary.find(c => c.id === 'attack_001');
            if (card) CardDeckManager.deck.push({ ...card });
        }

        // 添加3张格挡
        for (let i = 0; i < 3; i++) {
            const card = CardLibrary.find(c => c.id === 'armor_001');
            if (card) CardDeckManager.deck.push({ ...card });
        }

        // 添加1张媚眼
        const meimei = CardLibrary.find(c => c.id === 'h_attack_001');
        if (meimei) CardDeckManager.deck.push({ ...meimei });

        // 添加2张已选职业卡
        this.charData.selectedProfCards.forEach(card => {
            CardDeckManager.deck.push({ ...card });
        });

        // 初始化玩家（使用完整创建数据）
        PlayerState.init(this.charData.professionId, playerName, {
            age: this.charData.age,
            raceId: this.charData.raceId,
            bodyAttributes: this.charData.bodyAttributes,
            originId: this.charData.originId,
            startingStatuses: this.charData.startingStatuses
        });
        PlayerState.save();

        // 保存卡组
        saveCardDeck();
        CardDeckManager.renderDeck();
        PlayerState.updateDisplay();

        // 关闭创建界面
        document.getElementById('acjtCharCreationModal')?.remove();

        // 🎮 清空游戏历史区域（移除主菜单）
        const gameHistory = document.getElementById('gameHistory');
        if (gameHistory) {
            gameHistory.innerHTML = '';
            console.log('[ACJT] 已清空主菜单');
        }

        // 🎮 清空人物图谱（新游戏不应保留旧存档的人物）
        if (window.characterGraphManager) {
            window.characterGraphManager.characters.clear();
            window.characterGraphManager.vectors.clear();
            window.characterGraphManager.stats = {
                totalCharacters: 0,
                lastUpdate: null,
                matchCount: 0,
                avgMatchScore: 0
            };
            // 清空IndexedDB中的人物图谱数据
            if (window.characterGraphManager.indexedDB) {
                try {
                    const db = window.characterGraphManager.indexedDB;
                    const transaction = db.transaction(['characters'], 'readwrite');
                    const store = transaction.objectStore('characters');
                    store.clear();
                    console.log('[ACJT] 已清空人物图谱');
                } catch (e) {
                    console.error('[ACJT] 清空人物图谱失败:', e);
                }
            }
        }

        // 🎮 设置游戏已开始状态（让sendUserInput能正常工作）
        if (typeof gameState !== 'undefined') {
            gameState.isGameStarted = true;
            gameState.conversationHistory = []; // 清空对话历史

            // 🔧 完全重置变量表单（清除所有旧数据）
            const race = RaceConfig[this.charData.raceId];
            const origin = OriginConfig[this.charData.originId];
            gameState.variables = {
                name: this.charData.name,
                age: this.charData.age,
                gender: '女',
                race: race?.name || '人类',
                raceId: this.charData.raceId,
                job: PlayerState.profession?.name || '冒险者',
                profession: PlayerState.profession?.id || null,
                professionName: PlayerState.profession?.name || '冒险者',
                origin: origin?.name || '新人冒险者',
                originId: this.charData.originId,
                identity: '艾超尖塔冒险者',
                location: '艾超尖塔入口',
                currentDateTime: '未知',
                corruption: PlayerState.corruption || 0,
                isVirgin: this.charData.isVirgin,
                bodyAttributes: this.charData.bodyAttributes,
                relationships: [],
                history: [],
                items: [],
                protagonist: null,
                specialStatus: {}
            };
            console.log('[ACJT] 游戏状态已完全重置');

            // 立即保存到IndexedDB（确保刷新后能恢复）
            if (typeof saveGameHistory === 'function') {
                saveGameHistory().then(() => {
                    console.log('[ACJT] 游戏状态已保存到IndexedDB');
                }).catch(err => console.error('[ACJT] 保存失败:', err));
            }
        }

        // 清空特殊状态并添加开局状态
        if (typeof SpecialStatusManager !== 'undefined') {
            SpecialStatusManager.statuses = {};

            // 添加开局选择的特殊状态
            this.charData.startingStatuses.forEach(statusId => {
                const status = StartingStatusConfig[statusId];
                if (status) {
                    // 避免双重start_前缀
                    const finalId = statusId.startsWith('start_') ? statusId : 'start_' + statusId;
                    SpecialStatusManager.statuses[finalId] = {
                        id: finalId,
                        name: status.name,
                        icon: status.icon,
                        desc: status.effect,
                        fullDesc: status.description,
                        permanent: true,
                        effect: 'startingStatus',
                        source: 'starting', // 🔧 标记为开局选择，不会被教堂清除
                        ...status.statusEffect
                    };
                }
            });

            SpecialStatusManager.save();
            SpecialStatusManager.updateDisplay();
            SpecialStatusManager.applyEffects(); // 🔧 重新计算效果修正
        }

        // 🔧 清除旧的状态效果修正
        if (typeof PlayerState !== 'undefined') {
            PlayerState.statusEffects = { energyMod: 0, attackMod: 0, defenseMod: 0, maxHpMod: 0, damageTakenMod: 0 };
            PlayerState.updateDisplay();
        }

        // 🔧 清空黑市购买记录，但标记开局已选的同款
        if (typeof BlackMarketSystem !== 'undefined') {
            BlackMarketSystem.purchasedMods = [];

            // 如果开局选择了与黑市同款的状态，标记为已购买
            this.charData.startingStatuses.forEach(statusId => {
                const status = StartingStatusConfig[statusId];
                if (status && status.linkedBodyMod) {
                    BlackMarketSystem.purchasedMods.push(status.linkedBodyMod);
                }
            });

            BlackMarketSystem.savePurchased();
            console.log('[ACJT] 黑市已标记开局状态:', BlackMarketSystem.purchasedMods);
        }

        // 🎮 清空向量库（contextVectorManager 是主要使用的）
        if (window.contextVectorManager) {
            window.contextVectorManager.clear();
            // 确保IndexedDB也清空
            window.contextVectorManager.saveToIndexedDB().then(() => {
                console.log('[ACJT] ✅ 已清空 contextVectorManager（含IndexedDB）');
            }).catch(err => console.error('[ACJT] 清空向量库失败:', err));
        }
        // 兼容旧版 vectorLib
        if (window.vectorLib) {
            window.vectorLib.conversations = new Map();
            window.vectorLib.historyLayers = [];
            if (window.vectorLib.saveToIndexedDB) {
                window.vectorLib.saveToIndexedDB();
            }
            console.log('[ACJT] 已清空历史矩阵(vectorLib)');
        }
        // 清空矩阵管理器
        if (window.matrixManager) {
            if (window.matrixManager.clear) {
                window.matrixManager.clear();
            } else {
                window.matrixManager.layers = [];
            }
            console.log('[ACJT] ✅ 已清空矩阵管理器');
        }

        // 🎮 刷新状态栏显示
        if (typeof renderStatusPanel === 'function') {
            renderStatusPanel(gameState.variables);
            console.log('[ACJT] 状态栏已刷新');
        }

        this.isGameStarted = true;

        // 🎮 发送开局提示给AI
        this.sendOpeningPrompt();
    },

    // 发送开局提示
    sendOpeningPrompt: function () {
        const d = this.charData;
        const prof = ProfessionConfig[d.professionId];
        const race = RaceConfig[d.raceId];
        const origin = OriginConfig[d.originId];
        const body = d.bodyAttributes;

        // 获取身体属性描述
        const getBodyDesc = (type, id) => {
            const item = BodyConfig[type]?.find(i => i.id === id);
            return item ? item.desc : '';
        };

        // 构建特殊状态描述
        let statusDesc = '';
        if (d.startingStatuses.length > 0) {
            statusDesc = '\n- 特殊状态：';
            d.startingStatuses.forEach(sid => {
                const s = StartingStatusConfig[sid];
                if (s) statusDesc += `【${s.name}】${s.description}；`;
            });
        }

        // 自定义背景
        let customBg = d.customBackground ? `\n- 额外背景：${d.customBackground}` : '';

        const openingPrompt = `开始游戏。我的角色完整信息：
- 姓名：${d.name}
- 性别：女
- 年龄：${d.age}岁
- 种族：${race?.icon || ''} ${race?.name || '人类'}（${race?.description || ''}）
- 职业：${prof?.name || '冒险者'}（${prof?.description || ''}）
- 出身背景：${origin?.icon || ''} ${origin?.name || '新人冒险者'}（${origin?.description || ''}）
- 是否处女：${d.isVirgin ? '是' : '否'}
- 身高体型：${getBodyDesc('height', body.height)}，${getBodyDesc('weight', body.weight)}
- 胸部：${BodyConfig.chest.find(i => i.id === body.chest)?.name || 'C罩杯'}
- 臀部：${getBodyDesc('hips', body.hips)}
- 小穴特征：${getBodyDesc('vagina', body.vagina)}${statusDesc}${customBg}

【极其重要】这是游戏开局，必须完成以下任务：
1. 生成主角的完整详细信息（protagonist对象），包括：
   - appearance: 根据上述身体属性详细描写外貌
   - sexualPreference: 根据职业和背景合理设定性癖
   - isVirgin: 必须设置为 ${d.isVirgin}
   - bodyParts: 各部位详细描写（vagina要体现"${getBodyDesc('vagina', body.vagina)}"特征）
2. 设置currentDateTime（当前时间）
3. 根据出身背景"${origin?.name || '新人冒险者'}"生成合理的开局剧情

请生成至少800字的精彩开局剧情，描写：
- 主角的外貌特征（融入种族"${race?.name}"和身体属性）
- 来到艾超尖塔的原因（与"${origin?.name}"背景呼应）
- 踏入尖塔入口时的场景和心理描写。`;

        console.log('[ACJT] 发送开局提示:', openingPrompt);
        this.sendToAI(openingPrompt);
    },

    // 显示继续前进按钮
    showContinueButton: function () {
        const btn = document.getElementById('acjtContinueBtn');
        if (btn) {
            btn.style.display = 'block';
        }
    },

    // 隐藏继续前进按钮
    hideContinueButton: function () {
        const btn = document.getElementById('acjtContinueBtn');
        if (btn) {
            btn.style.display = 'none';
        }
    },

    // 发送消息给AI（使用supply完整结构）
    sendToAI: function (message) {
        console.log('[ACJT] 发送给AI:', message);

        // 确保游戏状态为已开始（避免"请先创建角色"提示）
        if (typeof gameState !== 'undefined' && !gameState.isGameStarted) {
            gameState.isGameStarted = true;
            console.log('[ACJT] 自动设置游戏状态为已开始');
        }

        // 构建消息并发送
        const userInput = document.getElementById('userInput');
        if (userInput) {
            userInput.value = message;
            // 触发发送
            if (typeof sendUserInput === 'function') {
                sendUserInput();
            }
        }

        // 标记需要添加"继续前进"选项
        this.needContinueOption = true;
    },

    // 🔧 记录到重要历史（向量库+矩阵）
    recordToHistory: function (text) {
        console.log('[ACJT] 记录到历史:', text);

        // 1. 添加到 gameState.variables.history（存储为字符串格式）
        if (typeof gameState !== 'undefined') {
            if (!gameState.variables.history) {
                gameState.variables.history = [];
            }
            // 格式：[第N层] 事件内容
            const historyText = `[第${PlayerState.floor || 1}层] ${text}`;
            gameState.variables.history.push(historyText);

            // 更新状态面板显示
            if (typeof updateStatusPanel === 'function') {
                updateStatusPanel();
            }
        }

        // 2. 添加到向量库
        if (typeof window.contextVectorManager !== 'undefined' && window.contextVectorManager.addToHistoryLibrary) {
            window.contextVectorManager.addToHistoryLibrary(text);
            console.log('[ACJT] 已添加到向量库');
        }

        // 3. 添加到矩阵（如果存在）
        if (typeof window.matrixManager !== 'undefined' && window.matrixManager.addEntry) {
            window.matrixManager.addEntry({
                type: 'history',
                content: text,
                timestamp: Date.now()
            });
            console.log('[ACJT] 已添加到矩阵');
        }

        // 4. 保存游戏状态
        if (typeof saveGameHistory === 'function') {
            saveGameHistory().catch(err => console.error('[ACJT] 保存失败:', err));
        }
    },

    // 添加"继续前进"选项到AI回复后
    addContinueOption: function () {
        if (!this.needContinueOption) return;

        // 🔧 等待AI完成生成后再添加按钮
        const waitForComplete = (attempts = 0) => {
            if (attempts > 30) { // 最多等待15秒
                this.needContinueOption = false;
                return;
            }

            // 检查是否有发送按钮被禁用（表示AI正在生成）
            const sendBtn = document.getElementById('sendMessage');
            const isGenerating = sendBtn && sendBtn.disabled;

            if (isGenerating) {
                // AI正在生成，继续等待
                setTimeout(() => waitForComplete(attempts + 1), 500);
                return;
            }

            // AI已完成，尝试添加按钮
            const optionsContainer = document.querySelector('.options-container');
            // 避免重复添加
            if (document.querySelector('.acjt-continue-btn')) {
                this.needContinueOption = false;
                return;
            }

            if (optionsContainer) {
                this.needContinueOption = false;

                const continueBtn = document.createElement('button');
                continueBtn.className = 'option-btn acjt-continue-btn';
                continueBtn.innerHTML = '继续前进（进入下一层）';
                continueBtn.style.cssText = `
                    background: linear-gradient(135deg, #2ed573, #26de81) !important;
                    border: none !important; padding: 12px 20px !important; border-radius: 8px !important;
                    color: #fff !important; cursor: pointer !important; font-size: 14px !important; 
                    margin-top: 10px !important; width: 100% !important;
                `;
                continueBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    RouteSystem.showRouteSelection();
                };
                optionsContainer.appendChild(continueBtn);
                console.log('[ACJT] 已添加继续前进按钮');
            } else {
                // 重试
                setTimeout(() => waitForComplete(attempts + 1), 500);
            }
        };

        // 延迟开始检测，避免过早检测
        setTimeout(() => waitForComplete(), 1500);
    }
};

// ==================== 初始化函数 ====================
function initCardSystem() {
    // 尝试从localStorage加载
    const savedDeck = localStorage.getItem('acjt_card_deck');
    if (savedDeck) {
        try {
            CardDeckManager.init(JSON.parse(savedDeck));
        } catch (e) {
            console.error('[卡牌系统] 加载卡组失败:', e);
            CardDeckManager.deck = [];
        }
    }

    // 加载玩家状态
    PlayerState.load();

    // 加载特殊状态
    SpecialStatusManager.load();

    // 加载身体改造（同步到特殊状态）
    BlackMarketSystem.loadPurchased();

    // 渲染
    CardDeckManager.renderDeck();
    PlayerState.updateDisplay();

    // 🎮 如果游戏已开始（有保存的玩家状态），显示继续前进按钮
    if (PlayerState.floor > 0 || CardDeckManager.deck.length > 0) {
        ACJTGame.showContinueButton();
        ACJTGame.isGameStarted = true;
        // 同步游戏状态
        if (typeof gameState !== 'undefined') {
            gameState.isGameStarted = true;
        }
        console.log('[卡牌系统] 检测到已有存档，显示继续前进按钮');
    }

    console.log('[卡牌系统] 初始化完成');
}

// 保存卡组
function saveCardDeck() {
    const deckData = CardDeckManager.getDeckData();
    localStorage.setItem('acjt_card_deck', JSON.stringify(deckData));
    console.log('[卡牌系统] 卡组已保存');
}

// 覆盖原有的startGame函数
window.acjtStartGame = function () {
    console.log('[ACJT] 开始游戏');
    ACJTGame.showCharacterCreation();
};

// 监听AI回复完成，添加继续前进选项
// 使用 MutationObserver 监听选项容器的添加
const setupContinueOptionObserver = () => {
    const gameHistory = document.getElementById('gameHistory');
    if (!gameHistory) {
        setTimeout(setupContinueOptionObserver, 500);
        return;
    }

    const observer = new MutationObserver((mutations) => {
        if (ACJTGame.needContinueOption) {
            // 检查是否有新的 options-container 被添加
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1) {
                        const optionsContainer = node.querySelector?.('.options-container') ||
                            (node.classList?.contains('options-container') ? node : null);
                        if (optionsContainer) {
                            ACJTGame.addContinueOption();
                            break;
                        }
                    }
                }
            }
        }
    });

    observer.observe(gameHistory, { childList: true, subtree: true });
    console.log('[ACJT] 选项容器观察器已启动');
};

// 页面加载后启动观察器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupContinueOptionObserver);
} else {
    setTimeout(setupContinueOptionObserver, 500);
}

// ==================== 导出到全局 ====================
window.CardType = CardType;
window.CardTypeNames = CardTypeNames;
window.CardTypeColors = CardTypeColors;
window.CardLibrary = CardLibrary;
window.CardDeckManager = CardDeckManager;
window.AICardParser = AICardParser;
window.RouteType = RouteType;
window.RouteTypeConfig = RouteTypeConfig;
window.RouteSystem = RouteSystem;
window.BattleSystem = BattleSystem;
window.ShopSystem = ShopSystem;
window.RestSystem = RestSystem;
window.TownSystem = TownSystem;
window.BlackMarketSystem = BlackMarketSystem;
window.CultivationSystem = CultivationSystem;
window.BodyModConfig = BodyModConfig;
window.PlayerState = PlayerState;
window.ProfessionConfig = ProfessionConfig;
window.RaceConfig = RaceConfig;
window.BodyConfig = BodyConfig;
window.StartingStatusConfig = StartingStatusConfig;
window.OriginConfig = OriginConfig;
window.MonsterConfig = MonsterConfig;
window.RelicConfig = RelicConfig;
window.SpecialStatusConfig = SpecialStatusConfig;
window.SpecialStatusManager = SpecialStatusManager;
window.RandomEventPrompts = RandomEventPrompts;
window.ACJTGame = ACJTGame;
window.initCardSystem = initCardSystem;
window.saveCardDeck = saveCardDeck;

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initCardSystem, 500);
    });
} else {
    setTimeout(initCardSystem, 500);
}

console.log('[卡牌系统] acjt-cards.js 已加载');

// ==================== ACJT专用变量编辑器 ====================
function openACJTVariableEditor() {
    const modal = document.createElement('div');
    modal.id = 'acjtVariableEditorModal';
    modal.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.9); display: flex;
        justify-content: center; align-items: center; z-index: 10000;
        padding: 20px; box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #667eea; border-radius: 16px;
        padding: 25px; width: 100%; max-width: 600px; max-height: 90vh;
        overflow-y: auto; color: #fff;
    `;

    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #667eea; font-size: 18px;">🎮 ACJT 变量编辑器</h2>
            <div style="display: flex; gap: 10px;">
                <button onclick="saveACJTVariables()" style="padding: 8px 20px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">保存</button>
                <button onclick="document.getElementById('acjtVariableEditorModal')?.remove()" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">关闭</button>
            </div>
        </div>
        
        <!-- 基本信息 -->
        <div style="margin-bottom: 20px;">
            <h3 style="color: #ffd700; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">👤 基本信息</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">姓名</label>
                    <input type="text" id="acjt-ve-name" value="${PlayerState.name || ''}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #fff; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">职业</label>
                    <input type="text" id="acjt-ve-profession" value="${PlayerState.profession?.name || '无'}" disabled style="width: 100%; padding: 8px; background: #1a1a3a; border: 1px solid #333; border-radius: 4px; color: #666; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">当前层数</label>
                    <input type="number" id="acjt-ve-floor" value="${PlayerState.floor || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #fff; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">金币 💰</label>
                    <input type="number" id="acjt-ve-gold" value="${PlayerState.gold || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ffd700; box-sizing: border-box;">
                </div>
            </div>
        </div>
        
        <!-- 战斗属性 -->
        <div style="margin-bottom: 20px;">
            <h3 style="color: #ff6b81; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">⚔️ 战斗属性</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px;">
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">生命值 ❤️</label>
                    <input type="number" id="acjt-ve-hp" value="${PlayerState.hp || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ff6b81; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">生命上限</label>
                    <input type="number" id="acjt-ve-maxHp" value="${PlayerState.maxHp || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ff6b81; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">费用 ⚡</label>
                    <input type="number" id="acjt-ve-energy" value="${PlayerState.energy || 3}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ffd700; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">攻击力</label>
                    <input type="number" id="acjt-ve-attack" value="${PlayerState.attack || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #ff4757; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">防御力</label>
                    <input type="number" id="acjt-ve-defense" value="${PlayerState.defense || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #70a1ff; box-sizing: border-box;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">基础护甲 🛡️</label>
                    <input type="number" id="acjt-ve-baseArmor" value="${PlayerState.baseArmor || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #70a1ff; box-sizing: border-box;">
                </div>
            </div>
        </div>
        
        <!-- 特殊属性 -->
        <div style="margin-bottom: 20px;">
            <h3 style="color: #9c88ff; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">💜 特殊属性</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                <div>
                    <label style="display: block; font-size: 11px; color: #888; margin-bottom: 4px;">堕落值 💜</label>
                    <input type="number" id="acjt-ve-corruption" value="${PlayerState.corruption || 0}" style="width: 100%; padding: 8px; background: #2a2a4a; border: 1px solid #444; border-radius: 4px; color: #9c88ff; box-sizing: border-box;">
                </div>
            </div>
        </div>
        
        <!-- 楼层回滚 -->
        <div style="margin-bottom: 20px;">
            <h3 style="color: #ffa502; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">⏪ 楼层回滚</h3>
            <div style="font-size: 11px; color: #888; margin-bottom: 10px;">回滚到之前的楼层会恢复当时的堕落值、金币、卡组等状态</div>
            <div id="acjt-ve-snapshots" style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${generateFloorSnapshotButtons()}
            </div>
        </div>
        
        <!-- 圣遗物 -->
        <div>
            <h3 style="color: #2ed573; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #333; padding-bottom: 8px;">🏆 圣遗物 (${PlayerState.relics?.length || 0}个)</h3>
            <div id="acjt-ve-relics" style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${(PlayerState.relics || []).map((r, i) => `
                    <div style="background: #2a2a4a; border: 1px solid #444; border-radius: 6px; padding: 8px 12px; display: flex; align-items: center; gap: 8px;">
                        <span>${RelicConfig[r]?.icon || '🏆'}</span>
                        <span style="font-size: 12px;">${RelicConfig[r]?.name || r}</span>
                        <button onclick="removeACJTRelic(${i})" style="background: #ff4757; border: none; border-radius: 4px; color: #fff; padding: 2px 6px; cursor: pointer; font-size: 10px;">×</button>
                    </div>
                `).join('') || '<span style="color: #666; font-size: 12px;">暂无圣遗物</span>'}
            </div>
        </div>
    `;

    modal.appendChild(content);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

// 保存ACJT变量
function saveACJTVariables() {
    PlayerState.name = document.getElementById('acjt-ve-name')?.value || '旅行者';
    PlayerState.floor = parseInt(document.getElementById('acjt-ve-floor')?.value) || 0;
    PlayerState.gold = parseInt(document.getElementById('acjt-ve-gold')?.value) || 0;
    PlayerState.hp = parseInt(document.getElementById('acjt-ve-hp')?.value) || 70;
    PlayerState.maxHp = parseInt(document.getElementById('acjt-ve-maxHp')?.value) || 70;
    PlayerState.energy = parseInt(document.getElementById('acjt-ve-energy')?.value) || 3;
    PlayerState.attack = parseInt(document.getElementById('acjt-ve-attack')?.value) || 0;
    PlayerState.defense = parseInt(document.getElementById('acjt-ve-defense')?.value) || 0;
    PlayerState.baseArmor = parseInt(document.getElementById('acjt-ve-baseArmor')?.value) || 0;
    PlayerState.corruption = parseInt(document.getElementById('acjt-ve-corruption')?.value) || 0;

    // 保存到localStorage
    PlayerState.save();

    // 更新显示
    PlayerState.updateDisplay();
    if (typeof updateStatusPanel === 'function') {
        updateStatusPanel();
    }

    // 关闭弹窗
    document.getElementById('acjtVariableEditorModal')?.remove();

    if (typeof showNotification === 'function') {
        showNotification('变量已保存', 'success');
    } else {
        alert('变量已保存');
    }
}

// 移除圣遗物
function removeACJTRelic(index) {
    if (PlayerState.relics && PlayerState.relics[index] !== undefined) {
        PlayerState.relics.splice(index, 1);
        PlayerState.save();
        // 刷新编辑器
        document.getElementById('acjtVariableEditorModal')?.remove();
        openACJTVariableEditor();
    }
}

// 🔧 生成楼层快照按钮HTML
function generateFloorSnapshotButtons() {
    const snapshots = PlayerState.floorSnapshots || {};
    const floors = Object.keys(snapshots);

    if (floors.length === 0) {
        return '<span style="color: #666; font-size: 12px;">暂无快照（进入新楼层时自动创建）</span>';
    }

    return floors.sort((a, b) => parseInt(b) - parseInt(a)).map(floor => {
        const snapshot = snapshots[floor];
        return '<button onclick="rollbackToFloorConfirm(' + floor + ')" ' +
            'style="background: linear-gradient(135deg, #ffa502 0%, #ff7f50 100%); ' +
            'border: none; border-radius: 6px; padding: 8px 12px; ' +
            'color: #fff; cursor: pointer; font-size: 12px;">' +
            '第' + floor + '层 (堕落:' + snapshot.corruption + ')' +
            '</button>';
    }).join('');
}

// 🔧 确认楼层回滚
function rollbackToFloorConfirm(targetFloor) {
    const snapshot = PlayerState.floorSnapshots[targetFloor];
    if (!snapshot) {
        alert('找不到该楼层的快照');
        return;
    }

    const confirmMsg = '确定要回滚到第' + targetFloor + '层吗？\n\n' +
        '回滚后状态：\n' +
        '- 堕落值: ' + snapshot.corruption + '\n' +
        '- 金币: ' + snapshot.gold + '\n' +
        '- HP: ' + snapshot.hp + '/' + snapshot.maxHp + '\n\n' +
        '注意：该楼层之后的所有进度将丢失！';

    if (confirm(confirmMsg)) {
        PlayerState.rollbackToFloor(targetFloor);

        // 同步到变量表单
        if (typeof gameState !== 'undefined' && gameState.variables) {
            gameState.variables.corruption = PlayerState.corruption;
        }

        // 刷新编辑器
        document.getElementById('acjtVariableEditorModal')?.remove();
        openACJTVariableEditor();

        if (typeof showNotification === 'function') {
            showNotification('已回滚到第' + targetFloor + '层', 'success');
        } else {
            alert('已回滚到第' + targetFloor + '层');
        }
    }
}

// 覆盖原有的openVariableEditor函数（ACJT模式下使用专用编辑器）
window.openVariableEditor = function () {
    if (typeof PlayerState !== 'undefined' && PlayerState.profession) {
        // ACJT模式：使用专用编辑器
        openACJTVariableEditor();
    } else if (typeof window._originalOpenVariableEditor === 'function') {
        // 非ACJT模式：使用原编辑器
        window._originalOpenVariableEditor();
    }
};

// 保存原函数引用
if (typeof openVariableEditor === 'function' && !window._originalOpenVariableEditor) {
    window._originalOpenVariableEditor = openVariableEditor;
}

window.openACJTVariableEditor = openACJTVariableEditor;
window.saveACJTVariables = saveACJTVariables;
window.removeACJTRelic = removeACJTRelic;
window.generateFloorSnapshotButtons = generateFloorSnapshotButtons;
window.rollbackToFloorConfirm = rollbackToFloorConfirm;
