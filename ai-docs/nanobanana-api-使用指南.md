# NanoBanana API 使用指南

## 基本信息

**API 基础地址**: `https://yunwu.ai`

**完整端点**: `https://yunwu.ai/v1beta/models/gemini-3-pro-image-preview:generateContent`

**请求方法**: POST

## 认证方式

需要在请求头中添加 API Key（具体的 header 名称需要从平台获取，通常是 `x-api-key` 或 `Authorization`）

## 请求示例

### Python 代码示例

```python
import requests
import json

# API 配置
API_URL = "https://yunwu.ai/v1beta/models/gemini-3-pro-image-preview:generateContent"
API_KEY = "your-api-key-here"  # 从平台获取你的 API Key

# 请求头
headers = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY  # 或者使用 "Authorization": f"Bearer {API_KEY}"
}

# 请求数据
data = {
    "contents": [
        {
            "parts": [
                {
                    "text": "画一只可爱的小猫咪"  # 你的图片描述
                }
            ]
        }
    ],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"],
        "imageConfig": {
            "aspectRatio": "16:9",  # 宽高比: 1:1, 4:3, 16:9, 9:16
            "imageSize": "4K"       # 清晰度: HD, 4K
        }
    }
}

# 发送请求
response = requests.post(API_URL, json=data, headers=headers)

# 处理响应
if response.status_code == 200:
    result = response.json()
    print("请求成功！")
    print(json.dumps(result, indent=2, ensure_ascii=False))
else:
    print(f"请求失败: {response.status_code}")
    print(response.text)
```

## 参数说明

### 1. 图片描述 (text)
- 在 `contents[0].parts[0].text` 中填写你想生成的图片描述
- 可以是中文或英文
- 描述越详细，生成的图片越符合预期

### 2. 宽高比 (aspectRatio)
可选值：
- `"1:1"` - 正方形
- `"4:3"` - 传统照片比例
- `"16:9"` - 宽屏比例（适合横向场景）
- `"9:16"` - 竖屏比例（适合手机壁纸）

### 3. 清晰度 (imageSize)
可选值：
- `"HD"` - 高清
- `"4K"` - 超高清

### 4. 响应模式 (responseModalities)
- `["TEXT", "IMAGE"]` - 同时返回文本和图片
- 可以只要图片，设置为 `["IMAGE"]`

## 完整的 JavaScript/Node.js 示例

```javascript
const axios = require('axios');

const API_URL = 'https://yunwu.ai/v1beta/models/gemini-3-pro-image-preview:generateContent';
const API_KEY = 'your-api-key-here';

async function generateImage(prompt, aspectRatio = '16:9', imageSize = '4K') {
  try {
    const response = await axios.post(
      API_URL,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      }
    );

    console.log('生成成功！');
    return response.data;
  } catch (error) {
    console.error('生成失败:', error.response?.data || error.message);
    throw error;
  }
}

// 使用示例
generateImage('一只在月光下跳舞的小兔子', '1:1', 'HD')
  .then(result => console.log(JSON.stringify(result, null, 2)));
```

## 图片编辑功能（高级）

如果需要基于已有图片进行编辑，可以添加图片数据：

```python
data = {
    "contents": [
        {
            "parts": [
                {
                    "text": "在我旁边添加一只羊驼"
                },
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": "base64_encoded_image_data_here"
                    }
                }
            ]
        }
    ],
    "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"],
        "imageConfig": {
            "aspectRatio": "16:9",
            "imageSize": "4K"
        }
    }
}
```

## 注意事项

1. **获取 API Key**: 登录 https://yunwu.apifox.cn 平台获取你的 API Key
2. **速率限制**: 注意API的调用频率限制，避免超出配额
3. **图片格式**: 生成的图片通常是 base64 编码，需要解码后保存
4. **错误处理**: 记得处理可能的错误响应（401认证失败、429请求过多等）

## 常见问题

### Q: 如何保存生成的图片？
A: 响应中的图片通常是 base64 编码，需要解码后保存：

```python
import base64

# 假设响应中有 image_data 字段
image_data = result['candidates'][0]['content']['parts'][0]['inline_data']['data']
image_bytes = base64.b64decode(image_data)

with open('generated_image.jpg', 'wb') as f:
    f.write(image_bytes)
```

### Q: 请求失败怎么办？
A: 检查以下几点：
1. API Key 是否正确
2. 请求格式是否符合规范
3. 网络连接是否正常
4. 是否超出了 API 调用限制

## 参考资料

- 官方文档: https://ai.google.dev/gemini-api/docs/image-generation
- API 平台: https://yunwu.apifox.cn/api-379838953
