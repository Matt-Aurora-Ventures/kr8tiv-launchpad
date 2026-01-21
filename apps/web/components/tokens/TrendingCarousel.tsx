'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, TrendingUp, Flame, Zap } from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

interface TrendingToken {
  mint: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  rank: number;
}

interface TrendingCarouselProps {
  tokens?: TrendingToken[];
  isLoading?: boolean;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  className?: string;
}

export function TrendingCarousel({
  tokens = [],
  isLoading = false,
  autoScroll = true,
  autoScrollInterval = 5000,
  className,
}: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, [tokens]);

  // Auto scroll
  useEffect(() => {
    if (!autoScroll || isPaused || tokens.length === 0) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        // Reset to start
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Scroll one card
        scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
      }
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, autoScrollInterval, isPaused, tokens.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">Trending</h3>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-48 h-24 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">Trending</h3>
          <span className="text-xs text-muted-foreground">({tokens.length})</span>
        </div>

        {/* Navigation */}
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              canScrollLeft ? 'hover:bg-secondary' : 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              canScrollRight ? 'hover:bg-secondary' : 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tokens.map((token) => {
          const isPositive = token.priceChange24h >= 0;

          return (
            <Link
              key={token.mint}
              href={`/tokens/${token.mint}`}
              className="flex-shrink-0 w-48 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {token.rank <= 3 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500">
                      #{token.rank}
                    </span>
                  )}
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {token.symbol.slice(0, 2)}
                  </div>
                </div>
                <Zap className="h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="space-y-1">
                <p className="font-semibold truncate">{token.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{token.name}</p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium">${formatNumber(token.price, 4)}</span>
                  <span className={cn(
                    'text-xs flex items-center gap-0.5',
                    isPositive ? 'text-green-500' : 'text-red-500'
                  )}>
                    <TrendingUp className={cn('h-3 w-3', !isPositive && 'rotate-180')} />
                    {formatNumber(Math.abs(token.priceChange24h), 1)}%
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Vol: ${formatCompact(token.volume24h)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Progress dots */}
      {tokens.length > 4 && (
        <div className="flex justify-center gap-1">
          {Array.from({ length: Math.ceil(tokens.length / 4) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === 0 ? 'w-4 bg-primary' : 'w-1.5 bg-secondary'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TrendingCarousel;
