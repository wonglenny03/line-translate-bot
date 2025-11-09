import { LANGUAGES, getLanguageByCode } from './languages';
import { logger } from './logger';

// OpenAI API密钥
let apiKey: string | null = null;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

// 语言代码映射（OpenAI识别的语言名称）
const LANGUAGE_NAMES: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  'en': '英语',
  'th': '泰语',
  'ja': '日语',
  'fr': '法语',
  'ar': '阿拉伯语',
  'ko': '韩语',
  'ms': '马来语',
};

// 初始化翻译客户端
export function initTranslator(key?: string): void {
  apiKey = key || process.env.OPENAI_API_KEY || null;
  if (!apiKey) {
    console.warn('警告: OPENAI_API_KEY 未设置');
  }
}

// 调用OpenAI API
async function callOpenAIAPI(prompt: string): Promise<string> {
  if (!apiKey) {
    throw new Error('翻译API密钥未设置，请设置OPENAI_API_KEY环境变量');
  }

  logger.debug('调用 OpenAI API', { 
    model: OPENAI_MODEL,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 100)
  });

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('OpenAI API 请求失败', { 
      status: response.status,
      statusText: response.statusText,
      error: error.substring(0, 500)
    });
    throw new Error(`OpenAI API错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || '';
  
  logger.debug('OpenAI API 响应', { 
    model: OPENAI_MODEL,
    hasContent: !!content,
    contentLength: content.length,
    contentPreview: content.substring(0, 100),
    fullResponse: JSON.stringify(data).substring(0, 500)
  });
  
  // 调试日志
  if (!content) {
    logger.warn('OpenAI API 返回空内容', { 
      model: OPENAI_MODEL,
      responseData: JSON.stringify(data).substring(0, 500)
    });
  }
  
  return content;
}

// 检测文本语言
export async function detectLanguage(text: string): Promise<string> {
  if (!apiKey) {
    throw new Error('翻译客户端未初始化');
  }

  try {
    const prompt = `请检测以下文本的语言，只返回ISO 639-1语言代码（如：zh-CN, en, ja, th, fr, ar, ko, ms, zh-TW）。如果无法确定，返回"unknown"。

文本：${text}

只返回语言代码，不要返回其他内容：`;

    const result = await callOpenAIAPI(prompt);
    let detectedLang = result.trim().toLowerCase();
    
    // 清理可能的标点符号和多余字符
    detectedLang = detectedLang.replace(/[.,;:!?。，；：！？]/g, '').trim();

    // 验证返回的语言代码是否有效
    const validCodes = Object.keys(LANGUAGE_NAMES);
    if (validCodes.includes(detectedLang)) {
      return detectedLang;
    }

    // 尝试匹配部分代码（如 zh 匹配 zh-CN）
    const matchedCode = validCodes.find(code => 
      code.toLowerCase().startsWith(detectedLang) || 
      detectedLang.startsWith(code.toLowerCase())
    );
    
    if (matchedCode) {
      return matchedCode;
    }
    
    // 如果还是无法匹配，尝试更宽松的匹配
    // 例如：如果返回 "english" 匹配 "en"
    const langMap: Record<string, string> = {
      'english': 'en',
      'chinese': 'zh-CN',
      'simplified chinese': 'zh-CN',
      'traditional chinese': 'zh-TW',
      'japanese': 'ja',
      'thai': 'th',
      'french': 'fr',
      'arabic': 'ar',
      'korean': 'ko',
      'malay': 'ms',
    };
    
    const lowerDetected = detectedLang.toLowerCase();
    for (const [key, code] of Object.entries(langMap)) {
      if (lowerDetected.includes(key) || key.includes(lowerDetected)) {
        return code;
      }
    }
    
    logger.warn('无法识别语言', { text: text.substring(0, 50), detectedLang });
    return 'unknown';
  } catch (error) {
    console.error('语言检测失败:', error);
    return 'unknown';
  }
}

// 使用OpenAI API翻译文本
async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('翻译API密钥未设置，请设置OPENAI_API_KEY环境变量');
  }

  // 如果源语言是 unknown，尝试自动检测或使用通用提示
  let sourceLangName = LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang;
  
  if (sourceLang === 'unknown') {
    // 对于未知语言，使用更通用的提示，强制要求翻译
    // 明确要求即使原文已经是目标语言，也要进行翻译（或者至少确认）
    const prompt = `请将以下文本翻译成${targetLangName}。只返回翻译结果，不要添加任何解释或其他内容。

原文：${text}

${targetLangName}翻译：`;
    
    logger.debug('翻译请求（unknown源语言）', { targetLang, targetLangName, text: text.substring(0, 50) });
    const result = await callOpenAIAPI(prompt);
    let translated = result.trim();
    
    // 清理可能的额外内容（如 "翻译：" 等前缀）
    const prefixPattern = new RegExp(`^(翻译|Translation|${targetLangName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}翻译)[：:]\s*`, 'i');
    translated = translated.replace(prefixPattern, '').trim();
    
    logger.debug('翻译结果（unknown源语言）', { 
      targetLang, 
      targetLangName,
      original: text.substring(0, 50),
      rawResult: result.substring(0, 100),
      translated: translated.substring(0, 50)
    });
    
    // 如果翻译结果和原文相同，可能是翻译失败，记录警告
    if (translated === text && text.length > 0) {
      logger.warn('翻译结果与原文相同（unknown源语言）', { 
        targetLang, 
        targetLangName,
        text: text.substring(0, 50),
        translated: translated.substring(0, 50),
        rawResult: result.substring(0, 100)
      });
    }
    
    return translated;
  }

  const prompt = `请将以下${sourceLangName}文本翻译成${targetLangName}。只返回翻译结果，不要添加任何解释或其他内容。

原文：${text}

${targetLangName}翻译：`;

  logger.debug('翻译请求', { sourceLang, targetLang, sourceLangName, targetLangName, text: text.substring(0, 50) });
  const result = await callOpenAIAPI(prompt);
  const translated = result.trim();
  
  logger.debug('翻译结果', { sourceLang, targetLang, original: text.substring(0, 50), translated: translated.substring(0, 50) });
  
  // 如果翻译结果和原文相同，可能是翻译失败，记录警告
  if (translated === text && text.length > 0 && sourceLang !== targetLang) {
    logger.warn('翻译结果与原文相同', { 
      sourceLang, 
      targetLang, 
      sourceLangName,
      targetLangName,
      text: text.substring(0, 50),
      translated: translated.substring(0, 50)
    });
  }
  
  return translated;
}

// 翻译文本到多个目标语言（先检测源语言）
export async function translateToLanguages(
  text: string,
  targetLanguages: string[]
): Promise<Record<string, string>> {
  if (!apiKey) {
    throw new Error('翻译客户端未初始化，请设置OPENAI_API_KEY环境变量');
  }

  // 先检测源语言
  const sourceLang = await detectLanguage(text);
  // 日志已在 webhook 中记录

  // 如果源语言在目标语言列表中，从目标语言中移除（不需要翻译成自己）
  const filteredTargetLanguages = targetLanguages.filter(
    (lang) => lang !== sourceLang
  );

  // 如果过滤后没有目标语言（所有目标语言都是源语言），返回空结果
  if (filteredTargetLanguages.length === 0) {
    logger.info('所有目标语言都是源语言，不返回翻译');
    return {};
  }

  const results: Record<string, string> = {};

  // 并发翻译到所有目标语言
  const translationPromises = filteredTargetLanguages.map(async (langCode) => {
    try {
      const translation = await translateText(text, sourceLang, langCode);
      return { langCode, translation, success: true };
    } catch (error: any) {
      logger.error(`翻译到 ${langCode} 失败`, { 
        langCode, 
        error: error.message,
        errorType: error.constructor.name
      });
      
      // 如果是配额错误，返回错误提示而不是原文
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        const language = getLanguageByCode(langCode);
        return { 
          langCode, 
          translation: `[翻译服务暂时不可用：API配额已用完]`, 
          success: false 
        };
      }
      
      return { langCode, translation: `[翻译失败: ${error.message.substring(0, 50)}]`, success: false };
    }
  });

  const translations = await Promise.all(translationPromises);

  translations.forEach(({ langCode, translation }) => {
    const language = getLanguageByCode(langCode);
    if (language) {
      // 格式：[本地名称]，例如：[English]
      results[`[${language.nativeName}]`] = translation;
    }
  });

  return results;
}

