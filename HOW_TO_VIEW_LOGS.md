# 如何查看日志

由于 Next.js 的默认日志输出可能被覆盖，我们添加了文件日志系统。

## 查看日志的方法

### 方法 1: 查看日志文件（推荐）

日志文件保存在项目根目录：`webhook.log`

```bash
# 查看最后 50 行日志
./view-logs.sh

# 或者直接使用 tail
tail -50 webhook.log

# 实时查看日志（推荐）
tail -f webhook.log
```

### 方法 2: 在 Line 中发送消息后立即查看

1. 在 Line 中发送一条消息给机器人
2. 立即运行：
   ```bash
   tail -20 webhook.log
   ```

### 方法 3: 查看完整日志

```bash
cat webhook.log
```

## 日志格式

日志格式如下：
```
[2025-11-09T14:46:18.123Z] [INFO] 🔔 WEBHOOK 请求到达
[2025-11-09T14:46:18.124Z] [INFO] 📥 收到 Webhook 事件
{
  "eventCount": 1,
  "events": [...]
}
```

## 日志包含的信息

- ✅ Webhook 请求到达
- ✅ 收到的事件类型和数量
- ✅ 用户 ID 和 ReplyToken
- ✅ 环境变量检查结果
- ✅ 发送消息的尝试和结果
- ✅ 错误信息（如果有）

## 排查问题

### 如果日志文件不存在

说明还没有收到任何 webhook 请求。请检查：
1. ngrok/localtunnel 是否正在运行
2. Line Console 中 webhook 是否已配置并验证成功
3. 是否在 Line 中发送了消息

### 如果看到错误日志

查看日志中的 `[ERROR]` 标记，会显示详细的错误信息，包括：
- 错误类型
- 错误消息
- HTTP 状态码
- 完整的错误对象

## 快速测试

发送消息后，立即运行：

```bash
tail -30 webhook.log | grep -E "(INFO|ERROR|WARN)"
```

这会显示所有重要日志。

