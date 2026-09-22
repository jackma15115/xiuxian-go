/**
 * NovelAI 文生图模块
 * 支持调用 NovelAI API 生成图片，并解压 ZIP 返回的图片数据
 */

/**
 * 动态加载 JSZip 库
 */
async function loadJSZip() {
    if (typeof JSZip !== 'undefined') {
        return JSZip;
    }
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            if (typeof JSZip !== 'undefined') {
                console.log('[NovelAI] JSZip 库加载成功');
                resolve(JSZip);
            } else {
                reject(new Error('JSZip 加载后仍不可用'));
            }
        };
        script.onerror = () => reject(new Error('JSZip CDN 加载失败'));
        document.head.appendChild(script);
    });
}

class NovelAIImageGenerator {
    constructor() {
        this.apiKey = '';
        this.enabled = false;
        this.imagePromptTemplate = '';  // 插图提示词模板
        this.positivePromptPrefix = 'masterpiece, best quality, amazing quality, very aesthetic, absurdres';  // 正面提示词前缀
        this.config = {
            model: 'nai-diffusion-4-5-full',  // NAI V4.5 Full
            width: 832,
            height: 1216,
            steps: 28,
            scale: 7,
            sampler: 'k_euler_ancestral',
            scheduler: 'karras',  // V4.5使用scheduler而不是noise_schedule
            sm: false,
            sm_dyn: false,
            decrisper: false,
            variety_boost: false,
            negative_prompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'
        };
    }

    /**
     * 设置 API Key
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('novelai_api_key', key);
    }

    /**
     * 设置启用状态
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('novelai_enabled', enabled ? 'true' : 'false');
    }

    /**
     * 设置插图提示词模板
     */
    setImagePromptTemplate(template) {
        this.imagePromptTemplate = template;
        localStorage.setItem('novelai_image_prompt_template', template);
    }

    /**
     * 加载保存的配置
     */
    loadConfig() {
        const savedKey = localStorage.getItem('novelai_api_key');
        if (savedKey) this.apiKey = savedKey;

        const savedEnabled = localStorage.getItem('novelai_enabled');
        this.enabled = savedEnabled === 'true';

        const savedTemplate = localStorage.getItem('novelai_image_prompt_template');
        if (savedTemplate) {
            this.imagePromptTemplate = savedTemplate;
        } else {
            // 默认模板
            this.imagePromptTemplate = `【插图生成规则】
请在JSON回复中增加"img"字段，用于生成当前场景的插图。

格式要求：
"img": "英文提示词，用逗号分隔"

例如：
"img": "1girl, long white hair, blue eyes, chinese hanfu, standing on cliff, sunset, mountain background, fantasy, detailed"

提示词编写要求：
- 使用英文，用逗号分隔各个标签
- 准确描述当前场景、人物外貌、服装、动作、背景、氛围等
- img字段是与story并列的独立字段
- 根据剧情和人物特征生成合适的提示词
- 不需要写masterpiece, best quality等质量标签（系统会自动添加）
- 每次回复都要生成img字段`;
        }

        // 加载正面提示词前缀
        const savedPositivePrefix = localStorage.getItem('novelai_positive_prompt_prefix');
        if (savedPositivePrefix !== null) {
            this.positivePromptPrefix = savedPositivePrefix;
        }

        const savedConfig = localStorage.getItem('novelai_image_config');
        if (savedConfig) {
            try {
                this.config = { ...this.config, ...JSON.parse(savedConfig) };
            } catch (e) {
                console.error('[NovelAI] 配置解析失败:', e);
            }
        }
    }

    /**
     * 保存配置
     */
    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('novelai_image_config', JSON.stringify(this.config));
    }

    /**
     * 获取要注入到用户输入之前的提示词
     * 只有启用时才返回内容
     */
    getInjectionPrompt() {
        if (!this.enabled || !this.imagePromptTemplate) {
            return '';
        }
        return '\n\n' + this.imagePromptTemplate;
    }

    /**
     * 转换 V4 网页格式提示词为 API 格式
     * 例如: "1.5::pink_hair::" → "(pink_hair:1.5)"
     * 例如: "1.8::source#teasing::" → "(source:1.8)"
     * @param {string} prompt - 原始提示词
     * @returns {string} - 转换后的提示词
     */
    convertV4PromptFormat(prompt) {
        let converted = prompt;
        
        // 1. 转换 "weight::tag#modifier::" 或 "weight::tag::" 格式为 "(tag:weight)"
        // 支持正权重和负权重，如 1.5::tag:: 或 -2::tag::
        // 匹配模式: 可选负号+数字::内容::
        converted = converted.replace(/(-?\d+\.?\d*)::([^:]+)::/g, (match, weight, tag) => {
            // 去掉 #modifier 部分（如 #teasing）
            const cleanTag = tag.split('#')[0].trim();
            const numWeight = parseFloat(weight);
            if (numWeight < 0) {
                // 负权重：转换为 [tag] 或用负数表示
                return `(${cleanTag}:${numWeight})`;
            }
            return `(${cleanTag}:${weight})`;
        });
        
        // 2. 处理 | 分隔符 - 在V4中用于角色分隔，转换为逗号+换行标记
        // 保留 | 因为 NAI API 可能支持，但清理多余空格
        converted = converted.replace(/\s*\|\s*/g, ', ');
        
        // 3. 清理多余的逗号和空格
        converted = converted.replace(/,\s*,/g, ',');
        converted = converted.replace(/\s+/g, ' ').trim();
        
        return converted;
    }

    /**
     * 生成图片
     * @param {string} prompt - 正向提示词
     * @param {string} negativePrompt - 负向提示词（可选）
     * @returns {Promise<string>} - 返回 base64 图片数据
     */
    async generateImage(prompt, negativePrompt = null) {
        if (!this.apiKey) {
            throw new Error('请先设置 NovelAI API Key');
        }

        if (!this.enabled) {
            throw new Error('NovelAI 文生图未启用');
        }

        // V4 API 原生支持 :: 格式，不需要转换！
        let finalPrompt = prompt;
        
        // 🎨 在提示词前面添加正面提示词前缀
        if (this.positivePromptPrefix && this.positivePromptPrefix.trim()) {
            finalPrompt = this.positivePromptPrefix.trim() + ', ' + finalPrompt;
        }
        
        console.log('[NovelAI] 🎨 最终发送提示词:', finalPrompt);
        console.log('[NovelAI] 🚫 负面提示词:', negativePrompt || this.config.negative_prompt);
        console.log('[NovelAI] 🎯 使用模型:', this.config.model);

        // 构建参数
        const isV4 = this.config.model.includes('diffusion-4');
        const neg = negativePrompt || this.config.negative_prompt;
        
        let parameters;
        
        if (isV4) {
            // V4/V4.5 参数结构（参考 SillyTavern）
            parameters = {
                params_version: 3,
                prefer_brownian: true,
                width: this.config.width,
                height: this.config.height,
                scale: this.config.scale,
                sampler: this.config.sampler,
                steps: this.config.steps,
                n_samples: 1,
                seed: Math.floor(Math.random() * 9999999999),
                noise_schedule: this.config.scheduler || 'karras',
                negative_prompt: neg,
                // V4 特有参数
                ucPreset: 0,
                qualityToggle: false,
                add_original_image: false,
                controlnet_strength: 1,
                deliberate_euler_ancestral_bug: false,
                dynamic_thresholding: this.config.decrisper || false,
                legacy: false,
                legacy_v3_extend: false,
                sm: false,
                sm_dyn: false,
                uncond_scale: 1,
                skip_cfg_above_sigma: null,
                use_coords: false,
                characterPrompts: [],
                reference_image_multiple: [],
                reference_information_extracted_multiple: [],
                reference_strength_multiple: [],
                // V4 prompt 格式
                v4_prompt: {
                    caption: {
                        base_caption: finalPrompt,
                        char_captions: [],
                    },
                    use_coords: false,
                    use_order: true,
                },
                v4_negative_prompt: {
                    caption: {
                        base_caption: neg,
                        char_captions: [],
                    },
                },
            };
        } else {
            // V3 参数结构
            parameters = {
                width: this.config.width,
                height: this.config.height,
                scale: this.config.scale,
                sampler: this.config.sampler,
                steps: this.config.steps,
                n_samples: 1,
                negative_prompt: neg,
                ucPreset: 0,
                qualityToggle: true,
                sm: this.config.sm,
                sm_dyn: this.config.sm_dyn,
                noise_schedule: this.config.noise_schedule || 'native',
            };
        }

        const payload = {
            input: finalPrompt,
            model: this.config.model,
            action: 'generate',
            parameters: parameters
        };
        
        console.log('[NovelAI] 📦 发送参数:', JSON.stringify(parameters, null, 2));

        // 日志已在上方输出

        const response = await fetch('https://image.novelai.net/ai/generate-image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/zip'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`NovelAI API 错误 (${response.status}): ${errorText}`);
        }

        // 获取 ZIP 数据
        const zipData = await response.arrayBuffer();

        // 使用 JSZip 解压（如果未加载则动态加载）
        const JSZipLib = await loadJSZip();
        const zip = await JSZipLib.loadAsync(zipData);

        // 获取 ZIP 中的第一个 PNG 文件
        const imageFile = Object.values(zip.files).find(f => f.name.endsWith('.png'));
        if (!imageFile) {
            throw new Error('ZIP 中未找到图片文件');
        }

        // 转换为 base64
        const imageData = await imageFile.async('base64');
        const base64Image = `data:image/png;base64,${imageData}`;

        console.log('[NovelAI] ✅ 图片生成成功');
        return base64Image;
    }

    /**
     * 解析故事文本中的图片提示词
     * @param {string} story - 故事文本
     * @returns {Array} - 返回匹配到的图片提示词数组
     */
    parseImagePrompts(story) {
        // 匹配 img:xxx,xxx,xxx 格式（直到换行或文本结束）
        const imagePattern = /img:([^\n]+)/g;
        const matches = [];
        let match;

        while ((match = imagePattern.exec(story)) !== null) {
            matches.push({
                fullMatch: match[0],
                prompt: match[1].trim()
            });
        }

        return matches;
    }
}

// 全局实例
window.novelAIGenerator = new NovelAIImageGenerator();
window.novelAIGenerator.loadConfig();

// ============ 图片渲染相关函数 ============

/**
 * 处理故事文本中的图片提示词，替换为图片占位符
 * @param {string} story - 原始故事文本
 * @returns {string} - 处理后的 HTML
 */
function processStoryWithImages(story) {
    if (!window.novelAIGenerator || !window.novelAIGenerator.enabled) {
        return escapeHtml(story).replace(/\n/g, '<br>');
    }

    const imageMatches = window.novelAIGenerator.parseImagePrompts(story);

    if (imageMatches.length === 0) {
        return escapeHtml(story).replace(/\n/g, '<br>');
    }

    // 使用占位符替换图片指令，然后对整体进行 HTML 转义
    let result = story;
    const placeholders = [];

    imageMatches.forEach((match, index) => {
        const placeholderKey = `__NAI_IMAGE_PLACEHOLDER_${index}_${Date.now()}__`;
        placeholders.push({
            key: placeholderKey,
            prompt: match.prompt,
            loadingId: `nai-img-${Date.now()}-${index}`
        });
        result = result.replace(match.fullMatch, placeholderKey);
    });

    // 对文本进行 HTML 转义
    result = escapeHtml(result).replace(/\n/g, '<br>');

    // 替换占位符为实际的 HTML
    placeholders.forEach((ph) => {
        const placeholder = `<div id="${ph.loadingId}" class="nai-image-loading">
            <span class="loading"></span> 🎨 生成插图中...
            <div class="nai-image-prompt-preview">${escapeHtml(ph.prompt.substring(0, 80))}...</div>
        </div>`;

        result = result.replace(ph.key, placeholder);

        // 异步生成图片
        if (window.novelAIGenerator.apiKey) {
            // 使用 setTimeout 确保 DOM 已更新
            setTimeout(() => generateImageAsync(ph.loadingId, ph.prompt), 50);
        } else {
            // 没有 API Key，显示提示
            setTimeout(() => {
                const el = document.getElementById(ph.loadingId);
                if (el) {
                    el.innerHTML = `<div class="nai-image-prompt-display">
                        <strong>🎨 插图提示词：</strong><br>
                        <code>${escapeHtml(ph.prompt)}</code>
                        <br><small style="color: #999;">（请配置 NovelAI API Key 以生成图片）</small>
                    </div>`;
                }
            }, 100);
        }
    });

    return result;
}

/**
 * 异步生成图片并更新 DOM
 */
async function generateImageAsync(elementId, prompt) {
    try {
        const base64Image = await window.novelAIGenerator.generateImage(prompt);
        const el = document.getElementById(elementId);
        if (el) {
            el.outerHTML = `
                <div class="nai-generated-image-container">
                    <img src="${base64Image}" alt="AI生成的插图" class="nai-generated-image" 
                         onclick="openNAIImageModal(this.src)" />
                    <div class="nai-image-actions">
                        <button class="nai-btn" onclick="toggleNAIPromptDisplay(this)">📝 提示词</button>
                        <button class="nai-btn" onclick="regenerateNAIImage(this, '${escapeHtml(prompt).replace(/'/g, "\\'")}')">🔄 重新生成</button>
                    </div>
                    <div class="nai-image-prompt-hidden" style="display:none;">
                        <code>${escapeHtml(prompt)}</code>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('[NovelAI] 图片生成失败:', error);
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `<div class="nai-image-error">
                ❌ 图片生成失败: ${escapeHtml(error.message)}
                <br><code>${escapeHtml(prompt)}</code>
                <br><button class="nai-btn" onclick="retryNAIImage(this.parentElement, '${escapeHtml(prompt).replace(/'/g, "\\'")}')">🔄 重试</button>
            </div>`;
        }
    }
}

/**
 * HTML 转义函数
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 切换提示词显示
 */
function toggleNAIPromptDisplay(btn) {
    const container = btn.closest('.nai-generated-image-container');
    if (!container) return;
    const promptDiv = container.querySelector('.nai-image-prompt-hidden');
    if (promptDiv) {
        promptDiv.style.display = promptDiv.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * 重新生成图片
 */
async function regenerateNAIImage(btn, prompt) {
    const container = btn.closest('.nai-generated-image-container');
    if (!container) {
        console.error('regenerateNAIImage: 找不到图片容器');
        return;
    }
    const img = container.querySelector('.nai-generated-image');

    // 显示加载状态
    img.style.opacity = '0.5';
    btn.disabled = true;
    btn.textContent = '⏳ 生成中...';

    try {
        const base64Image = await window.novelAIGenerator.generateImage(prompt);
        img.src = base64Image;
        img.style.opacity = '1';
    } catch (error) {
        alert('重新生成失败: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '🔄 重新生成';
        img.style.opacity = '1';
    }
}

/**
 * 重试生成图片
 */
async function retryNAIImage(errorDiv, prompt) {
    const loadingId = `nai-retry-${Date.now()}`;
    errorDiv.outerHTML = `<div id="${loadingId}" class="nai-image-loading">
        <span class="loading"></span> 🎨 重新生成中...
    </div>`;
    await generateImageAsync(loadingId, prompt);
}

/**
 * 图片放大查看
 */
function openNAIImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'nai-image-modal';
    modal.innerHTML = `
        <div class="nai-image-modal-content">
            <img src="${src}" />
            <button class="nai-modal-close" onclick="this.closest('.nai-image-modal').remove()">✕ 关闭</button>
            <a href="${src}" download="novelai-image.png" class="nai-modal-download">📥 下载</a>
        </div>
    `;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

// ============ 配置保存函数 ============

/**
 * 保存 NovelAI 设置
 */
function saveNovelAISettings() {
    const apiKey = document.getElementById('novelaiApiKey')?.value || '';
    const enabled = document.getElementById('enableNovelAI')?.checked || false;
    const template = document.getElementById('novelaiImagePromptTemplate')?.value || '';
    const positivePrefix = document.getElementById('novelaiPositivePrompt')?.value || '';

    // 保存基础设置
    window.novelAIGenerator.setApiKey(apiKey);
    window.novelAIGenerator.setEnabled(enabled);
    window.novelAIGenerator.setImagePromptTemplate(template);
    
    // 保存正面提示词前缀
    window.novelAIGenerator.positivePromptPrefix = positivePrefix;
    localStorage.setItem('novelai_positive_prompt_prefix', positivePrefix);

    // 保存图片参数
    const sizeSelect = document.getElementById('novelaiSize')?.value || '832x1216';
    const [width, height] = sizeSelect.split('x').map(Number);

    const config = {
        width: width,
        height: height,
        steps: parseInt(document.getElementById('novelaiSteps')?.value) || 28,
        scale: parseFloat(document.getElementById('novelaiScale')?.value) || 5,
        negative_prompt: document.getElementById('novelaiNegativePrompt')?.value || window.novelAIGenerator.config.negative_prompt
    };

    window.novelAIGenerator.saveConfig(config);

    console.log('[NovelAI] ✅ 设置已保存', { enabled, hasApiKey: !!apiKey, positivePrefix: positivePrefix.substring(0, 30) });
    alert('✅ NovelAI 设置已保存！');
}

/**
 * 加载 NovelAI 设置到表单
 */
function loadNovelAISettingsToForm() {
    const gen = window.novelAIGenerator;
    if (!gen) return;

    const apiKeyInput = document.getElementById('novelaiApiKey');
    const enabledCheckbox = document.getElementById('enableNovelAI');
    const templateTextarea = document.getElementById('novelaiImagePromptTemplate');
    const sizeSelect = document.getElementById('novelaiSize');
    const stepsInput = document.getElementById('novelaiSteps');
    const scaleInput = document.getElementById('novelaiScale');
    const positiveInput = document.getElementById('novelaiPositivePrompt');
    const negativeInput = document.getElementById('novelaiNegativePrompt');

    if (apiKeyInput) apiKeyInput.value = gen.apiKey;
    if (enabledCheckbox) enabledCheckbox.checked = gen.enabled;
    if (templateTextarea) templateTextarea.value = gen.imagePromptTemplate;

    if (sizeSelect) {
        const sizeValue = `${gen.config.width}x${gen.config.height}`;
        sizeSelect.value = sizeValue;
    }

    if (stepsInput) stepsInput.value = gen.config.steps;
    if (scaleInput) scaleInput.value = gen.config.scale;
    if (positiveInput) positiveInput.value = gen.positivePromptPrefix || '';
    if (negativeInput) negativeInput.value = gen.config.negative_prompt;

    // 显示/隐藏详细设置
    toggleNovelAIFields();
}

/**
 * 切换 NovelAI 详细设置显示
 */
function toggleNovelAIFields() {
    const enabled = document.getElementById('enableNovelAI')?.checked || false;
    const fieldsDiv = document.getElementById('novelaiFields');
    if (fieldsDiv) {
        fieldsDiv.style.display = enabled ? 'block' : 'none';
    }
}

/**
 * 测试 NovelAI 连接
 */
async function testNovelAIConnection() {
    const apiKey = document.getElementById('novelaiApiKey')?.value;
    if (!apiKey) {
        alert('请先输入 API Key');
        return;
    }

    const btn = document.getElementById('testNovelAIBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ 测试中...';
    }

    // 临时设置 API Key
    const oldKey = window.novelAIGenerator.apiKey;
    const oldEnabled = window.novelAIGenerator.enabled;
    window.novelAIGenerator.apiKey = apiKey;
    window.novelAIGenerator.enabled = true;

    try {
        // 使用简单提示词测试
        await window.novelAIGenerator.generateImage('1girl, simple background, white background, upper body, smile, test');
        alert('✅ NovelAI 连接成功！API Key 有效。');
    } catch (error) {
        alert('❌ 连接失败: ' + error.message);
    } finally {
        // 恢复原设置
        window.novelAIGenerator.apiKey = oldKey;
        window.novelAIGenerator.enabled = oldEnabled;

        if (btn) {
            btn.disabled = false;
            btn.textContent = '🧪 测试连接';
        }
    }
}

console.log('📦 [模块加载] novelai-image.js 已加载');
