# ngrok 配置指南

ngrok 现在需要注册账号并配置 authtoken 才能使用。

## 方法 1: 配置 ngrok（推荐）

### 步骤 1: 注册 ngrok 账号

1. 访问 https://dashboard.ngrok.com/signup
2. 使用 GitHub、Google 账号或邮箱注册
3. 注册后会自动登录到 dashboard

### 步骤 2: 获取 authtoken

1. 登录后访问：https://dashboard.ngrok.com/get-started/your-authtoken
2. 复制显示的 authtoken（类似：`2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_5ABCD6EFGH7IJKL8MNOP9QRST`）

### 步骤 3: 配置 authtoken

在终端运行：

```bash
ngrok config add-authtoken 你的authtoken
```

例如：
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_5ABCD6EFGH7IJKL8MNOP9QRST
```

### 步骤 4: 验证配置

运行：
```bash
ngrok http 3000
```

如果配置成功，应该能看到 ngrok 启动并显示 forwarding URL。

## 方法 2: 使用替代工具（无需注册）

如果不想注册 ngrok，可以使用以下替代方案：

### 选项 A: localtunnel（无需注册）

```bash
# 安装
npm install -g localtunnel

# 启动
lt --port 3000
```

会显示类似：`https://xxxx.loca.lt`

### 选项 B: Cloudflare Tunnel（免费，功能强大）

```bash
# 安装
brew install cloudflared

# 启动
cloudflared tunnel --url http://localhost:3000
```

### 选项 C: serveo（SSH 隧道，无需安装）

```bash
ssh -R 80:localhost:3000 serveo.net
```

## 推荐方案

- **最快上手**: localtunnel（无需注册，直接使用）
- **最稳定**: ngrok（注册后功能最全）
- **最灵活**: Cloudflare Tunnel（免费且功能强大）

