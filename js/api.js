// API 配置管理
class APIConfig {
    constructor() {
        this.nanoBananaURL = 'https://yunwu.ai/v1beta/models/gemini-3-pro-image-preview:generateContent';
    }

    // 保存配置到 localStorage（临时，测试用）
    save(nanoBananaKey, textAPIUrl, textAPIKey, textAPIModel) {
        localStorage.setItem('nanobanana_api_key', nanoBananaKey);
        localStorage.setItem('text_api_url', textAPIUrl);
        localStorage.setItem('text_api_key', textAPIKey);
        localStorage.setItem('text_api_model', textAPIModel);
    }

    // 从 localStorage 读取配置
    load() {
        return {
            nanoBananaKey: localStorage.getItem('nanobanana_api_key'),
            textAPIUrl: localStorage.getItem('text_api_url'),
            textAPIKey: localStorage.getItem('text_api_key'),
            textAPIModel: localStorage.getItem('text_api_model')
        };
    }

    // 检查配置是否完整
    isValid() {
        const config = this.load();
        return config.nanoBananaKey && config.textAPIUrl &&
               config.textAPIKey && config.textAPIModel;
    }

    // 清除配置
    clear() {
        localStorage.removeItem('nanobanana_api_key');
        localStorage.removeItem('text_api_url');
        localStorage.removeItem('text_api_key');
        localStorage.removeItem('text_api_model');
    }
}

// API 调用类
class APIClient {
    constructor(config) {
        this.config = config;
    }

    // 测试 NanoBanana API 连接
    async testNanoBananaAPI(apiKey) {
        try {
            console.log('测试 NanoBanana API (使用 query 参数认证)...');

            // API Key 作为 query 参数传递
            const url = `${this.config.nanoBananaURL}?key=${encodeURIComponent(apiKey)}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: 'test' }]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        imageConfig: {
                            aspectRatio: "1:1",
                            imageSize: "HD"
                        }
                    }
                })
            });

            console.log('NanoBanana API 响应状态:', response.status);

            // 如果成功或 400（参数问题，但连接正常）
            if (response.ok || response.status === 400) {
                return { success: true, method: 'query' };
            }

            // 读取错误信息
            const errorText = await response.text();
            console.error('NanoBanana API 错误响应:', errorText);
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };

        } catch (error) {
            console.error('NanoBanana API 测试失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 测试文本 API 连接
    async testTextAPI(apiUrl, apiKey, modelName) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: 'user', content: 'test' }
                    ],
                    max_tokens: 10
                })
            });

            return response.ok;
        } catch (error) {
            console.error('文本 API 测试失败:', error);
            return false;
        }
    }

    // 生成词汇（自定义场景）
    async generateVocabulary(scene) {
        const { textAPIUrl, textAPIKey, textAPIModel } = this.config.load();

        const prompt = `你是儿童识字专家。请为场景"${scene}"生成 15-20 个适合 5-9 岁儿童的双语词汇。

要求：
1. 每个词汇必须包含英文和汉字（格式：english 汉字）
2. 英文单词必须全部小写
3. 分为三类：
   - 核心角色与设施（3-5个）
   - 常见物品/工具（5-8个）
   - 环境与装饰（3-5个）
4. 返回纯 JSON 格式，不要任何其他文字：
{
  "核心": ["english 汉字", "english 汉字", ...],
  "物品": ["english 汉字", "english 汉字", ...],
  "环境": ["english 汉字", "english 汉字", ...]
}

示例：
{
  "核心": ["cashier 收银员", "shelf 货架"],
  "物品": ["apple 苹果", "milk 牛奶"],
  "环境": ["exit 出口", "light 灯"]
}`;

        try {
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
                            content: '你是一个专业的儿童教育专家，擅长为儿童场景生成双语词汇。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`API 调用失败: ${response.status}`);
            }

            const result = await response.json();
            const content = result.choices[0].message.content;

            // 提取 JSON（处理可能的 markdown 代码块）
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const vocabData = JSON.parse(jsonMatch[0]);
                // 格式化所有词汇，确保英文部分是小写
                return this.formatVocabulary(vocabData);
            }

            return this.formatVocabulary(JSON.parse(content));
        } catch (error) {
            console.error('生成词汇失败:', error);
            throw error;
        }
    }

    // 翻译汉字到英文
    async translateToEnglish(chineseWord) {
        const { textAPIUrl, textAPIKey, textAPIModel } = this.config.load();

        try {
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
                            content: '你是一个专业的翻译专家，将中文词汇翻译成简洁的英文。只返回英文翻译（全部小写），不要其他解释。'
                        },
                        {
                            role: 'user',
                            content: `请将"${chineseWord}"翻译成英文，只返回英文单词或短语（全部小写），不要其他内容。`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 20
                })
            });

            if (!response.ok) {
                throw new Error(`翻译 API 调用失败: ${response.status}`);
            }

            const result = await response.json();
            return result.choices[0].message.content.trim();
        } catch (error) {
            console.error('翻译失败:', error);
            throw error;
        }
    }

    // 格式化词汇，确保英文部分是小写
    formatVocabulary(vocabData) {
        const categories = ['核心', '物品', '环境'];
        categories.forEach(category => {
            if (vocabData[category]) {
                vocabData[category] = vocabData[category].map(word => {
                    const parts = word.split(' ');
                    const chinese = parts[parts.length - 1];
                    const english = parts.slice(0, -1).join(' ').toLowerCase();
                    return `${english} ${chinese}`;
                });
            }
        });
        return vocabData;
    }

    // 生成图片
    async generateImage(prompt) {
        const { nanoBananaKey } = this.config.load();

        try {
            // API Key 作为 query 参数传递
            const url = `${this.config.nanoBananaURL}?key=${encodeURIComponent(nanoBananaKey)}`;

            console.log('调用图片生成 API...');

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE"],
                        imageConfig: {
                            aspectRatio: "9:16",  // 竖版 A4
                            imageSize: "4K"
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`图片生成 API 调用失败: HTTP ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('API 响应:', result);

            // 详细检查响应结构
            if (result.candidates && result.candidates.length > 0) {
                console.log('候选结果数量:', result.candidates.length);
                const candidate = result.candidates[0];
                console.log('第一个候选:', candidate);

                // 尝试多种可能的图片数据位置
                let imageData = null;

                // 方法 1: 检查 content.parts
                if (candidate.content && candidate.content.parts) {
                    console.log('Content parts 数量:', candidate.content.parts.length);
                    candidate.content.parts.forEach((part, index) => {
                        console.log(`Part ${index}:`, Object.keys(part));
                    });

                    // 查找 inlineData (注意：不是 inline_data)
                    const imagePart = candidate.content.parts.find(
                        part => part.inlineData && part.inlineData.data
                    );
                    if (imagePart) {
                        console.log('找到图片数据 (inlineData)');
                        imageData = imagePart.inlineData.data;
                    }

                    // 如果没找到，尝试旧的格式 inline_data
                    if (!imageData) {
                        const oldImagePart = candidate.content.parts.find(
                            part => part.inline_data && part.inline_data.data
                        );
                        if (oldImagePart) {
                            console.log('找到图片数据 (inline_data - 旧格式)');
                            imageData = oldImagePart.inline_data.data;
                        }
                    }

                    // 如果没找到，查找可能的 videoData
                    if (!imageData) {
                        const videoPart = candidate.content.parts.find(
                            part => part.videoData && part.videoData.data
                        );
                        if (videoPart) {
                            console.log('找到视频数据 (可能是动态图片)');
                            imageData = videoPart.videoData.data;
                        }
                    }

                    // 检查是否有 thoughtSignature（说明还在思考）
                    const thoughtPart = candidate.content.parts.find(
                        part => part.thoughtSignature
                    );
                    if (thoughtPart && !imageData) {
                        console.warn('⚠️ API 返回了 thoughtSignature，但没有图片数据');
                        console.warn('这可能是因为：');
                        console.warn('1. 提示词过于复杂，API 还在处理中');
                        console.warn('2. API 配置问题');
                        console.warn('3. 需要等待更长时间');

                        // 生成一个更简单的测试提示词
                        const simplePrompt = '一个简单的苹果，卡通风格，白色背景';
                        console.log('尝试使用更简单的提示词...');
                        throw new Error(`API 返回了思考过程但没有图片数据。可能提示词太复杂了。提示词长度: ${prompt.length} 字符`);
                    }
                }

                // 方法 2: 检查直接的 data 字段
                if (!imageData && candidate.data) {
                    console.log('找到直接数据');
                    imageData = candidate.data;
                }

                if (imageData) {
                    return imageData; // base64 字符串
                }
            }

            // 如果以上都没找到，输出更详细的错误信息
            console.error('完整的响应结构:', JSON.stringify(result, null, 2));
            throw new Error('响应中没有找到图片数据。请查看控制台了解详细的响应结构。');
        } catch (error) {
            console.error('生成图片失败:', error);
            throw error;
        }
    }
}
