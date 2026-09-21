/**
 * 游戏注册中心
 * 管理所有可用的游戏配置
 */

import XiuxianGameConfig from './XiuxianGame.js';
import BaihuGameConfig from './BaihuGame.js';

export class GameRegistry {
    constructor() {
        this.games = new Map();
        this.categories = new Map();
        this.loadBuiltinGames();
    }
    
    /**
     * 加载内置游戏
     */
    loadBuiltinGames() {
        // 注册修仙游戏
        this.register(XiuxianGameConfig, 'xiuxian');
        
        // 注册白虎宗游戏
        this.register(BaihuGameConfig, 'sect');
        
        console.log('[GameRegistry] 内置游戏加载完成');
    }
    
    /**
     * 注册游戏
     */
    register(gameConfig, category = 'default') {
        // 验证配置
        const validation = gameConfig.validate();
        if (!validation.isValid) {
            console.error(`[GameRegistry] 游戏配置验证失败:`, validation.errors);
            throw new Error(`游戏配置无效: ${validation.errors.join(', ')}`);
        }
        
        // 注册游戏
        this.games.set(gameConfig.id, gameConfig);
        
        // 添加到分类
        if (!this.categories.has(category)) {
            this.categories.set(category, new Set());
        }
        this.categories.get(category).add(gameConfig.id);
        
        console.log(`[GameRegistry] 游戏注册成功: ${gameConfig.name} (${gameConfig.id})`);
    }
    
    /**
     * 获取游戏配置
     */
    getGame(gameId) {
        return this.games.get(gameId);
    }
    
    /**
     * 获取所有游戏列表
     */
    getAllGames() {
        return Array.from(this.games.values()).map(game => ({
            id: game.id,
            name: game.name,
            version: game.version,
            description: game.description,
            author: game.author,
            thumbnail: game.thumbnail,
            features: game.features
        }));
    }
    
    /**
     * 按分类获取游戏
     */
    getGamesByCategory(category) {
        const gameIds = this.categories.get(category);
        if (!gameIds) return [];
        
        return Array.from(gameIds).map(id => this.getGame(id));
    }
    
    /**
     * 获取所有分类
     */
    getCategories() {
        return Array.from(this.categories.keys());
    }
    
    /**
     * 从JSON导入游戏配置
     */
    async importFromJSON(jsonString, category = 'custom') {
        try {
            const data = JSON.parse(jsonString);
            const { GameConfig } = await import('./GameConfigTemplate.js');
            const gameConfig = GameConfig.fromJSON(data);
            this.register(gameConfig, category);
            return gameConfig;
        } catch (error) {
            console.error('[GameRegistry] 导入游戏配置失败:', error);
            throw error;
        }
    }
    
    /**
     * 导出游戏配置为JSON
     */
    exportToJSON(gameId) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error(`游戏不存在: ${gameId}`);
        }
        return JSON.stringify(game.toJSON(), null, 2);
    }
    
    /**
     * 删除游戏
     */
    unregister(gameId) {
        if (this.games.has(gameId)) {
            this.games.delete(gameId);
            
            // 从所有分类中移除
            for (const [category, gameIds] of this.categories.entries()) {
                gameIds.delete(gameId);
                if (gameIds.size === 0) {
                    this.categories.delete(category);
                }
            }
            
            console.log(`[GameRegistry] 游戏已删除: ${gameId}`);
            return true;
        }
        return false;
    }
    
    /**
     * 检查游戏是否存在
     */
    hasGame(gameId) {
        return this.games.has(gameId);
    }
    
    /**
     * 搜索游戏
     */
    searchGames(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllGames().filter(game => 
            game.name.toLowerCase().includes(lowerQuery) ||
            game.description.toLowerCase().includes(lowerQuery) ||
            game.author.toLowerCase().includes(lowerQuery)
        );
    }
    
    /**
     * 获取游戏统计信息
     */
    getStats() {
        return {
            totalGames: this.games.size,
            categories: this.getCategories(),
            gamesByCategory: Object.fromEntries(
                Array.from(this.categories.entries()).map(([cat, ids]) => [cat, ids.size])
            )
        };
    }
}

// 创建全局实例
const gameRegistry = new GameRegistry();
export default gameRegistry;
