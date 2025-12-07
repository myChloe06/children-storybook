// 主应用类
class StorybookApp {
    constructor() {
        this.apiConfig = new APIConfig();
        this.apiClient = new APIClient(this.apiConfig);
        this.yunwuClient = new YunwuAPIClient();  // 云雾API客户端
        this.currentScene = null;
        this.currentTitle = null;
        this.currentVocabulary = null;
        this.generatedImageBase64 = null;

        // 历史记录管理
        this.maxHistoryItems = 10; // 最多保存10条历史记录

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAPIConfig();
        this.loadHistory();
    }

    // 绑定事件
    bindEvents() {
        // API 配置相关
        document.getElementById('save-api-btn').addEventListener('click', () => this.saveAPIConfig());
        document.getElementById('clear-api-btn').addEventListener('click', () => this.clearAPIConfig());

        // 场景选择
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectPresetScene(e.target.dataset.scene));
        });
        document.getElementById('confirm-custom-scene-btn').addEventListener('click', () => this.confirmCustomScene());

        // 生成词汇
        document.getElementById('generate-vocab-btn').addEventListener('click', () => this.generateVocabulary());

        // 添加词汇（初始绑定）
        this.bindAddWordButtons();

        // 模态框
        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.hideAddWordModal());
        document.getElementById('modal-add-btn').addEventListener('click', () => this.addPendingWords());
        document.getElementById('modal-batch-translate-btn').addEventListener('click', () => this.batchTranslate());

        // 生成图片
        document.getElementById('generate-image-btn').addEventListener('click', () => this.generateImage());

        // 图片操作
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());
        document.getElementById('regenerate-btn').addEventListener('click', () => this.generateImage());
        document.getElementById('new-generation-btn').addEventListener('click', () => this.resetApp());

        // 标题输入变化
        document.getElementById('title-input').addEventListener('input', () => this.updateGenerateVocabButton());

        // 历史记录
        document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());
    }

    // 绑定添加词汇按钮（支持动态创建的按钮）
    bindAddWordButtons() {
        document.querySelectorAll('.add-word-btn').forEach(btn => {
            // 移除现有的事件监听器（避免重复绑定）
            btn.replaceWith(btn.cloneNode(true));
        });

        // 重新绑定所有按钮
        document.querySelectorAll('.add-word-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showAddWordModal(e.target.dataset.category));
        });
    }

    // 加载 API 配置
    loadAPIConfig() {
        if (this.apiConfig.isValid()) {
            const config = this.apiConfig.load();
            document.getElementById('nanobanana-key').value = config.nanoBananaKey;
            document.getElementById('text-api-url').value = config.textAPIUrl;
            document.getElementById('text-api-key').value = config.textAPIKey;
            document.getElementById('text-api-model').value = config.textAPIModel;

            // 加载API版本选择
            if (config.apiVersion) {
                document.querySelector(`input[name="api-version"][value="${config.apiVersion}"]`).checked = true;
            }
        }
    }

    // 保存 API 配置
    saveAPIConfig() {
        const nanoBananaKey = document.getElementById('nanobanana-key').value.trim();
        const textAPIUrl = document.getElementById('text-api-url').value.trim();
        const textAPIKey = document.getElementById('text-api-key').value.trim();
        const textAPIModel = document.getElementById('text-api-model').value.trim();
        const apiVersion = document.querySelector('input[name="api-version"]:checked').value;

        if (!nanoBananaKey || !textAPIUrl || !textAPIKey || !textAPIModel) {
            alert('请填写所有必填项');
            return;
        }

        this.apiConfig.save(nanoBananaKey, textAPIUrl, textAPIKey, textAPIModel, apiVersion);
        alert('API 配置已保存！');
    }

    // 清除 API 配置
    clearAPIConfig() {
        if (confirm('确定要清除所有 API 配置吗？')) {
            this.apiConfig.clear();
            document.getElementById('nanobanana-key').value = '';
            document.getElementById('text-api-url').value = '';
            document.getElementById('text-api-key').value = '';
            document.getElementById('text-api-model').value = '';
            alert('API 配置已清除！');
        }
    }

    // 选择预设场景
    selectPresetScene(scene) {
        // 移除所有场景的 active 类
        document.querySelectorAll('.scene-btn').forEach(btn => btn.classList.remove('active'));
        // 添加当前场景的 active 类
        event.target.classList.add('active');

        this.currentScene = scene;
        this.showSelectedScene(scene);
        this.updateGenerateVocabButton();

        // 清空自定义场景输入
        document.getElementById('custom-scene-input').value = '';
    }

    // 确认自定义场景
    confirmCustomScene() {
        const customScene = document.getElementById('custom-scene-input').value.trim();
        if (!customScene) {
            alert('请输入场景名称');
            return;
        }

        // 移除所有预设场景的 active 类
        document.querySelectorAll('.scene-btn').forEach(btn => btn.classList.remove('active'));

        this.currentScene = customScene;
        this.showSelectedScene(customScene);
        this.updateGenerateVocabButton();
    }

    // 显示已选场景
    showSelectedScene(scene) {
        const selectedInfo = document.getElementById('selected-scene');
        selectedInfo.textContent = `✓ 已选择场景：${scene}`;
        selectedInfo.classList.add('show');
    }

    // 更新生成词汇按钮状态
    updateGenerateVocabButton() {
        const title = document.getElementById('title-input').value.trim();
        const btn = document.getElementById('generate-vocab-btn');
        btn.disabled = !(this.currentScene && title);
    }

    // 更新生成图片按钮状态
    updateGenerateImageButton() {
        const btn = document.getElementById('generate-image-btn');
        // 检查是否有场景、标题和词汇
        const hasScene = this.currentScene && this.currentScene.trim() !== '';
        const hasTitle = this.currentTitle && this.currentTitle.trim() !== '';
        const hasVocabulary = this.currentVocabulary &&
            this.currentVocabulary['核心'] && this.currentVocabulary['核心'].length > 0 &&
            this.currentVocabulary['物品'] && this.currentVocabulary['物品'].length > 0 &&
            this.currentVocabulary['环境'] && this.currentVocabulary['环境'].length > 0;

        btn.disabled = !(hasScene && hasTitle && hasVocabulary);
    }

    // 生成词汇
    async generateVocabulary() {
        this.currentTitle = document.getElementById('title-input').value.trim();

        if (!this.currentScene || !this.currentTitle) {
            alert('请选择场景并输入标题');
            return;
        }

        // 显示词汇区域
        document.getElementById('vocab-section').style.display = 'block';

        // 检查是否为预设场景
        if (isPresetScene(this.currentScene)) {
            // 直接加载预设词汇
            this.currentVocabulary = getPresetVocabulary(this.currentScene);
            this.displayVocabulary();
        } else {
            // 调用 API 生成词汇
            try {
                // 显示加载状态
                document.getElementById('vocab-core').innerHTML = '<li>正在生成词汇...</li>';
                document.getElementById('vocab-items').innerHTML = '<li>正在生成词汇...</li>';
                document.getElementById('vocab-environment').innerHTML = '<li>正在生成词汇...</li>';

                this.currentVocabulary = await this.apiClient.generateVocabulary(this.currentScene);
                this.displayVocabulary();
            } catch (error) {
                alert('生成词汇失败：' + error.message);
                document.getElementById('vocab-section').style.display = 'none';
            }
        }
    }

    // 显示词汇列表
    displayVocabulary() {
        this.displayCategoryVocabulary('核心', 'vocab-core');
        this.displayCategoryVocabulary('物品', 'vocab-items');
        this.displayCategoryVocabulary('环境', 'vocab-environment');

        // 更新生成图片按钮状态
        this.updateGenerateImageButton();
    }

    // 显示某个类别的词汇
    displayCategoryVocabulary(category, elementId) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';

        const words = this.currentVocabulary[category] || [];
        words.forEach((word, index) => {
            const vocabItem = document.createElement('div');
            vocabItem.className = 'vocab-item';

            const wordSpan = document.createElement('div');
            wordSpan.className = 'vocab-word';

            // 分离英文和汉字
            const parts = word.split(' ');
            const english = parts.slice(0, -1).join(' ');
            const chinese = parts[parts.length - 1];

            wordSpan.innerHTML = `<span class="english">${english}</span><span class="chinese">${chinese}</span>`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-word-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => this.deleteWord(category, index));

            vocabItem.appendChild(wordSpan);
            vocabItem.appendChild(deleteBtn);
            container.appendChild(vocabItem);
        });

        // 重新绑定添加词汇按钮（因为按钮在HTML中已经存在）
        this.bindAddWordButtons();
    }

    // 删除词汇
    deleteWord(category, index) {
        this.currentVocabulary[category].splice(index, 1);
        this.displayCategoryVocabulary(category, this.getCategoryElementId(category));
        // 更新生成图片按钮状态
        this.updateGenerateImageButton();
    }

    // 获取类别对应的元素ID
    getCategoryElementId(category) {
        const map = {
            '核心': 'vocab-core',
            '物品': 'vocab-items',
            '环境': 'vocab-environment'
        };
        return map[category];
    }

    // 显示添加词汇模态框
    showAddWordModal(category) {
        this.currentAddCategory = category;
        document.getElementById('modal-category-name').textContent = category;
        document.getElementById('modal-word-input').value = '';
        document.getElementById('add-word-modal').style.display = 'flex';
        // 重置待翻译词汇列表
        this.pendingWords = [];
        this.updatePendingWordsDisplay();
    }

    // 隐藏添加词汇模态框
    hideAddWordModal() {
        document.getElementById('add-word-modal').style.display = 'none';
        this.currentAddCategory = null;
    }

    // 添加词汇到待翻译列表
    addPendingWords() {
        const input = document.getElementById('modal-word-input');
        const words = input.value.trim().split('\n').filter(word => word.trim());

        if (words.length === 0) {
            alert('请输入至少一个中文词汇');
            return;
        }

        // 添加到待翻译列表
        words.forEach(word => {
            const trimmedWord = word.trim();
            if (trimmedWord && !this.pendingWords.includes(trimmedWord)) {
                this.pendingWords.push(trimmedWord);
            }
        });

        // 清空输入框
        input.value = '';

        // 更新显示
        this.updatePendingWordsDisplay();
    }

    // 更新待翻译词汇显示
    updatePendingWordsDisplay() {
        const container = document.getElementById('pending-words-container');
        const list = document.getElementById('pending-words-list');
        const batchTranslateBtn = document.getElementById('modal-batch-translate-btn');

        if (this.pendingWords.length === 0) {
            container.style.display = 'none';
            batchTranslateBtn.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        batchTranslateBtn.style.display = 'inline-block';

        list.innerHTML = '';
        this.pendingWords.forEach((word, index) => {
            const item = document.createElement('div');
            item.className = 'pending-word-item';
            item.innerHTML = `
                <span>${word}</span>
                <button onclick="app.removePendingWord(${index})">删除</button>
            `;
            list.appendChild(item);
        });
    }

    // 移除待翻译词汇
    removePendingWord(index) {
        this.pendingWords.splice(index, 1);
        this.updatePendingWordsDisplay();
    }

    // 批量翻译
    async batchTranslate() {
        if (this.pendingWords.length === 0) {
            alert('没有待翻译的词汇');
            return;
        }

        // 显示加载状态
        document.getElementById('modal-loading').style.display = 'flex';
        document.getElementById('modal-batch-translate-btn').disabled = true;

        try {
            // 构建批量翻译的提示词
            const wordsText = this.pendingWords.join('、');
            const prompt = `请将以下中文词汇翻译成英文（全部小写），返回JSON格式：
{
  "translations": ["word1 english", "word2 english", "word3 english"]
}

中文词汇：${wordsText}`;

            // 调用 API 进行批量翻译
            const { textAPIUrl, textAPIKey, textAPIModel } = this.apiConfig.load();

            const response = await fetch(textAPIUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${textAPIKey}`
                },
                body: JSON.stringify({
                    model: textAPIModel,
                    messages: [
                        {
                            role: 'system',
                            content: '你是专业的翻译专家，将中文词汇翻译成英文（全部小写）。返回纯JSON格式。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`翻译请求失败: ${response.status}`);
            }

            const result = await response.json();
            const content = result.choices[0].message.content;

            // 提取 JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('翻译结果格式错误');
            }

            const translationData = JSON.parse(jsonMatch[0]);
            const translations = translationData.translations || [];

            // 将翻译结果添加到词汇列表
            translations.forEach((translation, index) => {
                if (this.pendingWords[index]) {
                    const formattedEnglish = translation.toLowerCase().trim();
                    const bilingualWord = `${formattedEnglish} ${this.pendingWords[index]}`;
                    this.currentVocabulary[this.currentAddCategory].push(bilingualWord);
                }
            });

            // 刷新显示
            this.displayCategoryVocabulary(
                this.currentAddCategory,
                this.getCategoryElementId(this.currentAddCategory)
            );

            // 关闭模态框
            this.hideAddWordModal();

            // 更新生成图片按钮状态
            this.updateGenerateImageButton();

            alert(`成功翻译并添加了 ${translations.length} 个词汇！`);
        } catch (error) {
            console.error('批量翻译失败:', error);
            alert('批量翻译失败：' + error.message);
        } finally {
            document.getElementById('modal-loading').style.display = 'none';
            document.getElementById('modal-batch-translate-btn').disabled = false;
        }
    }

    // 生成图片
    async generateImage() {
        // 验证数据
        if (!PromptBuilder.validate(this.currentScene, this.currentTitle, this.currentVocabulary)) {
            alert('请确保场景、标题和词汇都已填写完整');
            return;
        }

        // 构建提示词
        const prompt = PromptBuilder.build(this.currentScene, this.currentTitle, this.currentVocabulary);

        // 显示结果区域和加载状态
        document.getElementById('result-section').style.display = 'block';
        document.getElementById('loading-container').style.display = 'block';
        document.getElementById('result-container').style.display = 'none';

        // 滚动到结果区域
        document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });

        try {
            // 获取当前选择的API版本
            const apiVersion = document.querySelector('input[name="api-version"]:checked').value;
            const apiKey = document.getElementById('nanobanana-key').value.trim();

            if (!apiKey) {
                throw new Error('请输入 API Key');
            }

            let base64Image;

            // 根据选择的API版本调用不同的方法
            if (apiVersion === 'yunwu') {
                // 使用云雾API（同步模式）
                console.log('使用云雾API生成图片...');
                this.updateLoadingText('正在生成图片（云雾API）...');
                base64Image = await this.yunwuClient.generateImage(prompt, apiKey);
            } else {
                // 使用NanoBanana API（异步任务模式）
                console.log('使用NanoBanana API生成图片...');
                this.updateLoadingText('正在生成图片（异步任务模式）...');
                base64Image = await this.apiClient.generateImage(prompt);
            }

            this.generatedImageBase64 = base64Image;

            // 显示图片
            const imgElement = document.getElementById('result-image');
            imgElement.src = `data:image/jpeg;base64,${this.generatedImageBase64}`;

            // 隐藏加载状态，显示结果
            document.getElementById('loading-container').style.display = 'none';
            document.getElementById('result-container').style.display = 'block';

            // 添加到历史记录
            this.addToHistory();
        } catch (error) {
            alert('生成图片失败：' + error.message);
            document.getElementById('result-section').style.display = 'none';
        }
    }

    // 更新加载文本
    updateLoadingText(text) {
        const loadingText = document.getElementById('loading-text');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    // 下载图片
    downloadImage() {
        if (!this.generatedImageBase64) {
            alert('没有可下载的图片');
            return;
        }

        const filename = `识字小报_${this.currentScene}_${Date.now()}.jpg`;
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${this.generatedImageBase64}`;
        link.download = filename;
        link.click();
    }

    // 重置应用
    resetApp() {
        this.currentScene = null;
        this.currentTitle = null;
        this.currentVocabulary = null;
        this.generatedImageBase64 = null;

        // 清空输入
        document.querySelectorAll('.scene-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('custom-scene-input').value = '';
        document.getElementById('title-input').value = '';
        document.getElementById('selected-scene').classList.remove('show');

        // 隐藏区域
        document.getElementById('vocab-section').style.display = 'none';
        document.getElementById('result-section').style.display = 'none';

        // 禁用生成词汇按钮
        document.getElementById('generate-vocab-btn').disabled = true;

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 历史记录相关方法
    // 加载历史记录
    loadHistory() {
        const historyData = localStorage.getItem('storybook_history');
        this.history = historyData ? JSON.parse(historyData) : [];
        this.displayHistory();
    }

    // 保存历史记录
    saveHistory() {
        localStorage.setItem('storybook_history', JSON.stringify(this.history));
    }

    // 添加到历史记录
    addToHistory() {
        if (!this.currentScene || !this.currentTitle || !this.currentVocabulary) {
            return;
        }

        // 获取当前选择的API版本
        const apiVersion = document.querySelector('input[name="api-version"]:checked').value;

        const historyItem = {
            id: Date.now(),
            scene: this.currentScene,
            title: this.currentTitle,
            vocabulary: JSON.parse(JSON.stringify(this.currentVocabulary)), // 深拷贝
            timestamp: new Date().toISOString(),
            apiVersion: apiVersion
        };

        // 检查是否已存在相同的记录
        const existingIndex = this.history.findIndex(item =>
            item.scene === historyItem.scene &&
            item.title === historyItem.title
        );

        if (existingIndex >= 0) {
            // 如果存在，更新记录
            this.history[existingIndex] = historyItem;
        } else {
            // 如果不存在，添加到开头
            this.history.unshift(historyItem);
        }

        // 限制历史记录数量
        if (this.history.length > this.maxHistoryItems) {
            this.history = this.history.slice(0, this.maxHistoryItems);
        }

        try {
            this.saveHistory();
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                alert('存储空间已满，正在清理历史记录...');
                this.history = [];
                try {
                    this.saveHistory();
                    alert('历史记录已清理，请重新生成内容。');
                } catch (clearError) {
                    console.error('清理历史记录失败:', clearError);
                    alert('清理历史记录失败，请检查浏览器存储设置。');
                }
            } else {
                console.error('保存历史记录失败:', error);
                alert('保存历史记录失败，请稍后重试。');
            }
        }
        this.displayHistory();
    }

    // 显示历史记录
    displayHistory() {
        const historyList = document.getElementById('history-list');

        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
            return;
        }

        historyList.innerHTML = '';

        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            // 格式化日期
            const date = new Date(item.timestamp);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            let dateStr;
            if (isToday) {
                // 今天显示时间
                dateStr = `今天 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            } else {
                // 其他日期显示月日和时间
                dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            }

            // 获取预览词汇 - 减少显示数量，只显示前4个
            const previewWords = [];
            if (item.vocabulary) {
                // 按优先级获取词汇：核心 > 物品 > 环境
                const categories = ['核心', '物品', '环境'];
                for (const category of categories) {
                    if (item.vocabulary[category] && previewWords.length < 4) {
                        const wordsToAdd = item.vocabulary[category].slice(0, 4 - previewWords.length);
                        previewWords.push(...wordsToAdd);
                    }
                }
            }

            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-item-title" title="${item.title}">${this.truncateText(item.title, 20)}</span>
                    <span class="history-item-date">${dateStr}</span>
                </div>
                <div class="history-item-content">
                    <div class="history-item-scene">
                        <span class="scene-label">场景</span>
                        <span class="scene-value">${item.scene}</span>
                    </div>
                    ${previewWords.length > 0 ? `
                        <div class="history-item-vocab-preview">
                            <span class="vocab-label">词汇</span>
                            <div class="vocab-list">
                                ${previewWords.map(word =>
                                    `<span class="history-item-vocab">${word}</span>`
                                ).join('')}
                                ${this.getTotalWordCount(item.vocabulary) > previewWords.length ? `<span class="vocab-more">+${this.getTotalWordCount(item.vocabulary) - previewWords.length}</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;

            // 点击历史记录项
            historyItem.addEventListener('click', () => this.loadHistoryItem(item));

            historyList.appendChild(historyItem);
        });
    }

    // 辅助方法：截断文本
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 1) + '...';
    }

    // 辅助方法：获取词汇总数
    getTotalWordCount(vocabulary) {
        if (!vocabulary) return 0;
        let count = 0;
        ['核心', '物品', '环境'].forEach(category => {
            if (vocabulary[category]) {
                count += vocabulary[category].length;
            }
        });
        return count;
    }

    // 加载历史记录项
    loadHistoryItem(item) {
        // 恢复数据
        this.currentScene = item.scene;
        this.currentTitle = item.title;
        this.currentVocabulary = JSON.parse(JSON.stringify(item.vocabulary));

        // 清除当前图片数据
        this.generatedImageBase64 = null;

        // 更新界面
        document.getElementById('title-input').value = item.title;

        // 更新场景选择
        document.querySelectorAll('.scene-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.scene === item.scene) {
                btn.classList.add('active');
            }
        });

        // 清空自定义场景输入
        document.getElementById('custom-scene-input').value = '';

        // 显示选中的场景
        this.showSelectedScene(item.scene);

        // 显示词汇
        document.getElementById('vocab-section').style.display = 'block';
        this.displayVocabulary();

        // 隐藏结果区域（不显示图片）
        document.getElementById('result-section').style.display = 'none';

        // 显示提示信息
        alert('历史记录已加载！\n\n文字内容已恢复，包括标题、场景和词汇。\n\n请点击"生成图片"按钮来生成新的图片。');

        // 更新按钮状态
        this.updateGenerateVocabButton();

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 清空历史记录
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            this.history = [];
            this.saveHistory();
            this.displayHistory();
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.storybookApp = new StorybookApp();
});