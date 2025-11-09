# 部署指南

本指南将帮助您将 Line 翻译机器人部署到生产环境。

## 推荐平台：Vercel

Vercel 是 Next.js 的官方推荐平台，部署简单且免费。

## 部署步骤

### 1. 准备代码仓库

#### 选项 A：使用 GitHub（推荐）

1. 在 GitHub 创建新仓库
2. 推送代码到仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/line-trans-bot.git
   git push -u origin main
   ```

#### 选项 B：直接部署

也可以直接从本地文件夹部署到 Vercel。

### 2. 部署到 Vercel

#### 方法一：通过 Vercel 网站

1. 访问 [Vercel](https://vercel.com/)
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 导入您的 GitHub 仓库（或选择 "Import Git Repository"）
5. 配置项目：
   - **Framework Preset**: Next.js（自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `.next`（默认）
6. 点击 "Deploy"

#### 方法二：使用 Vercel CLI

1. 安装 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 登录 Vercel：
   ```bash
   vercel login
   ```

3. 部署项目：
   ```bash
   vercel
   ```

4. 按照提示完成部署

### 3. 配置环境变量

部署完成后，需要配置环境变量：

1. 在 Vercel 项目页面，进入 **Settings** → **Environment Variables**
2. 添加以下环境变量：

   ```
   LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
   LINE_CHANNEL_SECRET=your_line_channel_secret
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-3.5-turbo  # 可选，默认值
   ```

3. 点击 **Save** 保存

4. **重要**：需要重新部署才能使环境变量生效
   - 进入 **Deployments** 标签
   - 点击最新部署右侧的 **...** 菜单
   - 选择 **Redeploy**

### 4. 获取部署 URL

部署完成后，Vercel 会提供一个 URL，例如：
```
https://your-project-name.vercel.app
```

您的 Webhook URL 将是：
```
https://your-project-name.vercel.app/api/line/webhook
```

### 5. 配置 Line Webhook

1. 访问 [Line Developers Console](https://developers.line.biz/console/)
2. 选择您的 Channel
3. 进入 **Messaging API** 标签
4. 找到 **Webhook URL** 设置
5. 输入您的 Webhook URL：
   ```
   https://your-project-name.vercel.app/api/line/webhook
   ```
6. 点击 **Update**
7. 启用 **Use webhook** 开关
8. 点击 **Verify** 验证 Webhook（应该显示 "Success"）

### 6. 测试部署

1. 在 Line 中搜索您的机器人并添加为好友
2. 发送一条消息测试翻译功能
3. 检查 Vercel 的 **Functions** 标签查看日志

## 其他部署平台

### Railway

1. 访问 [Railway](https://railway.app/)
2. 使用 GitHub 登录
3. 创建新项目，选择 "Deploy from GitHub repo"
4. 选择您的仓库
5. 在 **Variables** 标签添加环境变量
6. Railway 会自动部署并提供 URL

### Render

1. 访问 [Render](https://render.com/)
2. 创建新的 **Web Service**
3. 连接 GitHub 仓库
4. 配置：
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. 在 **Environment** 标签添加环境变量
6. 部署后获取 URL

### 自托管（VPS/服务器）

如果您有自己的服务器：

1. 安装 Node.js 18+ 和 npm
2. 克隆代码：
   ```bash
   git clone https://github.com/yourusername/line-trans-bot.git
   cd line-trans-bot
   ```
3. 安装依赖：
   ```bash
   npm install
   ```
4. 创建 `.env.local` 文件并配置环境变量
5. 构建项目：
   ```bash
   npm run build
   ```
6. 使用 PM2 运行（推荐）：
   ```bash
   npm install -g pm2
   pm2 start npm --name "line-trans-bot" -- start
   pm2 save
   pm2 startup
   ```
7. 配置反向代理（Nginx）：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 部署检查清单

- [ ] 代码已推送到 Git 仓库
- [ ] 已部署到云平台
- [ ] 已配置所有环境变量
- [ ] 已重新部署使环境变量生效
- [ ] 已更新 Line Webhook URL
- [ ] 已验证 Webhook 连接
- [ ] 已测试机器人功能

## 常见问题

### Q: 部署后 Webhook 验证失败？

A: 检查：
1. Webhook URL 是否正确
2. 环境变量是否已配置
3. 是否已重新部署
4. 查看 Vercel 的 Function Logs 检查错误

### Q: 如何查看生产环境日志？

A: 
- **Vercel**: 进入项目 → **Functions** → 点击函数查看日志
- **Railway**: 进入项目 → **Deployments** → 查看日志
- **Render**: 进入服务 → **Logs** 标签

### Q: 如何更新代码？

A: 
1. 修改代码并提交到 Git
2. Vercel/Railway/Render 会自动检测并重新部署
3. 或者手动触发重新部署

### Q: 如何回滚到之前的版本？

A: 
- **Vercel**: 进入 **Deployments** → 选择之前的版本 → **Promote to Production**
- **Railway**: 进入 **Deployments** → 选择之前的版本 → **Redeploy**

## 安全建议

1. **不要**将 `.env.local` 文件提交到 Git
2. 确保 `.gitignore` 包含 `.env*` 文件
3. 定期更新依赖包：`npm update`
4. 使用环境变量管理敏感信息
5. 定期检查 API 使用量和费用

## 需要帮助？

如果遇到问题，请检查：
1. [Vercel 文档](https://vercel.com/docs)
2. [Next.js 部署文档](https://nextjs.org/docs/deployment)
3. [Line Developers 文档](https://developers.line.biz/en/docs/)

