'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { trackWalletConnection, trackApiError, addBreadcrumb } from '@/lib/sentry';

interface WalletState {
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface TransactionOptions {
  skipPreflight?: boolean;
  maxRetries?: number;
}

export function useWalletEnhanced() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [state, setState] = useState<WalletState>({
    balance: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const { connected, publicKey, signTransaction, signAllTransactions, connecting, disconnecting } = wallet;

  // Track wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      trackWalletConnection(publicKey.toBase58(), 'connected');
    } else if (!connected && !connecting) {
      trackWalletConnection(undefined, 'disconnected');
    }
  }, [connected, publicKey, connecting]);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setState((prev) => ({ ...prev, balance: null }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const balance = await connection.getBalance(publicKey);
      setState({
        balance: balance / LAMPORTS_PER_SOL,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      trackApiError('getBalance', error as Error);
    }
  }, [publicKey, connected, connection]);

  // Auto-refresh balance
  useEffect(() => {
    fetchBalance();

    if (connected) {
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, connected]);

  // Sign and send transaction helper
  const signAndSendTransaction = useCallback(
    async (transaction: Transaction, options: TransactionOptions = {}) => {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected');
      }

      addBreadcrumb('Transaction signing started', { instructions: transaction.instructions.length });

      try {
        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Sign transaction
        const signedTx = await signTransaction(transaction);

        // Send transaction
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: options.skipPreflight ?? false,
          maxRetries: options.maxRetries ?? 3,
        });

        addBreadcrumb('Transaction sent', { signature });

        // Confirm transaction
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        addBreadcrumb('Transaction confirmed', { signature });

        // Refresh balance after transaction
        await fetchBalance();

        return signature;
      } catch (error) {
        trackApiError('signAndSendTransaction', error as Error);
        throw error;
      }
    },
    [publicKey, signTransaction, connection, fetchBalance]
  );

  // Sign multiple transactions helper
  const signAndSendAllTransactions = useCallback(
    async (transactions: Transaction[], options: TransactionOptions = {}) => {
      if (!publicKey || !signAllTransactions) {
        throw new Error('Wallet not connected');
      }

      addBreadcrumb('Batch transaction signing started', { count: transactions.length });

      try {
        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        // Prepare all transactions
        const preparedTxs = transactions.map((tx) => {
          tx.recentBlockhash = blockhash;
          tx.feePayer = publicKey;
          return tx;
        });

        // Sign all transactions
        const signedTxs = await signAllTransactions(preparedTxs);

        // Send all transactions
        const signatures: string[] = [];
        for (const signedTx of signedTxs) {
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: options.skipPreflight ?? false,
            maxRetries: options.maxRetries ?? 3,
          });
          signatures.push(signature);
        }

        addBreadcrumb('Batch transactions sent', { signatures });

        // Confirm all transactions
        await Promise.all(
          signatures.map((signature) =>
            connection.confirmTransaction({
              signature,
              blockhash,
              lastValidBlockHeight,
            })
          )
        );

        addBreadcrumb('Batch transactions confirmed', { signatures });

        // Refresh balance
        await fetchBalance();

        return signatures;
      } catch (error) {
        trackApiError('signAndSendAllTransactions', error as Error);
        throw error;
      }
    },
    [publicKey, signAllTransactions, connection, fetchBalance]
  );

  // Create simple SOL transfer transaction
  const createTransferTransaction = useCallback(
    (to: string, amount: number) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      return transaction;
    },
    [publicKey]
  );

  // Format wallet address for display
  const formattedAddress = useMemo(() => {
    if (!publicKey) return null;
    const address = publicKey.toBase58();
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [publicKey]);

  // Full wallet address
  const address = useMemo(() => {
    return publicKey?.toBase58() || null;
  }, [publicKey]);

  return {
    // Original wallet properties
    ...wallet,

    // Enhanced state
    balance: state.balance,
    balanceLoading: state.isLoading,
    balanceError: state.error,
    lastUpdated: state.lastUpdated,

    // Computed
    formattedAddress,
    address,
    isReady: connected && !!publicKey && !connecting && !disconnecting,

    // Actions
    fetchBalance,
    signAndSendTransaction,
    signAndSendAllTransactions,
    createTransferTransaction,
  };
}

export default useWalletEnhanced;
