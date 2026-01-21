'use client';

import { useState } from 'react';
import {
  Coins,
  Users,
  TrendingUp,
  DollarSign,
  Flame,
  Droplets,
  PieChart,
  Settings,
  ExternalLink,
  Copy,
  Check,
  BarChart3,
} from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';

interface TokenStats {
  totalSupply: number;
  circulatingSupply: number;
  holders: number;
  marketCap: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  totalBurned: number;
  totalLpAdded: number;
  totalDividends: number;
}

interface TaxConfig {
  burnEnabled: boolean;
  burnPercent: number;
  lpEnabled: boolean;
  lpPercent: number;
  dividendsEnabled: boolean;
  dividendsPercent: number;
  customWalletEnabled: boolean;
  customWalletPercent: number;
  customWalletAddress?: string;
}

interface CreatorDashboardProps {
  tokenName: string;
  tokenSymbol: string;
  tokenMint: string;
  stats: TokenStats;
  taxConfig: TaxConfig;
  onUpdateTaxConfig?: (config: Partial<TaxConfig>) => void;
  isLoading?: boolean;
  className?: string;
}

export function CreatorDashboard({
  tokenName,
  tokenSymbol,
  tokenMint,
  stats,
  taxConfig,
  onUpdateTaxConfig,
  isLoading = false,
  className,
}: CreatorDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'taxes' | 'analytics'>('overview');

  const copyMint = async () => {
    await navigator.clipboard.writeText(tokenMint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateMint = (mint: string) => `${mint.slice(0, 8)}...${mint.slice(-8)}`;

  const statCards = [
    { icon: DollarSign, label: 'Price', value: `$${formatNumber(stats.price, 8)}`, change: stats.priceChange24h },
    { icon: TrendingUp, label: 'Market Cap', value: `$${formatCompact(stats.marketCap)}` },
    { icon: Users, label: 'Holders', value: formatCompact(stats.holders) },
    { icon: BarChart3, label: '24h Volume', value: `$${formatCompact(stats.volume24h)}` },
  ];

  const taxStats = [
    { icon: Flame, label: 'Total Burned', value: formatCompact(stats.totalBurned), color: 'text-orange-500' },
    { icon: Droplets, label: 'LP Added', value: `$${formatCompact(stats.totalLpAdded)}`, color: 'text-blue-500' },
    { icon: Coins, label: 'Dividends Paid', value: `$${formatCompact(stats.totalDividends)}`, color: 'text-green-500' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-2xl font-bold text-white">
              {tokenSymbol.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{tokenName}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>${tokenSymbol}</span>
                <span>•</span>
                <button
                  onClick={copyMint}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {truncateMint(tokenMint)}
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </button>
                <a
                  href={`https://solscan.io/token/${tokenMint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['overview', 'taxes', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 font-medium capitalize transition-colors border-b-2 -mb-[2px]',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-semibold">{stat.value}</p>
                    {stat.change !== undefined && (
                      <p className={cn('text-xs', stat.change >= 0 ? 'text-green-500' : 'text-red-500')}>
                        {stat.change >= 0 ? '+' : ''}{formatNumber(stat.change, 2)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tax Stats */}
          <div className="card">
            <h3 className="font-semibold mb-4">Tax Mechanics Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {taxStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <stat.icon className={cn('h-8 w-8', stat.color)} />
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supply Info */}
          <div className="card">
            <h3 className="font-semibold mb-4">Supply Distribution</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Circulating Supply</span>
                  <span>{formatCompact(stats.circulatingSupply)} / {formatCompact(stats.totalSupply)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(stats.circulatingSupply / stats.totalSupply) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Supply</p>
                  <p className="font-medium">{formatCompact(stats.totalSupply)} {tokenSymbol}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Burned</p>
                  <p className="font-medium text-orange-500">{formatCompact(stats.totalBurned)} {tokenSymbol}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Taxes Tab */}
      {activeTab === 'taxes' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold mb-4">Tax Configuration</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Configure optional tax mechanics for your token. All features are opt-in and disabled by default.
            </p>

            <div className="space-y-6">
              {/* Burn */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Flame className="h-6 w-6 text-orange-500" />
                  <div>
                    <p className="font-medium">Auto-Burn</p>
                    <p className="text-sm text-muted-foreground">Automatically burn tokens on each transaction</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {taxConfig.burnEnabled && (
                    <span className="text-sm">{taxConfig.burnPercent}%</span>
                  )}
                  <button
                    className={cn('toggle', taxConfig.burnEnabled && 'toggle-active')}
                    onClick={() => onUpdateTaxConfig?.({ burnEnabled: !taxConfig.burnEnabled })}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* LP */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Droplets className="h-6 w-6 text-blue-500" />
                  <div>
                    <p className="font-medium">Auto-LP</p>
                    <p className="text-sm text-muted-foreground">Add liquidity automatically on transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {taxConfig.lpEnabled && (
                    <span className="text-sm">{taxConfig.lpPercent}%</span>
                  )}
                  <button
                    className={cn('toggle', taxConfig.lpEnabled && 'toggle-active')}
                    onClick={() => onUpdateTaxConfig?.({ lpEnabled: !taxConfig.lpEnabled })}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* Dividends */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Coins className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium">Holder Dividends</p>
                    <p className="text-sm text-muted-foreground">Distribute rewards to token holders</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {taxConfig.dividendsEnabled && (
                    <span className="text-sm">{taxConfig.dividendsPercent}%</span>
                  )}
                  <button
                    className={cn('toggle', taxConfig.dividendsEnabled && 'toggle-active')}
                    onClick={() => onUpdateTaxConfig?.({ dividendsEnabled: !taxConfig.dividendsEnabled })}
                  >
                    <span className="toggle-thumb" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Advanced analytics coming soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorDashboard;
