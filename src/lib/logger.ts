// 日志工具 - 同时输出到控制台和文件
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'webhook.log');

// 确保日志文件存在
try {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, '', 'utf-8');
  }
} catch (e) {
  // 忽略
}

function writeLog(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  
  // 输出到控制台（强制输出，不使用 Next.js 的日志系统）
  if (level === 'ERROR') {
    process.stderr.write(logMessage);
  } else {
    process.stdout.write(logMessage);
  }
  
  // 写入文件
  try {
    fs.appendFileSync(LOG_FILE, logMessage, 'utf-8');
  } catch (error) {
    // 如果文件写入失败，至少输出到控制台
    process.stderr.write(`写入日志文件失败: ${error}\n`);
  }
}

export const logger = {
  info: (message: string, data?: any) => writeLog('INFO', message, data),
  error: (message: string, data?: any) => writeLog('ERROR', message, data),
  warn: (message: string, data?: any) => writeLog('WARN', message, data),
  debug: (message: string, data?: any) => writeLog('DEBUG', message, data),
};

