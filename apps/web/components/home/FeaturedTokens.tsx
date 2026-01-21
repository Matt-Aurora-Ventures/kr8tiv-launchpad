'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  Star,
  ArrowRight,
  Sparkles,
  Users,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface Token {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  createdAt: string;
  progress: number; // 0-100 graduation progress
  isGraduated: boolean;
}

// Mock data for demonstration
const mockTokens: Token[] = [
  {
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    name: 'Solana Pepe',
    symbol: 'SPEPE',
    price: 0.00042,
    priceChange24h: 156.7,
    marketCap: 420000,
    volume24h: 125000,
    holders: 2847,
    createdAt: '2h ago',
    progress: 78,
    isGraduated: false,
  },
  {
    mint: '8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV',
    name: 'Moon Cat',
    symbol: 'MCAT',
    price: 0.00089,
    priceChange24h: 89.2,
    marketCap: 890000,
    volume24h: 340000,
    holders: 5621,
    createdAt: '45m ago',
    progress: 92,
    isGraduated: false,
  },
  {
    mint: '9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW',
    name: 'Degen Finance',
    symbol: 'DGEN',
    price: 0.0156,
    priceChange24h: -12.4,
    marketCap: 1560000,
    volume24h: 780000,
    holders: 12450,
    createdAt: '1d ago',
    progress: 100,
    isGraduated: true,
  },
  {
    mint: 'AxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsX',
    name: 'Based Chad',
    symbol: 'CHAD',
    price: 0.00023,
    priceChange24h: 234.5,
    marketCap: 230000,
    volume24h: 89000,
    holders: 1823,
    createdAt: '15m ago',
    progress: 45,
    isGraduated: false,
  },
  {
    mint: 'BxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsY',
    name: 'Wojak Token',
    symbol: 'WOJ',
    price: 0.00067,
    priceChange24h: 45.8,
    marketCap: 670000,
    volume24h: 210000,
    holders: 4521,
    createdAt: '3h ago',
    progress: 85,
    isGraduated: false,
  },
  {
    mint: 'CxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsZ',
    name: 'Gigachad Coin',
    symbol: 'GIGA',
    price: 0.00145,
    priceChange24h: -5.2,
    marketCap: 1450000,
    volume24h: 520000,
    holders: 8934,
    createdAt: '6h ago',
    progress: 100,
    isGraduated: true,
  },
];

type FilterType = 'trending' | 'new' | 'graduating' | 'graduated';

interface FeaturedTokensProps {
  className?: string;
}

export function FeaturedTokens({ className }: FeaturedTokensProps) {
  const [filter, setFilter] = useState<FilterType>('trending');

  const filters: { value: FilterType; label: string; icon: React.ElementType }[] = [
    { value: 'trending', label: 'Trending', icon: Flame },
    { value: 'new', label: 'New', icon: Sparkles },
    { value: 'graduating', label: 'Graduating Soon', icon: TrendingUp },
    { value: 'graduated', label: 'Graduated', icon: Star },
  ];

  const filteredTokens = mockTokens.filter((token) => {
    switch (filter) {
      case 'trending':
        return token.priceChange24h > 0;
      case 'new':
        return token.createdAt.includes('m') || token.createdAt.includes('h');
      case 'graduating':
        return !token.isGraduated && token.progress >= 70;
      case 'graduated':
        return token.isGraduated;
      default:
        return true;
    }
  });

  const formatPrice = (price: number) => {
    if (price < 0.00001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1000000) return `$${(cap / 1000000).toFixed(2)}M`;
    if (cap >= 1000) return `$${(cap / 1000).toFixed(1)}K`;
    return `$${cap.toFixed(0)}`;
  };

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Featured Tokens
            </h2>
            <p className="text-muted-foreground">
              Discover the hottest launches on Solana
            </p>
          </div>
          <Link href="/explore">
            <Button variant="outline">
              View All Tokens
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              <f.icon className="h-4 w-4" />
              {f.label}
            </button>
          ))}
        </div>

        {/* Token Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTokens.map((token) => (
            <Link
              key={token.mint}
              href={`/token/${token.mint}`}
              className="card hover:border-primary/50 transition-all group"
            >
              {/* Token Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    {token.image ? (
                      <Image
                        src={token.image}
                        alt={token.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        {token.symbol.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {token.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">${token.symbol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {token.createdAt}
                </div>
              </div>

              {/* Price & Change */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-bold">{formatPrice(token.price)}</span>
                <span
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded',
                    token.priceChange24h >= 0
                      ? 'text-green-500 bg-green-500/10'
                      : 'text-red-500 bg-red-500/10'
                  )}
                >
                  {token.priceChange24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(token.priceChange24h).toFixed(1)}%
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    MCap
                  </div>
                  <div className="text-sm font-medium">{formatMarketCap(token.marketCap)}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Volume
                  </div>
                  <div className="text-sm font-medium">{formatMarketCap(token.volume24h)}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    Holders
                  </div>
                  <div className="text-sm font-medium">{token.holders.toLocaleString()}</div>
                </div>
              </div>

              {/* Graduation Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Graduation Progress</span>
                  <span className={token.isGraduated ? 'text-green-500' : ''}>
                    {token.isGraduated ? 'Graduated!' : `${token.progress}%`}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      token.isGraduated
                        ? 'bg-green-500'
                        : token.progress >= 70
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                    )}
                    style={{ width: `${token.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tokens found for this filter</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedTokens;
