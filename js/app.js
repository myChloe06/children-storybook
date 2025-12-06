// 主应用类
class StorybookApp {
    constructor() {
        this.apiConfig = new APIConfig();
        this.apiClient = new APIClient(this.apiConfig);
        this.currentScene = null;
        this.currentTitle = null;
        this.currentVocabulary = null;
        this.generatedImageBase64 = null;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadAPIConfig();
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

        // 添加词汇
        document.querySelectorAll('.add-word-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showAddWordModal(e.target.dataset.category));
        });
        document.getElementById('modal-cancel-btn').addEventListener('click', () => this.hideAddWordModal());
        document.getElementById('modal-add-btn').addEventListener('click', () => this.addWord());

        // 生成图片
        document.getElementById('generate-image-btn').addEventListener('click', () => this.generateImage());

        // 图片操作
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());
        document.getElementById('regenerate-btn').addEventListener('click', () => this.generateImage());
        document.getElementById('new-generation-btn').addEventListener('click', () => this.resetApp());

        // 标题输入变化
        document.getElementById('title-input').addEventListener('input', () => this.updateGenerateVocabButton());
    }

    // 加载 API 配置
    loadAPIConfig() {
        if (this.apiConfig.isValid()) {
            const config = this.apiConfig.load();
            document.getElementById('nanobanana-key').value = config.nanoBananaKey;
            document.getElementById('text-api-url').value = config.textAPIUrl;
            document.getElementById('text-api-key').value = config.textAPIKey;
            document.getElementById('text-api-model').value = config.textAPIModel;
        }
    }

    // 保存 API 配置
    saveAPIConfig() {
        const nanoBananaKey = document.getElementById('nanobanana-key').value.trim();
        const textAPIUrl = document.getElementById('text-api-url').value.trim();
        const textAPIKey = document.getElementById('text-api-key').value.trim();
        const textAPIModel = document.getElementById('text-api-model').value.trim();

        if (!nanoBananaKey || !textAPIUrl || !textAPIKey || !textAPIModel) {
            alert('请填写所有必填项');
            return;
        }

        this.apiConfig.save(nanoBananaKey, textAPIUrl, textAPIKey, textAPIModel);
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
    }

    // 显示某个类别的词汇
    displayCategoryVocabulary(category, elementId) {
        const container = document.getElementById(elementId);
        container.innerHTML = '';

        const words = this.currentVocabulary[category] || [];
        words.forEach((word, index) => {
            const li = document.createElement('li');

            const wordSpan = document.createElement('span');
            wordSpan.className = 'vocab-word';

            // 分离英文和汉字
            const parts = word.split(' ');
            const english = parts.slice(0, -1).join(' ');
            const chinese = parts[parts.length - 1];

            wordSpan.innerHTML = `<span class="english">${english}</span> <span class="chinese">${chinese}</span>`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-word-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', () => this.deleteWord(category, index));

            li.appendChild(wordSpan);
            li.appendChild(deleteBtn);
            container.appendChild(li);
        });
    }

    // 删除词汇
    deleteWord(category, index) {
        this.currentVocabulary[category].splice(index, 1);
        this.displayCategoryVocabulary(category, this.getCategoryElementId(category));
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
    }

    // 隐藏添加词汇模态框
    hideAddWordModal() {
        document.getElementById('add-word-modal').style.display = 'none';
        this.currentAddCategory = null;
    }

    // 添加词汇
    async addWord() {
        const chineseWord = document.getElementById('modal-word-input').value.trim();
        if (!chineseWord) {
            alert('请输入汉字');
            return;
        }

        // 显示加载状态
        document.getElementById('modal-loading').style.display = 'flex';
        document.getElementById('modal-add-btn').disabled = true;

        try {
            // 调用 API 翻译
            const englishTranslation = await this.apiClient.translateToEnglish(chineseWord);
            const bilingualWord = `${englishTranslation} ${chineseWord}`;

            // 添加到词汇列表
            this.currentVocabulary[this.currentAddCategory].push(bilingualWord);

            // 刷新显示
            this.displayCategoryVocabulary(
                this.currentAddCategory,
                this.getCategoryElementId(this.currentAddCategory)
            );

            // 关闭模态框
            this.hideAddWordModal();
        } catch (error) {
            alert('翻译失败：' + error.message);
        } finally {
            document.getElementById('modal-loading').style.display = 'none';
            document.getElementById('modal-add-btn').disabled = false;
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
            // 调用 API 生成图片
            this.generatedImageBase64 = await this.apiClient.generateImage(prompt);

            // 显示图片
            const imgElement = document.getElementById('result-image');
            imgElement.src = `data:image/jpeg;base64,${this.generatedImageBase64}`;

            // 隐藏加载状态，显示结果
            document.getElementById('loading-container').style.display = 'none';
            document.getElementById('result-container').style.display = 'block';
        } catch (error) {
            alert('生成图片失败：' + error.message);
            document.getElementById('result-section').style.display = 'none';
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
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.storybookApp = new StorybookApp();
});
