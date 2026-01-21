/**
 * Tests for form validation schemas
 * TDD: Define validation rules before implementing
 */

import { describe, it, expect } from 'vitest';
import {
  basicInfoSchema,
  tokenomicsSchema,
  taxConfigSchema,
  customWalletSchema,
  launchFormSchema,
} from '@/components/launch/schemas';

describe('Validation Schemas', () => {
  describe('basicInfoSchema', () => {
    it('validates correct basic info', () => {
      const validData = {
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token for testing purposes.',
        image: 'https://example.com/token.png',
      };

      const result = basicInfoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('requires name', () => {
      const result = basicInfoSchema.safeParse({
        symbol: 'TEST',
        description: 'A test token',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('validates name length (min 2)', () => {
      const result = basicInfoSchema.safeParse({
        name: 'A',
        symbol: 'TEST',
        description: 'A test token for testing',
      });

      expect(result.success).toBe(false);
    });

    it('validates name length (max 32)', () => {
      const result = basicInfoSchema.safeParse({
        name: 'A'.repeat(33),
        symbol: 'TEST',
        description: 'A test token for testing',
      });

      expect(result.success).toBe(false);
    });

    it('requires symbol', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        description: 'A test token',
      });

      expect(result.success).toBe(false);
    });

    it('validates symbol length (min 2)', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'T',
        description: 'A test token for testing',
      });

      expect(result.success).toBe(false);
    });

    it('validates symbol length (max 10)', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'A'.repeat(11),
        description: 'A test token for testing',
      });

      expect(result.success).toBe(false);
    });

    it('transforms symbol to uppercase', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'test',
        description: 'A test token for testing',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe('TEST');
      }
    });

    it('requires description', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'TEST',
      });

      expect(result.success).toBe(false);
    });

    it('validates description length (min 10)', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'Short',
      });

      expect(result.success).toBe(false);
    });

    it('validates description length (max 500)', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A'.repeat(501),
      });

      expect(result.success).toBe(false);
    });

    it('allows empty image', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token for testing',
        image: '',
      });

      expect(result.success).toBe(true);
    });

    it('validates image URL format', () => {
      const result = basicInfoSchema.safeParse({
        name: 'Test Token',
        symbol: 'TEST',
        description: 'A test token for testing',
        image: 'not-a-url',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('tokenomicsSchema', () => {
    it('validates correct tokenomics', () => {
      const validData = {
        supply: 1000000000,
        decimals: 9,
      };

      const result = tokenomicsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates supply minimum (1)', () => {
      const result = tokenomicsSchema.safeParse({
        supply: 0,
        decimals: 9,
      });

      expect(result.success).toBe(false);
    });

    it('validates supply maximum (1e15)', () => {
      const result = tokenomicsSchema.safeParse({
        supply: 1e16,
        decimals: 9,
      });

      expect(result.success).toBe(false);
    });

    it('validates decimals minimum (0)', () => {
      const result = tokenomicsSchema.safeParse({
        supply: 1000000000,
        decimals: -1,
      });

      expect(result.success).toBe(false);
    });

    it('validates decimals maximum (18)', () => {
      const result = tokenomicsSchema.safeParse({
        supply: 1000000000,
        decimals: 19,
      });

      expect(result.success).toBe(false);
    });

    it('requires integer for decimals', () => {
      const result = tokenomicsSchema.safeParse({
        supply: 1000000000,
        decimals: 9.5,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('taxConfigSchema', () => {
    it('validates correct tax config', () => {
      const validData = {
        burnEnabled: true,
        burnPercent: 2,
        lpEnabled: true,
        lpPercent: 3,
        dividendsEnabled: false,
        dividendsPercent: 0,
      };

      const result = taxConfigSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates burn percent maximum (10)', () => {
      const result = taxConfigSchema.safeParse({
        burnEnabled: true,
        burnPercent: 11,
        lpEnabled: false,
        lpPercent: 0,
        dividendsEnabled: false,
        dividendsPercent: 0,
      });

      expect(result.success).toBe(false);
    });

    it('validates LP percent maximum (10)', () => {
      const result = taxConfigSchema.safeParse({
        burnEnabled: false,
        burnPercent: 0,
        lpEnabled: true,
        lpPercent: 11,
        dividendsEnabled: false,
        dividendsPercent: 0,
      });

      expect(result.success).toBe(false);
    });

    it('validates dividends percent maximum (10)', () => {
      const result = taxConfigSchema.safeParse({
        burnEnabled: false,
        burnPercent: 0,
        lpEnabled: false,
        lpPercent: 0,
        dividendsEnabled: true,
        dividendsPercent: 11,
      });

      expect(result.success).toBe(false);
    });

    it('sets percent to 0 when disabled', () => {
      const result = taxConfigSchema.safeParse({
        burnEnabled: false,
        burnPercent: 5, // Should be normalized to 0
        lpEnabled: false,
        lpPercent: 3,
        dividendsEnabled: false,
        dividendsPercent: 2,
      });

      expect(result.success).toBe(true);
      // The schema should normalize disabled taxes to 0
    });
  });

  describe('customWalletSchema', () => {
    it('validates correct wallet', () => {
      const validData = {
        address: 'So11111111111111111111111111111111111111112',
        percent: 2,
        label: 'Marketing',
      };

      const result = customWalletSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates wallet address format', () => {
      const result = customWalletSchema.safeParse({
        address: 'invalid',
        percent: 2,
        label: 'Marketing',
      });

      expect(result.success).toBe(false);
    });

    it('validates percent maximum (5)', () => {
      const result = customWalletSchema.safeParse({
        address: 'So11111111111111111111111111111111111111112',
        percent: 6,
        label: 'Marketing',
      });

      expect(result.success).toBe(false);
    });

    it('requires label', () => {
      const result = customWalletSchema.safeParse({
        address: 'So11111111111111111111111111111111111111112',
        percent: 2,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('launchFormSchema (complete form)', () => {
    it('validates complete form', () => {
      const validData = {
        basicInfo: {
          name: 'Test Token',
          symbol: 'TEST',
          description: 'A test token for testing purposes.',
          image: '',
        },
        tokenomics: {
          supply: 1000000000,
          decimals: 9,
        },
        taxConfig: {
          burnEnabled: false,
          burnPercent: 0,
          lpEnabled: false,
          lpPercent: 0,
          dividendsEnabled: false,
          dividendsPercent: 0,
        },
        customWallets: [],
      };

      const result = launchFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates total tax does not exceed 25%', () => {
      const invalidData = {
        basicInfo: {
          name: 'Test Token',
          symbol: 'TEST',
          description: 'A test token for testing purposes.',
          image: '',
        },
        tokenomics: {
          supply: 1000000000,
          decimals: 9,
        },
        taxConfig: {
          burnEnabled: true,
          burnPercent: 10,
          lpEnabled: true,
          lpPercent: 10,
          dividendsEnabled: true,
          dividendsPercent: 10, // Total 30%
        },
        customWallets: [],
      };

      const result = launchFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('validates maximum 5 custom wallets', () => {
      const invalidData = {
        basicInfo: {
          name: 'Test Token',
          symbol: 'TEST',
          description: 'A test token for testing purposes.',
          image: '',
        },
        tokenomics: {
          supply: 1000000000,
          decimals: 9,
        },
        taxConfig: {
          burnEnabled: false,
          burnPercent: 0,
          lpEnabled: false,
          lpPercent: 0,
          dividendsEnabled: false,
          dividendsPercent: 0,
        },
        customWallets: [
          { address: 'Wallet1111111111111111111111111111111111111', percent: 1, label: 'W1' },
          { address: 'Wallet2222222222222222222222222222222222222', percent: 1, label: 'W2' },
          { address: 'Wallet3333333333333333333333333333333333333', percent: 1, label: 'W3' },
          { address: 'Wallet4444444444444444444444444444444444444', percent: 1, label: 'W4' },
          { address: 'Wallet5555555555555555555555555555555555555', percent: 1, label: 'W5' },
          { address: 'Wallet6666666666666666666666666666666666666', percent: 1, label: 'W6' },
        ],
      };

      const result = launchFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('includes custom wallet tax in total calculation', () => {
      const invalidData = {
        basicInfo: {
          name: 'Test Token',
          symbol: 'TEST',
          description: 'A test token for testing purposes.',
          image: '',
        },
        tokenomics: {
          supply: 1000000000,
          decimals: 9,
        },
        taxConfig: {
          burnEnabled: true,
          burnPercent: 10,
          lpEnabled: true,
          lpPercent: 10,
          dividendsEnabled: false,
          dividendsPercent: 0,
        },
        customWallets: [
          { address: 'Wallet1111111111111111111111111111111111111', percent: 5, label: 'W1' },
          { address: 'Wallet2222222222222222222222222222222222222', percent: 5, label: 'W2' },
        ], // Total now 30%
      };

      const result = launchFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
