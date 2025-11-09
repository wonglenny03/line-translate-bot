// 用户语言偏好存储（使用内存存储，生产环境建议使用数据库）
interface UserPreferences {
  userId: string;
  languages: string[];
}

const userPreferencesMap = new Map<string, UserPreferences>();

// 获取用户语言偏好
export function getUserLanguages(userId: string): string[] {
  const preferences = userPreferencesMap.get(userId);
  if (preferences) {
    return preferences.languages;
  }
  // 返回默认语言
  return ['zh-CN', 'en', 'th'];
}

// 设置用户语言偏好
export function setUserLanguages(userId: string, languages: string[]): void {
  userPreferencesMap.set(userId, {
    userId,
    languages,
  });
}

// 重置用户语言偏好为默认值
export function resetUserLanguages(userId: string): void {
  userPreferencesMap.set(userId, {
    userId,
    languages: ['zh-CN', 'en', 'th'],
  });
}

// 检查用户是否已设置偏好
export function hasUserPreferences(userId: string): boolean {
  return userPreferencesMap.has(userId);
}

