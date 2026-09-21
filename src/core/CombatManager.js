/**
 * 战斗管理器 - 简化版
 */

export class CombatManager {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.isActive = false;
    }

    async init() {
        console.log('[CombatManager] 初始化完成');
    }

    start(enemyData) {
        console.log('[CombatManager] 开始战斗:', enemyData);
        this.isActive = true;
        // 简化实现
    }
}
