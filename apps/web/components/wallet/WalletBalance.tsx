'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { RefreshCw, Coins, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
  decimals: number;
  usdValue?: number;
}

interface WalletBalanceProps {
  showTokens?: boolean;
  tokenMints?: string[];
  className?: string;
}

export function WalletBalance({
  showTokens = false,
  tokenMints = [],
  className,
}: WalletBalanceProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connected) {
      setSolBalance(null);
      setTokenBalances([]);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch SOL balance
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / LAMPORTS_PER_SOL);

      // Fetch token balances if requested
      if (showTokens && tokenMints.length > 0) {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );

        const balances: TokenBalance[] = [];

        for (const account of tokenAccounts.value) {
          const info = account.account.data.parsed.info;
          const mint = info.mint;

          if (tokenMints.includes(mint) || tokenMints.length === 0) {
            balances.push({
              mint,
              symbol: mint.slice(0, 4).toUpperCase(), // Placeholder symbol
              balance: info.tokenAmount.uiAmount || 0,
              decimals: info.tokenAmount.decimals,
            });
          }
        }

        setTokenBalances(balances);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connected, connection, showTokens, tokenMints]);

  // Fetch on mount and when wallet changes
  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [connected, fetchBalances]);

  if (!connected) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* SOL Balance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Coins className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SOL Balance</p>
            <p className="font-semibold">
              {solBalance !== null ? formatNumber(solBalance, 4) : '-'} SOL
            </p>
          </div>
        </div>

        <button
          onClick={fetchBalances}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Token Balances */}
      {showTokens && tokenBalances.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Tokens
          </p>
          {tokenBalances.map((token) => (
            <div
              key={token.mint}
              className="flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                  {token.symbol.slice(0, 2)}
                </div>
                <span className="text-sm">{token.symbol}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatNumber(token.balance, 2)}
                </p>
                {token.usdValue && (
                  <p className="text-xs text-muted-foreground">
                    ${formatNumber(token.usdValue, 2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <p className="text-[10px] text-muted-foreground text-center">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export default WalletBalance;
