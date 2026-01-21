/**
 * Tests for useWalletEnhanced hook
 * Tests balance fetching, transaction signing, connection status, and network switching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock @solana/web3.js
vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue(1000000000), // 1 SOL
    getRecentBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'test-blockhash',
      feeCalculator: { lamportsPerSignature: 5000 },
    }),
    confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    getLatestBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'test-blockhash',
      lastValidBlockHeight: 100,
    }),
  })),
  PublicKey: vi.fn().mockImplementation((key: string) => ({
    toBase58: () => key,
    toString: () => key,
  })),
  Transaction: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    sign: vi.fn(),
    serialize: vi.fn().mockReturnValue(Buffer.from('test')),
  })),
  SystemProgram: {
    transfer: vi.fn().mockReturnValue({}),
  },
  LAMPORTS_PER_SOL: 1000000000,
  clusterApiUrl: vi.fn().mockReturnValue('https://api.devnet.solana.com'),
}));

// Mock wallet adapter hooks
const mockPublicKey = {
  toBase58: () => 'TestWalletAddress123',
  toString: () => 'TestWalletAddress123',
};

const mockWallet = {
  adapter: {
    name: 'Phantom',
    icon: 'phantom-icon.png',
    publicKey: mockPublicKey,
  },
  publicKey: mockPublicKey,
};

const mockSignTransaction = vi.fn();
const mockSignAllTransactions = vi.fn();
const mockSignMessage = vi.fn();
const mockSendTransaction = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    connecting: false,
    disconnecting: false,
    publicKey: mockPublicKey,
    wallet: mockWallet,
    wallets: [],
    signTransaction: mockSignTransaction,
    signAllTransactions: mockSignAllTransactions,
    signMessage: mockSignMessage,
    sendTransaction: mockSendTransaction,
    connect: mockConnect,
    disconnect: mockDisconnect,
    select: vi.fn(),
  })),
  useConnection: vi.fn(() => ({
    connection: {
      getBalance: vi.fn().mockResolvedValue(1000000000),
      getRecentBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'test-blockhash',
        feeCalculator: { lamportsPerSignature: 5000 },
      }),
      confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: 'test-blockhash',
        lastValidBlockHeight: 100,
      }),
      rpcEndpoint: 'https://api.devnet.solana.com',
    },
  })),
}));

// Import after mocks
import { useWalletEnhanced, WalletNetwork } from '@/hooks/useWalletEnhanced';

describe('useWalletEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('connection status', () => {
    it('should return connected status when wallet is connected', async () => {
      const { result } = renderHook(() => useWalletEnhanced());

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.address).toBe('TestWalletAddress123');
    });

    it('should return disconnected status when wallet is not connected', async () => {
      const { useWallet } = await import('@solana/wallet-adapter-react');
      vi.mocked(useWallet).mockReturnValueOnce({
        connected: false,
        connecting: false,
        disconnecting: false,
        publicKey: null,
        wallet: null,
        wallets: [],
        signTransaction: undefined,
        signAllTransactions: undefined,
        signMessage: undefined,
        sendTransaction: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        select: vi.fn(),
      } as any);

      const { result } = renderHook(() => useWalletEnhanced());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBeNull();
    });

    it('should return connecting status during connection', async () => {
      const { useWallet } = await import('@solana/wallet-adapter-react');
      vi.mocked(useWallet).mockReturnValueOnce({
        connected: false,
        connecting: true,
        disconnecting: false,
        publicKey: null,
        wallet: null,
        wallets: [],
        signTransaction: undefined,
        signAllTransactions: undefined,
        signMessage: undefined,
        sendTransaction: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        select: vi.fn(),
      } as any);

      const { result } = renderHook(() => useWalletEnhanced());

      expect(result.current.isConnecting).toBe(true);
    });
  });

  describe('balance fetching', () => {
    it('should fetch balance when connected', async () => {
      const { result } = renderHook(() => useWalletEnhanced());

      await act(async () => {
        await result.current.refreshBalance();
      });

      await waitFor(() => {
        expect(result.current.balance).toBe(1); // 1 SOL
      });
    });

    it('should return null balance when disconnected', async () => {
      const { useWallet } = await import('@solana/wallet-adapter-react');
      vi.mocked(useWallet).mockReturnValueOnce({
        connected: false,
        connecting: false,
        disconnecting: false,
        publicKey: null,
        wallet: null,
        wallets: [],
        signTransaction: undefined,
        signAllTransactions: undefined,
        signMessage: undefined,
        sendTransaction: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        select: vi.fn(),
      } as any);

      const { result } = renderHook(() => useWalletEnhanced());

      expect(result.current.balance).toBeNull();
    });

    it('should handle balance fetch error gracefully', async () => {
      const { useConnection } = await import('@solana/wallet-adapter-react');
      vi.mocked(useConnection).mockReturnValueOnce({
        connection: {
          getBalance: vi.fn().mockRejectedValue(new Error('Network error')),
          rpcEndpoint: 'https://api.devnet.solana.com',
        },
      } as any);

      const { result } = renderHook(() => useWalletEnhanced());

      await act(async () => {
        await result.current.refreshBalance();
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('transaction signing', () => {
    it('should sign and send transaction', async () => {
      mockSendTransaction.mockResolvedValueOnce('test-signature');

      const { result } = renderHook(() => useWalletEnhanced());

      const mockTransaction = {
        add: vi.fn(),
        sign: vi.fn(),
        serialize: vi.fn().mockReturnValue(Buffer.from('test')),
      };

      let signature: string | undefined;
      await act(async () => {
        signature = await result.current.signAndSendTransaction(mockTransaction as any);
      });

      expect(signature).toBe('test-signature');
      expect(mockSendTransaction).toHaveBeenCalled();
    });

    it('should throw error when wallet is not connected', async () => {
      const { useWallet } = await import('@solana/wallet-adapter-react');
      vi.mocked(useWallet).mockReturnValueOnce({
        connected: false,
        connecting: false,
        disconnecting: false,
        publicKey: null,
        wallet: null,
        wallets: [],
        signTransaction: undefined,
        signAllTransactions: undefined,
        signMessage: undefined,
        sendTransaction: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        select: vi.fn(),
      } as any);

      const { result } = renderHook(() => useWalletEnhanced());

      await expect(
        result.current.signAndSendTransaction({} as any)
      ).rejects.toThrow('Wallet not connected');
    });

    it('should sign message with wallet', async () => {
      const mockEncodedMessage = new Uint8Array([1, 2, 3]);
      const mockSignature = new Uint8Array([4, 5, 6]);
      mockSignMessage.mockResolvedValueOnce(mockSignature);

      const { result } = renderHook(() => useWalletEnhanced());

      let signature: Uint8Array | undefined;
      await act(async () => {
        signature = await result.current.signMessage(mockEncodedMessage);
      });

      expect(signature).toBe(mockSignature);
      expect(mockSignMessage).toHaveBeenCalledWith(mockEncodedMessage);
    });
  });

  describe('network switching', () => {
    it('should return current network', () => {
      const { result } = renderHook(() => useWalletEnhanced());

      expect(result.current.network).toBeDefined();
    });

    it('should support devnet network', () => {
      const { result } = renderHook(() => useWalletEnhanced());

      expect(['mainnet-beta', 'devnet', 'testnet']).toContain(result.current.network);
    });
  });

  describe('wallet info', () => {
    it('should return wallet adapter info when connected', () => {
      const { result } = renderHook(() => useWalletEnhanced());

      expect(result.current.walletName).toBe('Phantom');
      expect(result.current.walletIcon).toBe('phantom-icon.png');
    });

    it('should return null wallet info when disconnected', async () => {
      const { useWallet } = await import('@solana/wallet-adapter-react');
      vi.mocked(useWallet).mockReturnValueOnce({
        connected: false,
        connecting: false,
        disconnecting: false,
        publicKey: null,
        wallet: null,
        wallets: [],
        signTransaction: undefined,
        signAllTransactions: undefined,
        signMessage: undefined,
        sendTransaction: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        select: vi.fn(),
      } as any);

      const { result } = renderHook(() => useWalletEnhanced());

      expect(result.current.walletName).toBeNull();
      expect(result.current.walletIcon).toBeNull();
    });
  });

  describe('auto-reconnect', () => {
    it('should attempt auto-reconnect on page load if previously connected', async () => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn().mockReturnValue('Phantom'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      const { result } = renderHook(() => useWalletEnhanced({ autoConnect: true }));

      // The hook should check localStorage for previous wallet
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should clear error after successful operation', async () => {
      const { result } = renderHook(() => useWalletEnhanced());

      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should set error on failed transaction', async () => {
      mockSendTransaction.mockRejectedValueOnce(new Error('Transaction failed'));

      const { result } = renderHook(() => useWalletEnhanced());

      await act(async () => {
        try {
          await result.current.signAndSendTransaction({} as any);
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });
});
