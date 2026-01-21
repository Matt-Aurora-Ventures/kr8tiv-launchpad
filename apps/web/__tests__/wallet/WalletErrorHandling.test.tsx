/**
 * Tests for wallet error handling
 * Connection errors, transaction errors, network errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Error classes to test
class WalletConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

class WalletSignTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletSignTransactionError';
  }
}

class WalletSendTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletSendTransactionError';
  }
}

class WalletTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletTimeoutError';
  }
}

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSendTransaction = vi.fn();
const mockSignTransaction = vi.fn();

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    connecting: false,
    disconnecting: false,
    publicKey: { toBase58: () => 'TestWallet123' },
    wallet: {
      adapter: {
        name: 'Phantom',
        icon: 'phantom-icon.png',
      },
    },
    wallets: [],
    connect: mockConnect,
    disconnect: mockDisconnect,
    sendTransaction: mockSendTransaction,
    signTransaction: mockSignTransaction,
    select: vi.fn(),
  })),
  useConnection: vi.fn(() => ({
    connection: {
      getBalance: vi.fn().mockResolvedValue(1000000000),
      rpcEndpoint: 'https://api.devnet.solana.com',
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'test',
        lastValidBlockHeight: 100,
      }),
      confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    },
  })),
}));

import { useWalletEnhanced } from '@/hooks/useWalletEnhanced';
import {
  WalletErrorHandler,
  WalletErrorType,
  isWalletError,
  getWalletErrorMessage,
} from '@/lib/wallet-errors';

describe('WalletErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('error classification', () => {
    it('should classify connection errors correctly', () => {
      const error = new WalletConnectionError('User rejected the request');
      const result = WalletErrorHandler.classify(error);

      expect(result.type).toBe(WalletErrorType.CONNECTION_REJECTED);
      expect(result.recoverable).toBe(true);
    });

    it('should classify timeout errors correctly', () => {
      const error = new WalletTimeoutError('Connection timed out');
      const result = WalletErrorHandler.classify(error);

      expect(result.type).toBe(WalletErrorType.TIMEOUT);
      expect(result.recoverable).toBe(true);
    });

    it('should classify insufficient funds error', () => {
      const error = new Error('insufficient funds for transaction');
      const result = WalletErrorHandler.classify(error);

      expect(result.type).toBe(WalletErrorType.INSUFFICIENT_FUNDS);
      expect(result.recoverable).toBe(false);
    });

    it('should classify network errors correctly', () => {
      const error = new Error('Network request failed');
      const result = WalletErrorHandler.classify(error);

      expect(result.type).toBe(WalletErrorType.NETWORK_ERROR);
      expect(result.recoverable).toBe(true);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Something unexpected happened');
      const result = WalletErrorHandler.classify(error);

      expect(result.type).toBe(WalletErrorType.UNKNOWN);
    });

    it('should classify user rejection from error message', () => {
      const error = new Error('User rejected the request');
      const result = WalletErrorHandler.classify(error);

      expect(result.type).toBe(WalletErrorType.USER_REJECTED);
      expect(result.recoverable).toBe(true);
    });

    it('should classify wallet not found error', () => {
      const error = new Error('Wallet not found');
      const result = WalletErrorHandler.classify(error);

      expect(result.type).toBe(WalletErrorType.WALLET_NOT_FOUND);
      expect(result.recoverable).toBe(true);
    });
  });

  describe('error messages', () => {
    it('should provide user-friendly message for connection rejection', () => {
      const message = getWalletErrorMessage(WalletErrorType.CONNECTION_REJECTED);
      expect(message).toContain('rejected');
    });

    it('should provide user-friendly message for insufficient funds', () => {
      const message = getWalletErrorMessage(WalletErrorType.INSUFFICIENT_FUNDS);
      expect(message.toLowerCase()).toContain('insufficient');
    });

    it('should provide user-friendly message for timeout', () => {
      const message = getWalletErrorMessage(WalletErrorType.TIMEOUT);
      expect(message.toLowerCase()).toContain('timeout');
    });

    it('should provide user-friendly message for network error', () => {
      const message = getWalletErrorMessage(WalletErrorType.NETWORK_ERROR);
      expect(message.toLowerCase()).toContain('network');
    });
  });

  describe('error recovery suggestions', () => {
    it('should suggest reconnect for connection errors', () => {
      const error = new WalletConnectionError('Connection failed');
      const result = WalletErrorHandler.classify(error);

      expect(result.suggestion).toContain('reconnect');
    });

    it('should suggest checking balance for insufficient funds', () => {
      const error = new Error('insufficient funds');
      const result = WalletErrorHandler.classify(error);

      expect(result.suggestion).toContain('balance');
    });

    it('should suggest retry for timeout errors', () => {
      const error = new WalletTimeoutError('Request timed out');
      const result = WalletErrorHandler.classify(error);

      expect(result.suggestion).toContain('retry');
    });
  });
});

describe('useWalletEnhanced error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle connection error gracefully', async () => {
    mockConnect.mockRejectedValueOnce(new Error('User rejected the request'));

    const { result } = renderHook(() => useWalletEnhanced());

    await act(async () => {
      try {
        await result.current.connect();
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.type).toBe(WalletErrorType.USER_REJECTED);
  });

  it('should handle transaction send error gracefully', async () => {
    mockSendTransaction.mockRejectedValueOnce(new Error('Transaction simulation failed'));

    const { result } = renderHook(() => useWalletEnhanced());

    await act(async () => {
      try {
        await result.current.signAndSendTransaction({} as any);
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should clear error on successful operation', async () => {
    // First, trigger an error
    mockSendTransaction.mockRejectedValueOnce(new Error('Failed'));
    const { result } = renderHook(() => useWalletEnhanced());

    await act(async () => {
      try {
        await result.current.signAndSendTransaction({} as any);
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBeTruthy();

    // Then clear it
    await act(async () => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should provide error recovery callback', async () => {
    const onError = vi.fn();
    mockSendTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

    const { result } = renderHook(() => useWalletEnhanced({ onError }));

    await act(async () => {
      try {
        await result.current.signAndSendTransaction({} as any);
      } catch (e) {
        // Expected
      }
    });

    expect(onError).toHaveBeenCalled();
  });
});

describe('isWalletError utility', () => {
  it('should return true for wallet-specific errors', () => {
    expect(isWalletError(new WalletConnectionError('test'))).toBe(true);
    expect(isWalletError(new WalletSignTransactionError('test'))).toBe(true);
    expect(isWalletError(new WalletSendTransactionError('test'))).toBe(true);
    expect(isWalletError(new WalletTimeoutError('test'))).toBe(true);
  });

  it('should return false for generic errors', () => {
    expect(isWalletError(new Error('generic error'))).toBe(false);
    expect(isWalletError(new TypeError('type error'))).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isWalletError('string')).toBe(false);
    expect(isWalletError(null)).toBe(false);
    expect(isWalletError(undefined)).toBe(false);
    expect(isWalletError(123)).toBe(false);
  });
});
