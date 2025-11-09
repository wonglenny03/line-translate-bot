#!/bin/bash

# 启动 ngrok 并显示 webhook URL
echo "🚀 启动 ngrok..."
echo ""
echo "等待 ngrok 启动..."
sleep 2

ngrok http 3000 &
NGROK_PID=$!

sleep 3

# 获取 ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ -z "$NGROK_URL" ]; then
  echo "❌ 无法获取 ngrok URL，请手动检查"
  echo "访问 http://localhost:4040 查看 ngrok 状态"
else
  echo "✅ ngrok 已启动！"
  echo ""
  echo "📋 Webhook URL:"
  echo "   $NGROK_URL/api/line/webhook"
  echo ""
  echo "📊 ngrok 管理界面:"
  echo "   http://localhost:4040"
  echo ""
  echo "⚠️  请复制上面的 Webhook URL 到 Line Developers Console"
  echo ""
  echo "按 Ctrl+C 停止 ngrok"
fi

wait $NGROK_PID

