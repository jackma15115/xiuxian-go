/**
 * 消息楼层指示器模块
 * 用于在消息header中显示消息的楼层编号
 * 作者：系统生成
 * 版本：1.0.0
 */

(function() {
    'use strict';
    
    /**
     * 为消息header添加楼层指示器
     * @param {HTMLElement} headerDiv - 消息的header DOM元素
     * @param {number} floorNumber - 楼层编号（对应data-message-index值）
     * @param {string} position - 显示位置 'left'(左侧) 或 'right'(右侧)，默认'left'
     */
    function addFloorIndicator(headerDiv, floorNumber, position = 'left') {
        if (!headerDiv || typeof floorNumber !== 'number') {
            console.warn('[楼层指示器] 参数无效:', { headerDiv, floorNumber });
            return;
        }
        
        // 创建楼层指示器元素
        const floorIndicator = document.createElement('span');
        floorIndicator.className = 'message-floor-indicator';
        floorIndicator.textContent = `#${floorNumber}`;
        floorIndicator.title = `第${floorNumber}层`;
        
        // 设置样式
        floorIndicator.style.cssText = `
            font-size: 12px;
            color: #6c757d;
            background: rgba(108, 117, 125, 0.1);
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: normal;
            user-select: none;
            margin: 0 8px;
        `;
        
        // 根据位置插入
        if (position === 'right') {
            headerDiv.appendChild(floorIndicator);
        } else {
            // 查找标题span并插入到其内部
            const titleSpan = headerDiv.querySelector('span:not(.message-floor-indicator)');
            if (titleSpan) {
                // 在标题span内部添加楼层指示器（避免使用innerHTML）
                const spaceNode = document.createTextNode(' ');
                titleSpan.appendChild(spaceNode);
                titleSpan.appendChild(floorIndicator);
            } else {
                // 如果找不到标题span，则添加到header末尾
                headerDiv.appendChild(floorIndicator);
            }
        }
    }
    
    /**
     * 批量更新所有消息的楼层指示器
     * 用于页面加载或消息删除后重新编号
     */
    function updateAllFloorIndicators() {
        const historyDiv = document.getElementById('gameHistory');
        if (!historyDiv) {
            console.warn('[楼层指示器] 未找到gameHistory元素');
            return;
        }
        
        const messages = historyDiv.querySelectorAll('.message');
        messages.forEach((messageDiv, index) => {
            // 更新data-message-index属性
            messageDiv.setAttribute('data-message-index', index);
            
            // 查找或创建楼层指示器
            const headerDiv = messageDiv.querySelector('.message-header');
            if (!headerDiv) return;
            
            // 移除旧的楼层指示器（如果存在）
            const oldIndicator = headerDiv.querySelector('.message-floor-indicator');
            if (oldIndicator) {
                oldIndicator.remove();
            }
            
            // 添加新的楼层指示器
            addFloorIndicator(headerDiv, index);
        });
        
        console.log(`[楼层指示器] 已更新 ${messages.length} 条消息的楼层编号`);
    }
    
    /**
     * 监听DOM变化，自动为新消息添加楼层指示器
     */
    function observeMessageChanges() {
        const historyDiv = document.getElementById('gameHistory');
        if (!historyDiv) {
            console.warn('[楼层指示器] 未找到gameHistory元素，延迟初始化');
            setTimeout(observeMessageChanges, 1000);
            return;
        }
        
        // 使用MutationObserver监听消息变化
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    // 只处理新增的消息元素，且不在删除模式时
                    if (node.nodeType === Node.ELEMENT_NODE && 
                        node.classList.contains('message') &&
                        !historyDiv.classList.contains('delete-mode-active')) {
                        
                        const headerDiv = node.querySelector('.message-header');
                        const messageIndex = parseInt(node.getAttribute('data-message-index'));
                        
                        if (headerDiv && !isNaN(messageIndex)) {
                            // 检查是否已有楼层指示器
                            if (!headerDiv.querySelector('.message-floor-indicator')) {
                                addFloorIndicator(headerDiv, messageIndex);
                            }
                        }
                    }
                });
            });
        });
        
        // 开始观察
        observer.observe(historyDiv, {
            childList: true,
            subtree: false
        });
        
        console.log('[楼层指示器] 已启动消息变化监听');
        
        // 初始化现有消息
        updateAllFloorIndicators();
    }
    
    /**
     * 初始化楼层指示器系统
     */
    function initFloorIndicator() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeMessageChanges);
        } else {
            observeMessageChanges();
        }
    }
    
    // 导出到全局对象
    window.MessageFloorIndicator = {
        addFloorIndicator,
        updateAllFloorIndicators,
        init: initFloorIndicator
    };
    
    // 自动初始化
    initFloorIndicator();
    
    console.log('[楼层指示器] 模块加载完成');
})();
