#!/bin/bash

# 启动本地隧道（localtunnel 或 ngrok）

echo "🚀 启动本地隧道..."
echo ""
echo "选择隧道工具:"
echo "1) localtunnel (推荐，无需注册)"
echo "2) ngrok (需要注册)"
read -p "请选择 (1/2): " choice

case $choice in
  1)
    echo ""
    echo "启动 localtunnel..."
    echo "等待连接..."
    lt --port 3000
    ;;
  2)
    echo ""
    echo "启动 ngrok..."
    echo "等待连接..."
    ngrok http 3000
    ;;
  *)
    echo "无效选择，使用 localtunnel..."
    lt --port 3000
    ;;
esac

