/**
 * Tests for Sentry client integration utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  setTag: vi.fn(),
  setExtra: vi.fn(),
  withScope: vi.fn((callback) => callback({ setExtra: vi.fn(), setTag: vi.fn() })),
  startSpan: vi.fn(),
  init: vi.fn(),
}));

import * as Sentry from '@sentry/nextjs';
import {
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  setTransactionContext,
  trackWalletConnection,
  trackTokenLaunch,
  trackStakingAction,
} from '../lib/sentry';

describe('Sentry Client Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('captureError', () => {
    it('should capture an error with Sentry', () => {
      const error = new Error('Test error');
      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
    });

    it('should include extra context when provided', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      captureError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: context,
      });
    });

    it('should include tags when provided', () => {
      const error = new Error('Test error');
      captureError(error, { component: 'test' }, { feature: 'launch' });

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: { component: 'test' },
        tags: { feature: 'launch' },
      });
    });
  });

  describe('captureMessage', () => {
    it('should capture a message with default level', () => {
      captureMessage('Test message');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Test message', 'info');
    });

    it('should capture a message with custom level', () => {
      captureMessage('Warning message', 'warning');

      expect(Sentry.captureMessage).toHaveBeenCalledWith('Warning message', 'warning');
    });
  });

  describe('setUser', () => {
    it('should set user with wallet address', () => {
      const wallet = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLTPh8qPJms2';
      setUser(wallet);

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: wallet,
        wallet,
      });
    });
  });

  describe('clearUser', () => {
    it('should clear user data', () => {
      clearUser();

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('addBreadcrumb', () => {
    it('should add a breadcrumb with message', () => {
      addBreadcrumb('User clicked button');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'User clicked button',
        level: 'info',
        category: 'user',
      });
    });

    it('should add a breadcrumb with data and custom category', () => {
      addBreadcrumb('API call', { endpoint: '/api/tokens' }, 'api');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'API call',
        level: 'info',
        category: 'api',
        data: { endpoint: '/api/tokens' },
      });
    });
  });

  describe('setTransactionContext', () => {
    it('should set transaction name and tags', () => {
      setTransactionContext('launch-token', { tokenName: 'TEST' });

      expect(Sentry.setTag).toHaveBeenCalledWith('transaction', 'launch-token');
    });
  });

  describe('trackWalletConnection', () => {
    it('should track wallet connection event', () => {
      const wallet = 'HN7cABqLq46Es1jh92dQQisAq662SmxELLTPh8qPJms2';
      trackWalletConnection(wallet, 'connected');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Wallet connected',
          category: 'wallet',
          data: expect.objectContaining({ wallet, status: 'connected' }),
        })
      );
    });

    it('should track wallet disconnection event', () => {
      trackWalletConnection(undefined, 'disconnected');

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Wallet disconnected',
          category: 'wallet',
        })
      );
    });
  });

  describe('trackTokenLaunch', () => {
    it('should track token launch start', () => {
      trackTokenLaunch('start', { tokenName: 'TEST', symbol: 'TST' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token launch started',
          category: 'launch',
          data: expect.objectContaining({ tokenName: 'TEST', symbol: 'TST' }),
        })
      );
    });

    it('should track token launch success', () => {
      trackTokenLaunch('success', { mint: 'abc123', tokenName: 'TEST' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token launch succeeded',
          category: 'launch',
        })
      );
    });

    it('should track token launch failure', () => {
      trackTokenLaunch('error', { error: 'Insufficient funds' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Token launch failed',
          category: 'launch',
          level: 'error',
        })
      );
    });
  });

  describe('trackStakingAction', () => {
    it('should track stake action', () => {
      trackStakingAction('stake', { amount: 1000, tier: 'gold' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Staking action: stake',
          category: 'staking',
          data: expect.objectContaining({ amount: 1000, tier: 'gold' }),
        })
      );
    });

    it('should track unstake action', () => {
      trackStakingAction('unstake', { amount: 500 });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Staking action: unstake',
          category: 'staking',
        })
      );
    });

    it('should track claim rewards action', () => {
      trackStakingAction('claim', { rewards: 50 });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Staking action: claim',
          category: 'staking',
        })
      );
    });
  });
});
