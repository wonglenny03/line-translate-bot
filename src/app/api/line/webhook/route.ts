import { NextRequest, NextResponse } from "next/server"
import {
  Client,
  WebhookEvent,
  MessageEvent,
  FollowEvent,
  PostbackEvent,
  validateSignature,
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
  logger.info("🔄 处理语言选择", { userId, selectedLangCode })
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

  logger.info("📤 发送语言选择确认", { replyToken, selectedNames })
  try {
    const result = await lineClient.replyMessage(replyToken, [
      {
        type: "text",
        text: `已选择语言：${selectedNames}\n\n继续选择其他语言，或发送消息进行翻译。`,
        quickReply: createLanguageQuickReply().quickReply,
      },
    ])
    logger.info("✅ 语言选择确认发送成功", { result })
  } catch (error: any) {
    logger.error("❌ 发送语言选择确认失败!", {
      errorType: error.constructor.name,
      errorMessage: error.message,
      statusCode: error.statusCode || error.status,
      fullError: error,
    })
    throw error
  }
}

// 处理重置
async function handleReset(userId: string, replyToken: string) {
  logger.info("🔄 处理重置", { userId })
  resetUserLanguages(userId)
  logger.info("📤 发送重置确认", { replyToken })
  try {
    // 动态生成默认语言列表文本
    const defaultLangNames = DEFAULT_LANGUAGES.map(code => {
      const lang = LANGUAGES.find(l => l.code === code)
      return lang ? lang.displayName : code
    }).join('、')
    
    const result = await lineClient.replyMessage(replyToken, [
      {
        type: "text",
        text: `已重置为默认语言：${defaultLangNames}`,
        quickReply: createLanguageQuickReply().quickReply,
      },
    ])
    logger.info("✅ 重置确认发送成功", { result })
  } catch (error: any) {
    logger.error("❌ 发送重置确认失败!", {
      errorType: error.constructor.name,
      errorMessage: error.message,
      statusCode: error.statusCode || error.status,
      fullError: error,
    })
    throw error
  }
}

// 处理消息翻译
async function handleMessageTranslation(
  userId: string,
  text: string,
  replyToken: string,
  originalMessageId?: string,
  quoteToken?: string
) {
  logger.info("🔄 处理消息翻译", { userId, text })
  const targetLanguages = getUserLanguages(userId)
  logger.debug("目标语言", { targetLanguages })

  if (targetLanguages.length === 0) {
    logger.warn("⚠️  用户未选择语言，发送提示")
    try {
      const result = await lineClient.replyMessage(replyToken, [
        {
          type: "text",
          text: "请先选择要翻译到的语言。",
          quickReply: createLanguageQuickReply().quickReply,
        },
      ])
      logger.info("✅ 语言提示发送成功", { result })
    } catch (error: any) {
      logger.error("❌ 发送语言提示失败!", { error })
      throw error
    }
    return
  }

  try {
    logger.info("🌐 开始翻译...")
    const translations = await translateToLanguages(text, targetLanguages)
    logger.info("✅ 翻译完成", { languages: Object.keys(translations) })

    // 如果没有翻译结果（所有目标语言都是源语言）
    if (Object.keys(translations).length === 0) {
      logger.info("所有目标语言都是源语言，发送提示")
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

    logger.info("📤 发送翻译结果", {
      replyToken,
      textLength: translationText.length,
      hasOriginalMessageId: !!originalMessageId,
      originalText: text.substring(0, 50),
    })

    // 使用 replyMessage 和 replyToken 回复
    // Line 会自动将回复关联到原消息（使用 replyToken）
    // 注意：replyToken 有效期约 30 秒，需要在收到 webhook 后尽快使用
    // 如果提供了 quoteToken，可以使用它来引用原消息
    logger.info("📤 准备发送回复", {
      replyToken: replyToken.substring(0, 20) + "...",
      translationCount: Object.keys(translations).length,
      hasQuoteToken: !!quoteToken,
    })

    // 构建回复消息
    const replyMessage: any = {
      type: "text",
      text: translationText,
    }

    // 如果提供了 quoteToken，添加引用
    if (quoteToken) {
      replyMessage.quoteToken = quoteToken
      logger.debug("使用 quoteToken 引用原消息", {
        quoteToken: quoteToken.substring(0, 20) + "...",
      })
    }

    const result = await lineClient.replyMessage(replyToken, [replyMessage])

    logger.info("✅ 翻译结果发送成功", {
      result,
    })
  } catch (error: any) {
    logger.error("❌ 翻译错误", { error: error.message, fullError: error })
    try {
      logger.info("📤 发送错误提示消息")
      const result = await lineClient.replyMessage(replyToken, [
        {
          type: "text",
          text: "翻译服务暂时不可用，请稍后再试。",
        },
      ])
      logger.info("✅ 错误提示发送成功", { result })
    } catch (sendError: any) {
      logger.error("❌ 发送错误提示也失败了!", { error: sendError })
    }
  }
}

// POST处理函数
export async function POST(req: NextRequest) {
  // 立即写入日志，在任何操作之前 - 使用同步方式确保写入
  const fs = require("fs")
  const path = require("path")
  const logFile = path.join(process.cwd(), "webhook.log")
  const timestamp = new Date().toISOString()

  try {
    fs.appendFileSync(
      logFile,
      `[${timestamp}] [INFO] ==================================================\n`,
      "utf-8"
    )
    fs.appendFileSync(
      logFile,
      `[${timestamp}] [INFO] 🔔 POST 请求到达 /api/line/webhook\n`,
      "utf-8"
    )
    fs.appendFileSync(
      logFile,
      `[${timestamp}] [INFO] URL: ${req.url}\n`,
      "utf-8"
    )
    fs.appendFileSync(
      logFile,
      `[${timestamp}] [INFO] Method: ${req.method}\n`,
      "utf-8"
    )
  } catch (e) {
    // 如果文件写入失败，至少输出到 stderr
    process.stderr.write(`[${timestamp}] 日志写入失败: ${e}\n`)
  }

  try {
    // 立即输出日志，确保能看到
    logger.info("=".repeat(50))
    logger.info("🔔 WEBHOOK 请求到达")
    logger.info("=".repeat(50))

    // 获取签名和原始 body（用于验证）
    const signature = req.headers.get("x-line-signature") || ""
    const channelSecret = process.env.LINE_CHANNEL_SECRET || ""

    logger.info("🔐 签名验证信息", {
      hasSignature: !!signature,
      signatureLength: signature.length,
      hasChannelSecret: !!channelSecret,
      channelSecretLength: channelSecret.length,
      allHeaders: Object.fromEntries(req.headers.entries()),
    })

    if (!channelSecret) {
      logger.error("❌ LINE_CHANNEL_SECRET 未设置", {
        nodeEnv: process.env.NODE_ENV,
        allEnvKeys: Object.keys(process.env).filter(
          (k) => k.includes("LINE") || k.includes("OPENAI")
        ),
      })
      return NextResponse.json(
        { error: "Channel secret not configured" },
        { status: 500 }
      )
    }

    if (!signature) {
      logger.warn("⚠️  未收到签名头", {
        hasSignature: !!signature,
        allHeaders: Array.from(req.headers.entries()).map(([k, v]) => [
          k,
          k === "x-line-signature" ? v.substring(0, 20) + "..." : v,
        ]),
      })
      // 在生产环境中必须拒绝没有签名的请求
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    // 获取原始 body 文本（用于签名验证）
    const bodyText = await req.text()

    logger.debug("📝 Body 信息", {
      bodyLength: bodyText.length,
      bodyPreview: bodyText.substring(0, 200),
    })

    // 验证签名（如果有签名）
    if (signature) {
      try {
        const isValid = validateSignature(bodyText, channelSecret, signature)
        if (!isValid) {
          logger.error("❌ Webhook 签名验证失败", {
            hasSignature: !!signature,
            signatureLength: signature.length,
            bodyLength: bodyText.length,
            channelSecretLength: channelSecret.length,
          })
          return NextResponse.json(
            { error: "Invalid signature" },
            { status: 401 }
          )
        }
        logger.info("✅ Webhook 签名验证通过")
      } catch (error: any) {
        logger.error("❌ 签名验证过程出错", {
          error: error.message,
          stack: error.stack,
        })
        return NextResponse.json(
          { error: "Signature validation error" },
          { status: 401 }
        )
      }
    } else {
      logger.warn("⚠️  跳过签名验证（无签名头）")
    }

    // 解析 JSON body
    const body = JSON.parse(bodyText)
    const events: WebhookEvent[] = body.events || []

    // 调试日志 - 始终输出（便于排查问题）
    logger.info("📥 收到 Webhook 事件", {
      eventCount: events.length,
      events: events.map((e) => ({
        type: e.type,
        userId: (e as any).source?.userId,
        hasReplyToken: !!(e as any).replyToken,
      })),
    })

    logger.info("环境变量检查", {
      hasAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      hasSecret: !!process.env.LINE_CHANNEL_SECRET,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    })

    for (const event of events) {
      if (event.type === "follow") {
        // 用户加入时发送语言选择
        const followEvent = event as FollowEvent
        try {
          logger.info("📤 尝试发送语言选择列表", {
            replyToken: followEvent.replyToken,
          })
          const message = createLanguageQuickReply()
          logger.debug("消息内容", message)
          const result = await lineClient.replyMessage(followEvent.replyToken, [
            message,
          ])
          logger.info("✅ 成功发送语言选择列表", { result })
        } catch (error: any) {
          logger.error("❌ 发送消息失败!", {
            errorType: error.constructor.name,
            errorMessage: error.message,
            statusCode: error.statusCode || error.status,
            fullError: error,
            originalError: error.originalError,
            response: error.response
              ? {
                  data: error.response.data,
                  status: error.response.status,
                }
              : null,
          })
        }
      } else if (event.type === "message") {
        const messageEvent = event as MessageEvent
        const userId = messageEvent.source.userId || ""

        if (messageEvent.message.type === "text") {
          const text = messageEvent.message.text

          // 检查是否是语言选择命令
          if (text.startsWith("选择语言") || text.startsWith("语言设置")) {
            logger.info("📤 发送语言选择列表（命令触发）", {
              replyToken: messageEvent.replyToken,
            })
            try {
              const message = createLanguageQuickReply()
              const result = await lineClient.replyMessage(
                messageEvent.replyToken,
                [message]
              )
              logger.info("✅ 成功发送语言选择列表", { result })
            } catch (error: any) {
              logger.error("❌ 发送语言选择列表失败!", {
                errorType: error.constructor.name,
                errorMessage: error.message,
                statusCode: error.statusCode || error.status,
                fullError: error,
              })
            }
          } else {
            // 普通消息，进行翻译
            // 获取原始消息 ID 和 quoteToken 用于引用
            // Line Messaging API 中，消息 ID 在 message 对象的 id 字段中
            // quoteToken 在 message 对象的 quoteToken 字段中（如果可用）
            const messageData = messageEvent.message as any
            const originalMessageId = messageData.id
            const quoteToken = messageData.quoteToken // 如果用户引用了其他消息，会有这个字段
            // 立即保存 replyToken，确保在翻译完成后仍可使用
            const replyToken = messageEvent.replyToken
            logger.info("📝 处理翻译请求", {
              userId,
              text,
              originalMessageId,
              hasReplyToken: !!replyToken,
              hasQuoteToken: !!quoteToken,
              messageType: messageData.type,
              messageKeys: Object.keys(messageData),
            })
            try {
              await handleMessageTranslation(
                userId,
                text,
                replyToken,
                originalMessageId,
                quoteToken
              )
              logger.info("✅ 成功处理翻译请求")
            } catch (error: any) {
              logger.error("❌ 翻译处理失败", {
                error: error.message,
                fullError: error,
              })
            }
          }
        }
      } else if (event.type === "postback") {
        // 处理快速回复按钮点击
        const postbackEvent = event as PostbackEvent
        const userId = postbackEvent.source.userId || ""
        const data = postbackEvent.postback.data
        const replyToken = postbackEvent.replyToken

        logger.info("🔘 收到 Postback 事件", { userId, data })
        try {
          if (data.startsWith("lang_select:")) {
            const langCode = data.split(":")[1]
            await handleLanguageSelection(userId, langCode, replyToken)
          } else if (data === "lang_reset") {
            await handleReset(userId, replyToken)
          }
          logger.info("✅ 成功处理 Postback 事件")
        } catch (error: any) {
          logger.error("❌ 处理 Postback 失败", {
            error: error.message,
            fullError: error,
          })
        }
      } else {
        logger.warn("⚠️  未处理的事件类型", { eventType: event.type })
      }
    }

    logger.info("✅ Webhook 处理完成，返回成功")
    logger.info("=".repeat(50))
    return NextResponse.json({ status: "ok" })
  } catch (error) {
    logger.error("=".repeat(50))
    logger.error("❌ Webhook处理错误", { error })
    logger.error("=".repeat(50))
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// GET处理函数（用于webhook验证）
export async function GET(req: NextRequest) {
  logger.info("🔍 GET 请求到达（Webhook 验证）", {
    url: req.url,
    pathname: req.nextUrl.pathname,
    method: req.method,
  })
  return NextResponse.json(
    { message: "Line Translation Bot Webhook" },
    { status: 200 }
  )
}
