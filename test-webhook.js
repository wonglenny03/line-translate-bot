#!/usr/bin/env node

// 测试 webhook 并查看日志

const http = require('http');

const testData = {
  events: [
    {
      type: 'message',
      source: {
        userId: 'test-user-123',
        type: 'user'
      },
      replyToken: 'test-reply-token-123',
      message: {
        type: 'text',
        text: 'Hello, test message'
      },
      timestamp: Date.now()
    }
  ]
};

console.log('🧪 测试 Webhook...');
console.log('发送数据:', JSON.stringify(testData, null, 2));
console.log('\n请查看运行 npm run dev 的终端，应该能看到详细的日志输出\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/line/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': JSON.stringify(testData).length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('✅ 响应状态码:', res.statusCode);
    console.log('📄 响应内容:', data);
    console.log('\n如果状态码是 200，请检查运行 npm run dev 的终端日志');
    console.log('应该能看到类似这样的输出:');
    console.log('==================================================');
    console.log('🔔 WEBHOOK 请求到达');
    console.log('==================================================');
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  console.log('\n请确保开发服务器正在运行: npm run dev');
});

req.write(JSON.stringify(testData));
req.end();

