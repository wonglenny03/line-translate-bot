#!/usr/bin/env node

// 检查 webhook 配置的脚本

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Webhook 配置...\n');

// 检查环境变量文件
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local 文件存在');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const hasAccessToken = envContent.includes('LINE_CHANNEL_ACCESS_TOKEN=') && 
                         !envContent.includes('LINE_CHANNEL_ACCESS_TOKEN=your_');
  const hasSecret = envContent.includes('LINE_CHANNEL_SECRET=') && 
                   !envContent.includes('LINE_CHANNEL_SECRET=your_');
  const hasDeepSeek = envContent.includes('DEEPSEEK_API_KEY=') && 
                     !envContent.includes('DEEPSEEK_API_KEY=your_');
  
  console.log('  - LINE_CHANNEL_ACCESS_TOKEN:', hasAccessToken ? '✅ 已配置' : '❌ 未配置或使用默认值');
  console.log('  - LINE_CHANNEL_SECRET:', hasSecret ? '✅ 已配置' : '❌ 未配置或使用默认值');
  console.log('  - DEEPSEEK_API_KEY:', hasDeepSeek ? '✅ 已配置' : '❌ 未配置或使用默认值');
} else {
  console.log('❌ .env.local 文件不存在');
}

// 检查服务器是否运行
console.log('\n📡 检查服务器状态...');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/line/webhook',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ 服务器正在运行');
      console.log('   响应:', data);
    } else {
      console.log('⚠️  服务器响应异常，状态码:', res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ 服务器未运行或无法连接');
  console.log('   错误:', error.message);
  console.log('\n💡 请运行: npm run dev');
});

req.on('timeout', () => {
  req.destroy();
  console.log('❌ 连接超时');
});

req.end();

console.log('\n📋 检查清单:');
console.log('  [ ] Line Console 中 "Use webhook" 已启用');
console.log('  [ ] Line Console 中 "Auto-reply messages" 已关闭');
console.log('  [ ] Webhook URL 已配置并验证成功');
console.log('  [ ] ngrok/localtunnel 正在运行');
console.log('  [ ] 开发服务器正在运行');

