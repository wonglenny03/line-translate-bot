# 修复 Webhook 401 Unauthorized 错误

## 问题症状

Line Console 显示：
```
The webhook returned an HTTP status code other than 200.(401 Unauthorized)
```

## 可能的原因

1. **环境变量未正确设置**
2. **签名验证失败**
3. **Channel Secret 不正确**

## 解决步骤

### 步骤 1: 检查 Vercel 环境变量

1. 进入 Vercel 项目页面
2. 进入 **Settings** → **Environment Variables**
3. 确认以下变量已设置：
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET` ⚠️ **最重要**
   - `OPENAI_API_KEY`

4. **重要**：确保变量值正确，没有多余的空格或换行符

### 步骤 2: 验证 Channel Secret

1. 访问 [Line Developers Console](https://developers.line.biz/console/)
2. 选择您的 Channel
3. 进入 **Basic settings** 标签
4. 找到 **Channel secret**
5. 复制完整的 Channel secret（不要包含空格）
6. 在 Vercel 中更新 `LINE_CHANNEL_SECRET` 环境变量

### 步骤 3: 重新部署

更新环境变量后，**必须重新部署**：

1. 进入 Vercel 项目的 **Deployments** 标签
2. 找到最新的部署
3. 点击右侧的 **...** 菜单
4. 选择 **Redeploy**
5. 等待部署完成

### 步骤 4: 检查 Vercel 日志

1. 进入 Vercel 项目的 **Functions** 标签
2. 点击 `/api/line/webhook` 函数
3. 查看 **Logs** 标签
4. 查找以下日志：
   - `🔐 签名验证信息` - 检查是否有签名和 Channel Secret
   - `✅ Webhook 签名验证通过` - 如果看到这个，说明验证成功
   - `❌ Webhook 签名验证失败` - 如果看到这个，说明验证失败

### 步骤 5: 验证 Webhook

1. 在 Line Developers Console 中
2. 进入 **Messaging API** → **Webhook**
3. 点击 **Verify** 按钮
4. 应该显示成功（绿色勾号 ✅）

## 常见问题

### Q: 环境变量已设置，但仍然 401？

**A**: 检查以下几点：
1. 确保环境变量名称完全正确（大小写敏感）
2. 确保没有多余的空格或换行符
3. 确保已重新部署（环境变量更改需要重新部署才能生效）
4. 检查 Vercel 日志中的 `channelSecretLength`，应该大于 0

### Q: 日志显示 "LINE_CHANNEL_SECRET 未设置"？

**A**: 
1. 检查 Vercel 环境变量是否已保存
2. 确保变量名称是 `LINE_CHANNEL_SECRET`（不是 `LINE_CHANNEL_SECRET_KEY` 或其他）
3. 重新部署项目

### Q: 日志显示 "签名验证失败"？

**A**: 
1. 检查 Channel Secret 是否正确
2. 确保 Channel Secret 是从 Line Console 的 **Basic settings** 中复制的
3. 不要使用 Channel Access Token（这是不同的东西）
4. 确保 Channel Secret 没有多余的空格

### Q: 如何查看详细的错误日志？

**A**: 
1. 在 Vercel 中进入项目
2. 点击 **Functions** 标签
3. 找到 `/api/line/webhook` 函数
4. 点击查看 **Logs**
5. 查找带有 `🔐`、`❌` 或 `✅` 的日志

## 调试技巧

### 临时禁用签名验证（仅用于调试）

如果需要临时禁用签名验证来测试其他功能，可以修改代码：

```typescript
// 临时跳过签名验证（仅用于调试）
if (signature && false) {  // 改为 false 来跳过验证
  const isValid = validateSignature(bodyText, channelSecret, signature)
  // ...
}
```

**⚠️ 警告**：这只是用于调试，**不要在生产环境中禁用签名验证**。

## 验证清单

- [ ] Vercel 环境变量 `LINE_CHANNEL_SECRET` 已设置
- [ ] Channel Secret 值正确（从 Line Console 复制）
- [ ] 环境变量已保存
- [ ] 已重新部署项目
- [ ] Vercel 日志显示 `✅ Webhook 签名验证通过`
- [ ] Line Console 中 Webhook 验证成功

## 需要帮助？

如果问题仍然存在，请提供：
1. Vercel 日志中的 `🔐 签名验证信息` 部分
2. 是否有 `❌` 错误日志
3. Channel Secret 的长度（不提供实际值，只提供长度）

