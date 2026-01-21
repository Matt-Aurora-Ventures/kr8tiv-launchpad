/**
 * i18n Configuration
 *
 * Central configuration for internationalization settings
 */

export const locales = ['en', 'es', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale prefix strategy: 'as-needed' means default locale has no prefix
export const localePrefix = 'as-needed' as const;

// RTL locales for future expansion (Arabic, Hebrew)
export const rtlLocales = ['ar', 'he'] as const;
export type RTLLocale = (typeof rtlLocales)[number];

/**
 * Check if a locale uses RTL text direction
 */
export function isRTL(locale: string): boolean {
  return (rtlLocales as readonly string[]).includes(locale);
}

/**
 * Get the text direction for a locale
 */
export function getDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Locale display names for the language switcher
 */
export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  zh: '中文',
};

/**
 * Locale native names (in their own language)
 */
export const localeNativeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Espanol',
  zh: '中文',
};

/**
 * Locale flags (emoji)
 */
export const localeFlags: Record<Locale, string> = {
  en: 'US',
  es: 'ES',
  zh: 'CN',
};

/**
 * Check if a string is a valid locale
 */
export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}
