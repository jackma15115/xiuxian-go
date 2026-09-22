// 📱 监听父页面的AI响应（论坛模块）
window.addEventListener('message', function(event) {
    // 🗑️ 监听清除数据消息
    if (event.data && event.data.type === 'MOBILE_FORUM_CLEAR') {
        console.log('[📰论坛] 收到清除数据指令');
        if (window.forumApi && window.forumApi.clearAll) {
            window.forumApi.clearAll();
        }
        return;
    }
    
    if (event.data && event.data.type === 'MOBILE_FORUM_RESPONSE') {
        console.log('[📰论坛] 收到AI响应');
        
        const { loadingId, success, reply, error } = event.data;
        
        // 移除加载状态
        const loadingEl = document.getElementById(loadingId);
        if (loadingEl) {
            loadingEl.remove();
        }
        
        if (success && reply) {
            // 解析AI回复
            if (window.MobilePrompts && window.MobilePrompts.forum) {
                const data = window.MobilePrompts.forum.parseAIReply(reply);
                window.forumApi.handleAIResponse(data);
            } else {
                console.error('[📰论坛] MobilePrompts.forum 未加载');
            }
        } else {
            window.forumApi.showError(error || '请求失败');
        }
    }
});

// 定义全局论坛功能
window.forumApi = {
    // 当前筛选标签
    currentTag: null,
    
    // 当前查看的帖子
    currentPost: null,
    
    // 本地帖子缓存
    postsCache: {},
    
    // 本地评论缓存
    commentsCache: {},
    
    // 💾 存储数据
    forumStorage: {
        myPosts: [],      // 我发的帖子
        myComments: [],   // 我的评论
        favorites: [],    // 收藏的帖子
        history: [],       // 浏览历史
        postsCache: {},   // AI生成的帖子缓存
        commentsCache: {} // 评论缓存
    },
    
    // 初始化论坛
    initApp: function() {
        window.forumApi.loadFromStorage();
        // 显示本地缓存或默认帖子（不触发API）
        setTimeout(() => {
            window.forumApi.showLocalPosts();
        }, 100);
    },
    
    // 显示本地缓存的帖子（不触发API）
    showLocalPosts: function(tag = null) {
        window.forumApi.currentTag = tag;
        
        // 获取缓存的帖子
        const cachedPosts = Object.values(window.forumApi.postsCache);
        console.log('[📰论坛] 显示本地帖子，缓存数量:', cachedPosts.length);
        
        // 如果有缓存，按获取时间排序（新的在前面），然后按标签筛选后显示
        if (cachedPosts.length > 0) {
            // 🆕 按获取时间排序，新帖子在最上面
            cachedPosts.sort((a, b) => (b._fetchTime || 0) - (a._fetchTime || 0));
            
            let filtered = cachedPosts;
            if (tag) {
                filtered = cachedPosts.filter(p => p.tag === tag);
            }
            window.forumApi.renderPostList(filtered);
        } else {
            // 没有缓存，显示默认帖子
            console.log('[📰论坛] 没有缓存帖子，显示默认内容');
            window.forumApi.showDefaultPosts(tag);
        }
    },
    
    // 显示默认帖子（不触发API）
    showDefaultPosts: function(tag = null) {
        const defaultPosts = [
            
        ];
        
        // 缓存默认帖子
        defaultPosts.forEach(post => {
            window.forumApi.postsCache[post.id] = post;
        });
        
        // 筛选
        let filtered = defaultPosts;
        if (tag) {
            filtered = defaultPosts.filter(p => p.tag === tag);
        }
        
        window.forumApi.renderPostList(filtered);
    },
    
    // 刷新帖子列表（触发API调用）
    refreshPosts: function(tag = null) {
        window.forumApi.currentTag = tag;
        window.forumApi.showLoading('forum-list-container', '正在加载帖子...');
        
        // 构建请求
        const request = window.MobilePrompts?.forum?.buildBrowseRequest(tag) || 
            JSON.stringify({ action: 'browse', tag: tag });
        
        // 发送请求到父页面
        window.forumApi.sendRequest(request, 'browse');
    },
    
    // 查看帖子详情（不自动触发API，显示缓存内容）
    viewPost: function(postId) {
        window.forumApi.currentPost = postId;
        window.forumApi.switchToDetail();
        
        // 添加到浏览历史
        window.forumApi.addToHistory(postId);
        
        // 尝试显示缓存的帖子
        const cachedPost = window.forumApi.postsCache[postId];
        const cachedComments = window.forumApi.commentsCache[postId] || [];
        
        if (cachedPost) {
            // 如果帖子没有完整内容，生成一个默认的详情
            if (!cachedPost.content) {
                cachedPost.content = cachedPost.preview || '点击下方刷新按钮加载完整内容...';
                cachedPost.author = cachedPost.author || { name: '未知', realm: '未知', avatar: '👤' };
            }
            window.forumApi.renderPostDetail(cachedPost, cachedComments);
        } else {
            // 没有缓存，显示提示
            const contentEl = document.getElementById('post-detail-content');
            if (contentEl) {
                contentEl.innerHTML = `
                    <div class="forum-empty">
                        <div class="empty-icon">📄</div>
                        <div class="empty-text">帖子未缓存</div>
                        <button class="retry-btn" onclick="window.forumApi.loadPostDetail('${postId}')">加载帖子</button>
                    </div>
                `;
            }
        }
    },
    
    // 加载帖子详情（手动触发API）
    loadPostDetail: function(postId) {
        window.forumApi.showLoading('post-detail-content', '正在加载帖子...');
        
        // 构建请求
        const request = window.MobilePrompts?.forum?.buildViewRequest(postId) ||
            JSON.stringify({ action: 'view', postId: postId });
        
        // 发送请求
        window.forumApi.sendRequest(request, 'view');
    },
    
    // 发送帖子
    submitPost: function() {
        const title = document.getElementById('new-post-title')?.value?.trim();
        const body = document.getElementById('new-post-body')?.value?.trim();
        const tag = document.getElementById('new-post-tag')?.value;
        
        if (!title) {
            alert('请输入帖子标题');
            return;
        }
        if (!body) {
            alert('请输入帖子内容');
            return;
        }
        
        window.forumApi.showLoading('create-post-form', '正在发布...');
        
        // 构建请求
        const request = window.MobilePrompts?.forum?.buildPostRequest(title, body, tag) ||
            JSON.stringify({ action: 'post', content: { title, body, tag } });
        
        // 发送请求
        window.forumApi.sendRequest(request, 'post');
    },
    
    // 发送评论
    submitComment: function(replyTo = null) {
        const input = document.getElementById('comment-input');
        const content = input?.value?.trim();
        
        if (!content) {
            return;
        }
        
        const postId = window.forumApi.currentPost;
        if (!postId) return;
        
        // 构建请求
        const request = window.MobilePrompts?.forum?.buildCommentRequest(postId, content, replyTo) ||
            JSON.stringify({ action: 'comment', postId, content: { body: content, replyTo } });
        
        // 清空输入
        input.value = '';
        
        // 先本地添加评论（乐观更新）
        window.forumApi.addLocalComment(postId, content, replyTo);
        
        // 发送请求
        window.forumApi.sendRequest(request, 'comment');
    },
    
    // 发送请求到父页面
    sendRequest: function(request, action) {
        const loadingId = 'forum-loading-' + Date.now();
        
        try {
            window.parent.postMessage({
                type: 'MOBILE_FORUM_REQUEST',
                action: action,
                userMessage: request,
                loadingId: loadingId
            }, '*');
        } catch (e) {
            console.error('[📰论坛] 发送请求失败:', e);
            window.forumApi.showError('通讯失败: ' + e.message);
        }
    },
    
    // 处理AI响应
    handleAIResponse: function(data) {
        if (!data) return;
        
        console.log('[📰论坛] AI返回完整数据:', JSON.stringify(data, null, 2));
        
        switch (data.type) {
            case 'postList':
                // 🆕 合并新帖子到缓存，而不是覆盖
                const newPosts = data.posts || [];
                const existingIds = new Set(Object.keys(window.forumApi.postsCache));
                
                // 为新帖子添加时间戳（用于排序）
                newPosts.forEach(post => {
                    if (!existingIds.has(post.id)) {
                        post._fetchTime = Date.now(); // 标记获取时间，新的在前面
                    }
                    window.forumApi.postsCache[post.id] = post;
                    // 缓存评论
                    if (post.comments && post.comments.length > 0) {
                        window.forumApi.commentsCache[post.id] = post.comments;
                    }
                });
                
                // 获取所有帖子并按获取时间排序（新的在前面）
                const allPosts = Object.values(window.forumApi.postsCache);
                allPosts.sort((a, b) => (b._fetchTime || 0) - (a._fetchTime || 0));
                
                // 按当前标签筛选
                let filteredPosts = allPosts;
                if (window.forumApi.currentTag) {
                    filteredPosts = allPosts.filter(p => p.tag === window.forumApi.currentTag);
                }
                
                window.forumApi.renderPostList(filteredPosts);
                // 保存AI生成的帖子数据
                window.forumApi.saveToStorage();
                console.log(`[📰论坛] 刷新完成，新增 ${newPosts.filter(p => !existingIds.has(p.id)).length} 个帖子，总计 ${allPosts.length} 个`);
                break;
            case 'postDetail':
                window.forumApi.renderPostDetail(data.post, data.comments || []);
                // 保存帖子详情和评论
                window.forumApi.saveToStorage();
                break;
            case 'actionResult':
                window.forumApi.handleActionResult(data);
                break;
            case 'error':
                window.forumApi.showError(data.message);
                break;
            default:
                console.warn('[📰论坛] 未知响应类型:', data.type);
        }
    },
    
    // 渲染帖子列表
    renderPostList: function(posts) {
        const container = document.getElementById('forum-list-container');
        if (!container) return;
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="forum-empty">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">// 暂无帖子</div>
                    <div class="empty-hint">点击右上角 + 发布第一个帖子，或点击 🔄 刷新获取新帖</div>
                </div>
            `;
            return;
        }
        
        // 🆕 注意：缓存逻辑已移到 handleAIResponse 中统一处理
        // 这里只负责渲染，不再重复缓存
        
        let html = '';
        posts.forEach(post => {
            const isHot = post.isHot || post.stats?.replies > 500;
            const tagClass = post.tag?.toLowerCase() || 'guide';
            const views = window.forumApi.formatNumber(post.stats?.views || 0);
            const replies = window.forumApi.formatNumber(post.stats?.replies || 0);
            
            html += `
                <div class="post-card ${isHot ? 'hot-topic' : ''}" onclick="window.forumApi.viewPost('${post.id}')">
                    ${isHot ? '<div class="post-scanline"></div>' : ''}
                    <div class="post-header">
                        <span class="tag ${tagClass}">[${post.tag}]</span>
                        <span class="post-id">ID:${post.id}</span>
                    </div>
                    <h3 class="post-title">>> ${post.title}_</h3>
                    ${post.preview ? `<div class="post-preview">${post.preview}</div>` : ''}
                    <div class="post-meta">
                        <span class="author">${post.author?.name || '匿名'} · ${post.author?.realm || '未知境界'}</span>
                    </div>
                    <div class="post-stats">
                        <span class="stat">RE: ${replies}</span>
                        <span class="stat">VIEW: ${views}</span>
                        <span class="stat time">${post.time || 'unknown'}</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    // 渲染帖子详情
    renderPostDetail: function(post, comments) {
        if (!post) return;
        
        // 缓存
        window.forumApi.postsCache[post.id] = post;
        window.forumApi.commentsCache[post.id] = comments;
        
        // 更新标题
        const titleEl = document.getElementById('post-detail-title');
        if (titleEl) titleEl.textContent = post.title;
        
        // 渲染帖子正文
        const contentEl = document.getElementById('post-detail-content');
        if (contentEl) {
            const tagClass = post.tag?.toLowerCase() || 'guide';
            contentEl.innerHTML = `
                <div class="detail-post">
                    <div class="detail-header">
                        <span class="tag ${tagClass}">[${post.tag}]</span>
                        <span class="post-id">ID:${post.id}</span>
                    </div>
                    <h2 class="detail-title">${post.title}</h2>
                    <div class="detail-author">
                        <span class="author-avatar">${post.author?.avatar || '👤'}</span>
                        <div class="author-info">
                            <span class="author-name">${post.author?.name || '匿名'}</span>
                            <span class="author-realm">${post.author?.realm || '未知境界'}</span>
                        </div>
                        <span class="post-time">${post.time || ''}</span>
                    </div>
                    <div class="detail-body">${window.forumApi.formatContent(post.content)}</div>
                    ${post.images?.length ? window.forumApi.renderImages(post.images) : ''}
                    <div class="detail-stats">
                        <span class="stat-item"><span class="stat-icon">👁</span> ${post.stats?.views || 0}</span>
                        <span class="stat-item"><span class="stat-icon">💬</span> ${post.stats?.replies || 0}</span>
                        <span class="stat-item"><span class="stat-icon">❤</span> ${post.stats?.likes || 0}</span>
                    </div>
                    <div class="detail-actions">
                        <button class="action-btn" onclick="window.forumApi.toggleFavorite('${post.id}')">
                            ${window.forumApi.isFavorited(post.id) ? '★ 已收藏' : '☆ 收藏'}
                        </button>
                        <button class="action-btn" onclick="window.forumApi.sharePost('${post.id}')">↗ 分享</button>
                    </div>
                </div>
                
                <div class="comments-section">
                    <div class="comments-header">
                        <span class="comments-title">评论 (${comments?.length || 0})</span>
                    </div>
                    <div class="comments-list" id="comments-list">
                        ${window.forumApi.renderComments(comments)}
                    </div>
                </div>
            `;
        }
    },
    
    // 渲染评论列表
    renderComments: function(comments) {
        if (!comments || comments.length === 0) {
            return '<div class="no-comments">// 暂无评论，快来抢沙发</div>';
        }
        
        return comments.map((comment, index) => `
            <div class="comment-item" data-floor="${comment.floor || index + 1}">
                <div class="comment-header">
                    <span class="comment-author">${comment.author?.name || '匿名'}</span>
                    <span class="comment-realm">${comment.author?.realm || ''}</span>
                    <span class="comment-floor">#${comment.floor || index + 1}楼</span>
                </div>
                ${comment.replyTo ? `<div class="comment-reply-to">回复 #${comment.replyTo}楼</div>` : ''}
                <div class="comment-content">${window.forumApi.formatContent(comment.content)}</div>
                <div class="comment-footer">
                    <span class="comment-time">${comment.time || ''}</span>
                    <span class="comment-likes">❤ ${comment.likes || 0}</span>
                    <button class="reply-btn" onclick="window.forumApi.replyToComment(${comment.floor || index + 1})">回复</button>
                </div>
            </div>
        `).join('');
    },
    
    // 渲染图片描述
    renderImages: function(images) {
        if (!images || images.length === 0) return '';
        return `
            <div class="post-images">
                ${images.map(img => `<div class="image-placeholder">[图片: ${img}]</div>`).join('')}
            </div>
        `;
    },
    
    // 格式化内容（处理换行）
    formatContent: function(content) {
        if (!content) return '';
        return content.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
    },
    
    // 格式化数字
    formatNumber: function(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return String(num);
    },
    
    // 回复评论
    replyToComment: function(floor) {
        const input = document.getElementById('comment-input');
        if (input) {
            input.focus();
            input.placeholder = `回复 #${floor}楼...`;
            input.dataset.replyTo = floor;
        }
    },
    
    // 本地添加评论（乐观更新）
    addLocalComment: function(postId, content, replyTo) {
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        const floor = (window.forumApi.commentsCache[postId]?.length || 0) + 1;
        const newComment = {
            id: window.MobilePrompts?.forum?.generateCommentId() || 'C' + Date.now(),
            author: { name: '我', id: 'self', realm: '未知' },
            content: content,
            time: '刚刚',
            likes: 0,
            floor: floor,
            replyTo: replyTo
        };
        
        // 添加到缓存
        if (!window.forumApi.commentsCache[postId]) {
            window.forumApi.commentsCache[postId] = [];
        }
        window.forumApi.commentsCache[postId].push(newComment);
        
        // 添加到我的评论
        window.forumApi.forumStorage.myComments.push({
            ...newComment,
            postId: postId,
            timestamp: Date.now()
        });
        window.forumApi.saveToStorage();
        
        // 渲染新评论
        const commentHtml = `
            <div class="comment-item new-comment" data-floor="${floor}">
                <div class="comment-header">
                    <span class="comment-author">我</span>
                    <span class="comment-floor">#${floor}楼</span>
                </div>
                ${replyTo ? `<div class="comment-reply-to">回复 #${replyTo}楼</div>` : ''}
                <div class="comment-content">${window.forumApi.formatContent(content)}</div>
                <div class="comment-footer">
                    <span class="comment-time">刚刚</span>
                    <span class="comment-likes">❤ 0</span>
                </div>
            </div>
        `;
        
        // 移除"暂无评论"提示
        const noComments = commentsList.querySelector('.no-comments');
        if (noComments) noComments.remove();
        
        commentsList.insertAdjacentHTML('beforeend', commentHtml);
        commentsList.scrollTop = commentsList.scrollHeight;
    },
    
    // 处理操作结果
    handleActionResult: function(data) {
        if (data.success) {
            if (data.newPost) {
                // 发帖成功
                window.forumApi.forumStorage.myPosts.push({
                    ...data.newPost,
                    timestamp: Date.now()
                });
                window.forumApi.saveToStorage();
                window.forumApi.closeCreateView();
                window.forumApi.refreshPosts();
                alert('发帖成功！');
            } else if (data.newComment) {
                // 评论成功（已乐观更新，可能需要更新ID等）
                console.log('[📰论坛] 评论成功:', data.newComment);
                
                // 处理其他用户对玩家评论的反应
                if (data.reactions && data.reactions.length > 0) {
                    console.log('[📰论坛] 收到网友反应:', data.reactions.length, '条');
                    window.forumApi.addReactionComments(data.reactions);
                }
            }
        } else {
            window.forumApi.showError(data.message || '操作失败');
        }
    },
    
    // 添加网友对玩家评论的反应
    addReactionComments: function(reactions) {
        const postId = window.forumApi.currentPost;
        if (!postId || !reactions || reactions.length === 0) return;
        
        const commentsList = document.getElementById('comments-list');
        if (!commentsList) return;
        
        // 依次添加每条反应评论
        reactions.forEach((reaction, index) => {
            // 添加到缓存
            if (!window.forumApi.commentsCache[postId]) {
                window.forumApi.commentsCache[postId] = [];
            }
            window.forumApi.commentsCache[postId].push(reaction);
            
            // 延迟显示，模拟网友陆续回复的效果
            setTimeout(() => {
                // 移除"暂无评论"提示
                const noComments = commentsList.querySelector('.no-comments');
                if (noComments) {
                    noComments.remove();
                }
                
                // 创建评论DOM
                const commentHtml = `
                    <div class="comment-item new-comment reaction-comment" data-floor="${reaction.floor || '?'}">
                        <div class="comment-header">
                            <span class="comment-author">${reaction.author?.name || '匿名网友'}</span>
                            <span class="comment-realm">${reaction.author?.realm || ''}</span>
                            <span class="comment-floor">#${reaction.floor || '?'}楼</span>
                        </div>
                        ${reaction.replyTo ? `<div class="comment-reply-to">回复 #${reaction.replyTo}楼</div>` : ''}
                        <div class="comment-content">${window.forumApi.formatContent(reaction.content)}</div>
                        <div class="comment-footer">
                            <span class="comment-time">${reaction.time || '刚刚'}</span>
                            <span class="comment-likes">❤ ${reaction.likes || 0}</span>
                            <button class="reply-btn" onclick="window.forumApi.replyToComment(${reaction.floor})">回复</button>
                        </div>
                    </div>
                `;
                
                commentsList.insertAdjacentHTML('beforeend', commentHtml);
                
                // 滚动到新评论
                const newComment = commentsList.lastElementChild;
                if (newComment) {
                    newComment.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                
                console.log('[📰论坛] 显示网友反应:', reaction.author?.name, '-', reaction.content);
            }, (index + 1) * 800); // 每条间隔800ms显示
        });
        
        // 更新评论数显示
        setTimeout(() => {
            const commentsTitle = document.querySelector('.comments-title');
            if (commentsTitle) {
                const count = window.forumApi.commentsCache[postId]?.length || 0;
                commentsTitle.textContent = `评论 (${count})`;
            }
            window.forumApi.saveToStorage();
        }, reactions.length * 800 + 100);
    },
    
    // 切换到详情视图
    switchToDetail: function() {
        const listView = document.getElementById('forum-list-view');
        const detailView = document.getElementById('forum-detail-view');
        
        // 隐藏主框架Header
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'none';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '0';
            appBody.style.display = 'flex';
            appBody.style.flexDirection = 'column';
            appBody.style.height = '100%';
        }
        
        if (listView && detailView) {
            listView.classList.add('hidden');
            detailView.classList.remove('hidden');
        }
    },
    
    // 返回列表视图
    backToList: function() {
        const listView = document.getElementById('forum-list-view');
        const detailView = document.getElementById('forum-detail-view');
        
        // 恢复主框架Header
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'flex';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '';
            appBody.style.display = 'block';
            appBody.style.height = '';
        }
        
        if (listView && detailView) {
            detailView.classList.add('hidden');
            listView.classList.remove('hidden');
        }
        
        window.forumApi.currentPost = null;
    },
    
    // 打开发帖视图
    openCreateView: function() {
        const listView = document.getElementById('forum-list-view');
        const createView = document.getElementById('forum-create-view');
        
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'none';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '0';
            appBody.style.display = 'flex';
            appBody.style.flexDirection = 'column';
            appBody.style.height = '100%';
        }
        
        if (listView && createView) {
            listView.classList.add('hidden');
            createView.classList.remove('hidden');
        }
        
        // 清空表单
        const titleInput = document.getElementById('new-post-title');
        const bodyInput = document.getElementById('new-post-body');
        if (titleInput) titleInput.value = '';
        if (bodyInput) bodyInput.value = '';
    },
    
    // 关闭发帖视图
    closeCreateView: function() {
        const listView = document.getElementById('forum-list-view');
        const createView = document.getElementById('forum-create-view');
        
        const appHeader = document.querySelector('.app-header');
        if (appHeader) appHeader.style.display = 'flex';
        
        const appBody = document.getElementById('appContent');
        if (appBody) {
            appBody.style.padding = '';
            appBody.style.display = 'block';
            appBody.style.height = '';
        }
        
        if (listView && createView) {
            createView.classList.add('hidden');
            listView.classList.remove('hidden');
        }
    },
    
    // 筛选标签（只筛选本地缓存，不触发API）
    filterByTag: function(tag) {
        // 更新标签按钮状态
        document.querySelectorAll('.filter-tag').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.tag === tag || (!tag && !el.dataset.tag)) {
                el.classList.add('active');
            }
        });
        
        // 只筛选本地缓存，不触发API
        window.forumApi.showLocalPosts(tag);
    },
    
    // 收藏/取消收藏
    toggleFavorite: function(postId) {
        const index = window.forumApi.forumStorage.favorites.indexOf(postId);
        if (index > -1) {
            window.forumApi.forumStorage.favorites.splice(index, 1);
        } else {
            window.forumApi.forumStorage.favorites.push(postId);
        }
        window.forumApi.saveToStorage();
        
        // 更新按钮显示
        const btn = document.querySelector('.action-btn');
        if (btn && btn.textContent.includes('收藏')) {
            btn.textContent = window.forumApi.isFavorited(postId) ? '★ 已收藏' : '☆ 收藏';
        }
    },
    
    // 是否已收藏
    isFavorited: function(postId) {
        return window.forumApi.forumStorage.favorites.includes(postId);
    },
    
    // 添加到浏览历史
    addToHistory: function(postId) {
        const history = window.forumApi.forumStorage.history;
        const index = history.indexOf(postId);
        if (index > -1) history.splice(index, 1);
        history.unshift(postId);
        if (history.length > 50) history.pop();
        window.forumApi.saveToStorage();
    },
    
    // 分享帖子
    sharePost: function(postId) {
        const post = window.forumApi.postsCache[postId];
        if (post) {
            const text = `【${post.tag}】${post.title}\n作者: ${post.author?.name}`;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
                alert('已复制到剪贴板');
            }
        }
    },
    
    // 显示加载状态
    showLoading: function(containerId, text = '加载中...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="forum-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${text}</div>
                </div>
            `;
        }
    },
    
    // 显示错误
    showError: function(message) {
        const container = document.getElementById('forum-list-container') || 
                          document.getElementById('post-detail-content');
        if (container) {
            container.innerHTML = `
                <div class="forum-error">
                    <div class="error-icon">⚠</div>
                    <div class="error-text">${message}</div>
                    <button class="retry-btn" onclick="window.forumApi.refreshPosts()">重试</button>
                </div>
            `;
        }
    },
    
    // 保存到localStorage
    saveToStorage: function() {
        try {
            // 同步缓存数据到存储对象
            window.forumApi.forumStorage.postsCache = window.forumApi.postsCache;
            window.forumApi.forumStorage.commentsCache = window.forumApi.commentsCache;
            
            localStorage.setItem('mobileForumData', JSON.stringify(window.forumApi.forumStorage));
            // 通知主游戏同步保存
            window.forumApi.notifyMainGameToSave();
            console.log('[📰论坛存储] 已保存帖子数据，帖子数量:', Object.keys(window.forumApi.postsCache).length);
        } catch (e) {
            console.error('[📰论坛存储] 保存失败:', e);
        }
    },
    
    // 通知主游戏同步保存到IndexedDB
    notifyMainGameToSave: function() {
        try {
            window.parent.postMessage({
                type: 'MOBILE_FORUM_DATA_CHANGED',
                action: 'save',
                data: window.forumApi.exportSaveData()
            }, '*');
            console.log('[📰论坛] 已通知主游戏同步保存');
        } catch (e) {
            console.warn('[📰论坛] 通知主游戏失败:', e);
        }
    },
    
    // 从localStorage加载
    loadFromStorage: function() {
        try {
            const saved = localStorage.getItem('mobileForumData');
            if (saved) {
                window.forumApi.forumStorage = JSON.parse(saved);
                
                // 恢复缓存数据
                window.forumApi.postsCache = window.forumApi.forumStorage.postsCache || {};
                window.forumApi.commentsCache = window.forumApi.forumStorage.commentsCache || {};
                
                console.log('[📰论坛存储] 已加载数据，帖子数量:', Object.keys(window.forumApi.postsCache).length);
            } else {
                // 初始化空的缓存
                window.forumApi.postsCache = {};
                window.forumApi.commentsCache = {};
                console.log('[📰论坛存储] 没有存档数据，使用初始状态');
            }
        } catch (e) {
            console.error('[📰论坛存储] 加载失败:', e);
            // 出错时也要初始化缓存
            window.forumApi.postsCache = {};
            window.forumApi.commentsCache = {};
        }
    },
    
    // 导出存档数据
    exportSaveData: function() {
        return window.forumApi.forumStorage;
    },
    
    // 导入存档数据
    importSaveData: function(data) {
        if (data) {
            window.forumApi.forumStorage = data;
            window.forumApi.saveToStorage();
            console.log('[📰论坛存储] 已从存档恢复');
        }
    },
    
    // 🗑️ 清空所有论坛数据
    clearAll: function() {
        // 清空存储数据
        window.forumApi.forumStorage = {
            myPosts: [],
            myComments: [],
            favorites: [],
            history: [],
            postsCache: {},
            commentsCache: {}
        };
        // 清空内存缓存
        window.forumApi.postsCache = {};
        window.forumApi.commentsCache = {};
        window.forumApi.currentPost = null;
        window.forumApi.currentTag = null;
        
        // 清空 localStorage
        try {
            localStorage.removeItem('mobileForumData');
        } catch (e) {}
        
        // 刷新显示（显示空列表）
        window.forumApi.showLocalPosts();
        
        console.log('[📰论坛] 已清空所有数据');
    }
};

const forumApp = `
<div class="forum-wrapper">
    <!-- 列表视图 -->
    <div id="forum-list-view" class="forum-view">
        <div class="forum-top-bar">
            <div class="forum-status">FORUM_ONLINE</div>
            <div class="forum-btns">
                <div class="forum-refresh-btn" onclick="window.forumApi.refreshPosts(window.forumApi.currentTag)" title="刷新论坛">🔄</div>
                <div class="forum-add-btn" onclick="window.forumApi.openCreateView()" title="发帖">+</div>
            </div>
        </div>
        
        <!-- 标签筛选 -->
        <div class="filter-bar">
            <div class="filter-tag active" data-tag="" onclick="window.forumApi.filterByTag(null)">全部</div>
            <div class="filter-tag" data-tag="HOT" onclick="window.forumApi.filterByTag('HOT')">🔥热门</div>
            <div class="filter-tag" data-tag="GOSSIP" onclick="window.forumApi.filterByTag('GOSSIP')">💬八卦</div>
            <div class="filter-tag" data-tag="GUIDE" onclick="window.forumApi.filterByTag('GUIDE')">📖攻略</div>
            <div class="filter-tag" data-tag="TRADE" onclick="window.forumApi.filterByTag('TRADE')">💰交易</div>
            <div class="filter-tag" data-tag="ASK" onclick="window.forumApi.filterByTag('ASK')">❓求助</div>
        </div>
        
        <!-- 帖子列表 -->
        <div class="forum-container" id="forum-list-container">
            <div class="forum-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">正在连接论坛...</div>
            </div>
        </div>
    </div>
    
    <!-- 帖子详情视图 -->
    <div id="forum-detail-view" class="forum-view hidden">
        <div class="detail-header">
            <div class="detail-back" onclick="window.forumApi.backToList()">
                <span class="back-arrow">←</span>
            </div>
            <div class="detail-title-box">
                <div class="detail-name" id="post-detail-title">帖子详情</div>
                <div class="detail-status">ENCRYPTED_CHANNEL</div>
            </div>
            <div class="detail-refresh-btn" onclick="window.forumApi.loadPostDetail(window.forumApi.currentPost)" title="刷新帖子">🔄</div>
        </div>
        
        <div class="post-detail-area" id="post-detail-content">
            <!-- 帖子内容动态插入 -->
        </div>
        
        <div class="comment-input-area">
            <input type="text" id="comment-input" class="comment-input" placeholder="发表评论..." 
                   onkeypress="if(event.keyCode==13) window.forumApi.submitComment(this.dataset.replyTo)">
            <button class="comment-btn" onclick="window.forumApi.submitComment(document.getElementById('comment-input').dataset.replyTo)">发送</button>
        </div>
    </div>
    
    <!-- 发帖视图 -->
    <div id="forum-create-view" class="forum-view hidden">
        <div class="detail-header">
            <div class="detail-back" onclick="window.forumApi.closeCreateView()">
                <span class="back-arrow">←</span>
            </div>
            <div class="detail-title-box">
                <div class="detail-name">发布帖子</div>
                <div class="detail-status">CREATE_NEW_POST</div>
            </div>
            <button class="submit-post-btn" onclick="window.forumApi.submitPost()">发布</button>
        </div>
        
        <div class="create-post-form" id="create-post-form">
            <div class="form-group">
                <label class="form-label">选择分类</label>
                <select id="new-post-tag" class="form-select">
                    <option value="GOSSIP">💬 八卦消息</option>
                    <option value="GUIDE">📖 攻略指南</option>
                    <option value="TRADE">💰 交易信息</option>
                    <option value="ASK">❓ 求助提问</option>
                    <option value="NEWS">📰 新闻资讯</option>
                    <option value="SHOW">🌟 晒图炫耀</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">帖子标题</label>
                <input type="text" id="new-post-title" class="form-input" placeholder="输入帖子标题..." maxlength="50">
            </div>
            <div class="form-group">
                <label class="form-label">帖子内容</label>
                <textarea id="new-post-body" class="form-textarea" placeholder="输入帖子内容..." rows="8"></textarea>
            </div>
        </div>
    </div>
</div>

<style>
/* 论坛包装器 */
.forum-wrapper {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.forum-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

.forum-view.hidden {
    display: none;
}

/* 顶部栏 */
.forum-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
}

.forum-status {
    font-size: 10px;
    color: var(--primary);
    font-family: 'Courier New', monospace;
    animation: blink 2s infinite;
}

.forum-btns {
    display: flex;
    gap: 8px;
    align-items: center;
}

.forum-refresh-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 243, 255, 0.05);
    border: 1px solid rgba(0, 243, 255, 0.3);
    color: var(--primary);
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.forum-refresh-btn:hover {
    background: rgba(0, 243, 255, 0.15);
    transform: rotate(180deg);
}

.forum-refresh-btn:active {
    transform: rotate(360deg);
}

.forum-add-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid var(--primary);
    color: var(--primary);
    font-size: 18px;
    cursor: pointer;
    clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}

.forum-add-btn:hover {
    background: rgba(0, 243, 255, 0.2);
}

/* 筛选栏 */
.filter-bar {
    display: flex;
    gap: 8px;
    padding: 10px 15px;
    overflow-x: auto;
    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
}

.filter-bar::-webkit-scrollbar {
    display: none;
}

.filter-tag {
    padding: 4px 10px;
    font-size: 11px;
    color: #666;
    background: rgba(0, 10, 20, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

.filter-tag:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.filter-tag.active {
    background: rgba(0, 243, 255, 0.1);
    border-color: var(--primary);
    color: var(--primary);
}

/* 帖子容器 */
.forum-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px 15px;
    padding-bottom: 20px;
    padding-right: 8px; /* 为滚动条留出空间 */
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
}

/* Cyberpunk scrollbar for forum-container */
.forum-container::-webkit-scrollbar {
    width: 6px;
}

.forum-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.1);
}

.forum-container::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #bf00ff 0%, rgba(255, 0, 60, 0.8) 100%);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.3);
    box-shadow: 0 0 6px rgba(191, 0, 255, 0.4);
}

.forum-container::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #fff 0%, #bf00ff 100%);
    box-shadow: 0 0 10px #bf00ff;
}

.forum-container::-webkit-scrollbar-corner {
    background: rgba(0, 0, 0, 0.3);
}

/* 帖子卡片 */
.post-card {
    position: relative;
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid rgba(0, 243, 255, 0.2);
    padding: 12px 15px;
    clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
    transition: all 0.2s;
    overflow: hidden;
    cursor: pointer;
    min-height: 80px;
    flex-shrink: 0;
}

.post-card:hover {
    background: rgba(0, 243, 255, 0.05);
    border-color: var(--primary);
    transform: translateX(3px);
}

.post-scanline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--secondary);
    opacity: 0;
    animation: scan 2s linear infinite;
}

.post-card.hot-topic {
    border-color: var(--secondary);
    box-shadow: 0 0 10px rgba(255, 0, 60, 0.1);
}

.post-card.hot-topic .post-scanline {
    opacity: 0.5;
}

@keyframes scan {
    0% { top: 0; }
    100% { top: 100%; }
}

.post-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-family: 'Courier New', monospace;
}

.tag {
    font-size: 10px;
    font-weight: bold;
    padding: 2px 6px;
    background: rgba(0,0,0,0.5);
    border: 1px solid currentColor;
}

.tag.hot { color: var(--secondary); border-color: var(--secondary); box-shadow: 0 0 5px var(--secondary); }
.tag.gossip { color: #bf00ff; border-color: #bf00ff; }
.tag.guide { color: var(--primary); border-color: var(--primary); }
.tag.trade { color: #ffd700; border-color: #ffd700; }
.tag.ask { color: #00ff88; border-color: #00ff88; }
.tag.news { color: #00aaff; border-color: #00aaff; }
.tag.show { color: #ff6600; border-color: #ff6600; }

.post-id {
    font-size: 10px;
    color: #444;
}

.post-title {
    font-size: 14px;
    color: #fff;
    margin-bottom: 6px;
    font-family: 'Courier New', monospace;
    line-height: 1.4;
    text-shadow: 0 0 5px rgba(255,255,255,0.3);
}

.post-preview {
    font-size: 11px;
    color: #888;
    margin-bottom: 8px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.post-meta {
    font-size: 10px;
    color: #555;
    margin-bottom: 8px;
}

.post-stats {
    display: flex;
    gap: 12px;
    font-size: 10px;
    color: #666;
    font-family: 'Courier New', monospace;
    border-top: 1px dashed rgba(255,255,255,0.1);
    padding-top: 8px;
}

.stat {
    display: flex;
    align-items: center;
}

.stat.time {
    margin-left: auto;
    color: var(--primary);
}

/* 详情头部 */
.detail-header {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    background: rgba(0, 10, 20, 0.9);
    border-bottom: 1px solid rgba(0, 243, 255, 0.2);
    gap: 10px;
}

.detail-back {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--primary);
    font-size: 18px;
}

.detail-title-box {
    flex: 1;
    min-width: 0;
}

.detail-name {
    font-size: 14px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.detail-status {
    font-size: 9px;
    color: var(--primary);
    font-family: 'Courier New', monospace;
}

.detail-refresh-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 243, 255, 0.05);
    border: 1px solid rgba(0, 243, 255, 0.3);
    color: var(--primary);
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.detail-refresh-btn:hover {
    background: rgba(0, 243, 255, 0.15);
    transform: rotate(180deg);
}

/* 帖子详情区域 */
.post-detail-area {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    padding-right: 8px;
}

/* Cyberpunk scrollbar for post-detail-area */
.post-detail-area::-webkit-scrollbar {
    width: 6px;
}

.post-detail-area::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.1);
}

.post-detail-area::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #bf00ff 0%, rgba(255, 0, 60, 0.8) 100%);
    border-radius: 3px;
    border: 1px solid rgba(191, 0, 255, 0.3);
    box-shadow: 0 0 6px rgba(191, 0, 255, 0.4);
}

.post-detail-area::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #fff 0%, #bf00ff 100%);
    box-shadow: 0 0 10px #bf00ff;
}

.detail-post {
    background: rgba(0, 10, 20, 0.6);
    border: 1px solid rgba(0, 243, 255, 0.15);
    padding: 15px;
    margin-bottom: 15px;
}

.detail-post .detail-header {
    padding: 0;
    margin-bottom: 10px;
    background: none;
    border: none;
}

.detail-title {
    font-size: 16px;
    color: #fff;
    margin-bottom: 12px;
    line-height: 1.4;
}

.detail-author {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(255,255,255,0.1);
    margin-bottom: 12px;
}

.author-avatar {
    font-size: 24px;
}

.author-info {
    flex: 1;
}

.author-name {
    display: block;
    font-size: 13px;
    color: var(--primary);
}

.author-realm {
    font-size: 10px;
    color: #666;
}

.post-time {
    font-size: 10px;
    color: #555;
}

.detail-body {
    font-size: 13px;
    color: #ccc;
    line-height: 1.7;
    margin-bottom: 15px;
}

.post-images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
}

.image-placeholder {
    padding: 20px;
    background: rgba(0, 243, 255, 0.05);
    border: 1px dashed rgba(0, 243, 255, 0.2);
    font-size: 11px;
    color: #666;
    text-align: center;
}

.detail-stats {
    display: flex;
    gap: 15px;
    padding: 10px 0;
    border-top: 1px dashed rgba(255,255,255,0.1);
}

.stat-item {
    font-size: 12px;
    color: #888;
    display: flex;
    align-items: center;
    gap: 4px;
}

.stat-icon {
    font-size: 14px;
}

.detail-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
}

.action-btn {
    flex: 1;
    padding: 8px 12px;
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid rgba(0, 243, 255, 0.3);
    color: var(--primary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: rgba(0, 243, 255, 0.2);
}

/* 评论区 */
.comments-section {
    background: rgba(0, 10, 20, 0.4);
    border: 1px solid rgba(0, 243, 255, 0.1);
}

.comments-header {
    padding: 10px 15px;
    border-bottom: 1px solid rgba(0, 243, 255, 0.1);
}

.comments-title {
    font-size: 13px;
    color: var(--primary);
}

.comments-list {

}

.no-comments {
    padding: 30px;
    text-align: center;
    color: #555;
    font-size: 12px;
}

.comment-item {
    padding: 12px 15px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.comment-item.new-comment {
    background: rgba(0, 243, 255, 0.05);
}

.comment-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.comment-author {
    font-size: 12px;
    color: var(--primary);
}

.comment-realm {
    font-size: 10px;
    color: #555;
}

.comment-floor {
    font-size: 10px;
    color: #444;
    margin-left: auto;
}

.comment-reply-to {
    font-size: 10px;
    color: #666;
    padding: 4px 8px;
    background: rgba(255,255,255,0.05);
    margin-bottom: 6px;
    display: inline-block;
}

.comment-content {
    font-size: 12px;
    color: #bbb;
    line-height: 1.5;
    margin-bottom: 8px;
}

.comment-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 10px;
    color: #555;
}

.comment-likes {
    color: #ff6666;
}

.reply-btn {
    padding: 2px 8px;
    background: none;
    border: 1px solid rgba(0, 243, 255, 0.2);
    color: var(--primary);
    font-size: 10px;
    cursor: pointer;
    margin-left: auto;
}

.reply-btn:hover {
    background: rgba(0, 243, 255, 0.1);
}

/* 评论输入区 */
.comment-input-area {
    display: flex;
    gap: 10px;
    padding: 12px 15px;
    background: rgba(0, 10, 20, 0.9);
    border-top: 1px solid rgba(0, 243, 255, 0.2);
}

.comment-input {
    flex: 1;
    padding: 10px 12px;
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid rgba(0, 243, 255, 0.2);
    color: #fff;
    font-size: 13px;
    outline: none;
}

.comment-input:focus {
    border-color: var(--primary);
}

.comment-btn {
    padding: 10px 20px;
    background: var(--primary);
    border: none;
    color: #000;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
}

/* 发帖表单 */
.submit-post-btn {
    padding: 6px 15px;
    background: var(--primary);
    border: none;
    color: #000;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
}

.create-post-form {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
}

.form-group {
    margin-bottom: 15px;
}

.form-label {
    display: block;
    font-size: 12px;
    color: var(--primary);
    margin-bottom: 6px;
}

.form-select, .form-input, .form-textarea {
    width: 100%;
    padding: 10px 12px;
    background: rgba(0, 10, 20, 0.8);
    border: 1px solid rgba(0, 243, 255, 0.2);
    color: #fff;
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
}

.form-select:focus, .form-input:focus, .form-textarea:focus {
    border-color: var(--primary);
}

.form-textarea {
    resize: vertical;
    min-height: 120px;
    font-family: inherit;
}

.form-select option {
    background: #0a0a15;
    color: #fff;
}

/* 加载状态 */
.forum-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    color: #666;
}

.loading-spinner {
    width: 30px;
    height: 30px;
    border: 2px solid rgba(0, 243, 255, 0.1);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 12px;
    font-family: 'Courier New', monospace;
    animation: blink 1s infinite;
}

@keyframes blink {
    50% { opacity: 0.5; }
}

/* 错误/空状态 */
.forum-error, .forum-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    text-align: center;
}

.error-icon, .empty-icon {
    font-size: 40px;
    margin-bottom: 15px;
}

.error-text, .empty-text {
    font-size: 14px;
    color: #888;
    margin-bottom: 10px;
}

.empty-hint {
    font-size: 12px;
    color: #555;
}

.retry-btn {
    padding: 8px 20px;
    background: rgba(0, 243, 255, 0.1);
    border: 1px solid var(--primary);
    color: var(--primary);
    cursor: pointer;
    margin-top: 15px;
}

.retry-btn:hover {
    background: rgba(0, 243, 255, 0.2);
}
</style>
`;
