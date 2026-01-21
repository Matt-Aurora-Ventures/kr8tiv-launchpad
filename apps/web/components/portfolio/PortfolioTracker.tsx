'use client';

import { useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

interface PortfolioToken {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  price: number;
  priceChange24h: number;
  value: number;
}

interface PortfolioTrackerProps {
  tokens?: PortfolioToken[];
  solBalance?: number;
  solPrice?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function PortfolioTracker({
  tokens = [],
  solBalance = 0,
  solPrice = 150,
  isLoading = false,
  onRefresh,
  className,
}: PortfolioTrackerProps) {
  const { connected } = useWallet();
  const [sortBy, setSortBy] = useState<'value' | 'change'>('value');

  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => {
      if (sortBy === 'value') return b.value - a.value;
      return b.priceChange24h - a.priceChange24h;
    });
  }, [tokens, sortBy]);

  const totalValue = useMemo(() => {
    const tokenValue = tokens.reduce((sum, t) => sum + t.value, 0);
    const solValue = solBalance * solPrice;
    return tokenValue + solValue;
  }, [tokens, solBalance, solPrice]);

  const totalChange = useMemo(() => {
    if (tokens.length === 0) return 0;
    const weightedChange = tokens.reduce((sum, t) => {
      const weight = t.value / totalValue;
      return sum + (t.priceChange24h * weight);
    }, 0);
    return weightedChange;
  }, [tokens, totalValue]);

  const allocation = useMemo(() => {
    const solValue = solBalance * solPrice;
    return {
      sol: totalValue > 0 ? (solValue / totalValue) * 100 : 0,
      tokens: totalValue > 0 ? ((totalValue - solValue) / totalValue) * 100 : 0,
    };
  }, [solBalance, solPrice, totalValue]);

  if (!connected) {
    return (
      <div className={cn('card text-center py-8', className)}>
        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Connect wallet to view portfolio</p>
      </div>
    );
  }

  return (
    <div className={cn('card space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Portfolio</h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </button>
        )}
      </div>

      {/* Total Value */}
      <div className="text-center py-4 bg-secondary/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Total Value</p>
        <p className="text-3xl font-bold">${formatCompact(totalValue)}</p>
        <p className={cn(
          'text-sm flex items-center justify-center gap-1',
          totalChange >= 0 ? 'text-green-500' : 'text-red-500'
        )}>
          {totalChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {totalChange >= 0 ? '+' : ''}{formatNumber(totalChange, 2)}% (24h)
        </p>
      </div>

      {/* Allocation */}
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Allocation</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              SOL {formatNumber(allocation.sol, 1)}%
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Tokens {formatNumber(allocation.tokens, 1)}%
            </span>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-purple-500 transition-all"
            style={{ width: `${allocation.sol}%` }}
          />
          <div
            className="bg-primary transition-all"
            style={{ width: `${allocation.tokens}%` }}
          />
        </div>
      </div>

      {/* SOL Balance */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SOL</span>
          </div>
          <div>
            <p className="font-medium">Solana</p>
            <p className="text-xs text-muted-foreground">{formatNumber(solBalance, 4)} SOL</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium">${formatNumber(solBalance * solPrice, 2)}</p>
          <p className="text-xs text-muted-foreground">${formatNumber(solPrice, 2)}/SOL</p>
        </div>
      </div>

      {/* Token Holdings */}
      {tokens.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Token Holdings</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'value' | 'change')}
              className="input text-xs py-1"
            >
              <option value="value">By Value</option>
              <option value="change">By Change</option>
            </select>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedTokens.map((token) => {
              const isPositive = token.priceChange24h >= 0;

              return (
                <div
                  key={token.mint}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                      {token.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{token.symbol}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCompact(token.balance)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-medium text-sm">${formatNumber(token.value, 2)}</p>
                    <p className={cn(
                      'text-xs flex items-center justify-end gap-0.5',
                      isPositive ? 'text-green-500' : 'text-red-500'
                    )}>
                      {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatNumber(Math.abs(token.priceChange24h), 2)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tokens.length === 0 && !isLoading && (
        <div className="text-center py-4">
          <PieChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No token holdings found</p>
        </div>
      )}
    </div>
  );
}

export default PortfolioTracker;
