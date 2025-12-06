// 云雾 API 调用类
class YunwuAPIClient {
    constructor() {
        this.yunwuURL = 'https://yunwu.ai/v1beta/models/gemini-3-pro-image-preview:generateContent';
    }

    // 测试云雾 API 连接
    async testAPI(apiKey) {
        try {
            console.log('测试云雾 API (使用 Bearer Token 认证)...');

            // 使用 Authorization: Bearer header
            const response = await fetch(this.yunwuURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: 'test' }]
                    }],
                    generationConfig: {
                        responseModalities: ['IMAGE'],
                        imageConfig: {
                            aspectRatio: '1:1',
                            imageSize: 'HD'
                        }
                    }
                })
            });

            console.log('云雾 API 响应状态:', response.status);

            if (response.ok || response.status === 400) {
                return { success: true };
            }

            const errorText = await response.text();
            console.error('云雾 API 错误响应:', errorText);
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };

        } catch (error) {
            console.error('云雾 API 测试失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 生成图片 - 云雾同步模式
    async generateImage(prompt, apiKey) {
        try {
            console.log('调用云雾图片生成 API（同步模式）...');

            const response = await fetch(this.yunwuURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    contents: [{
                        role: 'user',
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        responseModalities: ['IMAGE'],
                        imageConfig: {
                            aspectRatio: '9:16',  // 竖版 A4
                            imageSize: '4K'
                        }
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`云雾 API 调用失败: HTTP ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('云雾 API 响应:', result);

            // 解析响应 - 正确的方式
            return this.extractImageFromResponse(result);

        } catch (error) {
            console.error('云雾生成图片失败:', error);
            throw error;
        }
    }

    // 从云雾响应中提取图片数据
    extractImageFromResponse(resp) {
        const candidate = resp.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        // 找出真正带图片的那个 part
        const imagePart = parts.find(p => p.inline_data || p.inlineData);

        if (!imagePart) {
            console.error('没有找到图片数据，parts =', parts);
            // 检查是否有 thoughtSignature（说明还在思考）
            const thoughtPart = parts.find(p => p.thoughtSignature);
            if (thoughtPart) {
                console.warn('⚠️ API 返回了 thoughtSignature，但没有图片数据');
                throw new Error('API 还在处理中，请稍后再试或简化提示词');
            }
            throw new Error('响应中没有找到图片数据');
        }

        const inline = imagePart.inline_data || imagePart.inlineData;
        const base64 = inline.data;
        const mimeType = inline.mime_type || 'image/png';

        return base64; // 直接返回 base64 字符串
    }
}

// 导出到全局（方便调试）
if (typeof window !== 'undefined') {
    window.YunwuAPIClient = YunwuAPIClient;
}