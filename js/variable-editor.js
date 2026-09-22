/**
 * 变量编辑器 - 游戏中可视化修改变量管理器条目
 * 支持响应式布局，保存后覆盖原变量
 */

// 打开变量编辑器
function openVariableEditor() {
    if (!gameState.isGameStarted) {
        alert('请先开始游戏');
        return;
    }

    const vars = gameState.variables;
    
    // 构建编辑器HTML
    const editorHTML = buildVariableEditorHTML(vars);
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.id = 'variableEditorModal';
    modal.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px;
        box-sizing: border-box;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 12px;
        width: 100%;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
    `;
    content.innerHTML = editorHTML;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// 构建变量编辑器HTML
function buildVariableEditorHTML(vars) {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
            <h2 style="color: #667eea; margin: 0; font-size: 18px;">变量管理器</h2>
            <div style="display: flex; gap: 10px;">
                <button onclick="saveVariableEdits()" style="
                    padding: 8px 20px;
                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">保存</button>
                <button onclick="document.getElementById('variableEditorModal').remove()" style="
                    padding: 8px 20px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">关闭</button>
            </div>
        </div>

        <div class="ve-tabs" style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
            <button class="ve-tab-btn active" onclick="switchVETab('basic')" data-tab="basic" style="padding: 8px 15px; border: none; background: #667eea; color: white; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">基本信息</button>
            <button class="ve-tab-btn" onclick="switchVETab('stats')" data-tab="stats" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">属性数值</button>
            <button class="ve-tab-btn" onclick="switchVETab('attributes')" data-tab="attributes" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">六维属性</button>
            <button class="ve-tab-btn" onclick="switchVETab('items')" data-tab="items" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">物品道具</button>
            <button class="ve-tab-btn" onclick="switchVETab('relationships')" data-tab="relationships" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">人际关系</button>
            <button class="ve-tab-btn" onclick="switchVETab('skills')" data-tab="skills" style="padding: 8px 15px; border: none; background: #e0e0e0; color: #333; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 13px;">功法法术</button>
        </div>

        <!-- 基本信息标签页 -->
        <div id="ve-tab-basic" class="ve-tab-content" style="display: block;">
            ${buildBasicInfoEditor(vars)}
        </div>

        <!-- 属性数值标签页 -->
        <div id="ve-tab-stats" class="ve-tab-content" style="display: none;">
            ${buildStatsEditor(vars)}
        </div>

        <!-- 六维属性标签页 -->
        <div id="ve-tab-attributes" class="ve-tab-content" style="display: none;">
            ${buildAttributesEditor(vars)}
        </div>

        <!-- 物品道具标签页 -->
        <div id="ve-tab-items" class="ve-tab-content" style="display: none;">
            ${buildItemsEditor(vars)}
        </div>

        <!-- 人际关系标签页 -->
        <div id="ve-tab-relationships" class="ve-tab-content" style="display: none;">
            ${buildRelationshipsEditor(vars)}
        </div>

        <!-- 功法法术标签页 -->
        <div id="ve-tab-skills" class="ve-tab-content" style="display: none;">
            ${buildSkillsEditor(vars)}
        </div>
    `;
}

// 切换标签页
function switchVETab(tabName) {
    // 隐藏所有标签页内容
    document.querySelectorAll('.ve-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // 重置所有标签按钮样式
    document.querySelectorAll('.ve-tab-btn').forEach(btn => {
        btn.style.background = '#e0e0e0';
        btn.style.color = '#333';
        btn.classList.remove('active');
    });
    
    // 显示选中的标签页
    const selectedTab = document.getElementById('ve-tab-' + tabName);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // 高亮选中的按钮
    const selectedBtn = document.querySelector(`.ve-tab-btn[data-tab="${tabName}"]`);
    if (selectedBtn) {
        selectedBtn.style.background = '#667eea';
        selectedBtn.style.color = 'white';
        selectedBtn.classList.add('active');
    }
}

// 构建基本信息编辑器
function buildBasicInfoEditor(vars) {
    return `
        <div class="ve-section">
            <h3 style="color: #667eea; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">基本信息</h3>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">姓名</label>
                    <input type="text" id="ve-name" value="${vars.name || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">年龄</label>
                    <input type="number" id="ve-age" value="${vars.age || 18}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">性别</label>
                    <select id="ve-gender" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                        <option value="男" ${vars.gender === '男' ? 'selected' : ''}>男</option>
                        <option value="女" ${vars.gender === '女' ? 'selected' : ''}>女</option>
                    </select>
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">身份</label>
                    <input type="text" id="ve-identity" value="${vars.identity || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">境界</label>
                    <input type="text" id="ve-realm" value="${vars.realm || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">位置</label>
                    <input type="text" id="ve-location" value="${vars.location || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">性格</label>
                    <input type="text" id="ve-personality" value="${vars.personality || ''}" placeholder="如：沉稳内敛、洒脱不羁" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">外貌</label>
                    <input type="text" id="ve-appearance" value="${vars.appearance || ''}" placeholder="如：面容俊秀、身材修长" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field" style="grid-column: 1 / -1;">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">当前日期时间</label>
                    <input type="text" id="ve-currentDateTime" value="${vars.currentDateTime || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field" style="grid-column: 1 / -1;">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">天赋（用逗号分隔）</label>
                    <input type="text" id="ve-talents" value="${vars.talents ? vars.talents.join('、') : ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
        </div>
    `;
}

// 构建属性数值编辑器
function buildStatsEditor(vars) {
    return `
        <div class="ve-section">
            <h3 style="color: #667eea; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">属性数值</h3>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">体力(HP)</label>
                    <input type="number" id="ve-hp" value="${vars.hp || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">体力上限</label>
                    <input type="number" id="ve-hpMax" value="${vars.hpMax || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">法力(MP)</label>
                    <input type="number" id="ve-mp" value="${vars.mp || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">法力上限</label>
                    <input type="number" id="ve-mpMax" value="${vars.mpMax || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">灵石</label>
                    <input type="number" id="ve-spiritStones" value="${vars.spiritStones || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">机缘值</label>
                    <input type="number" id="ve-karmaFortune" value="${vars.karmaFortune || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">天谴值</label>
                    <input type="number" id="ve-karmaPunishment" value="${vars.karmaPunishment || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">修炼进度</label>
                    <input type="number" id="ve-cultivationProgress" value="${vars.cultivationProgress || 0}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">修炼进度上限</label>
                    <input type="number" id="ve-cultivationProgressMax" value="${vars.cultivationProgressMax || 100}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">炼丹等级</label>
                    <input type="text" id="ve-alchemyLevel" value="${vars.alchemyLevel || '未入门'}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">炼器等级</label>
                    <input type="text" id="ve-craftingLevel" value="${vars.craftingLevel || '未入门'}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
        </div>
    `;
}

// 构建六维属性编辑器
function buildAttributesEditor(vars) {
    const attrs = vars.attributes || {};
    return `
        <div class="ve-section">
            <h3 style="color: #667eea; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px;">六维属性</h3>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">根骨</label>
                    <input type="number" id="ve-attr-physique" value="${attrs.physique || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">气运</label>
                    <input type="number" id="ve-attr-fortune" value="${attrs.fortune || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">悟性</label>
                    <input type="number" id="ve-attr-comprehension" value="${attrs.comprehension || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">神识</label>
                    <input type="number" id="ve-attr-spirit" value="${attrs.spirit || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">潜力</label>
                    <input type="number" id="ve-attr-potential" value="${attrs.potential || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 12px; color: #666; margin-bottom: 4px;">魅力</label>
                    <input type="number" id="ve-attr-charisma" value="${attrs.charisma || 10}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
            </div>
        </div>
    `;
}

// 构建物品编辑器
function buildItemsEditor(vars) {
    const items = vars.items || [];
    let itemsHTML = items.map((item, index) => `
        <div class="ve-item-row" style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; align-items: center; padding: 10px; background: #f8f9fa; border-radius: 6px;">
            <input type="text" data-item-index="${index}" data-item-field="name" value="${item.name || ''}" placeholder="名称" style="flex: 2; min-width: 100px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-item-index="${index}" data-item-field="count" value="${item.count || 1}" placeholder="数量" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="text" data-item-index="${index}" data-item-field="type" value="${item.type || ''}" placeholder="类型" style="flex: 1; min-width: 80px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="removeVEItem(${index})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
        </div>
    `).join('');

    return `
        <div class="ve-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #667eea; margin: 0; font-size: 15px;">物品道具</h3>
                <button onclick="addVEItem()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">添加物品</button>
            </div>
            <div id="ve-items-list">
                ${itemsHTML || '<div style="text-align: center; color: #999; padding: 20px;">暂无物品</div>'}
            </div>
        </div>
    `;
}

// 构建人际关系编辑器
function buildRelationshipsEditor(vars) {
    const relationships = vars.relationships || [];
    let relHTML = relationships.map((rel, index) => `
        <div class="ve-rel-card" style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-weight: bold; color: #667eea;">${rel.name || '未命名'}</span>
                <button onclick="removeVERelationship(${index})" style="padding: 4px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">删除</button>
            </div>
            <div class="ve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">姓名</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="name" value="${rel.name || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">关系</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="relation" value="${rel.relation || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">好感度</label>
                    <input type="number" data-rel-index="${index}" data-rel-field="favor" value="${rel.favor || 0}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">年龄</label>
                    <input type="number" data-rel-index="${index}" data-rel-field="age" value="${rel.age || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">境界</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="realm" value="${rel.realm || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">性格</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="personality" value="${rel.personality || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">外貌</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="appearance" value="${rel.appearance || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
                <div class="ve-field">
                    <label style="display: block; font-size: 11px; color: #666; margin-bottom: 2px;">看法</label>
                    <input type="text" data-rel-index="${index}" data-rel-field="opinion" value="${rel.opinion || ''}" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; font-size: 13px;">
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="ve-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #667eea; margin: 0; font-size: 15px;">人际关系</h3>
                <button onclick="addVERelationship()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">添加角色</button>
            </div>
            <div id="ve-relationships-list">
                ${relHTML || '<div style="text-align: center; color: #999; padding: 20px;">暂无人际关系</div>'}
            </div>
        </div>
    `;
}

// 构建功法法术编辑器
function buildSkillsEditor(vars) {
    const techniques = vars.techniques || [];
    const spells = vars.spells || [];

    let techHTML = techniques.map((tech, index) => `
        <div class="ve-skill-row" style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; align-items: center; padding: 10px; background: #f0f4ff; border-radius: 6px;">
            <input type="text" data-tech-index="${index}" data-tech-field="name" value="${tech.name || ''}" placeholder="名称" style="flex: 2; min-width: 100px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-tech-index="${index}" data-tech-field="power" value="${tech.power || 0}" placeholder="威力" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-tech-index="${index}" data-tech-field="mpCost" value="${tech.mpCost || 0}" placeholder="消耗" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="removeVETechnique(${index})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
        </div>
    `).join('');

    let spellHTML = spells.map((spell, index) => `
        <div class="ve-skill-row" style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; align-items: center; padding: 10px; background: #f5f0ff; border-radius: 6px;">
            <input type="text" data-spell-index="${index}" data-spell-field="name" value="${spell.name || ''}" placeholder="名称" style="flex: 2; min-width: 100px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-spell-index="${index}" data-spell-field="power" value="${spell.power || 0}" placeholder="威力" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <input type="number" data-spell-index="${index}" data-spell-field="mpCost" value="${spell.mpCost || 0}" placeholder="消耗" style="width: 60px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <button onclick="removeVESpell(${index})" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">删除</button>
        </div>
    `).join('');

    return `
        <div class="ve-section" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #667eea; margin: 0; font-size: 15px;">功法</h3>
                <button onclick="addVETechnique()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">添加功法</button>
            </div>
            <div id="ve-techniques-list">
                ${techHTML || '<div style="text-align: center; color: #999; padding: 20px;">暂无功法</div>'}
            </div>
        </div>
        <div class="ve-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #764ba2; margin: 0; font-size: 15px;">法术</h3>
                <button onclick="addVESpell()" style="padding: 6px 15px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">添加法术</button>
            </div>
            <div id="ve-spells-list">
                ${spellHTML || '<div style="text-align: center; color: #999; padding: 20px;">暂无法术</div>'}
            </div>
        </div>
    `;
}

// 添加物品
function addVEItem() {
    if (!gameState.variables.items) {
        gameState.variables.items = [];
    }
    gameState.variables.items.push({ name: '', count: 1, type: '' });
    refreshVEItemsList();
}

// 删除物品
function removeVEItem(index) {
    if (gameState.variables.items) {
        gameState.variables.items.splice(index, 1);
        refreshVEItemsList();
    }
}

// 刷新物品列表
function refreshVEItemsList() {
    const container = document.getElementById('ve-items-list');
    if (container) {
        container.innerHTML = buildItemsEditor(gameState.variables).match(/<div id="ve-items-list">([\s\S]*?)<\/div>/)?.[1] || '';
    }
}

// 添加人际关系
function addVERelationship() {
    if (!gameState.variables.relationships) {
        gameState.variables.relationships = [];
    }
    gameState.variables.relationships.push({ 
        name: '', 
        relation: '', 
        favor: 0, 
        age: '',
        realm: '',
        personality: '',
        appearance: '',
        opinion: ''
    });
    refreshVERelationshipsList();
}

// 删除人际关系
function removeVERelationship(index) {
    if (gameState.variables.relationships) {
        gameState.variables.relationships.splice(index, 1);
        refreshVERelationshipsList();
    }
}

// 刷新人际关系列表
function refreshVERelationshipsList() {
    const container = document.getElementById('ve-relationships-list');
    if (container) {
        const newContent = buildRelationshipsEditor(gameState.variables);
        const match = newContent.match(/<div id="ve-relationships-list">([\s\S]*?)<\/div>\s*<\/div>\s*$/);
        if (match) {
            container.innerHTML = match[1];
        }
    }
}

// 添加功法
function addVETechnique() {
    if (!gameState.variables.techniques) {
        gameState.variables.techniques = [];
    }
    gameState.variables.techniques.push({ name: '', type: '功法', power: 0, mpCost: 0, description: '', effect: '' });
    refreshVESkillsList();
}

// 删除功法
function removeVETechnique(index) {
    if (gameState.variables.techniques) {
        gameState.variables.techniques.splice(index, 1);
        refreshVESkillsList();
    }
}

// 添加法术
function addVESpell() {
    if (!gameState.variables.spells) {
        gameState.variables.spells = [];
    }
    gameState.variables.spells.push({ name: '', type: '法术', power: 0, mpCost: 0, description: '', effect: '' });
    refreshVESkillsList();
}

// 删除法术
function removeVESpell(index) {
    if (gameState.variables.spells) {
        gameState.variables.spells.splice(index, 1);
        refreshVESkillsList();
    }
}

// 刷新功法法术列表
function refreshVESkillsList() {
    const tabContent = document.getElementById('ve-tab-skills');
    if (tabContent) {
        tabContent.innerHTML = buildSkillsEditor(gameState.variables);
    }
}

// 保存变量编辑
function saveVariableEdits() {
    try {
        // 基本信息
        const nameEl = document.getElementById('ve-name');
        if (nameEl) gameState.variables.name = nameEl.value;

        const ageEl = document.getElementById('ve-age');
        if (ageEl) gameState.variables.age = parseInt(ageEl.value) || 18;

        const genderEl = document.getElementById('ve-gender');
        if (genderEl) gameState.variables.gender = genderEl.value;

        const identityEl = document.getElementById('ve-identity');
        if (identityEl) gameState.variables.identity = identityEl.value;

        const realmEl = document.getElementById('ve-realm');
        if (realmEl) gameState.variables.realm = realmEl.value;

        const locationEl = document.getElementById('ve-location');
        if (locationEl) gameState.variables.location = locationEl.value;

        const personalityEl = document.getElementById('ve-personality');
        if (personalityEl) gameState.variables.personality = personalityEl.value;

        const appearanceEl = document.getElementById('ve-appearance');
        if (appearanceEl) gameState.variables.appearance = appearanceEl.value;

        const dateTimeEl = document.getElementById('ve-currentDateTime');
        if (dateTimeEl) gameState.variables.currentDateTime = dateTimeEl.value;

        const talentsEl = document.getElementById('ve-talents');
        if (talentsEl) {
            const talentsStr = talentsEl.value.trim();
            gameState.variables.talents = talentsStr ? talentsStr.split(/[,，、]/).map(t => t.trim()).filter(t => t) : [];
        }

        // 属性数值
        const hpEl = document.getElementById('ve-hp');
        if (hpEl) gameState.variables.hp = parseInt(hpEl.value) || 100;

        const hpMaxEl = document.getElementById('ve-hpMax');
        if (hpMaxEl) gameState.variables.hpMax = parseInt(hpMaxEl.value) || 100;

        const mpEl = document.getElementById('ve-mp');
        if (mpEl) gameState.variables.mp = parseInt(mpEl.value) || 100;

        const mpMaxEl = document.getElementById('ve-mpMax');
        if (mpMaxEl) gameState.variables.mpMax = parseInt(mpMaxEl.value) || 100;

        const spiritStonesEl = document.getElementById('ve-spiritStones');
        if (spiritStonesEl) gameState.variables.spiritStones = parseInt(spiritStonesEl.value) || 0;

        const karmaFortuneEl = document.getElementById('ve-karmaFortune');
        if (karmaFortuneEl) gameState.variables.karmaFortune = parseInt(karmaFortuneEl.value) || 0;

        const karmaPunishmentEl = document.getElementById('ve-karmaPunishment');
        if (karmaPunishmentEl) gameState.variables.karmaPunishment = parseInt(karmaPunishmentEl.value) || 0;

        const cultivationProgressEl = document.getElementById('ve-cultivationProgress');
        if (cultivationProgressEl) gameState.variables.cultivationProgress = parseInt(cultivationProgressEl.value) || 0;

        const cultivationProgressMaxEl = document.getElementById('ve-cultivationProgressMax');
        if (cultivationProgressMaxEl) gameState.variables.cultivationProgressMax = parseInt(cultivationProgressMaxEl.value) || 100;

        const alchemyLevelEl = document.getElementById('ve-alchemyLevel');
        if (alchemyLevelEl) gameState.variables.alchemyLevel = alchemyLevelEl.value || '未入门';

        const craftingLevelEl = document.getElementById('ve-craftingLevel');
        if (craftingLevelEl) gameState.variables.craftingLevel = craftingLevelEl.value || '未入门';

        // 六维属性
        if (!gameState.variables.attributes) {
            gameState.variables.attributes = {};
        }
        
        const attrFields = ['physique', 'fortune', 'comprehension', 'spirit', 'potential', 'charisma'];
        attrFields.forEach(attr => {
            const el = document.getElementById('ve-attr-' + attr);
            if (el) gameState.variables.attributes[attr] = parseInt(el.value) || 10;
        });

        // 收集物品数据
        const itemInputs = document.querySelectorAll('[data-item-index]');
        const itemsMap = new Map();
        itemInputs.forEach(input => {
            const index = parseInt(input.dataset.itemIndex);
            const field = input.dataset.itemField;
            if (!itemsMap.has(index)) {
                itemsMap.set(index, { name: '', count: 1, type: '' });
            }
            const item = itemsMap.get(index);
            if (field === 'count') {
                item[field] = parseInt(input.value) || 1;
            } else {
                item[field] = input.value;
            }
        });
        if (itemsMap.size > 0) {
            gameState.variables.items = Array.from(itemsMap.values()).filter(item => item.name);
        }

        // 收集人际关系数据
        const relInputs = document.querySelectorAll('[data-rel-index]');
        const relMap = new Map();
        relInputs.forEach(input => {
            const index = parseInt(input.dataset.relIndex);
            const field = input.dataset.relField;
            if (!relMap.has(index)) {
                relMap.set(index, { name: '', relation: '', favor: 0 });
            }
            const rel = relMap.get(index);
            if (field === 'favor' || field === 'age') {
                rel[field] = parseInt(input.value) || 0;
            } else {
                rel[field] = input.value;
            }
        });
        if (relMap.size > 0) {
            gameState.variables.relationships = Array.from(relMap.values()).filter(rel => rel.name);
        }

        // 收集功法数据
        const techInputs = document.querySelectorAll('[data-tech-index]');
        const techMap = new Map();
        techInputs.forEach(input => {
            const index = parseInt(input.dataset.techIndex);
            const field = input.dataset.techField;
            if (!techMap.has(index)) {
                techMap.set(index, { name: '', type: '功法', power: 0, mpCost: 0, description: '', effect: '' });
            }
            const tech = techMap.get(index);
            if (field === 'power' || field === 'mpCost') {
                tech[field] = parseInt(input.value) || 0;
            } else {
                tech[field] = input.value;
            }
        });
        if (techMap.size > 0) {
            gameState.variables.techniques = Array.from(techMap.values()).filter(tech => tech.name);
        }

        // 收集法术数据
        const spellInputs = document.querySelectorAll('[data-spell-index]');
        const spellMap = new Map();
        spellInputs.forEach(input => {
            const index = parseInt(input.dataset.spellIndex);
            const field = input.dataset.spellField;
            if (!spellMap.has(index)) {
                spellMap.set(index, { name: '', type: '法术', power: 0, mpCost: 0, description: '', effect: '' });
            }
            const spell = spellMap.get(index);
            if (field === 'power' || field === 'mpCost') {
                spell[field] = parseInt(input.value) || 0;
            } else {
                spell[field] = input.value;
            }
        });
        if (spellMap.size > 0) {
            gameState.variables.spells = Array.from(spellMap.values()).filter(spell => spell.name);
        }

        // 更新状态面板
        if (typeof updateStatusPanel === 'function') {
            updateStatusPanel();
        }

        // 保存到IndexedDB
        if (typeof saveGameHistory === 'function') {
            saveGameHistory();
        }

        // 关闭编辑器
        const modal = document.getElementById('variableEditorModal');
        if (modal) {
            modal.remove();
        }

        // 提示保存成功
        alert('变量已保存');
        
        console.log('[变量编辑器] 变量已保存:', gameState.variables);
    } catch (error) {
        console.error('[变量编辑器] 保存失败:', error);
        alert('保存失败: ' + error.message);
    }
}

// 导出到全局
window.openVariableEditor = openVariableEditor;
window.saveVariableEdits = saveVariableEdits;
window.switchVETab = switchVETab;
window.addVEItem = addVEItem;
window.removeVEItem = removeVEItem;
window.addVERelationship = addVERelationship;
window.removeVERelationship = removeVERelationship;
window.addVETechnique = addVETechnique;
window.removeVETechnique = removeVETechnique;
window.addVESpell = addVESpell;
window.removeVESpell = removeVESpell;
