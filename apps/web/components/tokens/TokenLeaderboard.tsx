'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Users,
  Flame,
  Clock,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

interface LeaderboardToken {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChange7d?: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  age: number; // days since launch
  graduationProgress?: number; // 0-100
}

type SortKey = 'marketCap' | 'priceChange24h' | 'volume24h' | 'holders' | 'age';
type TimeFilter = '24h' | '7d' | '30d' | 'all';

interface TokenLeaderboardProps {
  tokens?: LeaderboardToken[];
  isLoading?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  className?: string;
}

const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof Trophy }[] = [
  { key: 'marketCap', label: 'Market Cap', icon: Trophy },
  { key: 'priceChange24h', label: 'Gainers', icon: TrendingUp },
  { key: 'volume24h', label: 'Volume', icon: Flame },
  { key: 'holders', label: 'Holders', icon: Users },
  { key: 'age', label: 'Newest', icon: Clock },
];

export function TokenLeaderboard({
  tokens = [],
  isLoading = false,
  showFilters = true,
  maxItems = 10,
  className,
}: TokenLeaderboardProps) {
  const [sortBy, setSortBy] = useState<SortKey>('marketCap');
  const [sortDesc, setSortDesc] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24h');

  const sortedTokens = useMemo(() => {
    return [...tokens]
      .sort((a, b) => {
        let aVal = (a as any)[sortBy];
        let bVal = (b as any)[sortBy];

        // For 'age', lower is newer
        if (sortBy === 'age') {
          return sortDesc ? aVal - bVal : bVal - aVal;
        }

        return sortDesc ? bVal - aVal : aVal - bVal;
      })
      .slice(0, maxItems);
  }, [tokens, sortBy, sortDesc, maxItems]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className={cn('card', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-secondary rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-secondary rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="font-semibold">Leaderboard</h3>
        </div>
        {showFilters && (
          <div className="flex gap-1">
            {(['24h', '7d', '30d', 'all'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={cn(
                  'text-xs px-2 py-1 rounded transition-colors',
                  timeFilter === filter
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {filter === 'all' ? 'All' : filter.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort Options */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSort(option.key)}
              className={cn(
                'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors',
                sortBy === option.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              <option.icon className="h-3 w-3" />
              {option.label}
              {sortBy === option.key && (
                <ArrowUpDown className="h-3 w-3 ml-1" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard List */}
      {sortedTokens.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No tokens found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTokens.map((token, index) => {
            const isPositive = token.priceChange24h >= 0;

            return (
              <Link
                key={token.mint}
                href={`/tokens/${token.mint}`}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className={cn('w-6 text-center font-bold', getMedalColor(index))}>
                    {index < 3 ? '🏆'.repeat(3 - index).slice(0, 2) : `#${index + 1}`}
                  </div>

                  {/* Token Info */}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.symbol}</span>
                      {token.graduationProgress !== undefined && token.graduationProgress >= 80 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">
                          Near Graduation
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Price Change */}
                  <div className="text-right">
                    <p className={cn(
                      'flex items-center justify-end gap-1 font-medium',
                      isPositive ? 'text-green-500' : 'text-red-500'
                    )}>
                      {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {isPositive ? '+' : ''}{formatNumber(token.priceChange24h, 2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${formatNumber(token.price, 6)}
                    </p>
                  </div>

                  {/* Market Cap */}
                  <div className="text-right hidden md:block">
                    <p className="font-medium">${formatCompact(token.marketCap)}</p>
                    <p className="text-xs text-muted-foreground">Market Cap</p>
                  </div>

                  {/* Holders */}
                  <div className="text-right hidden lg:block">
                    <p className="font-medium">{formatCompact(token.holders)}</p>
                    <p className="text-xs text-muted-foreground">Holders</p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {tokens.length > maxItems && (
        <div className="text-center pt-2">
          <Link href="/tokens" className="text-sm text-primary hover:underline">
            View all {tokens.length} tokens
          </Link>
        </div>
      )}
    </div>
  );
}

export default TokenLeaderboard;
