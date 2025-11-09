import { NextRequest, NextResponse } from "next/server"
import {
  Client,
  WebhookEvent,
  MessageEvent,
  FollowEvent,
  PostbackEvent,
} from "@line/bot-sdk"
import { translateToLanguages, initTranslator } from "@/lib/translator"
import {
  getUserLanguages,
  setUserLanguages,
  resetUserLanguages,
  hasUserPreferences,
} from "@/lib/userPreferences"
import { LANGUAGES, DEFAULT_LANGUAGES } from "@/lib/languages"
import { logger } from "@/lib/logger"

// 初始化Line客户端
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
  channelSecret: process.env.LINE_CHANNEL_SECRET || "",
})

// 初始化翻译客户端
if (process.env.OPENAI_API_KEY) {
  initTranslator(process.env.OPENAI_API_KEY)
}

// 创建语言选择快速回复
function createLanguageQuickReply() {
  const actions = LANGUAGES.map((lang) => ({
    type: "action" as const,
    action: {
      type: "postback" as const,
      label: lang.displayName,
      data: `lang_select:${lang.code}`,
    },
  }))

  // 添加重置按钮
  actions.push({
    type: "action" as const,
    action: {
      type: "postback" as const,
      label: "重置",
      data: "lang_reset",
    },
  })

  return {
    type: "text" as const,
    text: "请选择您想要翻译到的语言（可多选，再次点击可取消选择）：",
    quickReply: {
      items: actions,
    },
  }
}

// 处理语言选择
async function handleLanguageSelection(
  userId: string,
  selectedLangCode: string,
  replyToken: string
) {
  logger.info('🔄 处理语言选择', { userId, selectedLangCode })
  const currentLanguages = getUserLanguages(userId)

  // 切换语言选择（如果已选择则移除，未选择则添加）
  if (currentLanguages.includes(selectedLangCode)) {
    const newLanguages = currentLanguages.filter(
      (lang) => lang !== selectedLangCode
    )
    setUserLanguages(
      userId,
      newLanguages.length > 0 ? newLanguages : DEFAULT_LANGUAGES
    )
  } else {
    setUserLanguages(userId, [...currentLanguages, selectedLangCode])
  }

  const updatedLanguages = getUserLanguages(userId)
  const selectedNames = updatedLanguages
    .map((code) => LANGUAGES.find((l) => l.code === code)?.displayName)
    .filter(Boolean)
    .join("、")

  logger.info('📤 发送语言选择确认', { replyToken, selectedNames })
  try {
    const result = await lineClient.replyMessage(replyToken, [
      {
        type: "text",
        text: `已选择语言：${selectedNames}\n\n继续选择其他语言，或发送消息进行翻译。`,
        quickReply: createLanguageQuickReply().quickReply,
      },
    ])
    logger.info('✅ 语言选择确认发送成功', { result })
  } catch (error: any) {
    logger.error('❌ 发送语言选择确认失败!', {
      errorType: error.constructor.name,
      errorMessage: error.message,
      statusCode: error.statusCode || error.status,
      fullError: error
    })
    throw error
  }
}

// 处理重置
async function handleReset(userId: string, replyToken: string) {
  logger.info('🔄 处理重置', { userId })
  resetUserLanguages(userId)
  logger.info('📤 发送重置确认', { replyToken })
  try {
    const result = await lineClient.replyMessage(replyToken, [
      {
        type: "text",
        text: "已重置为默认语言：中文简体、英语、泰语",
        quickReply: createLanguageQuickReply().quickReply,
      },
    ])
    logger.info('✅ 重置确认发送成功', { result })
  } catch (error: any) {
    logger.error('❌ 发送重置确认失败!', {
      errorType: error.constructor.name,
      errorMessage: error.message,
      statusCode: error.statusCode || error.status,
      fullError: error
    })
    throw error
  }
}

// 处理消息翻译
async function handleMessageTranslation(
  userId: string,
  text: string,
  replyToken: string
) {
  logger.info('🔄 处理消息翻译', { userId, text })
  const targetLanguages = getUserLanguages(userId)
  logger.debug('目标语言', { targetLanguages })

  if (targetLanguages.length === 0) {
    logger.warn('⚠️  用户未选择语言，发送提示')
    try {
      const result = await lineClient.replyMessage(replyToken, [
        {
          type: "text",
          text: "请先选择要翻译到的语言。",
          quickReply: createLanguageQuickReply().quickReply,
        },
      ])
      logger.info('✅ 语言提示发送成功', { result })
    } catch (error: any) {
      logger.error('❌ 发送语言提示失败!', { error })
      throw error
    }
    return
  }

  try {
    logger.info('🌐 开始翻译...')
    const translations = await translateToLanguages(text, targetLanguages)
    logger.info('✅ 翻译完成', { languages: Object.keys(translations) })

    // 如果没有翻译结果（所有目标语言都是源语言）
    if (Object.keys(translations).length === 0) {
      logger.info('所有目标语言都是源语言，发送提示')
      await lineClient.replyMessage(replyToken, [
        {
          type: "text",
          text: "您选择的所有语言都是源语言，无需翻译。\n\n请选择其他语言进行翻译。",
          quickReply: createLanguageQuickReply().quickReply,
        },
      ])
      return
    }

    // 格式化翻译结果：语言标题 [本地名称]: 翻译内容
    const translationText = Object.entries(translations)
      .map(([lang, translation]) => `${lang}:\n${translation}`)
      .join("\n\n")

    logger.info('📤 发送翻译结果', { replyToken, textLength: translationText.length })
    const result = await lineClient.replyMessage(replyToken, [
      {
        type: "text",
        text: translationText,
      },
    ])
    logger.info('✅ 翻译结果发送成功', { result })
  } catch (error: any) {
    logger.error("❌ 翻译错误", { error: error.message, fullError: error })
    try {
      logger.info('📤 发送错误提示消息')
      const result = await lineClient.replyMessage(replyToken, [
        {
          type: "text",
          text: "翻译服务暂时不可用，请稍后再试。",
        },
      ])
      logger.info('✅ 错误提示发送成功', { result })
    } catch (sendError: any) {
      logger.error('❌ 发送错误提示也失败了!', { error: sendError })
    }
  }
}

// POST处理函数
export async function POST(req: NextRequest) {
  // 立即写入日志，在任何操作之前 - 使用同步方式确保写入
  const fs = require('fs');
  const path = require('path');
  const logFile = path.join(process.cwd(), 'webhook.log');
  const timestamp = new Date().toISOString();
  
  try {
    fs.appendFileSync(logFile, `[${timestamp}] [INFO] ==================================================\n`, 'utf-8');
    fs.appendFileSync(logFile, `[${timestamp}] [INFO] 🔔 POST 请求到达 /api/line/webhook\n`, 'utf-8');
    fs.appendFileSync(logFile, `[${timestamp}] [INFO] URL: ${req.url}\n`, 'utf-8');
    fs.appendFileSync(logFile, `[${timestamp}] [INFO] Method: ${req.method}\n`, 'utf-8');
  } catch (e) {
    // 如果文件写入失败，至少输出到 stderr
    process.stderr.write(`[${timestamp}] 日志写入失败: ${e}\n`);
  }
  
  try {
    // 立即输出日志，确保能看到
    logger.info('='.repeat(50))
    logger.info('🔔 WEBHOOK 请求到达')
    logger.info('='.repeat(50))
    
    const body = await req.json()
    const events: WebhookEvent[] = body.events || []

    // 调试日志 - 始终输出（便于排查问题）
    logger.info('📥 收到 Webhook 事件', { 
      eventCount: events.length,
      events: events.map(e => ({
        type: e.type,
        userId: (e as any).source?.userId,
        hasReplyToken: !!(e as any).replyToken
      }))
    })
    
    logger.info('环境变量检查', {
      hasAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      hasSecret: !!process.env.LINE_CHANNEL_SECRET,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    })

    for (const event of events) {
      if (event.type === "follow") {
        // 用户加入时发送语言选择
        const followEvent = event as FollowEvent
        try {
          logger.info('📤 尝试发送语言选择列表', { replyToken: followEvent.replyToken })
          const message = createLanguageQuickReply()
          logger.debug('消息内容', message)
          const result = await lineClient.replyMessage(followEvent.replyToken, [
            message,
          ])
          logger.info('✅ 成功发送语言选择列表', { result })
        } catch (error: any) {
          logger.error('❌ 发送消息失败!', {
            errorType: error.constructor.name,
            errorMessage: error.message,
            statusCode: error.statusCode || error.status,
            fullError: error,
            originalError: error.originalError,
            response: error.response ? {
              data: error.response.data,
              status: error.response.status
            } : null
          })
        }
      } else if (event.type === "message") {
        const messageEvent = event as MessageEvent
        const userId = messageEvent.source.userId || ""

        if (messageEvent.message.type === "text") {
          const text = messageEvent.message.text

          // 检查是否是语言选择命令
          if (text.startsWith("选择语言") || text.startsWith("语言设置")) {
            logger.info('📤 发送语言选择列表（命令触发）', { replyToken: messageEvent.replyToken })
            try {
              const message = createLanguageQuickReply()
              const result = await lineClient.replyMessage(messageEvent.replyToken, [
                message,
              ])
              logger.info('✅ 成功发送语言选择列表', { result })
            } catch (error: any) {
              logger.error('❌ 发送语言选择列表失败!', {
                errorType: error.constructor.name,
                errorMessage: error.message,
                statusCode: error.statusCode || error.status,
                fullError: error
              })
            }
          } else {
            // 普通消息，进行翻译
            logger.info('📝 处理翻译请求', { userId, text })
            try {
              await handleMessageTranslation(
                userId,
                text,
                messageEvent.replyToken
              )
              logger.info('✅ 成功处理翻译请求')
            } catch (error: any) {
              logger.error('❌ 翻译处理失败', { error: error.message, fullError: error })
            }
          }
        }
      } else if (event.type === "postback") {
        // 处理快速回复按钮点击
        const postbackEvent = event as PostbackEvent
        const userId = postbackEvent.source.userId || ""
        const data = postbackEvent.postback.data
        const replyToken = postbackEvent.replyToken

        logger.info('🔘 收到 Postback 事件', { userId, data })
        try {
          if (data.startsWith("lang_select:")) {
            const langCode = data.split(":")[1]
            await handleLanguageSelection(userId, langCode, replyToken)
          } else if (data === "lang_reset") {
            await handleReset(userId, replyToken)
          }
          logger.info('✅ 成功处理 Postback 事件')
        } catch (error: any) {
          logger.error('❌ 处理 Postback 失败', { error: error.message, fullError: error })
        }
      } else {
        logger.warn('⚠️  未处理的事件类型', { eventType: event.type })
      }
    }

    logger.info('✅ Webhook 处理完成，返回成功')
    logger.info('='.repeat(50))
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    logger.error('='.repeat(50))
    logger.error("❌ Webhook处理错误", { error })
    logger.error('='.repeat(50))
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// GET处理函数（用于webhook验证）
export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Line Translation Bot Webhook" })
}
