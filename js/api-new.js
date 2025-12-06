// API 配置管理 - 更新版
class APIConfig {
    constructor() {
        // 新的 NanoBanana API 使用 kie.ai
        this.nanoBananaCreateTaskURL = 'https://api.kie.ai/api/v1/jobs/createTask';
        this.nanoBananaQueryTaskURL = 'https://api.kie.ai/api/v1/jobs/recordInfo';
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

// API 调用类 - 更新版
class APIClient {
    constructor(config) {
        this.config = config;
    }

    // 测试 NanoBanana API 连接
    async testNanoBananaAPI(apiKey) {
        try {
            console.log('测试 NanoBanana API (异步任务模式)...');

            // 步骤 1: 创建测试任务
            const response = await fetch(this.config.nanoBananaCreateTaskURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'nano-banana-pro',
                    input: {
                        prompt: 'test',
                        aspect_ratio: '1:1',
                        resolution: '1K',
                        output_format: 'png'
                    }
                })
            });

            console.log('创建任务响应状态:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('任务创建成功:', result);
                return { success: true };
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
2. 分为三类：
   - 核心角色与设施（3-5个）
   - 常见物品/工具（5-8个）
   - 环境与装饰（3-5个）
3. 返回纯 JSON 格式，不要任何其他文字：
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
                return JSON.parse(jsonMatch[0]);
            }

            return JSON.parse(content);
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
                            content: '你是一个专业的翻译专家，将中文词汇翻译成简洁的英文。只返回英文翻译，不要其他解释。'
                        },
                        {
                            role: 'user',
                            content: `请将"${chineseWord}"翻译成英文，只返回英文单词或短语，不要其他内容。`
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

    // 生成图片 - 使用新的异步任务 API
    async generateImage(prompt) {
        const { nanoBananaKey } = this.config.load();

        try {
            console.log('调用图片生成 API（异步任务模式）...');

            // 步骤 1: 创建生成任务
            console.log('步骤 1: 创建任务...');
            const createResponse = await fetch(this.config.nanoBananaCreateTaskURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${nanoBananaKey}`
                },
                body: JSON.stringify({
                    model: 'nano-banana-pro',
                    input: {
                        prompt: prompt,
                        aspect_ratio: '9:16',  // 竖版 A4
                        resolution: '4K',
                        output_format: 'jpg'
                    }
                })
            });

            if (!createResponse.ok) {
                const errorText = await createResponse.text();
                throw new Error(`创建任务失败: HTTP ${createResponse.status} - ${errorText}`);
            }

            const createResult = await createResponse.json();
            console.log('任务创建成功:', createResult);
            console.log('响应结构:', JSON.stringify(createResult, null, 2));

            // 检查不同的响应结构
            let taskId = null;
            if (createResult.data && createResult.data.taskId) {
                taskId = createResult.data.taskId;
            } else if (createResult.taskId) {
                taskId = createResult.taskId;
            } else if (createResult.id) {
                taskId = createResult.id;
            }

            if (!taskId) {
                console.error('无法从响应中提取 taskId，响应内容:', createResult);
                throw new Error(`创建任务失败：未返回有效的 taskId。响应结构：${JSON.stringify(createResult)}`);
            }

            console.log('任务 ID:', taskId);

            // 步骤 2: 轮询任务状态
            console.log('步骤 2: 轮询任务状态...');
            let attempts = 0;
            const maxAttempts = 60; // 最多轮询 60 次（5分钟）

            while (attempts < maxAttempts) {
                attempts++;
                console.log(`第 ${attempts} 次查询任务状态...`);

                const queryResponse = await fetch(`${this.config.nanoBananaQueryTaskURL}?taskId=${taskId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${nanoBananaKey}`
                    }
                });

                if (!queryResponse.ok) {
                    const errorText = await queryResponse.text();
                    throw new Error(`查询任务状态失败: HTTP ${queryResponse.status} - ${errorText}`);
                }

                const queryResult = await queryResponse.json();
                console.log('任务状态:', queryResult);

                if (queryResult.code !== 200) {
                    throw new Error(`查询任务失败: ${queryResult.msg}`);
                }

                const { state, resultJson, failMsg } = queryResult.data;

                if (state === 'success') {
                    console.log('任务成功完成！');
                    console.log('结果:', resultJson);

                    // 解析结果 JSON
                    const result = JSON.parse(resultJson);
                    if (result.resultUrls && result.resultUrls.length > 0) {
                        const imageUrl = result.resultUrls[0];
                        console.log('图片 URL:', imageUrl);

                        // 下载图片并转换为 base64
                        return await this.downloadAndConvertToBase64(imageUrl);
                    } else {
                        throw new Error('任务成功但没有返回图片 URL');
                    }
                } else if (state === 'fail') {
                    throw new Error(`任务失败: ${failMsg || '未知错误'}`);
                } else if (state === 'waiting') {
                    // 任务还在处理中，继续等待
                    console.log('任务处理中，等待 5 秒...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    throw new Error(`未知的任务状态: ${state}`);
                }
            }

            throw new Error('任务超时，请稍后再试');

        } catch (error) {
            console.error('生成图片失败:', error);
            throw error;
        }
    }

    // 下载图片并转换为 base64
    async downloadAndConvertToBase64(imageUrl) {
        try {
            console.log('下载图片:', imageUrl);

            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`下载图片失败: HTTP ${response.status}`);
            }

            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    // 移除 data:image/jpeg;base64, 前缀
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('下载并转换图片失败:', error);
            throw error;
        }
    }
}