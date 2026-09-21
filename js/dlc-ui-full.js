 // ==================== DLC知识包管理系统 ====================
        // ✅ DLCManager类核心功能已完整迁移到 dlc-manager.js
        // ✅ dlc-manager.js会自动创建 window.dlcManager 实例
        // 
        // 以下UI交互函数保留在此文件：
        // - createNewDLC, manageDLC, activateDLC, deactivateDLC
        // - deleteDLC, exportDLC, exportAllDLC, importDLC
        // - editDLCKnowledge, viewDLCKnowledgeVectorStatus
        // - vectorizeDLCKnowledge, confirmEditDLCKnowledge

        // 创建新DLC
        function createNewDLC() {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <h2 style="color: #667eea; margin-bottom: 20px;">📦 创建新DLC知识包</h2>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">DLC名称：</label>
                        <input type="text" id="dlcNameInput" placeholder="例如：克苏鲁修仙世界观" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">DLC描述：</label>
                        <textarea id="dlcDescInput" placeholder="描述这个DLC包的内容和用途..." style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; min-height: 80px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">知识条目（JSON格式）：</label>
                        <textarea id="dlcKnowledgeInput" placeholder='请粘贴知识条目的JSON数组，格式如下：
[
  {
    "id": "unique_id",
    "title": "条目标题",
    "content": "条目内容",
    "category": "分类",
    "tags": ["标签1", "标签2"],
    "alwaysInclude": true,
    "priority": "high"
  }
]' style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; min-height: 200px; resize: vertical; font-family: monospace; font-size: 12px;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="this.closest('div[style*=position]').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">取消</button>
                        <button onclick="confirmCreateDLC()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">创建DLC</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        // 确认创建DLC
        function confirmCreateDLC() {
            const name = document.getElementById('dlcNameInput').value.trim();
            const description = document.getElementById('dlcDescInput').value.trim();
            const knowledgeText = document.getElementById('dlcKnowledgeInput').value.trim();

            if (!name) {
                alert('请输入DLC名称！');
                return;
            }

            if (!knowledgeText) {
                alert('请输入知识条目！');
                return;
            }

            let knowledgeItems;
            try {
                knowledgeItems = JSON.parse(knowledgeText);
                if (!Array.isArray(knowledgeItems)) {
                    throw new Error('知识条目必须是数组格式');
                }
            } catch (error) {
                alert('JSON格式错误：' + error.message);
                return;
            }

            // 验证知识条目格式
            for (let i = 0; i < knowledgeItems.length; i++) {
                const item = knowledgeItems[i];
                if (!item.id || !item.title || !item.content) {
                    alert(`第${i+1}个知识条目缺少必要字段（id、title或content）`);
                    return;
                }
            }

            try {
                const dlc = window.dlcManager.createDLC(name, description, knowledgeItems);
                alert(`✅ DLC包"${dlc.name}"创建成功！\n\n包含${knowledgeItems.length}个知识条目\nDLC ID: ${dlc.id}`);
                document.querySelector('div[style*="position: fixed"]').remove();
            } catch (error) {
                alert('❌ 创建DLC失败：' + error.message);
            }
        }

        // 管理DLC包
        function manageDLC() {
            const dlcList = window.dlcManager.getDLCList();
            
            const modal = document.createElement('div');
            modal.id = 'dlcManageModal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            let dlcItemsHtml = '';
            if (dlcList.length === 0) {
                dlcItemsHtml = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
                        <div>暂无DLC知识包</div>
                        <div style="font-size: 14px; margin-top: 10px;">点击"创建新DLC"开始创建你的第一个知识包</div>
                    </div>
                `;
            } else {
                dlcItemsHtml = dlcList.map(dlc => {
                    const statusBadge = dlc.activated 
                        ? '<span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">✅ 已激活</span>'
                        : '<span style="background: #6c757d; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">⏸️ 未激活</span>';
                    
                    const actionButton = dlc.activated 
                        ? `<button onclick="deactivateDLC('${dlc.id}')" style="padding: 6px 12px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">停用</button>`
                        : `<button onclick="activateDLC('${dlc.id}')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">激活</button>`;

                    return `
                        <div style="border: 2px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 15px; ${dlc.activated ? 'border-color: #28a745; background: #f8fff9;' : ''}">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                <div>
                                    <h4 style="margin: 0; color: #333; font-size: 16px;">${dlc.name}</h4>
                                    <div style="font-size: 12px; color: #666; margin-top: 5px;">ID: ${dlc.id}</div>
                                </div>
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    ${statusBadge}
                                </div>
                            </div>
                            
                            <div style="font-size: 13px; color: #666; margin-bottom: 10px; line-height: 1.4;">
                                ${dlc.description || '暂无描述'}
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 12px; color: #999;">
                                    📚 ${dlc.knowledgeItems.length} 个知识条目 | 
                                    📅 ${new Date(dlc.createdAt).toLocaleDateString()}
                                    ${dlc.vectorizedAt ? `| 🧬 ${dlc.vectorMethod || 'unknown'} 向量化` : '| ⚪ 未向量化'}
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    ${actionButton}
                                    <button onclick="editDLCKnowledge('${dlc.id}')" style="padding: 6px 12px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">编辑条目</button>
                                    <button onclick="vectorizeDLCKnowledge('${dlc.id}')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🧬 向量化</button>
                                    <button onclick="exportDLC('${dlc.id}')" style="padding: 6px 12px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">导出</button>
                                    <button onclick="deleteDLC('${dlc.id}')" style="padding: 6px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">删除</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #667eea; margin: 0;">🎮 DLC知识包管理</h2>
                        <button onclick="document.getElementById('dlcManageModal').remove()" style="
                            padding: 8px 16px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">关闭</button>
                    </div>
                    
                    <div style="background: #f0f2ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #667eea;">${dlcList.length}</div>
                                <div style="font-size: 12px; color: #666;">总DLC数</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #28a745;">${dlcList.filter(d => d.activated).length}</div>
                                <div style="font-size: 12px; color: #666;">已激活</div>
                            </div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${dlcList.filter(d => !d.activated).length}</div>
                                <div style="font-size: 12px; color: #666;">未激活</div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="dlcListContainer">
                        ${dlcItemsHtml}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        // 激活DLC
        async function activateDLC(dlcId) {
            try {
                await window.dlcManager.activateDLC(dlcId);
                alert('✅ DLC包激活成功！\n\n知识条目已添加到静态知识库中。');
                // 移除旧窗口再刷新，避免窗口叠加
                const oldModal = document.getElementById('dlcManageModal');
                if (oldModal) oldModal.remove();
                manageDLC(); // 刷新管理界面
            } catch (error) {
                alert('❌ 激活DLC失败：' + error.message);
            }
        }

        // 停用DLC
        async function deactivateDLC(dlcId) {
            try {
                await window.dlcManager.deactivateDLC(dlcId);
                alert('✅ DLC包停用成功！\n\n相关知识条目已从静态知识库中移除。');
                // 移除旧窗口再刷新，避免窗口叠加
                const oldModal = document.getElementById('dlcManageModal');
                if (oldModal) oldModal.remove();
                manageDLC(); // 刷新管理界面
            } catch (error) {
                alert('❌ 停用DLC失败：' + error.message);
            }
        }

        // 删除DLC
        async function deleteDLC(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) return;

            if (!confirm(`⚠️ 确定要删除DLC包"${dlc.name}"吗？\n\n这将删除整个DLC包和其中的所有知识条目。\n如果DLC已激活，会先自动停用。\n\n此操作不可恢复！`)) {
                return;
            }

            try {
                await window.dlcManager.deleteDLC(dlcId);
                alert('✅ DLC包删除成功！');
                // 移除旧窗口再刷新，避免窗口叠加
                const oldModal = document.getElementById('dlcManageModal');
                if (oldModal) oldModal.remove();
                manageDLC(); // 刷新管理界面
            } catch (error) {
                alert('❌ 删除DLC失败：' + error.message);
            }
        }

        // 导出单个DLC
        function exportDLC(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('DLC包不存在！');
                return;
            }

            const exportData = {
                version: '1.0',
                type: 'dlc_package',
                exportTime: new Date().toISOString(),
                dlc: dlc
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DLC_${dlc.name}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            alert(`✅ DLC包"${dlc.name}"导出成功！\n\n文件名：${a.download}`);
        }

        // 导出所有DLC
        function exportAllDLC() {
            const allDLC = window.dlcManager.getDLCList();
            if (allDLC.length === 0) {
                alert('暂无DLC包可导出！');
                return;
            }

            const exportData = {
                version: '1.0',
                type: 'dlc_collection',
                exportTime: new Date().toISOString(),
                dlcPackages: allDLC
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `All_DLC_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            alert(`✅ 所有DLC包导出成功！\n\n共导出${allDLC.length}个DLC包\n文件名：${a.download}`);
        }

        // 导入DLC
        function importDLC() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const text = await file.text();
                    const data = JSON.parse(text);

                    if (data.type === 'dlc_package') {
                        // 单个DLC包
                        const dlc = data.dlc;
                        
                        // 检查ID冲突
                        const existingDLC = window.dlcManager.dlcPackages.find(d => d.id === dlc.id);
                        if (existingDLC) {
                            if (!confirm(`⚠️ 发现重复的DLC ID：${dlc.id}\n\n现有DLC：${existingDLC.name}\n导入DLC：${dlc.name}\n\n是否覆盖现有DLC？`)) {
                                return;
                            }
                            // 移除现有DLC
                            const index = window.dlcManager.dlcPackages.findIndex(d => d.id === dlc.id);
                            window.dlcManager.dlcPackages.splice(index, 1);
                        }

                        // 添加新DLC
                        window.dlcManager.dlcPackages.push(dlc);
                        await window.dlcManager.saveDLCToIndexedDB();
                        
                        alert(`✅ DLC包"${dlc.name}"导入成功！\n\n包含${dlc.knowledgeItems.length}个知识条目`);
                    } else if (data.type === 'dlc_collection') {
                        // DLC集合
                        const dlcPackages = data.dlcPackages;
                        let importedCount = 0;
                        let skippedCount = 0;

                        for (const dlc of dlcPackages) {
                            const existingDLC = window.dlcManager.dlcPackages.find(d => d.id === dlc.id);
                            if (existingDLC) {
                                skippedCount++;
                                continue;
                            }
                            
                            window.dlcManager.dlcPackages.push(dlc);
                            importedCount++;
                        }

                        await window.dlcManager.saveDLCToIndexedDB();
                        
                        alert(`✅ DLC集合导入成功！\n\n成功导入：${importedCount}个\n跳过重复：${skippedCount}个`);
                    } else if (data.knowledge && Array.isArray(data.knowledge)) {
                        // 普通知识库文件 - 自动转换为DLC
                        const fileName = file.name.replace('.json', '');
                        const dlcName = prompt('🔄 检测到普通知识库文件\n\n请输入DLC包名称：', fileName || '导入的知识库');
                        
                        if (!dlcName) {
                            return;
                        }

                        const dlcDescription = data.description || prompt('请输入DLC描述（可选）：', '从知识库文件导入的知识条目') || '';

                        // 创建DLC包
                        const dlc = {
                            id: 'dlc_' + Date.now(),
                            name: dlcName,
                            description: dlcDescription,
                            knowledgeItems: data.knowledge,
                            activated: false,
                            createdAt: new Date().toISOString(),
                            version: '1.0',
                            source: 'imported_knowledge_base',
                            originalFile: file.name
                        };

                        window.dlcManager.dlcPackages.push(dlc);
                        await window.dlcManager.saveDLCToIndexedDB();
                        
                        alert(`✅ 知识库文件已转换为DLC包！\n\nDLC名称：${dlc.name}\n知识条目：${dlc.knowledgeItems.length}个\n\n💡 你可以在"管理DLC包"中激活它`);
                    } else {
                        throw new Error('不支持的文件格式。支持的格式：\n1. DLC包文件 (.json)\n2. DLC集合文件 (.json)\n3. 知识库文件 (.json) - 会自动转换为DLC');
                    }
                } catch (error) {
                    console.error('[DLC导入] 错误:', error);
                    alert('❌ 导入失败：' + error.message + '\n\n请确保文件格式正确');
                }
            };
            
            input.click();
        }

        // 编辑DLC知识条目
        function editDLCKnowledge(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('DLC包不存在！');
                return;
            }

            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #667eea; margin: 0;">📝 编辑DLC知识条目</h2>
                        <button onclick="this.closest('div[style*=position]').remove()" style="
                            padding: 8px 16px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">关闭</button>
                    </div>
                    
                    <div style="background: #f0f2ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #333;">${dlc.name}</h4>
                        <div style="font-size: 13px; color: #666;">${dlc.description || '暂无描述'}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">DLC ID: ${dlc.id}</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <label style="font-weight: bold; color: #333;">知识条目（JSON格式）：</label>
                            <div style="font-size: 12px; color: #666;">共 ${dlc.knowledgeItems.length} 个条目</div>
                        </div>
                        <textarea id="dlcEditKnowledgeInput" style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; min-height: 300px; resize: vertical; font-family: monospace; font-size: 12px;">${JSON.stringify(dlc.knowledgeItems, null, 2)}</textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
                        <button onclick="viewDLCKnowledgeVectorStatus('${dlcId}')" style="padding: 10px 20px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">📊 向量状态</button>
                        <button onclick="vectorizeDLCKnowledge('${dlcId}')" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">🧬 向量化</button>
                        <button onclick="this.closest('div[style*=position]').remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">取消</button>
                        <button onclick="confirmEditDLCKnowledge('${dlcId}')" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">保存修改</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        }

        // 查看DLC知识条目向量化状态
        function viewDLCKnowledgeVectorStatus(dlcId) {
            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('DLC包不存在！');
                return;
            }

            // 获取当前编辑的知识条目
            const knowledgeText = document.getElementById('dlcEditKnowledgeInput').value.trim();
            
            let knowledgeItems;
            try {
                knowledgeItems = JSON.parse(knowledgeText);
                if (!Array.isArray(knowledgeItems)) {
                    throw new Error('知识条目必须是数组格式');
                }
            } catch (error) {
                alert('JSON格式错误：' + error.message);
                return;
            }

            // 统计向量化状态
            let vectorizedCount = 0;
            let notVectorizedCount = 0;
            let keywordVectorCount = 0;
            let denseVectorCount = 0;
            let alwaysIncludeCount = 0;

            const statusDetails = knowledgeItems.map(item => {
                if (item.vector) {
                    vectorizedCount++;
                    const isDense = Array.isArray(item.vector);
                    if (isDense) {
                        denseVectorCount++;
                    } else {
                        keywordVectorCount++;
                    }
                    return {
                        title: item.title,
                        status: item.alwaysInclude === true ? '⭐ 常驻知识(已向量化)' : '✅ 已向量化',
                        method: item.vectorMethod || 'unknown',
                        type: isDense ? 'dense' : 'sparse',
                        color: item.alwaysInclude === true ? '#ffc107' : '#28a745'
                    };
                } else if (item.alwaysInclude === true) {
                    alwaysIncludeCount++;
                    return {
                        title: item.title,
                        status: '⭐ 常驻知识',
                        method: '无需向量化',
                        type: 'always_include',
                        color: '#ffc107'
                    };
                } else {
                    notVectorizedCount++;
                    return {
                        title: item.title,
                        status: '⚪ 未向量化',
                        method: '无',
                        type: 'none',
                        color: '#6c757d'
                    };
                }
            });

            // 生成状态报告HTML
            const statusHtml = `
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h3 style="color: #333; margin: 0 0 15px 0;">📊 向量化统计</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #28a745;">
                            <div style="font-size: 24px; font-weight: bold; color: #28a745;">${vectorizedCount}</div>
                            <div style="font-size: 12px; color: #666;">已向量化</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #6c757d;">
                            <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${notVectorizedCount}</div>
                            <div style="font-size: 12px; color: #666;">未向量化</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #ffc107;">
                            <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${alwaysIncludeCount}</div>
                            <div style="font-size: 12px; color: #666;">常驻知识</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #17a2b8;">
                            <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${denseVectorCount}</div>
                            <div style="font-size: 12px; color: #666;">稠密向量</div>
                        </div>
                        <div style="text-align: center; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #6f42c1;">
                            <div style="font-size: 24px; font-weight: bold; color: #6f42c1;">${keywordVectorCount}</div>
                            <div style="font-size: 12px; color: #666;">关键词向量</div>
                        </div>
                    </div>
                </div>

                <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
                    <h3 style="color: #333; margin: 0 0 15px 0;">📋 详细状态</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${statusDetails.map((item, index) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${item.title}</div>
                                    <div style="font-size: 11px; color: #666;">方法: ${item.method} | 类型: ${item.type}</div>
                                </div>
                                <div style="padding: 4px 8px; background: ${item.color}; color: white; border-radius: 12px; font-size: 11px; font-weight: 500;">
                                    ${item.status}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            // 创建状态模态框
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10002;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="color: #17a2b8; margin: 0;">📊 DLC向量化状态</h2>
                        <button onclick="this.closest('div[style*=position]').remove()" style="
                            padding: 8px 16px;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">关闭</button>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1976d2;">${dlc.name}</h4>
                        <div style="font-size: 13px; color: #666;">${dlc.description || '暂无描述'}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">DLC ID: ${dlc.id}</div>
                    </div>
                    
                    ${statusHtml}
                </div>
            `;

            document.body.appendChild(modal);
        }

        // 向量化DLC知识条目
        async function vectorizeDLCKnowledge(dlcId) {
            if (!window.contextVectorManager) {
                alert('向量管理器未初始化！');
                return;
            }

            const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
            if (!dlc) {
                alert('DLC包不存在！');
                return;
            }

            // 获取知识条目 - 优先从编辑界面获取，如果没有则从DLC数据获取
            let knowledgeItems;
            const editInput = document.getElementById('dlcEditKnowledgeInput');
            
            if (editInput) {
                // 从编辑界面获取
                const knowledgeText = editInput.value.trim();
                try {
                    knowledgeItems = JSON.parse(knowledgeText);
                    if (!Array.isArray(knowledgeItems)) {
                        throw new Error('知识条目必须是数组格式');
                    }
                } catch (error) {
                    alert('JSON格式错误：' + error.message);
                    return;
                }
            } else {
                // 直接从DLC数据获取
                knowledgeItems = dlc.knowledgeItems;
                if (!Array.isArray(knowledgeItems)) {
                    alert('DLC知识条目格式错误！');
                    return;
                }
            }

            // 检查向量化方法
            const vectorMethod = document.getElementById('vectorMethod')?.value || 'keyword';
            
            if (vectorMethod === 'transformers') {
                // 检查是否已加载transformers
                if (!window.transformersLoaded) {
                    const confirmLoad = confirm('🤖 使用浏览器模型向量化需要下载约50MB的模型文件\n\n确定要继续吗？');
                    if (!confirmLoad) return;
                }
            } else if (vectorMethod === 'api') {
                // 检查API配置
                if (!window.extraApiConfig || !window.extraApiConfig.enabled) {
                    alert('❌ API向量化未配置\n\n请在"额外API设置"中启用并配置embeddings API');
                    return;
                }
            }

            // 显示进度提示
            const progressModal = document.createElement('div');
            progressModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
            `;
            
            progressModal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; min-width: 400px;">
                    <div style="color: #28a745; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
                        🧬 正在向量化DLC知识条目...
                    </div>
                    <div class="loading" style="margin: 20px auto;"></div>
                    <div style="color: #666; font-size: 14px; margin-bottom: 15px;">
                        使用方法：<strong>${vectorMethod === 'keyword' ? '关键词匹配' : vectorMethod === 'api' ? 'API向量化' : '浏览器模型'}</strong>
                    </div>
                    <div style="color: #666; font-size: 14px;">
                        正在处理 <span id="vectorizeCurrent">0</span>/${knowledgeItems.length} 个条目
                    </div>
                    <div style="margin-top: 15px; font-size: 12px; color: #999;">
                        请勿关闭窗口，这可能需要几分钟
                    </div>
                </div>
            `;
            
            document.body.appendChild(progressModal);

            try {
                let successCount = 0;
                let errorCount = 0;

                // 如果是transformers方法，先加载模型
                if (vectorMethod === 'transformers' && !window.transformersLoaded) {
                    document.querySelector('#vectorizeCurrent').textContent = '加载模型';
                    await window.loadTransformersJS();
                    window.transformersLoaded = true;
                }

                // 逐个向量化知识条目
                for (let i = 0; i < knowledgeItems.length; i++) {
                    const item = knowledgeItems[i];
                    
                    try {
                        // 更新进度
                        document.querySelector('#vectorizeCurrent').textContent = i + 1;
                        
                        // 生成向量
                        let vector;
                        const textForVector = `${item.title}\n${item.content}`;
                        
                        if (vectorMethod === 'keyword') {
                            vector = window.contextVectorManager.createKeywordVector(textForVector);
                        } else if (vectorMethod === 'api') {
                            vector = await window.contextVectorManager.getEmbeddingFromAPI(textForVector);
                        } else if (vectorMethod === 'transformers') {
                            vector = await window.contextVectorManager.getEmbeddingFromTransformers(textForVector);
                        }

                        // 更新条目的向量
                        item.vector = vector;
                        item.vectorType = Array.isArray(vector) ? 'dense' : 'sparse';
                        item.vectorizedAt = new Date().toISOString();
                        item.vectorMethod = vectorMethod;
                        
                        successCount++;
                        console.log(`[DLC向量化] ✅ ${item.title} (${item.vectorType})`);
                        
                    } catch (error) {
                        errorCount++;
                        console.error(`[DLC向量化] ❌ ${item.title}:`, error);
                        
                        // 失败时使用关键词方法作为后备
                        try {
                            const textForVector = `${item.title}\n${item.content}`;
                            const fallbackVector = window.contextVectorManager.createKeywordVector(textForVector);
                            item.vector = fallbackVector;
                            item.vectorType = 'sparse';
                            item.vectorizedAt = new Date().toISOString();
                            item.vectorMethod = 'keyword_fallback';
                            successCount++;
                            console.log(`[DLC向量化] 🔄 ${item.title} (关键词后备)`);
                        } catch (fallbackError) {
                            console.error(`[DLC向量化] ❌ ${item.title} 关键词后备也失败:`, fallbackError);
                        }
                    }
                }

                // 更新DLC知识条目
                const wasActive = dlc.activated;
                
                // 如果DLC已激活，先停用
                if (wasActive) {
                    await window.dlcManager.deactivateDLC(dlcId);
                }

                dlc.knowledgeItems = knowledgeItems;
                dlc.updatedAt = new Date().toISOString();
                dlc.vectorizedAt = new Date().toISOString();
                dlc.vectorMethod = vectorMethod;
                
                await window.dlcManager.saveDLCToIndexedDB();

                // 如果之前是激活状态，重新激活
                if (wasActive) {
                    await window.dlcManager.activateDLC(dlcId);
                }

                // 更新编辑界面的文本框（如果存在）
                const editInput = document.getElementById('dlcEditKnowledgeInput');
                if (editInput) {
                    editInput.value = JSON.stringify(knowledgeItems, null, 2);
                }

                // 移除进度提示
                progressModal.remove();

                // 显示结果
                let resultMessage = `✅ DLC向量化完成！\n\n`;
                resultMessage += `📊 处理结果：\n`;
                resultMessage += `   - 总条目：${knowledgeItems.length} 个\n`;
                resultMessage += `   - 成功：${successCount} 个\n`;
                resultMessage += `   - 失败：${errorCount} 个\n`;
                resultMessage += `   - 方法：${vectorMethod === 'keyword' ? '关键词匹配' : vectorMethod === 'api' ? 'API向量化' : '浏览器模型'}\n\n`;
                resultMessage += `💡 向量化后的条目将用于智能检索\n`;
                resultMessage += `🔄 已自动保存并更新DLC包`;

                alert(resultMessage);

                // 刷新DLC管理界面以显示更新后的向量化状态
                const manageModal = document.getElementById('dlcManageModal');
                if (manageModal) {
                    // 重新渲染DLC列表
                    manageDLC();
                }

            } catch (error) {
                progressModal.remove();
                alert(`❌ 向量化失败：${error.message}\n\n建议：\n- 检查网络连接\n- 尝试使用关键词匹配方法\n- 查看控制台了解详情`);
                console.error('[DLC向量化] 失败:', error);
            }
        }

        // 确认编辑DLC知识条目
        async function confirmEditDLCKnowledge(dlcId) {
            const knowledgeText = document.getElementById('dlcEditKnowledgeInput').value.trim();

            let knowledgeItems;
            try {
                knowledgeItems = JSON.parse(knowledgeText);
                if (!Array.isArray(knowledgeItems)) {
                    throw new Error('知识条目必须是数组格式');
                }
            } catch (error) {
                alert('JSON格式错误：' + error.message);
                return;
            }

            // 验证知识条目格式
            for (let i = 0; i < knowledgeItems.length; i++) {
                const item = knowledgeItems[i];
                if (!item.id || !item.title || !item.content) {
                    alert(`第${i+1}个知识条目缺少必要字段（id、title或content）`);
                    return;
                }
            }

            try {
                const dlc = window.dlcManager.dlcPackages.find(d => d.id === dlcId);
                const wasActive = dlc.activated;
                
                // 如果DLC已激活，先停用
                if (wasActive) {
                    await window.dlcManager.deactivateDLC(dlcId);
                }

                // 更新知识条目
                dlc.knowledgeItems = knowledgeItems;
                dlc.updatedAt = new Date().toISOString();
                
                await window.dlcManager.saveDLCToIndexedDB();

                // 如果之前是激活状态，重新激活
                if (wasActive) {
                    await window.dlcManager.activateDLC(dlcId);
                }

                alert(`✅ DLC知识条目更新成功！\n\n已更新${knowledgeItems.length}个知识条目`);
                document.querySelector('div[style*="position: fixed"]').remove();
                manageDLC(); // 刷新管理界面
            } catch (error) {
                alert('❌ 更新失败：' + error.message);
            }
        }

        // 🔧 将DLC管理函数暴露到全局作用域，供HTML中的onclick使用
        window.createNewDLC = createNewDLC;
        window.importDLC = importDLC;
        window.manageDLC = manageDLC;
        window.exportAllDLC = exportAllDLC;

        // ==================== DLC管理系统结束 ====================