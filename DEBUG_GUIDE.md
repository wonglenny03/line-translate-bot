# 调试指南

本指南将帮助您调试 Line 翻译机器人。

## 1. 本地开发调试

### 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动。

### 检查环境变量

确保 `.env.local` 文件已正确配置：

```bash
# 检查环境变量是否加载
cat .env.local
```

或者创建一个测试脚本来验证环境变量：

```bash
node -e "require('dotenv').config({ path: '.env.local' }); console.log('LINE_CHANNEL_ACCESS_TOKEN:', process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已设置' : '未设置'); console.log('LINE_CHANNEL_SECRET:', process.env.LINE_CHANNEL_SECRET ? '已设置' : '未设置'); console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置');"
```

## 2. 使用 ngrok 暴露本地服务

Line Webhook 需要公网可访问的 URL，本地开发需要使用 ngrok 等工具。

### 安装 ngrok

```bash
# macOS
brew install ngrok

# 或从官网下载: https://ngrok.com/download
```

### 启动 ngrok

```bash
# 在另一个终端窗口运行
ngrok http 3000
```

ngrok 会显示一个公网 URL，例如：
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
```

### 配置 Line Webhook

1. 访问 [Line Developers Console](https://developers.line.biz/console/)
2. 选择您的 Channel
3. 进入 "Messaging API" 设置
4. 在 "Webhook URL" 中填入：`https://xxxx-xx-xx-xx-xx.ngrok-free.app/api/line/webhook`
5. 点击 "Verify" 验证 webhook
6. 启用 "Use webhook"

## 3. 测试 Webhook 端点

### 使用 curl 测试

```bash
# 测试 GET 请求（webhook 验证）
curl http://localhost:3000/api/line/webhook

# 应该返回: {"message":"Line Translation Bot Webhook"}
```

### 使用 Postman 或类似工具测试 POST 请求

创建一个测试请求到 `http://localhost:3000/api/line/webhook`，使用以下 JSON body：

```json
{
  "events": [
    {
      "type": "message",
      "source": {
        "userId": "test-user-id"
      },
      "replyToken": "test-reply-token",
      "message": {
        "type": "text",
        "text": "Hello, world!"
      }
    }
  ]
}
```

## 4. 查看日志

### 开发服务器日志

开发服务器会在控制台输出日志，包括：
- 翻译错误
- 语言检测结果
- API 调用错误

### 添加更多调试日志

在 `src/app/api/line/webhook/route.ts` 中添加日志：

```typescript
console.log('收到事件:', JSON.stringify(event, null, 2));
console.log('用户ID:', userId);
console.log('目标语言:', targetLanguages);
```

## 5. 测试各个功能

### 测试语言检测

创建一个测试脚本 `test-detect.js`：

```javascript
const { initTranslator, detectLanguage } = require('./src/lib/translator');

// 加载环境变量
require('dotenv').config({ path: '.env.local' });

initTranslator(process.env.DEEPSEEK_API_KEY);

async function test() {
  const texts = [
    'Hello, how are you?',
    '你好，世界',
    'สวัสดี',
    'こんにちは',
  ];
  
  for (const text of texts) {
    const lang = await detectLanguage(text);
    console.log(`"${text}" -> ${lang}`);
  }
}

test().catch(console.error);
```

运行：
```bash
node test-detect.js
```

### 测试翻译功能

创建测试脚本 `test-translate.js`：

```javascript
const { initTranslator, translateToLanguages } = require('./src/lib/translator');

require('dotenv').config({ path: '.env.local' });

initTranslator(process.env.DEEPSEEK_API_KEY);

async function test() {
  const text = 'Hello, world!';
  const targetLanguages = ['zh-CN', 'ja', 'th'];
  
  const translations = await translateToLanguages(text, targetLanguages);
  console.log('翻译结果:', JSON.stringify(translations, null, 2));
}

test().catch(console.error);
```

## 6. 常见问题排查

### 问题 1: Webhook 验证失败

**症状**: Line Console 显示 webhook 验证失败

**解决方法**:
- 确保 ngrok URL 正确
- 检查服务器是否正在运行
- 查看服务器日志是否有错误
- 确保 GET 端点返回正确的响应

### 问题 2: 消息没有回复

**症状**: 发送消息给机器人但没有回复

**解决方法**:
- 检查 Line Console 中 webhook 是否已启用
- 查看服务器日志是否有错误
- 检查环境变量是否正确配置
- 验证 `replyToken` 是否有效（每个事件只能使用一次）

### 问题 3: 翻译失败

**症状**: 收到消息但翻译失败

**解决方法**:
- 检查 `DEEPSEEK_API_KEY` 是否正确
- 查看控制台日志中的错误信息
- 验证 API 密钥是否有足够的配额
- 测试 DeepSeek API 是否可访问

### 问题 4: 语言检测不准确

**症状**: 检测到的语言代码不正确

**解决方法**:
- 查看 `src/lib/translator.ts` 中的语言检测逻辑
- 检查返回的语言代码是否在支持的语言列表中
- 可以添加更多日志来查看 DeepSeek 的原始响应

## 7. 使用 Line 开发者工具

### Line Webhook Simulator

1. 访问 Line Developers Console
2. 选择您的 Channel
3. 进入 "Messaging API" > "Webhook"
4. 使用 "Webhook URL tester" 测试 webhook

### 查看 Webhook 事件日志

在 Line Developers Console 的 "Messaging API" > "Webhook" 页面可以查看：
- Webhook 请求历史
- 成功/失败状态
- 响应时间

## 8. 调试技巧

### 启用详细日志

在 `src/app/api/line/webhook/route.ts` 开头添加：

```typescript
// 开发环境启用详细日志
if (process.env.NODE_ENV === 'development') {
  console.log('Webhook 请求:', JSON.stringify(body, null, 2));
}
```

### 使用 VS Code 调试

创建 `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### 测试特定功能

创建一个测试路由 `src/app/api/test/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { initTranslator, detectLanguage, translateToLanguages } from '@/lib/translator';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const text = searchParams.get('text') || 'Hello, world!';
  
  initTranslator(process.env.DEEPSEEK_API_KEY);
  
  try {
    const detectedLang = await detectLanguage(text);
    const translations = await translateToLanguages(text, ['zh-CN', 'ja', 'th']);
    
    return NextResponse.json({
      text,
      detectedLanguage: detectedLang,
      translations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

然后访问：`http://localhost:3000/api/test?text=你好`

## 9. 生产环境调试

### 使用 Vercel 日志

如果部署在 Vercel：
1. 进入 Vercel Dashboard
2. 选择项目
3. 查看 "Functions" 标签页的日志

### 添加错误追踪

考虑集成 Sentry 或其他错误追踪服务：

```bash
npm install @sentry/nextjs
```

## 10. 性能监控

### 监控 API 响应时间

在代码中添加时间测量：

```typescript
const startTime = Date.now();
const translations = await translateToLanguages(text, targetLanguages);
const duration = Date.now() - startTime;
console.log(`翻译耗时: ${duration}ms`);
```

### 监控 API 调用次数

添加计数器来跟踪 API 使用情况。

