'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface RecentToken {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  price: number;
  priceChange: number;
  marketCap: number;
  createdAt: Date;
  creator: string;
}

// Mock data - would be replaced with real API data
const mockRecentTokens: RecentToken[] = [
  {
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs1',
    name: 'Fresh Meme',
    symbol: 'FRESH',
    price: 0.00001,
    priceChange: 0,
    marketCap: 1000,
    createdAt: new Date(Date.now() - 30000), // 30 seconds ago
    creator: 'Abc...xyz',
  },
  {
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs2',
    name: 'Sol Doge',
    symbol: 'SDOGE',
    price: 0.000015,
    priceChange: 50,
    marketCap: 1500,
    createdAt: new Date(Date.now() - 120000), // 2 minutes ago
    creator: 'Def...uvw',
  },
  {
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs3',
    name: 'Moon Shot',
    symbol: 'MOON',
    price: 0.00002,
    priceChange: 100,
    marketCap: 2000,
    createdAt: new Date(Date.now() - 300000), // 5 minutes ago
    creator: 'Ghi...rst',
  },
  {
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs4',
    name: 'Based Token',
    symbol: 'BASED',
    price: 0.000012,
    priceChange: 20,
    marketCap: 1200,
    createdAt: new Date(Date.now() - 600000), // 10 minutes ago
    creator: 'Jkl...opq',
  },
  {
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs5',
    name: 'Solana Cat',
    symbol: 'SCAT',
    price: 0.00003,
    priceChange: 200,
    marketCap: 3000,
    createdAt: new Date(Date.now() - 900000), // 15 minutes ago
    creator: 'Mno...lmn',
  },
  {
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs6',
    name: 'Rug Proof',
    symbol: 'RUGP',
    price: 0.000018,
    priceChange: 80,
    marketCap: 1800,
    createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
    creator: 'Pqr...ijk',
  },
];

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface RecentLaunchesProps {
  className?: string;
}

export function RecentLaunches({ className }: RecentLaunchesProps) {
  const [tokens, setTokens] = useState(mockRecentTokens);
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens((prev) =>
        prev.map((token) => ({
          ...token,
          priceChange: token.priceChange + (Math.random() - 0.3) * 10,
          price: token.price * (1 + (Math.random() - 0.3) * 0.1),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const copyMint = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(2);
    return price.toFixed(6);
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1000) return `$${(cap / 1000).toFixed(1)}K`;
    return `$${cap.toFixed(0)}`;
  };

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm mb-2">
              <Sparkles className="h-4 w-4" />
              Just Launched
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Recent Launches
            </h2>
            <p className="text-muted-foreground">
              Be early. Discover tokens seconds after they launch.
            </p>
          </div>
          <Link href="/explore?sort=newest">
            <Button variant="outline">
              View All New Tokens
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                    Token
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Change
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Market Cap
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    Launched
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Creator
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr
                    key={token.mint}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Token */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                          {token.image ? (
                            <Image
                              src={token.image}
                              alt={token.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-bold text-primary">
                              {token.symbol.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{token.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              ${token.symbol}
                            </span>
                            <button
                              onClick={() => copyMint(token.mint)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedMint === token.mint ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-mono text-sm">${formatPrice(token.price)}</span>
                    </td>

                    {/* Change */}
                    <td className="py-4 px-4 text-right hidden sm:table-cell">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-sm font-medium',
                          token.priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                        )}
                      >
                        {token.priceChange >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(token.priceChange).toFixed(1)}%
                      </span>
                    </td>

                    {/* Market Cap */}
                    <td className="py-4 px-4 text-right hidden md:table-cell">
                      <span className="text-sm">{formatMarketCap(token.marketCap)}</span>
                    </td>

                    {/* Launched */}
                    <td className="py-4 px-4 text-right">
                      <span className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getRelativeTime(token.createdAt)}
                      </span>
                    </td>

                    {/* Creator */}
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground font-mono">
                        {token.creator}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-center">
                      <Link href={`/token/${token.mint}`}>
                        <Button size="sm" variant="outline" className="h-8">
                          Trade
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            New tokens launch every minute. Set up alerts to never miss a launch.
          </p>
          <Link href="/launch">
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Launch Your Own Token
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default RecentLaunches;
