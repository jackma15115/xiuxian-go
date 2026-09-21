/**
 * UI管理器 - 简化版
 */

export class UIManager {
    constructor(gameCore) {
        this.gameCore = gameCore;
        this.currentTheme = 'default';
    }

    async init() {
        console.log('[UIManager] 初始化完成');
    }

    async initGameUI(gameConfig) {
        console.log('[UIManager] 初始化游戏UI:', gameConfig.name);
        // 应用主题
        if (gameConfig.ui?.theme) {
            this.currentTheme = gameConfig.ui.theme;
        }
        // 应用自定义CSS
        if (gameConfig.ui?.customCSS) {
            this.applyCustomCSS(gameConfig.ui.customCSS);
        }
    }

    applyCustomCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    showModal(content) {
        console.log('[UIManager] 显示模态框:', content);
        // 简化实现
    }

    update() {
        console.log('[UIManager] 更新UI');
        // 简化实现
    }
}
