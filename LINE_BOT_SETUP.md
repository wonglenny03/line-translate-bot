# Line Bot 账号设置指南

## 错误："非常抱歉，此账号目前无法回复任何消息"

这个错误通常是因为 Bot 账号的 Messaging API 未正确启用或需要验证。

## 解决步骤

### 步骤 1: 验证 Bot 账号

1. 访问 [Line Developers Console](https://developers.line.biz/console/)
2. 选择您的 Channel
3. 进入 **"Messaging API"** 页面
4. 检查以下设置：

#### ✅ 必须启用的设置：

1. **"Use webhook"** - 必须启用（ON）
2. **"Auto-reply messages"** - 必须关闭（OFF）
3. **"Greeting messages"** - 可以关闭（OFF）

### 步骤 2: 验证账号（如果需要）

如果看到需要验证的提示：

1. 在 Line Developers Console 中
2. 进入 **"Settings"** > **"Basic settings"**
3. 如果提示需要验证，按照步骤完成验证：
   - 可能需要绑定手机号
   - 可能需要验证邮箱
   - 可能需要完成开发者认证

### 步骤 3: 检查 Channel Access Token

1. 在 **"Messaging API"** 页面
2. 找到 **"Channel access token"** 部分
3. 确保已生成 token（点击 "Issue" 生成新的）
4. 复制 token 到 `.env.local` 文件：
   ```
   LINE_CHANNEL_ACCESS_TOKEN=你的token
   ```

### 步骤 4: 检查 Bot 状态

1. 在 Line Developers Console 的 **"Settings"** > **"Basic settings"**
2. 检查 Bot 状态：
   - 应该是 "Active" 或 "正常"
   - 如果显示 "Pending" 或 "待审核"，需要等待审核通过

### 步骤 5: 重新启动开发服务器

更新环境变量后，重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

### 步骤 6: 测试 Webhook

1. 在 Line Console 的 **"Messaging API"** > **"Webhook"**
2. 点击 **"Verify"** 按钮
3. 应该显示绿色勾号 ✅

## 常见原因和解决方案

### 原因 1: Messaging API 未启用

**症状**: Bot 无法发送消息

**解决**:
- 确保 "Use webhook" 已启用
- 确保 Channel Access Token 已生成

### 原因 2: 账号需要验证

**症状**: 显示需要验证账号

**解决**:
- 完成手机号验证
- 完成邮箱验证
- 等待审核通过（如果是新账号）

### 原因 3: Channel Access Token 无效或过期

**症状**: 401 错误或认证失败

**解决**:
1. 在 Line Console 重新生成 Channel Access Token
2. 更新 `.env.local` 文件
3. 重启开发服务器

### 原因 4: Bot 账号被限制

**症状**: 账号状态显示异常

**解决**:
- 检查是否有违规行为
- 联系 Line 支持
- 创建新的 Channel

### 原因 5: Webhook URL 配置错误

**症状**: Webhook 验证失败

**解决**:
1. 检查 URL 格式是否正确
2. 确保包含 `/api/line/webhook`
3. 确保 ngrok/localtunnel 正在运行
4. 重新验证 webhook

## 验证清单

在开始测试前，确保：

- [ ] Line Console 中 "Use webhook" 已启用
- [ ] Line Console 中 "Auto-reply messages" 已关闭
- [ ] Channel Access Token 已生成并配置到 `.env.local`
- [ ] Webhook URL 已配置并验证成功
- [ ] 开发服务器正在运行
- [ ] ngrok/localtunnel 正在运行
- [ ] Bot 账号状态为 "Active"

## 测试步骤

1. **测试 Webhook 连接**
   ```bash
   curl https://你的webhook地址/api/line/webhook
   ```
   应该返回：`{"message":"Line Translation Bot Webhook"}`

2. **在 Line Console 点击 "Verify"**
   - 应该显示绿色勾号

3. **添加机器人为好友**
   - 应该立即收到语言选择列表

4. **发送测试消息**
   - 应该收到翻译结果

## 如果仍然无法解决

1. 检查 Line Console 的 **"Messaging API"** > **"Webhook event log"**
   - 查看是否有错误信息
   - 查看请求是否成功

2. 查看开发服务器日志
   - 是否有错误信息
   - 是否有认证错误

3. 检查环境变量
   ```bash
   # 确认环境变量已加载
   cat .env.local
   ```

4. 重新生成 Channel Access Token
   - 在 Line Console 中重新生成
   - 更新 `.env.local`
   - 重启服务器

