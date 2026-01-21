/**
 * Internationalization (i18n) Tests
 *
 * TDD tests for next-intl configuration and message handling
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(__dirname, '../../messages');
const SUPPORTED_LOCALES = ['en', 'es', 'zh'];
const DEFAULT_LOCALE = 'en';

describe('i18n Configuration', () => {
  describe('Message Files', () => {
    it('should have message files for all supported locales', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
        expect(fs.existsSync(filePath), `Missing ${locale}.json`).toBe(true);
      }
    });

    it('should have valid JSON in all message files', () => {
      for (const locale of SUPPORTED_LOCALES) {
        const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });

    it('should have all required top-level keys in each locale', () => {
      const requiredKeys = [
        'common',
        'navigation',
        'home',
        'launch',
        'staking',
        'dashboard',
        'footer',
        'wallet',
        'errors',
      ];

      for (const locale of SUPPORTED_LOCALES) {
        const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
        const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        for (const key of requiredKeys) {
          expect(messages[key], `Missing key "${key}" in ${locale}.json`).toBeDefined();
        }
      }
    });
  });

  describe('Message Completeness', () => {
    let englishMessages: Record<string, unknown>;

    beforeAll(() => {
      const filePath = path.join(MESSAGES_DIR, 'en.json');
      englishMessages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    });

    it('should have all English keys in Spanish translation', () => {
      const filePath = path.join(MESSAGES_DIR, 'es.json');
      const spanishMessages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const missingKeys = findMissingKeys(englishMessages, spanishMessages);
      expect(missingKeys, `Missing keys in es.json: ${missingKeys.join(', ')}`).toHaveLength(0);
    });

    it('should have all English keys in Chinese translation', () => {
      const filePath = path.join(MESSAGES_DIR, 'zh.json');
      const chineseMessages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const missingKeys = findMissingKeys(englishMessages, chineseMessages);
      expect(missingKeys, `Missing keys in zh.json: ${missingKeys.join(', ')}`).toHaveLength(0);
    });
  });

  describe('Plural Handling', () => {
    it('should have proper plural forms in English', () => {
      const filePath = path.join(MESSAGES_DIR, 'en.json');
      const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Check for ICU plural format in messages that need it
      const pluralKeys = [
        'dashboard.tokensLaunched',
        'dashboard.totalHolders',
        'staking.stakedTokens',
      ];

      for (const key of pluralKeys) {
        const value = getNestedValue(messages, key);
        if (value && typeof value === 'string') {
          // Plurals use ICU format: {count, plural, one {# item} other {# items}}
          // Or simple format with {count} placeholder
          expect(value.includes('{count}') || value.includes('{value}'),
            `Key "${key}" should have a count/value placeholder`).toBe(true);
        }
      }
    });
  });

  describe('RTL Support', () => {
    it('should have RTL-aware CSS configuration', () => {
      const globalsCssPath = path.join(__dirname, '../../app/globals.css');
      const content = fs.readFileSync(globalsCssPath, 'utf-8');

      // Check for RTL utility classes or dir attribute handling
      expect(
        content.includes('[dir="rtl"]') ||
        content.includes('dir: rtl') ||
        content.includes('rtl:')
      ).toBe(true);
    });
  });
});

describe('i18n Helper Functions', () => {
  describe('getRequestConfig', () => {
    it('should export a valid configuration function', async () => {
      const { default: getRequestConfig } = await import('../../i18n');
      expect(typeof getRequestConfig).toBe('function');
    });
  });
});

describe('LanguageSwitcher Component', () => {
  it('should export LanguageSwitcher component', async () => {
    const module = await import('../../components/i18n/LanguageSwitcher');
    expect(module.LanguageSwitcher).toBeDefined();
  });
});

// Helper functions
function findMissingKeys(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  prefix = ''
): string[] {
  const missing: string[] = [];

  for (const key of Object.keys(source)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (!(key in target)) {
      missing.push(fullKey);
    } else if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      missing.push(
        ...findMissingKeys(
          source[key] as Record<string, unknown>,
          target[key] as Record<string, unknown>,
          fullKey
        )
      );
    }
  }

  return missing;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}
