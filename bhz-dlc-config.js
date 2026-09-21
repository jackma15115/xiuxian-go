/**
 * 白虎宗DLC配置文件
 * 用于自动配置独立的数据库和激活白虎宗DLC
 */

(async function() {
    console.log('[白虎宗DLC配置] 开始初始化...');
    
    // 等待DLCManager初始化完成
    const waitForDLCManager = () => {
        return new Promise((resolve) => {
            if (window.dlcManager && window.dlcManager.db) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.dlcManager) {
                        clearInterval(checkInterval);
                        setTimeout(resolve, 100); // 额外等待一点时间确保初始化完成
                    }
                }, 100);
            }
        });
    };
    
    await waitForDLCManager();
    
    // 修改DLCManager的数据库配置
    if (window.BHZ_CONFIG && window.dlcManager) {
        console.log('[白虎宗DLC配置] 正在重新配置DLC管理器...');
        
        // 关闭原有数据库连接
        if (window.dlcManager.db) {
            window.dlcManager.db.close();
        }
        
        // 修改数据库名称
        window.dlcManager.dbName = window.BHZ_CONFIG.DB_NAME;
        window.dlcManager.db = null;
        
        // 重新初始化数据库
        await window.dlcManager.initDB();
        await window.dlcManager.loadAllDLCs();
        
        console.log('[白虎宗DLC配置] DLC管理器已重新配置为:', window.BHZ_CONFIG.DB_NAME);
        
        // 检查白虎宗DLC是否已导入
        const bhzDLCs = window.dlcManager.dlcPackages.filter(dlc => 
            dlc.name && dlc.name.includes('白虎宗') || 
            dlc.description && dlc.description.includes('白虎宗')
        );
        
        if (bhzDLCs.length === 0) {
            console.log('[白虎宗DLC配置] 未找到白虎宗DLC，尝试自动导入...');
            
            // 尝试加载白虎宗DLC文件
            try {
                const response = await fetch(window.BHZ_CONFIG.DLC_FILE);
                if (!response.ok) {
                    throw new Error('无法加载DLC文件: ' + response.statusText);
                }
                
                const dlcData = await response.json();
                console.log('[白虎宗DLC配置] DLC文件加载成功:', dlcData);
                
                // 导入DLC包
                if (dlcData.dlcPackages && Array.isArray(dlcData.dlcPackages)) {
                    console.log(`[白虎宗DLC配置] 发现 ${dlcData.dlcPackages.length} 个DLC包，开始导入...`);
                    
                    for (const dlcPackage of dlcData.dlcPackages) {
                        try {
                            await window.dlcManager.importDLC(dlcPackage);
                            console.log(`[白虎宗DLC配置] 已导入DLC包: ${dlcPackage.name}`);
                        } catch (error) {
                            console.error(`[白虎宗DLC配置] 导入DLC包失败 (${dlcPackage.name}):`, error);
                        }
                    }
                    
                    // 保存到数据库
                    await window.dlcManager.saveDLCToIndexedDB();
                    
                    // 重新加载DLC列表
                    await window.dlcManager.loadAllDLCs();
                    
                    console.log('[白虎宗DLC配置] ✅ 白虎宗DLC已成功导入！');
                    
                    // 显示通知
                    setTimeout(() => {
                        alert('✅ 白虎宗DLC已导入！\n\n' + 
                              `📦 已自动导入 ${dlcData.dlcPackages.length} 个DLC包\n` +
                              '⚙️ 请在设置中手动激活需要的DLC\n' +
                              '💡 点击右上角"⚙️ 设置" → "📦 DLC管理"');
                    }, 500);
                } else {
                    console.error('[白虎宗DLC配置] DLC文件格式不正确');
                }
                
            } catch (error) {
                console.error('[白虎宗DLC配置] 自动导入DLC失败:', error);
                console.log('[白虎宗DLC配置] 请手动在设置中导入白虎宗DLC文件');
            }
        } else {
            console.log(`[白虎宗DLC配置] 发现 ${bhzDLCs.length} 个白虎宗相关DLC`);
            
            // 统计激活状态
            const activatedDLCs = bhzDLCs.filter(dlc => dlc.activated);
            console.log(`[白虎宗DLC配置] 其中 ${activatedDLCs.length} 个已激活`);
            
            if (activatedDLCs.length === 0) {
                console.log('[白虎宗DLC配置] 💡 提示: 请在设置中手动激活白虎宗DLC');
            }
            
            console.log('[白虎宗DLC配置] ✅ 白虎宗DLC配置完成');
        }
    }
    
    // 修改向量数据库名称（包装所有数据库操作方法）
    if (window.BHZ_CONFIG && window.contextVectorManager) {
        console.log('[白虎宗DLC配置] 正在配置向量管理器使用独立数据库...');
        
        const BHZ_VECTOR_DB = window.BHZ_CONFIG.VECTOR_DB_NAME;
        
        // 包装所有IndexedDB操作方法，自动使用白虎宗数据库名称
        const originalMethods = {
            saveToIndexedDB: window.contextVectorManager.saveToIndexedDB.bind(window.contextVectorManager),
            loadFromIndexedDB: window.contextVectorManager.loadFromIndexedDB.bind(window.contextVectorManager),
            saveStaticKBToIndexedDB: window.contextVectorManager.saveStaticKBToIndexedDB.bind(window.contextVectorManager),
            loadStaticKBFromIndexedDB: window.contextVectorManager.loadStaticKBFromIndexedDB.bind(window.contextVectorManager),
            clearIndexedDB: window.contextVectorManager.clearIndexedDB.bind(window.contextVectorManager)
        };
        
        // 重写方法，自动使用白虎宗数据库
        window.contextVectorManager.saveToIndexedDB = async function() {
            return originalMethods.saveToIndexedDB(BHZ_VECTOR_DB);
        };
        
        window.contextVectorManager.loadFromIndexedDB = async function() {
            return originalMethods.loadFromIndexedDB(BHZ_VECTOR_DB);
        };
        
        window.contextVectorManager.saveStaticKBToIndexedDB = async function() {
            return originalMethods.saveStaticKBToIndexedDB(BHZ_VECTOR_DB);
        };
        
        window.contextVectorManager.loadStaticKBFromIndexedDB = async function() {
            return originalMethods.loadStaticKBFromIndexedDB(BHZ_VECTOR_DB);
        };
        
        window.contextVectorManager.clearIndexedDB = async function() {
            return originalMethods.clearIndexedDB(BHZ_VECTOR_DB);
        };
        
        // 立即加载白虎宗的向量数据库
        try {
            await window.contextVectorManager.loadFromIndexedDB();
            await window.contextVectorManager.loadStaticKBFromIndexedDB();
            console.log('[白虎宗DLC配置] ✅ 向量管理器已配置为使用独立数据库:', BHZ_VECTOR_DB);
        } catch (error) {
            console.log('[白虎宗DLC配置] 向量数据库为空或加载失败（首次使用正常）:', error.message);
        }
    }
    
    console.log('[白虎宗DLC配置] 初始化完成');
})();
