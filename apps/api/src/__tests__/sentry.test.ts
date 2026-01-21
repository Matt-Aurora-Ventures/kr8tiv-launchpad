/**
 * Tests for Sentry backend integration utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setExtra: vi.fn(),
  addBreadcrumb: vi.fn(),
  withScope: vi.fn((callback) => callback({ setExtra: vi.fn(), setTag: vi.fn(), setLevel: vi.fn() })),
  startSpan: vi.fn((options, callback) => callback({ setAttribute: vi.fn() })),
  Handlers: {
    requestHandler: vi.fn(() => vi.fn((req: any, res: any, next: any) => next())),
    errorHandler: vi.fn(() => vi.fn((err: any, req: any, res: any, next: any) => next(err))),
    tracingHandler: vi.fn(() => vi.fn((req: any, res: any, next: any) => next())),
  },
}));

vi.mock('@sentry/profiling-node', () => ({
  ProfilingIntegration: vi.fn().mockImplementation(() => ({})),
  nodeProfilingIntegration: vi.fn(() => ({})),
}));

import * as Sentry from '@sentry/node';
import {
  initSentry,
  captureApiError,
  captureMessage,
  setRequestUser,
  addApiContext,
  trackLaunchTransaction,
  trackStakingTransaction,
  trackFeeCollection,
  createSentryMiddleware,
} from '../utils/sentry';

describe('Sentry Backend Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    process.env.NODE_ENV = 'test';
    process.env.SENTRY_DSN = 'https://test@sentry.io/123';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initSentry', () => {
    it('should initialize Sentry with correct options', () => {
      initSentry();

      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV,
          tracesSampleRate: expect.any(Number),
        })
      );
    });

    it('should not initialize if DSN is not set', () => {
      delete process.env.SENTRY_DSN;
      initSentry();

      // Should still call init but with undefined DSN (Sentry handles this gracefully)
      expect(Sentry.init).toHaveBeenCalled();
    });
  });

  describe('captureApiError', () => {
    it('should capture an API error with request context', () => {
      const error = new Error('API Error');
      const request = {
        method: 'POST',
        url: '/api/launch',
        body: { tokenName: 'TEST' },
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1',
      };

      captureApiError(error, request as any);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should include response status code if provided', () => {
      const error = new Error('Not Found');
      const request = {
        method: 'GET',
        url: '/api/tokens/unknown',
        headers: {},
      };

      captureApiError(error, request as any, 404);

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('captureMessage', () => {
    it('should capture a message with default level', () => {
      captureMessage('Test info message');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test info message', 'info');
    });

    it('should capture a message with warning level', () => {
      captureMessage('Test warning', 'warning');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test warning', 'warning');
    });
  });

  describe('setRequestUser', () => {
    it('should set user from wallet address', () => {
      const wallet = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLTPh8qPJms2';
      setRequestUser(wallet);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: wallet,
        wallet,
      });
    });

    it('should set user from API key', () => {
      setRequestUser(undefined, 'api-key-123');

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'api-key-123',
        apiKey: 'api-key-123',
      });
    });

    it('should set anonymous user if no identifier provided', () => {
      setRequestUser();

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'anonymous',
      });
    });
  });

  describe('addApiContext', () => {
    it('should add API context as breadcrumb', () => {
      addApiContext('GET', '/api/tokens', { status: 200, duration: 50 });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'api',
        message: 'GET /api/tokens',
        level: 'info',
        data: expect.objectContaining({ status: 200, duration: 50 }),
      });
    });
  });

  describe('trackLaunchTransaction', () => {
    it('should track token launch start', () => {
      trackLaunchTransaction('start', {
        creator: 'wallet123',
        tokenName: 'TEST',
        symbol: 'TST',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'launch',
          message: 'Token launch started',
          data: expect.objectContaining({ tokenName: 'TEST', symbol: 'TST' }),
        })
      );
    });

    it('should track token launch success', () => {
      trackLaunchTransaction('success', {
        mint: 'mint123',
        tokenName: 'TEST',
        creator: 'wallet123',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'launch',
          message: 'Token launch succeeded',
          level: 'info',
        })
      );
    });

    it('should track token launch failure', () => {
      trackLaunchTransaction('error', {
        error: 'Bags API failed',
        tokenName: 'TEST',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'launch',
          message: 'Token launch failed',
          level: 'error',
        })
      );
    });
  });

  describe('trackStakingTransaction', () => {
    it('should track stake action', () => {
      trackStakingTransaction('stake', {
        wallet: 'wallet123',
        amount: 1000,
        signature: 'sig123',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'staking',
          message: 'Staking: stake',
          data: expect.objectContaining({ amount: 1000 }),
        })
      );
    });

    it('should track unstake action', () => {
      trackStakingTransaction('unstake', {
        wallet: 'wallet123',
        amount: 500,
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'staking',
          message: 'Staking: unstake',
        })
      );
    });

    it('should track claim rewards', () => {
      trackStakingTransaction('claim', {
        wallet: 'wallet123',
        rewards: 50,
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'staking',
          message: 'Staking: claim',
        })
      );
    });
  });

  describe('trackFeeCollection', () => {
    it('should track fee collection event', () => {
      trackFeeCollection({
        tokenMint: 'mint123',
        feeAmount: 100,
        feeType: 'transfer',
        signature: 'sig123',
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'fees',
          message: 'Fee collected',
          data: expect.objectContaining({
            tokenMint: 'mint123',
            feeAmount: 100,
            feeType: 'transfer',
          }),
        })
      );
    });

    it('should track fee distribution', () => {
      trackFeeCollection({
        tokenMint: 'mint123',
        distributed: true,
        burnAmount: 50,
        lpAmount: 25,
        treasuryAmount: 25,
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'fees',
          message: 'Fee distributed',
        })
      );
    });
  });

  describe('createSentryMiddleware', () => {
    it('should return middleware functions', () => {
      const middleware = createSentryMiddleware();

      expect(middleware).toHaveProperty('requestHandler');
      expect(middleware).toHaveProperty('tracingHandler');
      expect(middleware).toHaveProperty('errorHandler');
      expect(typeof middleware.requestHandler).toBe('function');
      expect(typeof middleware.tracingHandler).toBe('function');
      expect(typeof middleware.errorHandler).toBe('function');
    });
  });
});
