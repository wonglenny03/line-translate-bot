# Line Bot 调试步骤

## 前置条件

✅ 本地接口测试通过（`/api/test` 返回正确）
✅ 开发服务器正在运行（`npm run dev`）
✅ 环境变量已配置（`.env.local`）

## 步骤 1: 暴露本地服务到公网

有两种方式，选择其中一种：

### 方案 A: 使用 localtunnel（推荐，无需注册）

在**新的终端窗口**运行：

```bash
lt --port 3000
```

你会看到类似这样的输出：

```
your url is: https://xxxx.loca.lt
```

**重要**: 复制这个 URL，例如：
```
https://xxxx.loca.lt
```

### 方案 B: 使用 ngrok（需要注册）

#### 1. 注册并配置 ngrok

1. 访问 https://dashboard.ngrok.com/signup 注册账号
2. 获取 authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. 配置 authtoken:
   ```bash
   ngrok config add-authtoken 你的authtoken
   ```

#### 2. 启动 ngrok

在**新的终端窗口**运行：

```bash
ngrok http 3000
```

你会看到类似这样的输出：

```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
```

**重要**: 复制 `Forwarding` 后面的 HTTPS URL

详细配置说明请查看 [NGROK_SETUP.md](./NGROK_SETUP.md)

## 步骤 2: 配置 Line Webhook

### 2.1 访问 Line Developers Console

1. 打开浏览器访问: https://developers.line.biz/console/
2. 登录您的 Line 开发者账号
3. 选择您的 Provider
4. 选择您的 Channel（Messaging API 类型）

### 2.2 配置 Webhook URL

1. 在左侧菜单点击 **"Messaging API"**
2. 滚动到 **"Webhook settings"** 部分
3. 在 **"Webhook URL"** 输入框中填入：
   
   **如果使用 localtunnel:**
   ```
   https://你的loca地址.loca.lt/api/line/webhook
   ```
   例如：
   ```
   https://abcd-1234.loca.lt/api/line/webhook
   ```
   
   **如果使用 ngrok:**
   ```
   https://你的ngrok地址.ngrok-free.app/api/line/webhook
   ```
   例如：
   ```
   https://abcd-1234-5678.ngrok-free.app/api/line/webhook
   ```

4. 点击 **"Verify"** 按钮验证 webhook
   - ✅ 如果显示绿色勾号，说明验证成功
   - ❌ 如果失败，检查：
     - localtunnel/ngrok 是否正在运行
     - URL 是否正确（包含 `/api/line/webhook`）
     - 开发服务器是否在运行
     - 如果是 localtunnel，可能需要访问一次 URL 来激活隧道

5. 启用 **"Use webhook"** 开关

### 2.3 禁用自动回复（重要）

在 **"Messaging API"** 页面：
- 找到 **"Auto-reply messages"** 部分
- 将 **"Enabled"** 开关设置为 **关闭**（OFF）

这样可以确保所有消息都通过 webhook 处理。

## 步骤 3: 测试 Line Bot

### 3.1 添加机器人为好友

1. 在 Line 应用中：
   - 点击右上角的 "+" 或搜索
   - 输入您的 Bot 的 ID 或扫描二维码
   - 添加为好友

2. 添加成功后，您应该**立即收到**语言选择列表

### 3.2 测试语言选择

1. 点击语言按钮（如"英语"、"日语"等）
2. 应该收到确认消息，显示已选择的语言
3. 继续选择其他语言，测试多选功能
4. 点击"重置"按钮，测试重置功能

### 3.3 测试翻译功能

1. 发送一条消息，例如：`Hello, world!`
2. 机器人应该：
   - 自动检测源语言（英语）
   - 翻译到您选择的目标语言
   - 返回翻译结果

3. 测试不同语言的消息：
   - 中文：`你好，世界`
   - 日语：`こんにちは`
   - 泰语：`สวัสดี`

## 步骤 4: 查看调试信息

### 4.1 查看请求日志

**如果使用 ngrok:**
访问 ngrok 的 Web Interface：
```
http://127.0.0.1:4040
```

这里可以看到：
- 所有进入的 HTTP 请求
- 请求和响应的详细信息
- 实时请求流

**如果使用 localtunnel:**
查看运行 `lt --port 3000` 的终端输出，会显示所有请求信息。

### 4.2 查看开发服务器日志

在运行 `npm run dev` 的终端中，您会看到：
- 收到的 webhook 事件
- 语言检测结果
- 翻译结果
- 任何错误信息

### 4.3 查看 Line Console 日志

在 Line Developers Console：
1. 进入 **"Messaging API"** > **"Webhook"**
2. 查看 **"Webhook event log"**
3. 可以看到：
   - Webhook 请求历史
   - 成功/失败状态
   - 响应时间

## 常见问题排查

### 问题 1: Webhook 验证失败

**症状**: 点击 "Verify" 后显示失败

**解决方法**:
1. 确保开发服务器正在运行：`npm run dev`
2. 确保 localtunnel/ngrok 正在运行
3. 测试 GET 请求：
   ```bash
   # localtunnel
   curl https://你的loca地址.loca.lt/api/line/webhook
   
   # ngrok
   curl https://你的ngrok地址.ngrok-free.app/api/line/webhook
   ```
   应该返回：`{"message":"Line Translation Bot Webhook"}`
4. 检查 URL 是否正确（包含 `/api/line/webhook`）
5. 如果是 localtunnel，首次访问可能需要先打开一次 URL 来激活隧道

### 问题 2: 添加好友后没有收到语言选择

**症状**: 添加机器人为好友后没有任何回复

**解决方法**:
1. 检查 webhook 是否已启用（"Use webhook" 开关）
2. 检查自动回复是否已禁用
3. 查看开发服务器日志是否有错误
4. 查看 ngrok 日志是否收到请求
5. 检查 `src/app/api/line/webhook/route.ts` 中的 `follow` 事件处理

### 问题 3: 发送消息没有回复

**症状**: 发送消息给机器人但没有收到回复

**解决方法**:
1. 查看开发服务器日志
2. 检查环境变量是否正确（特别是 `LINE_CHANNEL_ACCESS_TOKEN`）
3. 检查 `replyToken` 是否有效（每个事件只能使用一次）
4. 查看是否有错误日志

### 问题 4: 翻译失败

**症状**: 收到消息但翻译失败或返回错误

**解决方法**:
1. 检查 `DEEPSEEK_API_KEY` 是否正确
2. 查看服务器日志中的错误信息
3. 测试 `/api/test` 端点验证翻译功能
4. 检查 API 密钥是否有足够的配额

### 问题 5: 隧道连接断开

**症状**: localtunnel/ngrok 显示连接断开或超时

**解决方法**:
1. 重启隧道：
   - localtunnel: `lt --port 3000`
   - ngrok: `ngrok http 3000`
2. 更新 Line Console 中的 Webhook URL（URL 可能会变化）
3. 重新验证 webhook

**注意**: localtunnel 的 URL 每次启动可能会不同，需要重新配置 webhook URL。

## 调试技巧

### 添加详细日志

在 `src/app/api/line/webhook/route.ts` 的 `POST` 函数开头添加：

```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('=== Webhook 事件 ===')
    console.log('事件类型:', body.events?.[0]?.type)
    console.log('用户ID:', body.events?.[0]?.source?.userId)
    console.log('完整事件:', JSON.stringify(body, null, 2))
    
    // ... 原有代码
  }
}
```

### 测试特定事件

可以使用 Postman 或 curl 模拟 Line 事件：

```bash
curl -X POST http://localhost:3000/api/line/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "message",
      "source": {"userId": "test-user"},
      "replyToken": "test-token",
      "message": {
        "type": "text",
        "text": "Hello"
      }
    }]
  }'
```

## 下一步

调试成功后：
1. 部署到生产环境（如 Vercel）
2. 更新 Line Console 中的 Webhook URL 为生产地址
3. 配置生产环境的环境变量

