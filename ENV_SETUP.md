# 环境变量配置说明

本项目需要配置以下环境变量才能正常运行。

## 创建环境变量文件

在项目根目录创建 `.env.local` 文件（此文件已被 git 忽略，不会提交到代码库）。

## 必需的环境变量

### 1. Line Bot 配置

#### LINE_CHANNEL_ACCESS_TOKEN
- **说明**: Line Messaging API 的 Channel Access Token
- **获取步骤**:
  1. 访问 [Line Developers Console](https://developers.line.biz/console/)
  2. 登录您的 Line 开发者账号
  3. 创建新的 Provider（如果还没有）
  4. 创建新的 Channel，选择 "Messaging API" 类型
  5. 在 Channel Settings 页面找到 "Channel access token"
  6. 点击 "Issue" 生成新的 token
  7. 复制 token 到环境变量

#### LINE_CHANNEL_SECRET
- **说明**: Line Messaging API 的 Channel Secret
- **获取步骤**:
  1. 在 Line Developers Console 的 Channel Settings 页面
  2. 找到 "Channel secret" 部分
  3. 点击 "Show" 显示 secret
  4. 复制 secret 到环境变量

### 2. OpenAI API 配置

#### OPENAI_API_KEY
- **说明**: OpenAI API 的密钥，用于语言检测和翻译
- **获取步骤**:
  1. 访问 [OpenAI 平台](https://platform.openai.com/)
  2. 注册或登录您的 OpenAI 账号
  3. 进入 API Keys 页面: https://platform.openai.com/api-keys
  4. 点击 "Create new secret key" 创建新的 API Key
  5. 复制生成的 API Key 到环境变量
  6. （重要）妥善保管 API Key，不要泄露给他人

#### OPENAI_MODEL（可选）
- **说明**: 指定使用的 OpenAI 模型
- **默认值**: `gpt-3.5-turbo`
- **可选值**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo-preview` 等
- **注意**: 不同模型的价格和性能不同，请根据需求选择

## 环境变量文件示例

创建 `.env.local` 文件，内容如下：

```env
# Line Bot配置
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here

# 可选：指定使用的模型（默认: gpt-3.5-turbo）
# OPENAI_MODEL=gpt-3.5-turbo
```

## 注意事项

1. **安全性**: 
   - `.env.local` 文件包含敏感信息，不要提交到 git
   - 生产环境部署时，在部署平台（如 Vercel）配置环境变量

2. **API 配额**:
   - OpenAI API 有使用配额限制和计费
   - 请查看 OpenAI 平台的定价: https://openai.com/pricing
   - 建议设置使用限制和预算提醒
   - 默认使用 `gpt-3.5-turbo` 模型（成本较低）

3. **Webhook URL**:
   - 部署后需要在 Line Developers Console 配置 Webhook URL
   - Webhook URL 格式: `https://your-domain.com/api/line/webhook`
   - 本地开发可以使用 ngrok 等工具进行测试

## 验证配置

配置完成后，运行以下命令启动开发服务器：

```bash
npm run dev
```

如果配置正确，服务器应该能正常启动。检查控制台是否有警告信息。

