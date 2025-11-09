import { NextRequest, NextResponse } from "next/server"
import {
  initTranslator,
  detectLanguage,
  translateToLanguages,
} from "@/lib/translator"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const text = searchParams.get("text") || "Hello, world!"

  // 初始化翻译器
  if (process.env.OPENAI_API_KEY) {
    initTranslator(process.env.OPENAI_API_KEY)
  } else {
    return NextResponse.json(
      { error: "OPENAI_API_KEY 未设置" },
      { status: 500 }
    )
  }

  try {
    console.log("测试文本:", text)

    // 检测语言
    const startDetect = Date.now()
    const detectedLang = await detectLanguage(text)
    const detectDuration = Date.now() - startDetect
    console.log(`语言检测耗时: ${detectDuration}ms`)

    // 翻译到多个语言
    const startTranslate = Date.now()
    const translations = await translateToLanguages(text, [
      "zh-CN",
      "ja",
      "th",
      "en",
    ])
    const translateDuration = Date.now() - startTranslate
    console.log(`翻译耗时: ${translateDuration}ms`)

    return NextResponse.json({
      text,
      detectedLanguage: detectedLang,
      detectDuration: `${detectDuration}ms`,
      translations,
      translateDuration: `${translateDuration}ms`,
    })
  } catch (error: any) {
    console.error("测试错误:", error)
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}

