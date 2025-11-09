# Line 翻译机器人

这是一个基于 Next.js 和 Line Messaging API 的翻译机器人，支持多语言翻译功能。

## 功能特性

- 🌍 支持9种语言：中文简体、英语、泰语、日语、汉语、法语、阿拉伯语、韩语、马来文
- 🔄 用户加入聊天时自动弹出语言选择列表
- 💾 保存用户的语言偏好设置
- 🔁 支持重置为默认语言（中文、英语、泰语）
- 📝 根据用户选择的语言自动翻译消息
- 🎯 使用 OpenAI API 进行翻译和语言检测

## 快速开始

### 本地开发

1. 复制环境变量示例文件：
   ```bash
   cp env.example .env.local
   ```

2. 编辑 `.env.local` 文件，填入您的 API 密钥

3. 安装依赖并启动：
   ```bash
   npm install
   npm run dev
   ```

4. 详细配置说明请查看 [ENV_SETUP.md](./ENV_SETUP.md)

### 部署到生产环境

请查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取详细的部署指南。

推荐使用 **Vercel** 进行部署（最简单）：
1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com/) 导入项目
3. 配置环境变量
4. 更新 Line Webhook URL

## 环境配置

### 必需的环境变量

```env
# Line Bot配置
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key
```

### 获取 Line Bot 凭证

1. 访问 [Line Developers Console](https://developers.line.biz/console/)
2. 创建新的 Provider 和 Channel
3. 选择 "Messaging API" 类型
4. 在 Channel Settings 中获取 `Channel Access Token` 和 `Channel Secret`

### 获取 OpenAI API Key

1. 访问 [OpenAI 平台](https://platform.openai.com/)
2. 注册或登录账号
3. 进入 API Keys 页面: https://platform.openai.com/api-keys
4. 创建新的 API Key

## 安装依赖

```bash
npm install
# 或
yarn install
```

## 运行开发服务器

```bash
npm run dev
# 或
yarn dev
```

服务器将在 [http://localhost:3000](http://localhost:3000) 启动。

## Webhook 配置

1. 部署应用到可公开访问的服务器（如 Vercel、Heroku 等）
2. 在 Line Developers Console 中配置 Webhook URL：
   - Webhook URL: `https://your-domain.com/api/line/webhook`
   - 启用 Webhook

## 使用方法

1. 用户添加机器人为好友后，会自动收到语言选择列表
2. 点击语言按钮选择要翻译到的语言（可多选）
3. 再次点击已选择的语言可取消选择
4. 点击"重置"按钮恢复默认语言设置
5. 发送消息后，机器人会自动检测源语言，然后将消息翻译到所有已选择的语言
6. 发送"选择语言"或"语言设置"可重新打开语言选择列表

## 调试

详细的调试指南请查看 [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)

### 快速测试

启动开发服务器后，访问测试端点：
```
http://localhost:3000/api/test?text=你好
```

这将测试语言检测和翻译功能。

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── line/
│   │       └── webhook/
│   │           └── route.ts      # Line webhook 处理
│   └── ...
└── lib/
    ├── languages.ts               # 语言配置
    ├── translator.ts              # OpenAI API 封装（语言检测和翻译）
    └── userPreferences.ts         # 用户偏好存储
```

## 技术栈

- **Next.js 16** - React 框架
- **@line/bot-sdk** - Line Messaging API SDK
- **OpenAI API** - 语言检测和翻译服务
- **TypeScript** - 类型安全

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 部署完成后，在 Line Developers Console 中配置 Webhook URL

## 注意事项

- 当前使用内存存储用户偏好，服务器重启后数据会丢失。生产环境建议使用数据库（如 MongoDB、PostgreSQL 等）
- OpenAI API 有使用配额限制，请查看 OpenAI 平台的定价和使用限制
- Line Webhook 需要在 30 秒内响应，确保翻译 API 调用不会超时
- 翻译功能会先自动检测源语言，然后翻译到用户选择的目标语言（不会翻译成源语言本身）
