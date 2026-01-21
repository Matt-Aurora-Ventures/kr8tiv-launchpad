'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useToken } from '@/hooks/useTokens';
import { cn, shortenAddress, formatNumber, formatCompact, copyToClipboard, formatDate } from '@/lib/utils';
import { TaxBadges } from '@/components/shared/TaxBadges';
import { FeeBreakdownChart } from '@/components/shared/FeeBreakdownChart';

export default function TokenDetailPage() {
  const params = useParams();
  const mint = params.mint as string;
  const { token, isLoading, error } = useToken(mint);
  const [copiedMint, setCopiedMint] = useState(false);

  const handleCopyMint = async () => {
    const success = await copyToClipboard(mint);
    if (success) {
      setCopiedMint(true);
      setTimeout(() => setCopiedMint(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="card text-center py-12">
          <p className="text-destructive mb-4">{error || 'Token not found'}</p>
          <Link href="/tokens" className="btn-outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tokens
          </Link>
        </div>
      </div>
    );
  }

  const priceChangePositive = token.stats.priceChange24h >= 0;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Back Link */}
      <Link
        href="/tokens"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tokens
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
        {/* Token Image & Name */}
        <div className="flex items-center gap-4">
          {token.image ? (
            <img
              src={token.image}
              alt={token.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {token.symbol.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{token.name}</h1>
            <p className="text-xl text-muted-foreground">${token.symbol}</p>
          </div>
        </div>

        {/* Price & Change */}
        <div className="md:ml-auto text-left md:text-right">
          <p className="text-3xl font-bold">${formatNumber(token.stats.price, 6)}</p>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium',
              priceChangePositive
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            )}
          >
            {priceChangePositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(token.stats.priceChange24h).toFixed(2)}% (24h)
          </div>
        </div>
      </div>

      {/* Tax Badges */}
      <TaxBadges taxConfig={token.taxConfig} showEmpty className="mb-8" />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
              <p className="text-xl font-bold">${formatCompact(token.stats.marketCap)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-muted-foreground mb-1">Volume (24h)</p>
              <p className="text-xl font-bold">${formatCompact(token.stats.volume24h)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-muted-foreground mb-1">Holders</p>
              <p className="text-xl font-bold">{formatCompact(token.stats.holders)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-muted-foreground mb-1">Transactions</p>
              <p className="text-xl font-bold">{formatCompact(token.stats.transactions)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <p className="text-muted-foreground">{token.description}</p>
          </div>

          {/* Token Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Token Details</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Mint Address</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{shortenAddress(token.mint, 8)}</span>
                  <button onClick={handleCopyMint} className="btn-ghost h-7 w-7 p-0">
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`https://solscan.io/token/${token.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost h-7 w-7 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Creator</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">{shortenAddress(token.creator, 6)}</span>
                  <a
                    href={`https://solscan.io/account/${token.creator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost h-7 w-7 p-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-semibold">{formatCompact(token.supply)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Decimals</span>
                <span className="font-semibold">{token.decimals}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold">{formatDate(new Date(token.createdAt))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fee Breakdown */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Fee Distribution</h2>
            <FeeBreakdownChart taxConfig={token.taxConfig} />
          </div>

          {/* Quick Links */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <a
                href={`https://solscan.io/token/${token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span>View on Solscan</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={`https://birdeye.so/token/${token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span>View on Birdeye</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={`https://jup.ag/swap/SOL-${token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span>Trade on Jupiter</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
