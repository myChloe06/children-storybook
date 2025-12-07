# 历史记录存储问题修复方案

## 问题描述
- **错误**: `Failed to execute 'setItem' on 'Storage': Setting the value of 'storybook_history' exceeded the quota`
- **原因**: 历史记录保存了完整的图片 base64 数据，导致 localStorage 存储空间超限

## 解决方案

### 方案选择：只保存文字信息
- ✅ 保存：场景、标题、词汇列表、时间戳、API版本
- ❌ 不保存：任何图片数据（包括 base64 和缩略图）

### 修改内容

#### 1. 修改 `addToHistory()` 方法 (app.js 第447-483行)
```javascript
// 修改前：保存图片
imageBase64: this.generatedImageBase64, // 这行导致存储超限

// 修改后：移除图片保存
// 删除 imageBase64 字段，只保存文字信息
```

#### 2. 修改 `loadHistoryItem()` 方法 (app.js 第540-560行)
```javascript
// 修改前：恢复图片
if (item.imageBase64) {
    this.generatedImageBase64 = item.imageBase64;
    // 显示图片...
}

// 修改后：不恢复图片，只填充文字内容
// 用户需要重新生成图片
```

#### 3. 减少历史记录数量
- 从 20 条减少到 10 条
- 进一步节省存储空间

#### 4. 添加错误处理
- 捕获存储超限错误
- 提示用户清理历史记录

### 用户体验
1. **点击历史记录** → 自动填充场景、标题、词汇
2. **不显示旧图片** → 避免混淆
3. **需要重新生成** → 用户点击"生成图片"按钮
4. **可以修改词汇** → 生成前可调整

### 优势
- 解决存储空间问题
- 历史记录功能保留
- 用户可以查看和复用之前的词汇
- 代码更简单，维护更容易

## 实施步骤
1. 修改 addToHistory() - 移除图片保存
2. 修改 loadHistoryItem() - 只恢复文字
3. 调整历史记录显示 - 移除图片预览
4. 减少最大历史记录数到 10 条
5. 添加存储错误处理