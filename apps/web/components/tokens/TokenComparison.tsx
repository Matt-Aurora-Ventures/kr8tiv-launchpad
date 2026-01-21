'use client';

import { useState, useMemo } from 'react';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Flame,
  Droplets,
  Plus,
  X,
  Search,
} from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

interface TokenData {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  totalSupply: number;
  circulatingSupply: number;
  burnedSupply: number;
  lpValue: number;
}

interface TokenComparisonProps {
  tokens?: TokenData[];
  availableTokens?: TokenData[];
  onAddToken?: (mint: string) => void;
  onRemoveToken?: (mint: string) => void;
  maxTokens?: number;
  className?: string;
}

const METRICS = [
  { key: 'price', label: 'Price', format: (v: number) => `$${formatNumber(v, 8)}`, icon: DollarSign },
  { key: 'priceChange24h', label: '24h Change', format: (v: number) => `${v >= 0 ? '+' : ''}${formatNumber(v, 2)}%`, icon: TrendingUp, isChange: true },
  { key: 'marketCap', label: 'Market Cap', format: (v: number) => `$${formatCompact(v)}`, icon: BarChart3 },
  { key: 'volume24h', label: '24h Volume', format: (v: number) => `$${formatCompact(v)}`, icon: BarChart3 },
  { key: 'holders', label: 'Holders', format: (v: number) => formatCompact(v), icon: Users },
  { key: 'circulatingSupply', label: 'Circulating', format: (v: number) => formatCompact(v), icon: null },
  { key: 'burnedSupply', label: 'Burned', format: (v: number) => formatCompact(v), icon: Flame },
  { key: 'lpValue', label: 'LP Value', format: (v: number) => `$${formatCompact(v)}`, icon: Droplets },
] as const;

export function TokenComparison({
  tokens = [],
  availableTokens = [],
  onAddToken,
  onRemoveToken,
  maxTokens = 4,
  className,
}: TokenComparisonProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAvailable = useMemo(() => {
    const selectedMints = new Set(tokens.map(t => t.mint));
    return availableTokens
      .filter(t => !selectedMints.has(t.mint))
      .filter(t =>
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
  }, [availableTokens, tokens, searchQuery]);

  const getBestValue = (metricKey: string) => {
    if (tokens.length === 0) return null;

    const values = tokens.map(t => (t as any)[metricKey] as number);

    // For price change, best is highest positive
    if (metricKey === 'priceChange24h') {
      return Math.max(...values);
    }

    // For most metrics, higher is better
    return Math.max(...values);
  };

  return (
    <div className={cn('card space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Token Comparison</h3>
        </div>
        {tokens.length < maxTokens && (
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="btn btn-secondary text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Token
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {showSearch && (
        <div className="relative">
          <div className="flex items-center gap-2 p-2 border rounded-lg">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tokens..."
              className="flex-1 bg-transparent outline-none text-sm"
              autoFocus
            />
            <button onClick={() => setShowSearch(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {filteredAvailable.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-10">
              {filteredAvailable.map((token) => (
                <button
                  key={token.mint}
                  onClick={() => {
                    onAddToken?.(token.mint);
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {tokens.length === 0 ? (
        <div className="text-center py-12">
          <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Add tokens to compare</p>
          <p className="text-sm text-muted-foreground">Select up to {maxTokens} tokens</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-3 px-2 text-sm text-muted-foreground font-medium">Metric</th>
                {tokens.map((token) => (
                  <th key={token.mint} className="text-center py-3 px-2 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <span className="font-medium">{token.symbol}</span>
                      {onRemoveToken && (
                        <button
                          onClick={() => onRemoveToken(token.mint)}
                          className="text-xs text-muted-foreground hover:text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric) => {
                const bestValue = getBestValue(metric.key);

                return (
                  <tr key={metric.key} className="border-t">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {metric.icon && <metric.icon className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm">{metric.label}</span>
                      </div>
                    </td>
                    {tokens.map((token) => {
                      const value = (token as any)[metric.key] as number;
                      const isBest = value === bestValue && tokens.length > 1;
                      const isPositive = metric.isChange ? value >= 0 : true;

                      return (
                        <td
                          key={token.mint}
                          className={cn(
                            'py-3 px-2 text-center',
                            isBest && 'bg-green-500/10',
                            metric.isChange && (isPositive ? 'text-green-500' : 'text-red-500')
                          )}
                        >
                          <span className={cn(
                            'font-medium',
                            isBest && 'text-green-500'
                          )}>
                            {metric.format(value)}
                          </span>
                          {isBest && (
                            <span className="ml-1 text-xs text-green-500">★</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {tokens.length > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          ★ indicates best value among compared tokens
        </p>
      )}
    </div>
  );
}

export default TokenComparison;
