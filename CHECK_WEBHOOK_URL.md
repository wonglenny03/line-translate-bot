# 检查 Webhook URL 配置

## 问题：日志显示 `POST /` 而不是 `POST /api/line/webhook`

这说明请求没有到达正确的路由。请检查：

## 1. 检查 Line Console 中的 Webhook URL

1. 访问 [Line Developers Console](https://developers.line.biz/console/)
2. 进入您的 Channel > "Messaging API" > "Webhook"
3. **检查 Webhook URL 是否正确**

### 正确的 URL 格式：

```
https://你的ngrok地址.ngrok-free.app/api/line/webhook
```

或

```
https://你的loca地址.loca.lt/api/line/webhook
```

### ❌ 错误的 URL 格式：

```
https://你的ngrok地址.ngrok-free.app/          ← 缺少 /api/line/webhook
https://你的loca地址.loca.lt/                   ← 缺少 /api/line/webhook
```

## 2. 验证 Webhook URL

在 Line Console 中：
1. 点击 "Verify" 按钮
2. 应该显示绿色勾号 ✅
3. 如果失败，检查 URL 是否正确

## 3. 测试正确的 URL

使用 curl 测试：

```bash
curl https://你的webhook地址/api/line/webhook
```

应该返回：`{"message":"Line Translation Bot Webhook"}`

## 4. 查看中间件日志

现在所有请求都会被记录到 `webhook.log`，包括：
- 请求的路径
- 请求的方法
- 时间戳

运行：
```bash
tail -f webhook.log | grep MIDDLEWARE
```

可以看到所有进入的请求路径。

## 5. 常见问题

### 问题：Webhook URL 配置错误

**症状**: 日志显示 `POST /` 而不是 `POST /api/line/webhook`

**解决**: 
1. 检查 Line Console 中的 Webhook URL
2. 确保包含完整的路径：`/api/line/webhook`
3. 重新验证 webhook

### 问题：ngrok/localtunnel URL 变化

**症状**: 之前配置的 URL 不再工作

**解决**:
1. 重启 ngrok/localtunnel
2. 获取新的 URL
3. 更新 Line Console 中的 Webhook URL
4. 重新验证

