// 提示词构建模块
class PromptBuilder {
    /**
     * 构建完整的图片生成提示词
     * @param {string} scene - 场景名称
     * @param {string} title - 小报标题
     * @param {Object} vocabulary - 词汇对象 {核心: [], 物品: [], 环境: []}
     * @returns {string} 完整的提示词
     */
    static build(scene, title, vocabulary) {
        const template = `请生成一张儿童识字小报《${scene}》，竖版 A4，学习小报版式，适合 5–9 岁孩子认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《${title}》

-   **风格**：儿童学习报感
-   **文本要求**：大字、醒目、卡通手写体、彩色描边
-   **装饰**：周围添加与 ${scene} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「${scene}」场景**：

-   **整体气氛**：明亮、温暖、积极
-   **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**

1.  **核心区域 A（主要对象）**：表现 ${scene} 的核心活动。
2.  **核心区域 B（配套设施）**：展示相关的工具或物品。
3.  **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**

-   **角色**：1 位可爱卡通人物（职业/身份：与 ${scene} 匹配）。
-   **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
${vocabulary.核心.join(', ')}

**2. 常见物品/工具：**
${vocabulary.物品.join(', ')}

**3. 环境与装饰：**
${vocabulary.环境.join(', ')}

_(注意：画面中的物体数量不限于此，但以上列表必须作为重点描绘对象)_

# 四、识字标注规则

每个物体旁边需要添加"识字贴纸"：

-   **格式**：双行文字
    -   第一行：英文（小字）
    -   第二行：汉字（稍大）
-   **样式**：
    -   底色：白色或淡色带圆角矩形背景
    -   描边：彩色边框
    -   整体感觉像"贴纸"效果

**示例标注格式：**
\`\`\`
┌──────────┐
│  apple   │  ← 英文
│  苹果     │  ← 汉字
└──────────┘
\`\`\`

# 五、排版与美观要求

-   物体摆放合理，不过度重叠
-   标签不遮挡主体
-   色彩鲜艳但不刺眼
-   整体风格统一（卡通、儿童向）
-   保持识字小报的教育性和趣味性

# 六、技术要求

-   图片比例：9:16（竖版 A4）
-   分辨率：4K
-   风格：卡通插画风格，适合儿童
-   色彩：明亮温暖，不刺眼`;

        return template;
    }

    /**
     * 验证提示词参数是否完整
     * @param {string} scene
     * @param {string} title
     * @param {Object} vocabulary
     * @returns {boolean}
     */
    static validate(scene, title, vocabulary) {
        if (!scene || !title) {
            return false;
        }

        if (!vocabulary || !vocabulary.核心 || !vocabulary.物品 || !vocabulary.环境) {
            return false;
        }

        // 检查词汇数量
        if (vocabulary.核心.length === 0 || vocabulary.物品.length === 0 || vocabulary.环境.length === 0) {
            return false;
        }

        return true;
    }
}
