'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import {
  Wallet,
  Rocket,
  TrendingUp,
  Users,
  DollarSign,
  Coins,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';
import { useDiscount } from '@/hooks/useDiscount';
import { dashboardApi } from '@/lib/api';
import { cn, formatCompact, formatNumber, shortenAddress } from '@/lib/utils';
import { STAKING_TIERS, TIER_COLORS } from '@/lib/constants';
import { TokenCard } from '@/components/shared/TokenCard';

interface CreatorStats {
  tokensLaunched: number;
  totalVolume: number;
  totalFees: number;
  totalHolders: number;
}

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { discount } = useDiscount();

  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const {
    tokens: myTokens,
    isLoading: isLoadingTokens,
    error: tokensError,
  } = useTokens({
    creator: publicKey?.toBase58(),
    autoFetch: connected,
  });

  // Fetch creator stats
  useEffect(() => {
    if (!connected || !publicKey) return;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const result = await dashboardApi.getCreatorStats(publicKey.toBase58());
        setStats(result);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [connected, publicKey]);

  // Not connected state
  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="card text-center py-16 max-w-lg mx-auto">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground mb-8">
            Connect your wallet to view your tokens and analytics
          </p>
          <button onClick={() => setVisible(true)} className="btn-primary">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const tierKey = discount?.tier || 'NONE';
  const tierInfo = STAKING_TIERS[tierKey];
  const tierColor = TIER_COLORS[tierKey];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your tokens and track performance
          </p>
        </div>
        <Link href="/launch" className="btn-primary">
          <Rocket className="h-4 w-4 mr-2" />
          Launch New Token
        </Link>
      </div>

      {/* User Info Card */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Wallet Info */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <p className="font-mono font-semibold">
                {shortenAddress(publicKey?.toBase58() || '', 8)}
              </p>
            </div>
          </div>

          {/* Tier Badge */}
          <div className="md:ml-auto">
            <Link
              href="/staking"
              className={cn(
                'inline-flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors',
                tierColor.bg,
                tierColor.border,
                'hover:opacity-90'
              )}
            >
              <div>
                <p className="text-xs text-muted-foreground">Your Tier</p>
                <p className={cn('font-semibold', tierColor.text)}>{tierInfo.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Fee Discount</p>
                <p className={cn('font-semibold', tierColor.text)}>{tierInfo.discount}%</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tokens Launched</p>
              {isLoadingStats ? (
                <div className="h-6 w-12 bg-secondary rounded animate-pulse" />
              ) : (
                <p className="text-xl font-bold">{stats?.tokensLaunched || myTokens.length}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              {isLoadingStats ? (
                <div className="h-6 w-16 bg-secondary rounded animate-pulse" />
              ) : (
                <p className="text-xl font-bold">${formatCompact(stats?.totalVolume || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Holders</p>
              {isLoadingStats ? (
                <div className="h-6 w-14 bg-secondary rounded animate-pulse" />
              ) : (
                <p className="text-xl font-bold">{formatCompact(stats?.totalHolders || 0)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fees Earned</p>
              {isLoadingStats ? (
                <div className="h-6 w-14 bg-secondary rounded animate-pulse" />
              ) : (
                <p className="text-xl font-bold">${formatCompact(stats?.totalFees || 0)}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* My Tokens */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">My Tokens</h2>
          <Link href="/tokens" className="text-sm text-primary hover:underline">
            View All Tokens
          </Link>
        </div>

        {isLoadingTokens ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : myTokens.length === 0 ? (
          <div className="card text-center py-12">
            <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tokens Yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't launched any tokens. Get started now!
            </p>
            <Link href="/launch" className="btn-primary">
              <Rocket className="h-4 w-4 mr-2" />
              Launch Your First Token
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTokens.slice(0, 6).map((token) => (
              <TokenCard key={token.mint} token={token} />
            ))}
          </div>
        )}

        {myTokens.length > 6 && (
          <div className="text-center mt-6">
            <Link href="/tokens" className="btn-outline">
              View All {myTokens.length} Tokens
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/launch"
            className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Rocket className="h-6 w-6 text-primary mb-2" />
            <p className="font-medium">Launch Token</p>
            <p className="text-sm text-muted-foreground">Create a new token</p>
          </Link>
          <Link
            href="/staking"
            className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
            <p className="font-medium">Stake KR8TIV</p>
            <p className="text-sm text-muted-foreground">Earn rewards & discounts</p>
          </Link>
          <a
            href="https://docs.kr8tiv.io"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <ExternalLink className="h-6 w-6 text-blue-500 mb-2" />
            <p className="font-medium">Documentation</p>
            <p className="text-sm text-muted-foreground">Learn how it works</p>
          </a>
        </div>
      </div>
    </div>
  );
}
