'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  PieChart,
  History,
  Settings,
  Star,
  Rocket,
  Gift,
  BarChart3,
  Activity,
  Clock,
  Coins,
} from 'lucide-react';
import { cn, formatNumber, formatCompact, shortenAddress } from '@/lib/utils';
import { PortfolioTracker } from '@/components/portfolio/PortfolioTracker';
import { Watchlist } from '@/components/portfolio/Watchlist';
import { TransactionHistory } from '@/components/transactions/TransactionHistory';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';

interface UserStats {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  tokensLaunched: number;
  tokensHeld: number;
  stakingRewards: number;
  totalVolume: number;
  memberSince: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export default function ProfilePage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'watchlist' | 'history' | 'achievements'>('portfolio');
  const [copied, setCopied] = useState(false);

  // Mock user stats
  const [stats] = useState<UserStats>({
    totalValue: 125430,
    totalPnL: 34250,
    totalPnLPercent: 37.5,
    tokensLaunched: 3,
    tokensHeld: 12,
    stakingRewards: 2450,
    totalVolume: 85000,
    memberSince: '2024-01-01',
  });

  // Mock achievements
  const achievements: Achievement[] = [
    {
      id: 'first_launch',
      title: 'Token Creator',
      description: 'Launch your first token',
      icon: <Rocket className="h-5 w-5" />,
      unlocked: true,
    },
    {
      id: 'staker',
      title: 'Staking Pro',
      description: 'Stake 10,000+ KR8TIV tokens',
      icon: <Coins className="h-5 w-5" />,
      unlocked: true,
    },
    {
      id: 'early_bird',
      title: 'Early Adopter',
      description: 'One of the first 1000 users',
      icon: <Star className="h-5 w-5" />,
      unlocked: true,
    },
    {
      id: 'diamond_hands',
      title: 'Diamond Hands',
      description: 'Hold tokens for 30+ days',
      icon: <TrendingUp className="h-5 w-5" />,
      unlocked: false,
      progress: 15,
      maxProgress: 30,
    },
    {
      id: 'volume_king',
      title: 'Volume King',
      description: 'Trade $100K+ volume',
      icon: <BarChart3 className="h-5 w-5" />,
      unlocked: false,
      progress: 85000,
      maxProgress: 100000,
    },
    {
      id: 'community',
      title: 'Community Builder',
      description: 'Refer 10 new users',
      icon: <Gift className="h-5 w-5" />,
      unlocked: false,
      progress: 4,
      maxProgress: 10,
    },
  ];

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      toast({ type: 'success', title: 'Copied', message: 'Address copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            Connect your Solana wallet to view your profile and portfolio.
          </p>
          <Button size="lg" onClick={() => setVisible(true)}>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {shortenAddress(publicKey?.toString() || '').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg">
                  {shortenAddress(publicKey?.toString() || '')}
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
                  href={`https://solscan.io/account/${publicKey?.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-secondary rounded transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Member since {new Date(stats.memberSince).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <PieChart className="h-4 w-4" />
            <span className="text-xs">Portfolio Value</span>
          </div>
          <span className="text-xl font-bold">${formatCompact(stats.totalValue)}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs">Total P&L</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-xl font-bold',
                stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {stats.totalPnL >= 0 ? '+' : ''}${formatCompact(stats.totalPnL)}
            </span>
            <span
              className={cn(
                'text-sm',
                stats.totalPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              ({stats.totalPnLPercent >= 0 ? '+' : ''}{formatNumber(stats.totalPnLPercent, 1)}%)
            </span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Rocket className="h-4 w-4" />
            <span className="text-xs">Tokens Launched</span>
          </div>
          <span className="text-xl font-bold">{stats.tokensLaunched}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Gift className="h-4 w-4" />
            <span className="text-xs">Staking Rewards</span>
          </div>
          <span className="text-xl font-bold">${formatCompact(stats.stakingRewards)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { id: 'portfolio', label: 'Portfolio', icon: PieChart },
            { id: 'watchlist', label: 'Watchlist', icon: Star },
            { id: 'history', label: 'History', icon: History },
            { id: 'achievements', label: 'Achievements', icon: Gift },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'portfolio' && (
          <PortfolioTracker
            solBalance={45.23}
            solPrice={150}
            tokens={[
              {
                mint: 'token1',
                symbol: 'KR8TIV',
                name: 'KR8TIV Token',
                balance: 50000,
                price: 0.052,
                priceChange24h: 12.5,
                value: 2600,
              },
              {
                mint: 'token2',
                symbol: 'MEME',
                name: 'Meme Token',
                balance: 1000000,
                price: 0.001,
                priceChange24h: -5.2,
                value: 1000,
              },
            ]}
          />
        )}

        {activeTab === 'watchlist' && <Watchlist />}

        {activeTab === 'history' && (
          <TransactionHistory tokenMint={publicKey?.toString()} />
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  'card transition-all',
                  achievement.unlocked
                    ? 'border-primary/50 bg-primary/5'
                    : 'opacity-70'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      achievement.unlocked
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{achievement.title}</h3>
                      {achievement.unlocked && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>
                            {formatCompact(achievement.progress)} / {formatCompact(achievement.maxProgress!)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${(achievement.progress / achievement.maxProgress!) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
