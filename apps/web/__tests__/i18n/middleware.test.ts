/**
 * i18n Middleware Tests
 *
 * Tests for locale detection and routing middleware
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next/server for testing
const mockNextRequest = (url: string, headers: Record<string, string> = {}) => {
  return {
    url,
    nextUrl: new URL(url),
    headers: new Map(Object.entries(headers)),
    cookies: new Map(),
  } as unknown as NextRequest;
};

describe('i18n Middleware', () => {
  describe('Locale Detection', () => {
    it('should detect locale from Accept-Language header', async () => {
      const { detectLocale } = await import('../../lib/i18n/locale-detection');

      const request = mockNextRequest('http://localhost:3000', {
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      });

      const locale = detectLocale(request);
      expect(locale).toBe('es');
    });

    it('should fall back to default locale when no matching locale found', async () => {
      const { detectLocale } = await import('../../lib/i18n/locale-detection');

      const request = mockNextRequest('http://localhost:3000', {
        'Accept-Language': 'fr-FR,fr;q=0.9',
      });

      const locale = detectLocale(request);
      expect(locale).toBe('en'); // Default locale
    });

    it('should detect Chinese locale variants', async () => {
      const { detectLocale } = await import('../../lib/i18n/locale-detection');

      const simplifiedRequest = mockNextRequest('http://localhost:3000', {
        'Accept-Language': 'zh-CN,zh;q=0.9',
      });
      expect(detectLocale(simplifiedRequest)).toBe('zh');

      const traditionalRequest = mockNextRequest('http://localhost:3000', {
        'Accept-Language': 'zh-TW,zh;q=0.9',
      });
      expect(detectLocale(traditionalRequest)).toBe('zh');
    });

    it('should detect locale from URL path', async () => {
      const { getLocaleFromPath } = await import('../../lib/i18n/locale-detection');

      expect(getLocaleFromPath('/es/launch')).toBe('es');
      expect(getLocaleFromPath('/zh/staking')).toBe('zh');
      expect(getLocaleFromPath('/en/dashboard')).toBe('en');
      expect(getLocaleFromPath('/launch')).toBeNull();
    });

    it('should respect locale cookie if set', async () => {
      const { detectLocale } = await import('../../lib/i18n/locale-detection');

      const request = {
        url: 'http://localhost:3000',
        nextUrl: new URL('http://localhost:3000'),
        headers: new Map([['Accept-Language', 'en-US']]),
        cookies: new Map([['NEXT_LOCALE', 'es']]),
      } as unknown as NextRequest;

      const locale = detectLocale(request);
      expect(locale).toBe('es');
    });
  });

  describe('Routing', () => {
    it('should export supported locales', async () => {
      const { locales, defaultLocale } = await import('../../lib/i18n/config');

      expect(locales).toContain('en');
      expect(locales).toContain('es');
      expect(locales).toContain('zh');
      expect(defaultLocale).toBe('en');
    });

    it('should have locale prefix strategy configured', async () => {
      const { localePrefix } = await import('../../lib/i18n/config');

      // 'as-needed' means default locale has no prefix, others do
      expect(['as-needed', 'always', 'never']).toContain(localePrefix);
    });
  });
});

describe('RTL Support', () => {
  it('should identify RTL locales', async () => {
    const { isRTL } = await import('../../lib/i18n/config');

    // These locales are not RTL
    expect(isRTL('en')).toBe(false);
    expect(isRTL('es')).toBe(false);
    expect(isRTL('zh')).toBe(false);

    // Future RTL support
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he')).toBe(true);
  });

  it('should export RTL locale list for future expansion', async () => {
    const { rtlLocales } = await import('../../lib/i18n/config');

    expect(Array.isArray(rtlLocales)).toBe(true);
    expect(rtlLocales).toContain('ar');
    expect(rtlLocales).toContain('he');
  });
});
