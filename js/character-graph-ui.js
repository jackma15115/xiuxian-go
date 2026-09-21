/**
 * 人物图谱UI管理
 * 提供配置界面和人物管理界面
 */

class CharacterGraphUI {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * 初始化UI
     */
    async init() {
        if (this.isInitialized) {
            return;
        }

        // 等待DOM加载
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        this.isInitialized = true;
        console.log('[人物图谱UI] 初始化完成');
    }

    /**
     * 创建配置面板HTML
     */
    createConfigPanelHTML() {
        return `
            <div class="config-section" id="characterGraphSection" style="display: none;">
                <div class="config-section-header" onclick="toggleSection('characterGraphSection')">
                    <span>👥 人物图谱设置</span>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="config-section-content">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 14px; color: white; margin-bottom: 8px;">
                            <strong>🌟 人物图谱系统</strong>
                        </div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.9); line-height: 1.6;">
                            自动提取人物的<strong>姓名、性格、外貌</strong>到向量图谱库，通过向量匹配智能检索相关人物，只将匹配度高的人物加入上下文，避免上下文过长。
                        </div>
                    </div>

                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="enableCharacterGraph" onchange="characterGraphUI.toggleCharacterGraph()" checked>
                            <span>启用人物图谱系统</span>
                        </label>
                        <small style="color: #999; display: block; margin-top: 5px;">
                            启用后，人物信息将存储到图谱，通过向量匹配动态加载到上下文
                        </small>
                    </div>

                    <div id="characterGraphFields" style="display: block;">
                        <div class="form-group">
                            <label>
                                <span>匹配阈值</span>
                                <input type="range" id="graphMatchThreshold" min="0" max="100" value="40" 
                                    oninput="document.getElementById('graphMatchThresholdValue').textContent = this.value + '%'">
                                <span id="graphMatchThresholdValue" style="margin-left: 10px;">40%</span>
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                只有相似度高于此值的人物才会被加入上下文
                            </small>
                        </div>

                        <div class="form-group">
                            <label>
                                <span>上下文最大人物数</span>
                                <input type="number" id="graphMaxCharacters" min="1" max="10" value="3" style="width: 80px;">
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                每次对话最多加载多少个相关人物到上下文
                            </small>
                        </div>

                        <div class="form-group">
                            <label>
                                <span>姓名权重</span>
                                <input type="range" id="graphNameWeight" min="1" max="5" step="0.5" value="3" 
                                    oninput="document.getElementById('graphNameWeightValue').textContent = this.value">
                                <span id="graphNameWeightValue" style="margin-left: 10px;">3</span>
                            </label>
                            <small style="color: #999; display: block; margin-top: 5px;">
                                姓名在向量匹配中的权重（相对于性格和外貌）
                            </small>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="graphAutoExtract" checked>
                                <span>自动提取AI响应中的人物</span>
                            </label>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="graphAutoMatch" checked>
                                <span>自动匹配相关人物到上下文</span>
                            </label>
                        </div>

                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <input type="checkbox" id="graphDebugMode" checked>
                                <span>启用调试日志</span>
                            </label>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button onclick="characterGraphUI.saveConfig()" 
                                style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                💾 保存配置
                            </button>
                            <button onclick="characterGraphUI.openManagementPanel()" 
                                style="flex: 1; padding: 10px; background: #764ba2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                📊 管理图谱
                            </button>
                        </div>

                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="characterGraphUI.migrateRelationships()" 
                                style="flex: 1; padding: 10px; background: #f39c12; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                🚀 迁移现有人物
                            </button>
                            <button onclick="characterGraphUI.testMatch()" 
                                style="flex: 1; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                🔍 测试匹配
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 创建管理面板HTML
     */
    createManagementPanelHTML() {
        return `
            <div id="characterGraphManagementModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; overflow: auto;">
                <div style="max-width: 900px; margin: 0 auto; background: #1a1a2e; border-radius: 10px; padding: 30px; position: relative;">
                    <button onclick="characterGraphUI.closeManagementPanel()" 
                        style="position: absolute; top: 20px; right: 20px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 20px;">
                        ×
                    </button>

                    <h2 style="color: white; margin-bottom: 20px;">👥 人物图谱管理</h2>

                    <!-- 统计信息 -->
                    <div id="graphStatsPanel" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">总人物数</div>
                                <div id="statTotalCharacters" style="font-size: 24px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">匹配次数</div>
                                <div id="statMatchCount" style="font-size: 24px; font-weight: bold;">0</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; opacity: 0.8;">平均匹配度</div>
                                <div id="statAvgScore" style="font-size: 24px; font-weight: bold;">0%</div>
                            </div>
                        </div>
                    </div>

                    <!-- 搜索框 -->
                    <div style="margin-bottom: 20px;">
                        <input type="text" id="characterSearchInput" placeholder="🔍 搜索人物姓名、性格或外貌..." 
                            style="width: 100%; padding: 12px; border: 1px solid #444; background: #2a2a3e; color: white; border-radius: 5px; font-size: 14px;"
                            onkeyup="characterGraphUI.searchCharacters()">
                    </div>

                    <!-- 人物列表 -->
                    <div id="characterListPanel" style="max-height: 400px; overflow-y: auto; background: #2a2a3e; border-radius: 8px; padding: 15px;">
                        <div style="text-align: center; color: #999; padding: 40px;">
                            加载中...
                        </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="characterGraphUI.exportGraph()" 
                            style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📤 导出图谱
                        </button>
                        <button onclick="characterGraphUI.importGraph()" 
                            style="flex: 1; padding: 12px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📥 导入图谱
                        </button>
                        <button onclick="characterGraphUI.clearGraph()" 
                            style="flex: 1; padding: 12px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🗑️ 清空图谱
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染人物列表
     */
    async renderCharacterList(searchQuery = '') {
        const listPanel = document.getElementById('characterListPanel');
        if (!listPanel) return;

        const manager = window.characterGraphManager;
        if (!manager || !manager.isInitialized) {
            listPanel.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">图谱管理器未初始化</div>';
            return;
        }

        const allCharacters = Array.from(manager.characters.values());
        
        // 过滤
        let filteredCharacters = allCharacters;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredCharacters = allCharacters.filter(char => 
                (char.name || '').toLowerCase().includes(query) ||
                (char.personality || '').toLowerCase().includes(query) ||
                (char.appearance || '').toLowerCase().includes(query)
            );
        }

        // 排序（按最后匹配时间）
        filteredCharacters.sort((a, b) => (b.lastMatchedAt || 0) - (a.lastMatchedAt || 0));

        if (filteredCharacters.length === 0) {
            listPanel.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">暂无人物</div>';
            return;
        }

        let html = '';
        filteredCharacters.forEach((char, index) => {
            html += `
                <div style="background: #1a1a2e; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #444;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <div style="color: white; font-size: 16px; font-weight: bold;">${char.name}</div>
                            <div style="color: #999; font-size: 12px; margin-top: 5px;">
                                匹配次数: ${char.matchCount || 0} | 
                                最后匹配: ${char.lastMatchedAt ? new Date(char.lastMatchedAt).toLocaleString('zh-CN') : '从未'}
                            </div>
                        </div>
                        <button onclick="characterGraphUI.deleteCharacter('${char.name}')" 
                            style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                            🗑️ 删除
                        </button>
                    </div>
                    <div style="color: #ccc; font-size: 13px; line-height: 1.6;">
                        ${char.personality ? `<div><strong>性格：</strong>${char.personality}</div>` : ''}
                        ${char.appearance ? `<div><strong>外貌：</strong>${char.appearance}</div>` : ''}
                        ${char.realm ? `<div><strong>境界：</strong>${char.realm}</div>` : ''}
                        ${char.age ? `<div><strong>年龄：</strong>${char.age}</div>` : ''}
                    </div>
                </div>
            `;
        });

        listPanel.innerHTML = html;
    }

    /**
     * 更新统计信息
     */
    async updateStats() {
        const manager = window.characterGraphManager;
        if (!manager || !manager.isInitialized) return;

        const stats = manager.getStats();
        
        const totalEl = document.getElementById('statTotalCharacters');
        const matchEl = document.getElementById('statMatchCount');
        const avgEl = document.getElementById('statAvgScore');

        if (totalEl) totalEl.textContent = stats.totalCharacters;
        if (matchEl) matchEl.textContent = stats.matchCount;
        if (avgEl) avgEl.textContent = (stats.avgMatchScore * 100).toFixed(1) + '%';
    }

    /**
     * 切换图谱开关
     */
    async toggleCharacterGraph() {
        const checkbox = document.getElementById('enableCharacterGraph');
        const fieldsDiv = document.getElementById('characterGraphFields');
        
        if (checkbox.checked) {
            fieldsDiv.style.display = 'block';
            
            // 初始化系统
            if (!window.characterGraphManager.isInitialized) {
                await window.characterGraphManager.init();
            }
            if (!window.characterGraphIntegration.isEnabled) {
                await window.characterGraphIntegration.init();
            }
        } else {
            fieldsDiv.style.display = 'none';
            window.characterGraphIntegration.setEnabled(false);
        }
    }

    /**
     * 保存配置
     */
    async saveConfig() {
        const config = {
            enabled: document.getElementById('enableCharacterGraph').checked,
            matchThreshold: parseInt(document.getElementById('graphMatchThreshold').value) / 100,
            contextMaxCharacters: parseInt(document.getElementById('graphMaxCharacters').value),
            nameWeight: parseFloat(document.getElementById('graphNameWeight').value),
            autoExtract: document.getElementById('graphAutoExtract').checked,
            autoMatch: document.getElementById('graphAutoMatch').checked,
            enableDebug: document.getElementById('graphDebugMode').checked
        };

        // 保存到集成模块
        window.characterGraphIntegration.updateConfig(config);

        // 保存到图谱管理器
        window.characterGraphManager.updateConfig({
            matchThreshold: config.matchThreshold,
            maxResults: config.contextMaxCharacters,
            nameWeight: config.nameWeight
        });

        alert('✅ 人物图谱配置已保存！');
    }

    /**
     * 加载配置
     */
    loadConfig() {
        const integration = window.characterGraphIntegration;
        const manager = window.characterGraphManager;
        
        if (integration) {
            const config = integration.getConfig();
            document.getElementById('enableCharacterGraph').checked = integration.isEnabled;
            document.getElementById('graphMatchThreshold').value = config.matchThreshold * 100;
            document.getElementById('graphMatchThresholdValue').textContent = (config.matchThreshold * 100).toFixed(0) + '%';
            document.getElementById('graphMaxCharacters').value = config.contextMaxCharacters;
            document.getElementById('graphAutoExtract').checked = config.autoExtract;
            document.getElementById('graphAutoMatch').checked = config.autoMatch;
            document.getElementById('graphDebugMode').checked = config.enableDebug;
            
            if (integration.isEnabled) {
                document.getElementById('characterGraphFields').style.display = 'block';
            }
        }
        
        if (manager) {
            const config = manager.config;
            document.getElementById('graphNameWeight').value = config.nameWeight;
            document.getElementById('graphNameWeightValue').textContent = config.nameWeight;
        }
    }

    /**
     * 打开管理面板
     */
    async openManagementPanel() {
        let modal = document.getElementById('characterGraphManagementModal');
        if (!modal) {
            document.body.insertAdjacentHTML('beforeend', this.createManagementPanelHTML());
            modal = document.getElementById('characterGraphManagementModal');
        }
        
        modal.style.display = 'block';
        await this.updateStats();
        await this.renderCharacterList();
    }

    /**
     * 关闭管理面板
     */
    closeManagementPanel() {
        const modal = document.getElementById('characterGraphManagementModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 搜索人物
     */
    searchCharacters() {
        const input = document.getElementById('characterSearchInput');
        if (input) {
            this.renderCharacterList(input.value);
        }
    }

    /**
     * 删除人物
     */
    async deleteCharacter(name) {
        if (!confirm(`确定要删除人物"${name}"吗？`)) {
            return;
        }

        await window.characterGraphManager.deleteCharacter(name);
        await this.updateStats();
        await this.renderCharacterList();
    }

    /**
     * 迁移现有人物
     */
    async migrateRelationships() {
        if (!window.gameState || !window.gameState.variables) {
            alert('❌ 游戏状态未初始化');
            return;
        }

        if (!confirm('确定要将当前变量表单中的relationships迁移到图谱吗？')) {
            return;
        }

        await window.characterGraphIntegration.migrateExistingRelationships(window.gameState);
        alert('✅ 迁移完成！');
    }

    /**
     * 测试匹配
     */
    async testMatch() {
        const query = prompt('请输入要测试的查询内容（人名、性格或外貌）:');
        if (!query) return;

        const results = await window.characterGraphManager.searchCharacters(query, '', '');
        
        if (results.length === 0) {
            alert('未找到匹配的人物');
        } else {
            let message = `找到 ${results.length} 个匹配:\n\n`;
            results.forEach((char, i) => {
                message += `${i + 1}. ${char.name} (${(char.matchScore * 100).toFixed(1)}%)\n`;
            });
            alert(message);
        }
    }

    /**
     * 导出图谱
     */
    async exportGraph() {
        const data = window.characterGraphManager.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `character-graph-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        alert('✅ 图谱已导出！');
    }

    /**
     * 导入图谱
     */
    async importGraph() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                await window.characterGraphManager.importData(data);
                await this.updateStats();
                await this.renderCharacterList();
                alert('✅ 图谱已导入！');
            } catch (error) {
                alert('❌ 导入失败: ' + error.message);
            }
        };
        
        input.click();
    }

    /**
     * 清空图谱
     */
    async clearGraph() {
        if (!confirm('确定要清空所有人物图谱数据吗？此操作不可恢复！')) {
            return;
        }
        
        await window.characterGraphManager.clearAll();
        await this.updateStats();
        await this.renderCharacterList();
        alert('✅ 图谱已清空！');
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.characterGraphUI = new CharacterGraphUI();
    console.log('[人物图谱UI] 全局实例已创建: window.characterGraphUI');
}
