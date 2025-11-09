#!/bin/bash

# 查看 webhook 日志

LOG_FILE="webhook.log"

if [ ! -f "$LOG_FILE" ]; then
  echo "❌ 日志文件不存在: $LOG_FILE"
  echo ""
  echo "请先触发一次 webhook 请求（在 Line 中发送消息）"
  exit 1
fi

echo "📋 查看 Webhook 日志 (最后 50 行)"
echo "=================================================="
echo ""

tail -50 "$LOG_FILE"

echo ""
echo "=================================================="
echo "💡 提示:"
echo "  - 实时查看: tail -f $LOG_FILE"
echo "  - 查看全部: cat $LOG_FILE"
echo "  - 清空日志: > $LOG_FILE"

