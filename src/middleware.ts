import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 中间件：记录所有请求
// 注意：Edge Runtime 不支持文件系统操作，所以只记录到控制台
export function middleware(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const pathname = request.nextUrl.pathname;
  
  // 只记录到控制台（Edge Runtime 不支持文件系统）
  console.log(`[${timestamp}] [MIDDLEWARE] ${request.method} ${pathname}`);
  
  // 如果是 webhook 请求，记录详细信息
  if (pathname === '/api/line/webhook') {
    console.log(`[${timestamp}] [MIDDLEWARE] Webhook 请求到达: ${request.method}`);
  }
  
  return NextResponse.next()
}

// 匹配所有路由
export const config = {
  matcher: '/:path*',
}

