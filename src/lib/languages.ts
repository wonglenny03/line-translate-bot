// 语言配置
export interface Language {
  code: string;
  name: string;
  displayName: string;
  nativeName: string; // 该语言的本地名称
}

export const LANGUAGES: Language[] = [
  { code: 'zh-CN', name: '中文简体', displayName: '中文简体', nativeName: '简体中文' },
  { code: 'en', name: '英语', displayName: '英语', nativeName: 'English' },
  { code: 'th', name: '泰语', displayName: '泰语', nativeName: 'ไทย' },
  { code: 'ja', name: '日语', displayName: '日语', nativeName: '日本語' },
  { code: 'zh-TW', name: '汉语', displayName: '汉语', nativeName: '繁體中文' },
  { code: 'fr', name: '法语', displayName: '法语', nativeName: 'Français' },
  { code: 'ar', name: '阿拉伯语', displayName: '阿拉伯语', nativeName: 'العربية' },
  { code: 'ko', name: '韩语', displayName: '韩语', nativeName: '한국어' },
  { code: 'ms', name: '马来文', displayName: '马来文', nativeName: 'Bahasa Melayu' },
];

// 默认语言：中文、英语、泰语
export const DEFAULT_LANGUAGES = ['zh-CN', 'en', 'th'];

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find(lang => lang.code === code);
}

