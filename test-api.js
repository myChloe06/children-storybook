// API 连通性测试脚本
// 注意：此文件仅用于测试，不包含实际的 API Key

// 测试文本 API 连通性
async function testTextAPI() {
    const apiUrl = 'https://api.siliconflow.cn/v1/chat/completions';
    const apiKey = 'sk-mdtnyqrclamlwrfelpobienafsakzniebphreqshnolycurq';
    const model = 'Pro/deepseek-ai/DeepSeek-V3.2';

    console.log('\n=== 测试文本 API ===');
    console.log('URL:', apiUrl);
    console.log('Model:', model);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: '你好，请回复"连接成功"'
                    }
                ],
                max_tokens: 50,
                temperature: 0.7
            })
        });

        console.log('响应状态:', response.status);
        console.log('响应头:', [...response.headers.entries()]);

        const data = await response.json();

        if (response.ok) {
            console.log('✅ 文本 API 连接成功！');
            console.log('响应内容:', JSON.stringify(data, null, 2));
            return { success: true, data };
        } else {
            console.error('❌ 文本 API 连接失败');
            console.error('错误信息:', data);
            return { success: false, error: data };
        }
    } catch (error) {
        console.error('❌ 文本 API 测试异常:', error);
        return { success: false, error: error.message };
    }
}

// 测试 NanoBanana API 连通性
async function testNanoBananaAPI() {
    const apiUrl = 'https://yunwu.ai/v1beta/models/gemini-3-pro-image-preview:generateContent';
    const apiKey = 'sk-Gd0VCqE8N1fdZt8UFSV9fEqgpyJLXhm6VWEdDSy4wPAgiEt1';

    console.log('\n=== 测试 NanoBanana API ===');
    console.log('URL:', apiUrl);
    console.log('API Key 长度:', apiKey.length);

    try {
        const url = `${apiUrl}?key=${encodeURIComponent(apiKey)}`;
        console.log('完整 URL:', url);

        const requestBody = {
            contents: [{
                role: 'user',
                parts: [{ text: 'test' }]
            }],
            generationConfig: {
                responseModalities: ["TEXT"],  // 先用 TEXT 测试连接
                imageConfig: {
                    aspectRatio: "1:1",
                    imageSize: "HD"
                }
            }
        };
        console.log('请求体:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('响应状态:', response.status);
        console.log('响应头:', [...response.headers.entries()]);

        const responseText = await response.text();
        console.log('响应内容:', responseText);

        if (response.ok || response.status === 400) {
            console.log('✅ NanoBanana API 连接成功！');
            return { success: true };
        } else {
            console.error('❌ NanoBanana API 连接失败');
            return { success: false, error: `HTTP ${response.status}: ${responseText}` };
        }
    } catch (error) {
        console.error('❌ NanoBanana API 测试异常:', error);
        console.error('错误堆栈:', error.stack);
        return { success: false, error: error.message };
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('开始 API 连通性测试...\n');

    // 测试文本 API
    const textResult = await testTextAPI();

    // 测试 NanoBanana API
    const nanoResult = await testNanoBananaAPI();

    // 输出测试结果摘要
    console.log('\n=== 测试结果摘要 ===');
    console.log('文本 API:', textResult.success ? '✅ 成功' : '❌ 失败');
    console.log('NanoBanana API:', nanoResult.success ? '✅ 成功' : '❌ 失败');

    if (!textResult.success) {
        console.log('\n文本 API 错误详情:', textResult.error);
    }
    if (!nanoResult.success) {
        console.log('\nNanoBanana API 错误详情:', nanoResult.error);
    }
}

// 如果直接运行此脚本
if (typeof window !== 'undefined') {
    // 浏览器环境
    window.testAPIs = runAllTests;
    console.log('在浏览器控制台中运行 testAPIs() 来执行测试');
} else {
    // Node.js 环境
    runAllTests();
}