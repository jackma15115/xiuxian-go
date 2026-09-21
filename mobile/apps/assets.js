const assetsApp = `
<div class="wallet-container">
    <div class="crypto-card">
        <div class="card-circuit"></div>
        <div class="card-header">
            <span class="bank-name">CYBER_BANK_v2.0</span>
            <span class="chip-icon">💾</span>
        </div>
        <div class="balance-section">
            <div class="balance-label">TOTAL_ASSETS</div>
            <div class="balance-value glitch-num" data-value="9,999">9,999</div>
            <div class="currency-type">SPIRIT_COIN</div>
        </div>
        <div class="card-footer">
            <span class="card-id">**** **** **** 8086</span>
            <span class="card-exp">EXP: 2099</span>
        </div>
    </div>

    <div class="ops-grid">
        <div class="ops-btn">
            <div class="ops-hex">💎</div>
            <span>DEPOSIT</span>
        </div>
        <div class="ops-btn">
            <div class="ops-hex">📤</div>
            <span>TRANSFER</span>
        </div>
        <div class="ops-btn">
            <div class="ops-hex">💰</div>
            <span>WITHDRAW</span>
        </div>
    </div>

    <div class="tx-log-header">
        <span>// TRANSACTION_LOG</span>
        <div class="header-line"></div>
    </div>
    
    <div class="tx-log">
        <div class="tx-row income">
            <div class="tx-icon">[+]</div>
            <div class="tx-data">
                <div class="tx-title">AUCTION_INCOME</div>
                <div class="tx-meta">ID:8X22 | T:NOW</div>
            </div>
            <div class="tx-amount">+500</div>
        </div>

        <div class="tx-row expense">
            <div class="tx-icon">[-]</div>
            <div class="tx-data">
                <div class="tx-title">ITEM_PURCHASE</div>
                <div class="tx-meta">ID:7B11 | T:-1H</div>
            </div>
            <div class="tx-amount">-1,200</div>
        </div>

        <div class="tx-row income">
            <div class="tx-icon">[+]</div>
            <div class="tx-data">
                <div class="tx-title">SECT_REWARD</div>
                <div class="tx-meta">ID:9C33 | T:-1D</div>
            </div>
            <div class="tx-amount">+300</div>
        </div>

        <div class="tx-row expense">
            <div class="tx-icon">[-]</div>
            <div class="tx-data">
                <div class="tx-title">ALCHEMY_MATS</div>
                <div class="tx-meta">ID:4D44 | T:-2D</div>
            </div>
            <div class="tx-amount">-800</div>
        </div>
    </div>
</div>

<style>
.wallet-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 10px;
    margin: 5px;
}

.crypto-card {
    position: relative;
    background: linear-gradient(135deg, #000, #0a1a2f);
    border: 1px solid var(--primary);
    border-radius: 15px;
    padding: 20px;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);
    margin: 5px;
}

.card-circuit {
    position: absolute;
    inset: 0;
    background-image: 
        linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.3;
    pointer-events: none;
}

.crypto-card::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 45%, rgba(255,255,255,0.1) 50%, transparent 55%);
    animation: sheen 3s infinite;
}

@keyframes sheen {
    0% { transform: translate(-100%, -100%); }
    100% { transform: translate(100%, 100%); }
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
}

.bank-name {
    font-size: 12px;
    color: var(--primary);
    font-family: 'Courier New', monospace;
    letter-spacing: 2px;
}

.chip-icon {
    font-size: 24px;
    text-shadow: 0 0 10px #ffd700;
}

.balance-section {
    text-align: center;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
}

.balance-label {
    font-size: 10px;
    color: #888;
    letter-spacing: 4px;
    margin-bottom: 5px;
}

.balance-value {
    font-size: 42px;
    font-weight: bold;
    color: #fff;
    font-family: 'Courier New', monospace;
    text-shadow: 0 0 10px rgba(255,255,255,0.5);
}

.currency-type {
    font-size: 10px;
    color: #ffd700;
    letter-spacing: 2px;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: #666;
    position: relative;
    z-index: 1;
}

.ops-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.ops-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    color: #888;
    font-size: 10px;
    font-family: 'Courier New', monospace;
    transition: all 0.2s;
}

.ops-btn:hover {
    color: var(--primary);
}

.ops-hex {
    width: 45px;
    height: 45px;
    background: rgba(0, 20, 40, 0.8);
    border: 1px solid rgba(0, 243, 255, 0.3);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: all 0.2s;
}

.ops-btn:hover .ops-hex {
    background: rgba(0, 243, 255, 0.2);
    border-color: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
}

.tx-log-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: var(--primary);
    margin-top: 10px;
}

.header-line {
    flex: 1;
    height: 1px;
    background: var(--primary);
    opacity: 0.3;
}

.tx-log {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tx-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: rgba(0,0,0,0.3);
    border-left: 2px solid #333;
    font-family: 'Courier New', monospace;
}

.tx-row:hover {
    background: rgba(255,255,255,0.05);
}

.tx-row.income { border-color: #0f0; }
.tx-row.expense { border-color: #ff003c; }

.tx-icon {
    font-weight: bold;
    font-size: 14px;
}

.income .tx-icon { color: #0f0; }
.expense .tx-icon { color: #ff003c; }

.tx-data {
    flex: 1;
}

.tx-title {
    font-size: 12px;
    color: #ddd;
    margin-bottom: 2px;
}

.tx-meta {
    font-size: 8px;
    color: #666;
}

.tx-amount {
    font-weight: bold;
    font-size: 14px;
}

.income .tx-amount { color: #0f0; text-shadow: 0 0 5px rgba(0,255,0,0.5); }
.expense .tx-amount { color: #ff003c; text-shadow: 0 0 5px rgba(255,0,60,0.5); }
</style>
`;
