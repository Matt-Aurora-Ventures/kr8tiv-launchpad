'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  Share2,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Droplets,
  Wallet,
  BarChart3,
  Activity,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatNumber, formatCompact, shortenAddress } from '@/lib/utils';
import { PriceChart } from '@/components/charts/PriceChart';
import { BondingCurve } from '@/components/charts/BondingCurve';
import { LiquidityPool } from '@/components/charts/LiquidityPool';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { ShareButtons } from '@/components/social/ShareButtons';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image?: string;
  creator: string;
  createdAt: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  totalSupply: number;
  circulatingSupply: number;
  bondingProgress: number;
  isGraduated: boolean;
  liquidity: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export default function TokenDetailPage() {
  const params = useParams();
  const mint = params.mint as string;
  const { toast } = useToast();

  const [token, setToken] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'bonding' | 'liquidity' | 'txns'>('chart');

  // Mock data - replace with API call
  useEffect(() => {
    const fetchToken = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setToken({
        mint,
        name: 'KR8TIV Token',
        symbol: 'KR8TIV',
        description: 'The native token for the KR8TIV Launchpad ecosystem. Stake to earn rewards, participate in governance, and get discounts on launch fees.',
        image: '/tokens/kr8tiv.png',
        creator: '9WzDX...4Kp2',
        createdAt: '2024-01-15T00:00:00Z',
        price: 0.0524,
        priceChange24h: 12.5,
        marketCap: 5240000,
        volume24h: 1250000,
        holders: 4521,
        totalSupply: 100000000,
        circulatingSupply: 42000000,
        bondingProgress: 75,
        isGraduated: false,
        liquidity: 850000,
        website: 'https://kr8tiv.io',
        twitter: 'kr8tiv_io',
        telegram: 'kr8tiv_official',
        discord: 'kr8tiv',
      });
      setIsLoading(false);
    };

    fetchToken();
  }, [mint]);

  const copyAddress = () => {
    navigator.clipboard.writeText(mint);
    setCopied(true);
    toast({
      type: 'success',
      title: 'Address Copied',
      message: 'Token address copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleWatchlist = () => {
    setIsWatchlisted(!isWatchlisted);
    toast({
      type: isWatchlisted ? 'info' : 'success',
      title: isWatchlisted ? 'Removed from Watchlist' : 'Added to Watchlist',
      message: isWatchlisted
        ? `${token?.symbol} removed from your watchlist`
        : `${token?.symbol} added to your watchlist`,
    });
  };

  if (isLoading || !token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-secondary rounded" />
          <div className="flex gap-6">
            <div className="h-24 w-24 bg-secondary rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-8 w-48 bg-secondary rounded" />
              <div className="h-4 w-32 bg-secondary rounded" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-secondary rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-secondary rounded-lg" />
        </div>
      </div>
    );
  }

  const isPositive = token.priceChange24h >= 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explore
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          {/* Token Image */}
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {token.symbol.slice(0, 2)}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{token.name}</h1>
              <span className="px-2 py-1 text-sm bg-secondary rounded-lg">{token.symbol}</span>
              {token.isGraduated ? (
                <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded-full flex items-center gap-1">
                  <Check className="h-3 w-3" /> Graduated
                </span>
              ) : (
                <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Bonding
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">
                {shortenAddress(mint)}
              </span>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <a
                href={`https://solscan.io/token/${mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </div>

            <p className="text-sm text-muted-foreground mt-2 max-w-lg">
              {token.description}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-3">
              {token.website && (
                <a
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Website
                </a>
              )}
              {token.twitter && (
                <a
                  href={`https://twitter.com/${token.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Twitter
                </a>
              )}
              {token.telegram && (
                <a
                  href={`https://t.me/${token.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Telegram
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleWatchlist}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              isWatchlisted
                ? 'border-yellow-500 text-yellow-500'
                : 'border-border hover:border-primary'
            )}
          >
            <Star className={cn('h-5 w-5', isWatchlisted && 'fill-yellow-500')} />
          </button>
          <ShareButtons
            title={`Check out ${token.name} (${token.symbol})`}
            url={`https://kr8tiv.io/token/${mint}`}
            description={token.description}
          />
          <Button>Buy {token.symbol}</Button>
        </div>
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Price</span>
          </div>
          <div className="flex items-baseline gap-2">
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
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Wallet className="h-4 w-4" />
            <span className="text-xs">Market Cap</span>
          </div>
          <span className="text-xl font-bold">${formatCompact(token.marketCap)}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs">24h Volume</span>
          </div>
          <span className="text-xl font-bold">${formatCompact(token.volume24h)}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Droplets className="h-4 w-4" />
            <span className="text-xs">Liquidity</span>
          </div>
          <span className="text-xl font-bold">${formatCompact(token.liquidity)}</span>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs">Holders</span>
          </div>
          <span className="text-lg font-semibold">{formatCompact(token.holders)}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Lock className="h-4 w-4" />
            <span className="text-xs">Total Supply</span>
          </div>
          <span className="text-lg font-semibold">{formatCompact(token.totalSupply)}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Circulating</span>
          </div>
          <span className="text-lg font-semibold">{formatCompact(token.circulatingSupply)}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Created</span>
          </div>
          <span className="text-lg font-semibold">
            {new Date(token.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Bonding Progress (if not graduated) */}
      {!token.isGraduated && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Bonding Curve Progress</span>
            <span className="text-sm text-muted-foreground">{token.bondingProgress}%</span>
          </div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
              style={{ width: `${token.bondingProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Current: ${formatCompact(token.marketCap)}</span>
            <span>Graduation: ${formatCompact(69000)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-4">
          {[
            { id: 'chart', label: 'Price Chart' },
            { id: 'bonding', label: 'Bonding Curve' },
            { id: 'liquidity', label: 'Liquidity' },
            { id: 'txns', label: 'Transactions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'chart' && (
          <PriceChart
            tokenMint={mint}
            currentPrice={token.price}
            priceChange24h={token.priceChange24h}
          />
        )}
        {activeTab === 'bonding' && (
          <BondingCurve
            currentProgress={token.bondingProgress}
            currentPrice={token.price}
            marketCap={token.marketCap}
            graduationThreshold={69000}
          />
        )}
        {activeTab === 'liquidity' && (
          <LiquidityPool
            tvl={token.liquidity}
            volume24h={token.volume24h}
            fees24h={token.volume24h * 0.003}
            tokenSymbol={token.symbol}
          />
        )}
        {activeTab === 'txns' && (
          <TransactionHistory tokenMint={mint} />
        )}
      </div>

      {/* Risk Warning */}
      <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-500">Risk Warning</p>
          <p className="text-sm text-muted-foreground mt-1">
            Trading meme tokens involves significant risk. Never invest more than you can afford to
            lose. Always DYOR (Do Your Own Research) before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
