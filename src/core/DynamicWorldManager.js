/**
 * 动态世界管理器 - 简化版
 */

export class DynamicWorldManager {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.enabled = false;
        this.prompt = '';
    }

    async init() {
        console.log('[DynamicWorldManager] 初始化完成');
    }

    setPrompt(prompt) {
        this.prompt = prompt;
    }

    isEnabled() {
        return this.enabled;
    }

    processResponse(data) {
        // 简化实现
    }
}
