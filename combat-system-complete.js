/**
 * 修仙游戏 - 完整回合制战斗系统
 */

// combatState 已在 combat-system-part1.js 中定义，这里不再重复声明

/**
 * 启动战斗
 */
function startCombat(enemyInfo) {
    console.log('🎮 启动战斗:', enemyInfo);
    
    combatState.combatStartInfo = enemyInfo;
    
    // 初始化玩家数据
    const playerData = {
        name: gameState.variables.name || "玩家",
        realm: gameState.variables.realm || "凡人",
        hp: gameState.variables.hp || 100,
        hpMax: gameState.variables.hpMax || 100,
        mp: gameState.variables.mp || 100,
        mpMax: gameState.variables.mpMax || 100,
        attributes: gameState.variables.attributes || {
            physique: 10, comprehension: 10, spirituality: 10,
            luck: 10, charm: 10, willpower: 10
        },
        techniques: gameState.variables.techniques || [],
        spells: gameState.variables.spells || [],
        effects: []
    };
    
    // 生成敌人数据
    const realmConfig = REALM_CONFIG[enemyInfo.realmLevel] || REALM_CONFIG[1];
    const enemyHp = rollDice(realmConfig.hp.min, realmConfig.hp.max);
    const enemyMp = rollDice(realmConfig.mp.min, realmConfig.mp.max);
    
    const enemyData = {
        name: enemyInfo.name,
        realm: enemyInfo.realm,
        realmLevel: enemyInfo.realmLevel,
        hp: enemyHp,
        hpMax: enemyHp,
        mp: enemyMp,
        mpMax: enemyMp,
        attributes: enemyInfo.attributes,
        techniques: enemyInfo.techniques.length > 0 ? enemyInfo.techniques : 
                   getRandomItems(TECHNIQUES[enemyInfo.realmLevel] || TECHNIQUES[1], 2),
        spells: enemyInfo.spells.length > 0 ? enemyInfo.spells : 
                getRandomItems(SPELLS[enemyInfo.realmLevel] || SPELLS[1], 2),
        effects: []
    };
    
    // 初始化战斗状态
    combatState.isActive = true;
    combatState.player = playerData;
    combatState.enemy = enemyData;
    combatState.currentTurn = 'player';
    combatState.turnCount = 1;
    combatState.combatLog = [];
    combatState.playerMomentum = 0;
    combatState.enemyMomentum = 0;
    
    addCombatLog(`⚔️ 战斗开始！${playerData.name} VS ${enemyData.name}`);
    addCombatLog(`${enemyData.name}（${enemyData.realm}）- HP:${enemyData.hp}/${enemyData.hpMax} MP:${enemyData.mp}/${enemyData.mpMax}`);
    
    showCombatUI();
    
    // 确保DOM完全创建后再渲染UI
    setTimeout(() => {
        renderCombatUI();
    }, 100);
}

/**
 * 显示战斗界面
 */
function showCombatUI() {
    let combatModal = document.getElementById('combatModal');
    if (!combatModal) {
        // 如果模态框不存在，创建它
        combatModal = document.createElement('div');
        combatModal.id = 'combatModal';
        combatModal.className = 'combat-modal';
        document.body.appendChild(combatModal);
    }
    
    // 无论模态框是否已存在，都设置HTML内容
    combatModal.innerHTML = `
        <div class="combat-container">
            <div class="combat-header">
                <h2>⚔️ 回合制战斗</h2>
                <div class="combat-header-controls">
                    <span class="combat-turn">第 <span id="combatTurnNum">1</span> 回合</span>
                    <button class="combat-restart-btn" onclick="restartCombat()" title="重新挑战">🔄</button>
                    <button class="combat-close-btn" onclick="closeCombat()" title="关闭战斗">✖</button>
                </div>
            </div>
            
            <div class="combat-battlefield">
                <div class="combat-character player-side">
                    <div class="character-name" id="playerName">玩家</div>
                    <div class="character-hp">
                        <div class="hp-bar-container">
                            <div class="hp-bar" id="playerHpBar" style="width: 100%"></div>
                            <span class="hp-text" id="playerHpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-mp">
                        <div class="mp-bar-container">
                            <div class="mp-bar" id="playerMpBar" style="width: 100%"></div>
                            <span class="mp-text" id="playerMpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-momentum">
                        <span>💨 气势:</span>
                        <div class="momentum-bar">
                            <div class="momentum-fill" id="playerMomentum" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="character-effects" id="playerEffects"></div>
                </div>
                
                <div class="combat-vs">VS</div>
                
                <div class="combat-character enemy-side">
                    <div class="character-name" id="enemyName">敌人</div>
                    <div class="character-hp">
                        <div class="hp-bar-container">
                            <div class="hp-bar" id="enemyHpBar" style="width: 100%"></div>
                            <span class="hp-text" id="enemyHpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-mp">
                        <div class="mp-bar-container">
                            <div class="mp-bar" id="enemyMpBar" style="width: 100%"></div>
                            <span class="mp-text" id="enemyMpText">100/100</span>
                        </div>
                    </div>
                    <div class="character-momentum">
                        <span>💨 气势:</span>
                        <div class="momentum-bar">
                            <div class="momentum-fill" id="enemyMomentum" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="character-effects" id="enemyEffects"></div>
                </div>
            </div>
            
            <div class="combat-log-container">
                <div class="combat-log" id="combatLog"></div>
            </div>
            
            <div class="combat-skills" id="combatSkills">
                <div class="skills-title">选择行动</div>
                <div class="skills-tabs">
                    <button class="skill-tab active" onclick="switchSkillTab('techniques')">功法</button>
                    <button class="skill-tab" onclick="switchSkillTab('spells')">法术</button>
                </div>
                <div class="skills-list" id="skillsList"></div>
            </div>
        </div>
    `;
    
    combatModal.style.display = 'flex';
}

/**
 * 隐藏战斗界面
 */
function hideCombatUI() {
    const combatModal = document.getElementById('combatModal');
    if (combatModal) {
        combatModal.style.display = 'none';
    }
}

/**
 * 关闭战斗界面
 */
function closeCombat() {
    console.log('🚪 关闭战斗界面');
    hideCombatUI();
    
    // 清除战斗状态
    if (typeof combatState !== 'undefined') {
        combatState.isInCombat = false;
        combatState.currentEnemy = null;
    }
    
    // 清除预存储的战斗信息
    if (window.pendingCombatInfo) {
        window.pendingCombatInfo = null;
    }
}

/**
 * 重新挑战
 */
function restartCombat() {
    console.log('🔄 重新挑战');
    
    // 检查是否有当前敌人
    if (typeof combatState !== 'undefined' && combatState.currentEnemy) {
        // 重置战斗状态
        combatState.turn = 1;
        combatState.playerHp = combatState.playerMaxHp;
        combatState.playerMp = combatState.playerMaxMp;
        combatState.enemyHp = combatState.enemyMaxHp;
        combatState.enemyMp = combatState.enemyMaxMp;
        combatState.playerMomentum = 0;
        combatState.enemyMomentum = 0;
        combatState.playerEffects = [];
        combatState.enemyEffects = [];
        
        // 重置技能冷却
        if (combatState.playerTechniques) {
            combatState.playerTechniques.forEach(tech => tech.currentCooldown = 0);
        }
        if (combatState.playerSpells) {
            combatState.playerSpells.forEach(spell => spell.currentCooldown = 0);
        }
        if (combatState.enemyTechniques) {
            combatState.enemyTechniques.forEach(tech => tech.currentCooldown = 0);
        }
        if (combatState.enemySpells) {
            combatState.enemySpells.forEach(spell => spell.currentCooldown = 0);
        }
        
        // 重新渲染界面
        renderCombatUI();
        
        // 添加重新开始日志
        addCombatLog('🔄 战斗重新开始！');
    } else {
        console.warn('⚠️ 没有找到当前敌人，无法重新挑战');
        alert('没有找到可重新挑战的敌人');
    }
}

/**
 * 渲染战斗界面
 */
function renderCombatUI() {
    // 检查战斗界面是否存在
    const combatModal = document.getElementById('combatModal');
    if (!combatModal) {
        console.error('❌ 战斗模态框不存在，无法渲染UI');
        return;
    }
    
    // 安全地更新元素，添加存在性检查
    const turnNum = document.getElementById('combatTurnNum');
    if (turnNum) turnNum.textContent = combatState.turnCount;
    
    const playerName = document.getElementById('playerName');
    if (playerName) playerName.textContent = combatState.player.name;
    
    updateHPBar('player', combatState.player.hp, combatState.player.hpMax);
    updateMPBar('player', combatState.player.mp, combatState.player.mpMax);
    updateMomentum('player', combatState.playerMomentum);
    
    const enemyName = document.getElementById('enemyName');
    if (enemyName) enemyName.textContent = `${combatState.enemy.name}（${combatState.enemy.realm}）`;
    
    updateHPBar('enemy', combatState.enemy.hp, combatState.enemy.hpMax);
    updateMPBar('enemy', combatState.enemy.mp, combatState.enemy.mpMax);
    updateMomentum('enemy', combatState.enemyMomentum);
    
    renderSkills('techniques');
    renderCombatLog();
}

/**
 * 更新血条
 */
function updateHPBar(side, hp, hpMax) {
    const percentage = Math.max(0, Math.min(100, (hp / hpMax) * 100));
    const hpBar = document.getElementById(`${side}HpBar`);
    const hpText = document.getElementById(`${side}HpText`);
    
    if (hpBar) {
        hpBar.style.width = percentage + '%';
        if (percentage > 50) {
            hpBar.style.background = 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)';
        } else if (percentage > 25) {
            hpBar.style.background = 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
        } else {
            hpBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
        }
    }
    
    if (hpText) {
        hpText.textContent = `${Math.max(0, Math.floor(hp))}/${hpMax}`;
    }
}

/**
 * 更新法力条
 */
function updateMPBar(side, mp, mpMax) {
    const percentage = Math.max(0, Math.min(100, (mp / mpMax) * 100));
    const mpBar = document.getElementById(`${side}MpBar`);
    const mpText = document.getElementById(`${side}MpText`);
    
    if (mpBar) mpBar.style.width = percentage + '%';
    if (mpText) mpText.textContent = `${Math.max(0, Math.floor(mp))}/${mpMax}`;
}

/**
 * 更新气势
 */
function updateMomentum(side, momentum) {
    const momentumBar = document.getElementById(`${side}Momentum`);
    if (momentumBar) {
        momentumBar.style.width = Math.max(0, Math.min(100, momentum)) + '%';
    }
}

/**
 * 更新状态效果
 */
function updateEffects(side) {
    const effectsContainer = document.getElementById(`${side}Effects`);
    if (!effectsContainer) return;
    
    const effects = side === 'player' ? combatState.player.effects : combatState.enemy.effects;
    effectsContainer.innerHTML = effects.map(effect => {
        const desc = EFFECT_DESCRIPTIONS[effect.type] || effect.type;
        return `<span class="effect-badge ${effect.type}">${desc}</span>`;
    }).join('');
}

/**
 * 切换技能标签
 */
function switchSkillTab(tab) {
    const tabs = document.querySelectorAll('.skill-tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = Array.from(tabs).find(t => 
        (tab === 'techniques' && t.textContent.includes('功法')) ||
        (tab === 'spells' && t.textContent.includes('法术'))
    );
    if (activeTab) activeTab.classList.add('active');
    
    renderSkills(tab);
}

/**
 * 渲染技能列表
 */
function renderSkills(type) {
    const skillsList = document.getElementById('skillsList');
    if (!skillsList) return;
    
    skillsList.innerHTML = '';
    let skills = type === 'techniques' ? combatState.player.techniques : combatState.player.spells;
    
    // 如果没有技能，自动添加"殴打"技能
    if (!skills || skills.length === 0) {
        const punchSkill = {
            name: "殴打",
            power: 15,
            mpCost: 0,
            cooldown: 0,
            currentCooldown: 0,
            description: "基础的物理攻击"
        };
        
        // 创建临时技能数组
        skills = [punchSkill];
        
        // 如果是功法且没有功法，添加到玩家数据中
        if (type === 'techniques' && !combatState.player.techniques) {
            combatState.player.techniques = [punchSkill];
        }
        // 如果是法术且没有法术，添加到玩家数据中
        else if (type === 'spells' && !combatState.player.spells) {
            combatState.player.spells = [punchSkill];
        }
    }
    
    skills.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = 'skill-btn';
        
        const canUse = combatState.player.mp >= skill.mpCost && 
                      (!skill.currentCooldown || skill.currentCooldown === 0);
        
        if (!canUse) {
            btn.classList.add('disabled');
            btn.disabled = true;
        }
        
        let info = `<div class="skill-name">${skill.name}</div><div class="skill-info">
            <span>💥 ${skill.power}</span><span>💧 ${skill.mpCost}</span>`;
        
        if (skill.currentCooldown && skill.currentCooldown > 0) {
            info += `<span class="skill-cooldown">⏰ ${skill.currentCooldown}</span>`;
        }
        info += `</div>`;
        
        btn.innerHTML = info;
        btn.onclick = () => { if (canUse) useSkill(type, skill); };
        skillsList.appendChild(btn);
    });
}

/**
 * 使用技能
 */
function useSkill(type, skill) {
    if (combatState.currentTurn !== 'player') return;
    
    combatState.combatLog.push(`\n--- 第 ${combatState.turnCount} 回合：玩家行动 ---`);
    combatState.player.mp -= skill.mpCost;
    
    let damage = skill.power;
    damage += Math.floor((combatState.player.attributes.physique || 10) * 0.5);
    damage -= Math.floor((combatState.enemy.attributes.physique || 10) * 0.2);
    
    const momentum = combatState.playerMomentum;
    damage += Math.floor(damage * momentum / 200);
    
    const luck = combatState.player.attributes.luck || 10;
    const critChance = Math.min(30, luck * 1.5);
    const isCrit = Math.random() * 100 < critChance;
    
    if (isCrit) {
        damage = Math.floor(damage * 1.8);
        combatState.combatLog.push(`💥 暴击！${combatState.player.name}使用${skill.name}造成${damage}点伤害！`);
    } else {
        combatState.combatLog.push(`⚔️ ${combatState.player.name}使用${skill.name}造成${damage}点伤害`);
    }
    
    combatState.enemy.hp -= damage;
    combatState.playerMomentum = Math.min(100, combatState.playerMomentum + 10);
    
    if (skill.cooldown > 0) skill.currentCooldown = skill.cooldown;
    
    renderCombatUI();
    
    if (combatState.enemy.hp <= 0) {
        endCombat('victory');
        return;
    }
    
    setTimeout(() => {
        combatState.currentTurn = 'enemy';
        enemyTurn();
    }, 1500);
}

/**
 * 敌人回合
 */
function enemyTurn() {
    combatState.combatLog.push(`\n--- 第 ${combatState.turnCount} 回合：敌人行动 ---`);
    
    const allSkills = [...combatState.enemy.techniques, ...combatState.enemy.spells];
    const available = allSkills.filter(s => 
        combatState.enemy.mp >= s.mpCost && (!s.currentCooldown || s.currentCooldown === 0)
    );
    
    let skill;
    if (available.length > 0) {
        skill = available[Math.floor(Math.random() * available.length)];
    } else {
        skill = { name: "普通攻击", power: 10, mpCost: 0, effects: [] };
    }
    
    combatState.enemy.mp -= skill.mpCost;
    
    let damage = skill.power;
    damage += Math.floor((combatState.enemy.attributes.physique || 10) * 0.5);
    damage -= Math.floor((combatState.player.attributes.physique || 10) * 0.2);
    
    const momentum = combatState.enemyMomentum;
    damage += Math.floor(damage * momentum / 200);
    
    const luck = combatState.enemy.attributes.luck || 10;
    const critChance = Math.min(30, luck * 1.5);
    const isCrit = Math.random() * 100 < critChance;
    
    if (isCrit) {
        damage = Math.floor(damage * 1.8);
        combatState.combatLog.push(`💥 暴击！${combatState.enemy.name}使用${skill.name}造成${damage}点伤害！`);
    } else {
        combatState.combatLog.push(`⚔️ ${combatState.enemy.name}使用${skill.name}造成${damage}点伤害`);
    }
    
    combatState.player.hp -= damage;
    combatState.enemyMomentum = Math.min(100, combatState.enemyMomentum + 10);
    
    if (skill.cooldown > 0) skill.currentCooldown = skill.cooldown;
    
    renderCombatUI();
    
    if (combatState.player.hp <= 0) {
        endCombat('defeat');
        return;
    }
    
    setTimeout(() => {
        combatState.turnCount++;
        combatState.currentTurn = 'player';
        renderCombatUI();
    }, 1500);
}

/**
 * 结束战斗
 */
function endCombat(result) {
    combatState.isActive = false;
    
    if (result === 'victory') {
        combatState.combatLog.push(`\n🎉 战斗胜利！${combatState.enemy.name}被击败！`);
        showCombatResult('victory');
    } else {
        combatState.combatLog.push(`\n💀 战斗失败！${combatState.player.name}被击败...`);
        showCombatResult('defeat');
    }
    
    renderCombatUI();
}

/**
 * 显示战斗结果
 */
function showCombatResult(result) {
    const container = document.getElementById('combatSkills');
    if (!container) return;
    
    if (result === 'victory') {
        container.innerHTML = `
            <div class="combat-result">
                <h3>🎉 战斗胜利！</h3>
                <p>你击败了 ${combatState.enemy.name}（${combatState.enemy.realm}）</p>
                <div class="result-options">
                    <button class="result-btn" onclick="finishCombat('kill')">⚔️ 处决</button>
                    <button class="result-btn" onclick="finishCombat('release')">🕊️ 放走</button>
                    <button class="result-btn" onclick="finishCombat('rape')">🔞 强奸</button>
                    <button class="result-btn" onclick="finishCombat('custom')">✏️ 自定义</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="combat-result">
                <h3>💀 战斗失败...</h3>
                <p>${combatState.player.name}被${combatState.enemy.name}击败</p>
                <div class="result-options">
                    <button class="result-btn" onclick="finishCombat('defeat')">💔 默认结局</button>
                    <button class="result-btn" onclick="finishCombat('beg')">🙏 求饶</button>
                    <button class="result-btn" onclick="finishCombat('escape')">🏃 逃跑</button>
                    <button class="result-btn" onclick="finishCombat('seduce')">💋 出卖色相</button>
                    <button class="result-btn" onclick="showCustomDefeatInput()">✏️ 自定义</button>
                </div>
                <div id="custom-defeat-input" style="display: none; margin-top: 15px;">
                    <textarea id="defeat-custom-text" placeholder="描述你的失败后续..." rows="3" style="width: 100%; margin-bottom: 10px;"></textarea>
                    <button class="result-btn" onclick="submitCustomDefeat()">提交</button>
                    <button class="result-btn" onclick="hideCustomDefeatInput()">取消</button>
                </div>
            </div>
        `;
    }
}

/**
 * 显示自定义输入
 */
function showCustomInput() {
    const container = document.getElementById('combatSkills');
    if (!container) return;
    
    container.innerHTML = `
        <div class="combat-result">
            <h3>✏️ 自定义处理方式</h3>
            <textarea id="customActionText" placeholder="请输入你想要对${combatState.enemy.name}做的具体事情..." rows="4" cols="50"></textarea>
            <div class="result-options">
                <button class="result-btn" onclick="finishCombatWithCustom()">确认</button>
                <button class="result-btn" onclick="showCombatResult('victory')">返回</button>
            </div>
        </div>
    `;
}

/**
 * 使用自定义方式完成战斗
 */
function finishCombatWithCustom() {
    const customText = document.getElementById('customActionText').value;
    if (customText && customText.trim()) {
        finishCombat('custom', customText);
    } else {
        alert('请输入自定义处理方式');
    }
}

/**
 * 显示失败自定义输入
 */
function showCustomDefeatInput() {
    const inputDiv = document.getElementById('custom-defeat-input');
    if (inputDiv) {
        inputDiv.style.display = 'block';
        // 聚焦到文本框
        setTimeout(() => {
            const textarea = document.getElementById('defeat-custom-text');
            if (textarea) {
                textarea.focus();
            }
        }, 100);
    }
}

/**
 * 隐藏失败自定义输入
 */
function hideCustomDefeatInput() {
    const inputDiv = document.getElementById('custom-defeat-input');
    if (inputDiv) {
        inputDiv.style.display = 'none';
        const textarea = document.getElementById('defeat-custom-text');
        if (textarea) {
            textarea.value = '';
        }
    }
}

/**
 * 提交自定义失败处理
 */
function submitCustomDefeat() {
    const textarea = document.getElementById('defeat-custom-text');
    if (!textarea) return;
    
    const customText = textarea.value.trim();
    if (!customText) {
        alert('请输入失败后续描述');
        return;
    }
    
    finishCombat('custom-defeat', customText);
}

/**
 * 完成战斗
 */
async function finishCombat(action, customText = '') {
    let report = `\n【战斗报告】\n`;
    report += `对战：${combatState.player.name} VS ${combatState.enemy.name}（${combatState.enemy.realm}）\n`;
    report += `结果：`;
    
    if (action === 'defeat') {
        report += `战败\n`;
    } else if (action === 'beg') {
        report += `战败后向${combatState.enemy.name}求饶\n`;
    } else if (action === 'escape') {
        report += `战败后尝试逃跑\n`;
    } else if (action === 'seduce') {
        report += `战败后试图出卖色相求生\n`;
    } else if (action === 'custom-defeat') {
        report += `战败后${customText}\n`;
    } else {
        report += `胜利\n`;
        report += `处理方式：`;
        
        switch(action) {
            case 'kill':
                report += `处决了${combatState.enemy.name}`;
                break;
            case 'release':
                report += `放走了${combatState.enemy.name}`;
                break;
            case 'rape':
                report += `强奸了${combatState.enemy.name}`;
                break;
            case 'custom':
                report += `对${combatState.enemy.name}${customText}`;
                break;
        }
    }
    report += `\n战斗日志：\n${combatState.combatLog.slice(-10).join('\n')}`;
    
    // 更新玩家状态
    gameState.variables.hp = Math.max(1, combatState.player.hp);
    gameState.variables.mp = Math.max(0, combatState.player.mp);
    
    hideCombatUI();
    
    // 清除已使用的战斗信息
    window.pendingCombatInfo = null;
    console.log('🧹 战斗结束，已清除战斗信息');
    
    // 发送战斗报告给AI
    if (!gameState.isProcessing) {
        gameState.isProcessing = true;
        
        displayUserMessage(report);
        gameState.conversationHistory.push({ role: 'user', content: report });
        gameState.variableSnapshots.push(JSON.parse(JSON.stringify(gameState.variables)));
        
        const historyDiv = document.getElementById('gameHistory');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message ai-message';
        loadingDiv.innerHTML = '<div class="message-content"><span class="loading"></span> AI思考中...</div>';
        loadingDiv.id = 'loading-message';
        historyDiv.appendChild(loadingDiv);
        
        try {
            const response = await callAI(report, false, report);
            const loading = document.getElementById('loading-message');
            if (loading) loading.remove();
            handleAIResponse(response);
            generateDynamicWorld().catch(err => console.error('[动态世界] 生成异常:', err));
        } catch (error) {
            const loading = document.getElementById('loading-message');
            if (loading) loading.remove();
            displayErrorMessageWithRetry('AI响应失败：' + error.message, () => {
                document.getElementById('error-message-with-retry')?.remove();
                finishCombat(action, customText);
            });
        }
        
        gameState.isProcessing = false;
    }
}

console.log('✅ 战斗系统加载完成！startCombat函数已定义。');
