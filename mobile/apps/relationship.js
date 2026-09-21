const relationshipApp = `
<div class="rel-container">
    <div class="stats-grid">
        <div class="stat-panel love">
            <div class="panel-icon">❤️</div>
            <div class="panel-data">
                <div class="panel-label">DATA_道侣</div>
                <div class="panel-value">00</div>
            </div>
            <div class="panel-bar"></div>
        </div>
        
        <div class="stat-panel friend">
            <div class="panel-icon">👥</div>
            <div class="panel-data">
                <div class="panel-label">DATA_好友</div>
                <div class="panel-value">12</div>
            </div>
            <div class="panel-bar" style="width: 40%"></div>
        </div>
        
        <div class="stat-panel enemy">
            <div class="panel-icon">⚔️</div>
            <div class="panel-data">
                <div class="panel-label">DATA_仇家</div>
                <div class="panel-value glitch-text">99+</div>
            </div>
            <div class="panel-bar full"></div>
        </div>
    </div>

    <div class="data-divider">
        <span class="divider-text">// RECENT_INTERACTIONS</span>
        <div class="divider-line"></div>
    </div>
    
    <div class="contacts-list">
        <div class="contact-entry">
            <div class="contact-hex cyan">
                <span class="hex-content">👩</span>
            </div>
            <div class="contact-info">
                <div class="contact-name">ID: 师姐 <span class="status-tag online">ONLINE</span></div>
                <div class="contact-meta">LEVEL: 筑基后期 | TRUST: 85%</div>
            </div>
            <div class="contact-btn">ACCESS</div>
        </div>

        <div class="contact-entry">
            <div class="contact-hex purple">
                <span class="hex-content">👨</span>
            </div>
            <div class="contact-info">
                <div class="contact-name">ID: 师弟 <span class="status-tag online">ONLINE</span></div>
                <div class="contact-meta">LEVEL: 练气巅峰 | TRUST: 92%</div>
            </div>
            <div class="contact-btn">ACCESS</div>
        </div>

        <div class="contact-entry">
            <div class="contact-hex gold">
                <span class="hex-content">🧙</span>
            </div>
            <div class="contact-info">
                <div class="contact-name">ID: 掌门 <span class="status-tag offline">OFFLINE</span></div>
                <div class="contact-meta">LEVEL: 元婴期 | TRUST: 50%</div>
            </div>
            <div class="contact-btn">LOCKED</div>
        </div>

        <div class="contact-entry">
            <div class="contact-hex red">
                <span class="hex-content">😈</span>
            </div>
            <div class="contact-info">
                <div class="contact-name">ID: 宿敌 <span class="status-tag online">TRACKING</span></div>
                <div class="contact-meta">LEVEL: 金丹初期 | THREAT: HIGH</div>
            </div>
            <div class="contact-btn danger">ATTACK</div>
        </div>
    </div>
</div>

<style>
.rel-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 10px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.stat-panel {
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid #333;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
}

.stat-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 10px;
    height: 10px;
    border-top: 2px solid var(--primary);
    border-left: 2px solid var(--primary);
}

.stat-panel::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-bottom: 2px solid var(--primary);
    border-right: 2px solid var(--primary);
}

.stat-panel.love { border-color: rgba(255, 0, 60, 0.3); }
.stat-panel.love::before, .stat-panel.love::after { border-color: #ff003c; }

.stat-panel.friend { border-color: rgba(0, 243, 255, 0.3); }

.stat-panel.enemy { border-color: rgba(255, 215, 0, 0.3); }
.stat-panel.enemy::before, .stat-panel.enemy::after { border-color: #ffd700; }

.panel-icon {
    font-size: 20px;
    margin-bottom: 5px;
    opacity: 0.8;
}

.panel-label {
    font-size: 8px;
    color: #666;
    letter-spacing: 1px;
    margin-bottom: 2px;
}

.panel-value {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    font-family: 'Courier New', monospace;
}

.glitch-text {
    color: #ff003c;
    animation: glitch-text 2s infinite;
}

@keyframes glitch-text {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
}

.panel-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--primary);
    width: 0%;
    box-shadow: 0 0 5px var(--primary);
}

.panel-bar.full { width: 100%; background: #ff003c; box-shadow: 0 0 5px #ff003c; }

.data-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 5px 0;
}

.divider-text {
    font-size: 10px;
    color: var(--primary);
    font-family: 'Courier New', monospace;
    background: rgba(0, 243, 255, 0.1);
    padding: 2px 5px;
}

.divider-line {
    flex: 1;
    height: 1px;
    background: repeating-linear-gradient(90deg, var(--primary) 0, var(--primary) 5px, transparent 5px, transparent 10px);
    opacity: 0.5;
}

.contacts-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.contact-entry {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 10px;
    clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px);
    transition: all 0.2s;
    margin-right: 5px;
}

.contact-entry:hover {
    background: rgba(0, 243, 255, 0.05);
    border-color: var(--primary);
    padding-left: 15px;
}

.contact-hex {
    width: 40px;
    height: 40px;
    background: #111;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 1px solid #444;
}

.contact-hex.cyan { border-color: var(--primary); box-shadow: 0 0 10px rgba(0, 243, 255, 0.2); }
.contact-hex.purple { border-color: #bf00ff; box-shadow: 0 0 10px rgba(191, 0, 255, 0.2); }
.contact-hex.gold { border-color: #ffd700; box-shadow: 0 0 10px rgba(255, 215, 0, 0.2); }
.contact-hex.red { border-color: #ff003c; box-shadow: 0 0 10px rgba(255, 0, 60, 0.2); }

.contact-info {
    flex: 1;
    font-family: 'Courier New', monospace;
}

.contact-name {
    font-size: 12px;
    color: #fff;
    font-weight: bold;
    margin-bottom: 2px;
}

.status-tag {
    font-size: 8px;
    padding: 1px 4px;
    border-radius: 2px;
    margin-left: 5px;
}

.status-tag.online { background: #0f0; color: #000; }
.status-tag.offline { background: #555; color: #ccc; }
.status-tag.tracking { background: #ff003c; color: #fff; animation: blink 1s infinite; }

.contact-meta {
    font-size: 10px;
    color: #888;
}

.contact-btn {
    font-size: 10px;
    border: 1px solid var(--primary);
    color: var(--primary);
    padding: 4px 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.contact-btn:hover {
    background: var(--primary);
    color: #000;
}

.contact-btn.danger {
    border-color: #ff003c;
    color: #ff003c;
}

.contact-btn.danger:hover {
    background: #ff003c;
    color: #fff;
}
</style>
`;
