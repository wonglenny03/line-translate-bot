#!/bin/bash

# 实时监控 webhook 日志

LOG_FILE="webhook.log"

echo "🔍 启动日志监控..."
echo "日志文件: $LOG_FILE"
echo ""
echo "等待日志输出..."
echo "（在 Line 中发送消息后，日志会实时显示）"
echo ""
echo "按 Ctrl+C 退出"
echo "=================================================="
echo ""

# 如果日志文件不存在，创建一个空文件
touch "$LOG_FILE"

# 实时显示日志
tail -f "$LOG_FILE"

