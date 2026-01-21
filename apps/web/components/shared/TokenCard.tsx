'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Users, Activity } from 'lucide-react';
import { cn, formatCompact, shortenAddress } from '@/lib/utils';
import { TokenInfo } from '@/lib/api';
import { TaxBadges } from './TaxBadges';

interface TokenCardProps {
  token: TokenInfo;
  className?: string;
}

export function TokenCard({ token, className }: TokenCardProps) {
  const priceChangePositive = token.stats.priceChange24h >= 0;

  return (
    <Link href={`/tokens/${token.mint}`}>
      <div className={cn('card-hover group', className)}>
        <div className="flex items-start gap-4">
          {/* Token Image */}
          <div className="relative">
            {token.image ? (
              <img
                src={token.image}
                alt={token.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {token.symbol.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Token Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {token.name}
              </h3>
              <span className="text-muted-foreground text-sm">${token.symbol}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{token.description}</p>
          </div>

          {/* Price Change */}
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium',
            priceChangePositive
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          )}>
            {priceChangePositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(token.stats.priceChange24h).toFixed(2)}%
          </div>
        </div>

        {/* Tax Badges */}
        <div className="mt-4">
          <TaxBadges taxConfig={token.taxConfig} size="sm" />
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Market Cap</p>
            <p className="font-semibold">${formatCompact(token.stats.marketCap)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Volume 24h</p>
            <p className="font-semibold">${formatCompact(token.stats.volume24h)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Holders</p>
            <p className="font-semibold">{formatCompact(token.stats.holders)}</p>
          </div>
        </div>

        {/* Creator */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Creator</span>
          <span className="font-mono">{shortenAddress(token.creator)}</span>
        </div>
      </div>
    </Link>
  );
}

export default TokenCard;
