'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Rocket,
  Crown,
  Medal,
  Award,
  ArrowUpRight,
  Clock,
  Flame,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface TopToken {
  rank: number;
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  graduatedAt?: Date;
}

interface TopTrader {
  rank: number;
  address: string;
  pnl: number;
  pnlPercent: number;
  trades: number;
  winRate: number;
  volume: number;
  bestTrade: {
    token: string;
    profit: number;
  };
}

interface TopCreator {
  rank: number;
  address: string;
  tokensLaunched: number;
  totalVolume: number;
  successRate: number;
  topToken: {
    name: string;
    marketCap: number;
  };
}

// Mock data
const mockTopTokens: TopToken[] = [
  {
    rank: 1,
    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    name: 'Solana Pepe',
    symbol: 'SPEPE',
    price: 0.00042,
    priceChange24h: 156.7,
    marketCap: 4200000,
    volume24h: 1250000,
    holders: 28470,
    graduatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    rank: 2,
    mint: '8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV',
    name: 'Moon Cat',
    symbol: 'MCAT',
    price: 0.00089,
    priceChange24h: 89.2,
    marketCap: 3560000,
    volume24h: 890000,
    holders: 15621,
  },
  {
    rank: 3,
    mint: '9xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsW',
    name: 'Degen Finance',
    symbol: 'DGEN',
    price: 0.0156,
    priceChange24h: -12.4,
    marketCap: 2780000,
    volume24h: 780000,
    holders: 12450,
    graduatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    rank: 4,
    mint: 'AxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsX',
    name: 'Based Chad',
    symbol: 'CHAD',
    price: 0.00023,
    priceChange24h: 234.5,
    marketCap: 2300000,
    volume24h: 690000,
    holders: 18230,
  },
  {
    rank: 5,
    mint: 'BxKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsY',
    name: 'Wojak Token',
    symbol: 'WOJ',
    price: 0.00067,
    priceChange24h: 45.8,
    marketCap: 1890000,
    volume24h: 560000,
    holders: 9521,
  },
];

const mockTopTraders: TopTrader[] = [
  {
    rank: 1,
    address: '7xKXtg...sgAsU',
    pnl: 125000,
    pnlPercent: 847,
    trades: 234,
    winRate: 78.5,
    volume: 890000,
    bestTrade: { token: 'SPEPE', profit: 45000 },
  },
  {
    rank: 2,
    address: '8yLYuh...thBsV',
    pnl: 89000,
    pnlPercent: 523,
    trades: 156,
    winRate: 72.3,
    volume: 670000,
    bestTrade: { token: 'CHAD', profit: 32000 },
  },
  {
    rank: 3,
    address: '9zMZvi...uiCsW',
    pnl: 67000,
    pnlPercent: 412,
    trades: 189,
    winRate: 65.8,
    volume: 540000,
    bestTrade: { token: 'MCAT', profit: 28000 },
  },
  {
    rank: 4,
    address: 'AxNAwj...vjDsX',
    pnl: 52000,
    pnlPercent: 298,
    trades: 312,
    winRate: 58.2,
    volume: 890000,
    bestTrade: { token: 'DGEN', profit: 18000 },
  },
  {
    rank: 5,
    address: 'BxOBxk...wkEsY',
    pnl: 45000,
    pnlPercent: 245,
    trades: 98,
    winRate: 82.1,
    volume: 320000,
    bestTrade: { token: 'WOJ', profit: 15000 },
  },
];

const mockTopCreators: TopCreator[] = [
  {
    rank: 1,
    address: '7xKXtg...sgAsU',
    tokensLaunched: 12,
    totalVolume: 4500000,
    successRate: 75,
    topToken: { name: 'Solana Pepe', marketCap: 4200000 },
  },
  {
    rank: 2,
    address: '8yLYuh...thBsV',
    tokensLaunched: 8,
    totalVolume: 2800000,
    successRate: 62.5,
    topToken: { name: 'Moon Cat', marketCap: 3560000 },
  },
  {
    rank: 3,
    address: '9zMZvi...uiCsW',
    tokensLaunched: 15,
    totalVolume: 2100000,
    successRate: 53.3,
    topToken: { name: 'Based Chad', marketCap: 2300000 },
  },
  {
    rank: 4,
    address: 'AxNAwj...vjDsX',
    tokensLaunched: 6,
    totalVolume: 1800000,
    successRate: 83.3,
    topToken: { name: 'Wojak Token', marketCap: 1890000 },
  },
  {
    rank: 5,
    address: 'BxOBxk...wkEsY',
    tokensLaunched: 4,
    totalVolume: 1200000,
    successRate: 100,
    topToken: { name: 'Degen Finance', marketCap: 2780000 },
  },
];

type TabType = 'tokens' | 'traders' | 'creators';
type TimeRange = '24h' | '7d' | '30d' | 'all';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tokens');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const tabs: { value: TabType; label: string; icon: React.ElementType }[] = [
    { value: 'tokens', label: 'Top Tokens', icon: Rocket },
    { value: 'traders', label: 'Top Traders', icon: TrendingUp },
    { value: 'creators', label: 'Top Creators', icon: Users },
  ];

  const timeRanges: TimeRange[] = ['24h', '7d', '30d', 'all'];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toLocaleString()}`;
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Crown className="h-5 w-5 text-yellow-500" />
          </div>
        );
      case 2:
        return (
          <div className="h-8 w-8 rounded-full bg-gray-400/20 flex items-center justify-center">
            <Medal className="h-5 w-5 text-gray-400" />
          </div>
        );
      case 3:
        return (
          <div className="h-8 w-8 rounded-full bg-amber-600/20 flex items-center justify-center">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">{rank}</span>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Trophy className="h-5 w-5" />
          <span className="text-sm font-medium">Leaderboard</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Top Performers</h1>
        <p className="text-muted-foreground">
          Discover the best tokens, traders, and creators on KR8TIV
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex gap-2 bg-secondary rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-colors uppercase',
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Top Tokens */}
      {activeTab === 'tokens' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                    Token
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    24h Change
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Market Cap
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Volume
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Holders
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTopTokens.map((token) => (
                  <tr
                    key={token.mint}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-4 px-4">{getRankBadge(token.rank)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{token.name}</span>
                            {token.graduatedAt && (
                              <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/10 text-green-500">
                                Graduated
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">${token.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-mono">
                      ${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(4)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={cn(
                          'flex items-center justify-end gap-1',
                          token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        )}
                      >
                        {token.priceChange24h >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {Math.abs(token.priceChange24h).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right hidden md:table-cell">
                      {formatCurrency(token.marketCap)}
                    </td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      {formatCurrency(token.volume24h)}
                    </td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      {formatNumber(token.holders)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Link href={`/token/${token.mint}`}>
                        <Button size="sm" variant="outline" className="h-8">
                          Trade
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Traders */}
      {activeTab === 'traders' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                    Trader
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    PnL
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Win Rate
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Trades
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Volume
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    Best Trade
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTopTraders.map((trader) => (
                  <tr
                    key={trader.address}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-4 px-4">{getRankBadge(trader.rank)}</td>
                    <td className="py-4 px-4">
                      <code className="text-sm">{trader.address}</code>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div>
                        <span className="text-green-500 font-medium">
                          +{formatCurrency(trader.pnl)}
                        </span>
                        <p className="text-xs text-green-500">+{trader.pnlPercent}%</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right hidden md:table-cell">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          trader.winRate >= 70
                            ? 'bg-green-500/10 text-green-500'
                            : trader.winRate >= 50
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                        )}
                      >
                        {trader.winRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">{trader.trades}</td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      {formatCurrency(trader.volume)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div>
                        <span className="text-sm font-medium">${trader.bestTrade.token}</span>
                        <p className="text-xs text-green-500">
                          +{formatCurrency(trader.bestTrade.profit)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Creators */}
      {activeTab === 'creators' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                    Creator
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    Tokens
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Success Rate
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Total Volume
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">
                    Top Token
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockTopCreators.map((creator) => (
                  <tr
                    key={creator.address}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-4 px-4">{getRankBadge(creator.rank)}</td>
                    <td className="py-4 px-4">
                      <code className="text-sm">{creator.address}</code>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Rocket className="h-4 w-4 text-muted-foreground" />
                        {creator.tokensLaunched}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right hidden md:table-cell">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          creator.successRate >= 70
                            ? 'bg-green-500/10 text-green-500'
                            : creator.successRate >= 50
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                        )}
                      >
                        {creator.successRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right hidden lg:table-cell">
                      {formatCurrency(creator.totalVolume)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div>
                        <span className="text-sm font-medium">{creator.topToken.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(creator.topToken.marketCap)} MCap
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-12 text-center">
        <div className="card bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 inline-block">
          <div className="flex flex-col md:flex-row md:items-center gap-4 text-left">
            <div className="h-16 w-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Flame className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Want to be on the leaderboard?</h3>
              <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                Launch your token today and compete with the best on Solana.
              </p>
            </div>
            <Link href="/launch" className="md:ml-8">
              <Button>
                <Rocket className="h-4 w-4 mr-2" />
                Launch Token
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
