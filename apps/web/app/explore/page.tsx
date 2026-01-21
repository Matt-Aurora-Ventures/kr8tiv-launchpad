'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  Star,
  ArrowUpRight,
  Grid,
  List,
  Rocket,
  CheckCircle,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { cn, formatNumber, formatCompact, shortenAddress } from '@/lib/utils';
import { TokenSearch } from '@/components/search';
import { TrendingCarousel } from '@/components/tokens/TrendingCarousel';
import { Button, Select, Slider, RangeSlider, Switch } from '@/components/ui';

interface Token {
  mint: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  liquidity: number;
  bondingProgress: number;
  isGraduated: boolean;
  createdAt: string;
  image?: string;
}

type SortOption = 'trending' | 'newest' | 'market_cap' | 'volume' | 'holders' | 'liquidity';
type ViewMode = 'grid' | 'list';

// Mock data
const MOCK_TOKENS: Token[] = Array.from({ length: 24 }, (_, i) => ({
  mint: `token${i}mint12345`,
  name: `Token ${i + 1}`,
  symbol: `TKN${i + 1}`,
  price: Math.random() * 10,
  priceChange24h: (Math.random() - 0.5) * 40,
  marketCap: Math.random() * 10000000,
  volume24h: Math.random() * 1000000,
  holders: Math.floor(Math.random() * 10000),
  liquidity: Math.random() * 500000,
  bondingProgress: Math.floor(Math.random() * 100),
  isGraduated: Math.random() > 0.7,
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
}));

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    showGraduated: true,
    showBonding: true,
    minMarketCap: 0,
    maxMarketCap: 10000000,
    minVolume: 0,
    minHolders: 0,
    minLiquidity: 0,
  });

  const sortOptions = [
    { value: 'trending', label: 'Trending' },
    { value: 'newest', label: 'Newest' },
    { value: 'market_cap', label: 'Market Cap' },
    { value: 'volume', label: 'Volume (24h)' },
    { value: 'holders', label: 'Holders' },
    { value: 'liquidity', label: 'Liquidity' },
  ];

  const filteredTokens = useMemo(() => {
    let result = [...MOCK_TOKENS];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.symbol.toLowerCase().includes(query) ||
          t.mint.toLowerCase().includes(query)
      );
    }

    // Apply filters
    result = result.filter((t) => {
      if (!filters.showGraduated && t.isGraduated) return false;
      if (!filters.showBonding && !t.isGraduated) return false;
      if (t.marketCap < filters.minMarketCap) return false;
      if (t.marketCap > filters.maxMarketCap) return false;
      if (t.volume24h < filters.minVolume) return false;
      if (t.holders < filters.minHolders) return false;
      if (t.liquidity < filters.minLiquidity) return false;
      return true;
    });

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          return Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'market_cap':
          return b.marketCap - a.marketCap;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'holders':
          return b.holders - a.holders;
        case 'liquidity':
          return b.liquidity - a.liquidity;
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, sortBy, filters]);

  const resetFilters = () => {
    setFilters({
      showGraduated: true,
      showBonding: true,
      minMarketCap: 0,
      maxMarketCap: 10000000,
      minVolume: 0,
      minHolders: 0,
      minLiquidity: 0,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Tokens</h1>
        <p className="text-muted-foreground">
          Discover and trade tokens launched on KR8TIV Launchpad
        </p>
      </div>

      {/* Trending Carousel */}
      <div className="mb-8">
        <TrendingCarousel />
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, symbol, or address..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v as SortOption)}
            options={sortOptions}
            className="w-40"
          />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-3 py-2 rounded-lg border transition-colors flex items-center gap-2',
              showFilters
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary'
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-primary hover:underline"
            >
              Reset all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Token Type */}
            <div className="space-y-3">
              <span className="text-sm font-medium">Token Type</span>
              <div className="space-y-2">
                <Switch
                  label="Graduated"
                  description="Listed on DEX"
                  checked={filters.showGraduated}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, showGraduated: e.target.checked }))
                  }
                  size="sm"
                />
                <Switch
                  label="Bonding"
                  description="Still on curve"
                  checked={filters.showBonding}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, showBonding: e.target.checked }))
                  }
                  size="sm"
                />
              </div>
            </div>

            {/* Market Cap */}
            <div>
              <RangeSlider
                label="Market Cap"
                value={[filters.minMarketCap, filters.maxMarketCap]}
                onChange={([min, max]) =>
                  setFilters((f) => ({ ...f, minMarketCap: min, maxMarketCap: max }))
                }
                min={0}
                max={10000000}
                step={100000}
                formatValue={(v) => `$${formatCompact(v)}`}
              />
            </div>

            {/* Volume */}
            <div>
              <Slider
                label="Min Volume (24h)"
                value={filters.minVolume}
                onChange={(v) => setFilters((f) => ({ ...f, minVolume: v }))}
                min={0}
                max={1000000}
                step={10000}
                formatValue={(v) => `$${formatCompact(v)}`}
              />
            </div>

            {/* Holders */}
            <div>
              <Slider
                label="Min Holders"
                value={filters.minHolders}
                onChange={(v) => setFilters((f) => ({ ...f, minHolders: v }))}
                min={0}
                max={10000}
                step={100}
                formatValue={(v) => formatCompact(v)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredTokens.length} tokens found
        </p>
      </div>

      {/* Token Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTokens.map((token) => (
            <TokenCard key={token.mint} token={token} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-sm text-muted-foreground">
            <div className="col-span-3">Token</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">24h Change</div>
            <div className="col-span-2 text-right">Market Cap</div>
            <div className="col-span-2 text-right">Volume</div>
            <div className="col-span-1"></div>
          </div>
          {filteredTokens.map((token) => (
            <TokenRow key={token.mint} token={token} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredTokens.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tokens found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Token Card Component
function TokenCard({ token }: { token: Token }) {
  const isPositive = token.priceChange24h >= 0;

  return (
    <Link href={`/token/${token.mint}`}>
      <div className="card hover:border-primary transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {token.symbol.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">
                {token.name}
              </h3>
              <p className="text-xs text-muted-foreground">{token.symbol}</p>
            </div>
          </div>
          {token.isGraduated ? (
            <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              DEX
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-1">
              <Rocket className="h-3 w-3" />
              {token.bondingProgress}%
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xl font-bold">${formatNumber(token.price, 4)}</span>
          <span
            className={cn(
              'text-sm flex items-center gap-0.5',
              isPositive ? 'text-green-500' : 'text-red-500'
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatNumber(Math.abs(token.priceChange24h), 2)}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">MCap</span>
            <span>${formatCompact(token.marketCap)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vol</span>
            <span>${formatCompact(token.volume24h)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Holders</span>
            <span>{formatCompact(token.holders)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Liq</span>
            <span>${formatCompact(token.liquidity)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Token Row Component (for list view)
function TokenRow({ token }: { token: Token }) {
  const isPositive = token.priceChange24h >= 0;

  return (
    <Link href={`/token/${token.mint}`}>
      <div className="card py-3 hover:border-primary transition-all duration-200 cursor-pointer">
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Token Info */}
          <div className="col-span-12 md:col-span-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {token.symbol.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{token.name}</h3>
                {token.isGraduated ? (
                  <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                ) : (
                  <Rocket className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{token.symbol}</p>
            </div>
          </div>

          {/* Price */}
          <div className="col-span-4 md:col-span-2 text-right">
            <span className="font-medium">${formatNumber(token.price, 4)}</span>
          </div>

          {/* Change */}
          <div className="col-span-4 md:col-span-2 text-right">
            <span
              className={cn(
                'font-medium flex items-center justify-end gap-1',
                isPositive ? 'text-green-500' : 'text-red-500'
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatNumber(Math.abs(token.priceChange24h), 2)}%
            </span>
          </div>

          {/* Market Cap */}
          <div className="col-span-4 md:col-span-2 text-right">
            <span className="text-muted-foreground">${formatCompact(token.marketCap)}</span>
          </div>

          {/* Volume */}
          <div className="hidden md:block col-span-2 text-right">
            <span className="text-muted-foreground">${formatCompact(token.volume24h)}</span>
          </div>

          {/* Action */}
          <div className="hidden md:flex col-span-1 justify-end">
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
}
