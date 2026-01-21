'use client';

import { useState } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  Gift,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowRight,
  Twitter,
  MessageCircle,
  Link as LinkIcon,
  QrCode,
  Trophy,
  Target,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  claimedRewards: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  tierProgress: number;
  tierTarget: number;
}

interface Referral {
  id: string;
  address: string;
  joinedAt: Date;
  volume: number;
  rewardsGenerated: number;
  status: 'active' | 'inactive';
}

// Mock data
const mockStats: ReferralStats = {
  totalReferrals: 47,
  activeReferrals: 32,
  pendingRewards: 2450,
  claimedRewards: 8750,
  tier: 'gold',
  tierProgress: 47,
  tierTarget: 100,
};

const mockReferrals: Referral[] = [
  {
    id: '1',
    address: '7xKXtg...sgAsU',
    joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    volume: 45000,
    rewardsGenerated: 450,
    status: 'active',
  },
  {
    id: '2',
    address: '8yLYuh...thBsV',
    joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    volume: 32000,
    rewardsGenerated: 320,
    status: 'active',
  },
  {
    id: '3',
    address: '9zMZvi...uiCsW',
    joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    volume: 0,
    rewardsGenerated: 0,
    status: 'inactive',
  },
  {
    id: '4',
    address: 'AxNAwj...vjDsX',
    joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    volume: 89000,
    rewardsGenerated: 890,
    status: 'active',
  },
  {
    id: '5',
    address: 'BxOBxk...wkEsY',
    joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    volume: 12000,
    rewardsGenerated: 120,
    status: 'active',
  },
];

const tiers = [
  {
    name: 'Bronze',
    referrals: 0,
    commission: 10,
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    borderColor: 'border-amber-600/20',
  },
  {
    name: 'Silver',
    referrals: 10,
    commission: 15,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
    borderColor: 'border-gray-400/20',
  },
  {
    name: 'Gold',
    referrals: 50,
    commission: 20,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  {
    name: 'Platinum',
    referrals: 100,
    commission: 25,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
  },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Mock referral link
  const referralCode = 'KR8TIV-ABC123';
  const referralLink = `https://kr8tiv.io/ref/${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return `${formatNumber(num)} KR8TIV`;
  };

  const getRelativeTime = (date: Date) => {
    const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const currentTier = tiers.find((t) => t.name.toLowerCase() === mockStats.tier) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Users className="h-5 w-5" />
          <span className="text-sm font-medium">Referral Program</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Earn by Sharing</h1>
        <p className="text-muted-foreground">
          Invite friends to KR8TIV and earn rewards on their trading activity
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="card mb-8 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Your Referral Link</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link and earn {currentTier.commission}% commission on all trading fees from
              your referrals.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Input value={referralLink} readOnly className="pr-24 font-mono text-sm" />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
                  onClick={() => copyToClipboard(referralLink)}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowQR(!showQR)}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground mr-2">Share via:</span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=Join%20KR8TIV%20and%20start%20trading%20meme%20tokens%20on%20Solana!&url=${encodeURIComponent(referralLink)}`,
                    '_blank'
                  )
                }
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={() =>
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}`, '_blank')
                }
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={() => copyToClipboard(referralLink)}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* QR Code Placeholder */}
          {showQR && (
            <div className="lg:w-48">
              <div className="bg-white p-4 rounded-lg">
                <div className="aspect-square bg-gray-200 rounded flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-xl font-bold">{mockStats.totalReferrals}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {mockStats.activeReferrals} active this month
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Rewards</p>
              <p className="text-xl font-bold">{formatCurrency(mockStats.pendingRewards)}</p>
            </div>
          </div>
          <Button size="sm" className="mt-3 w-full">
            Claim Rewards
          </Button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-xl font-bold">{formatCurrency(mockStats.claimedRewards)}</p>
            </div>
          </div>
          <p className="text-xs text-green-500 mt-2">All time earnings</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', currentTier.bgColor)}>
              <Trophy className={cn('h-5 w-5', currentTier.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Tier</p>
              <p className={cn('text-xl font-bold', currentTier.color)}>{currentTier.name}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {currentTier.commission}% commission rate
          </p>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Tier Progress</h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                tier.name.toLowerCase() === mockStats.tier
                  ? cn(tier.bgColor, tier.borderColor)
                  : 'bg-secondary/30 border-transparent'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className={cn('h-5 w-5', tier.color)} />
                <span className={cn('font-semibold', tier.color)}>{tier.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">{tier.referrals}+ referrals</p>
              <p className="text-lg font-bold mt-1">{tier.commission}%</p>
              <p className="text-xs text-muted-foreground">commission</p>
            </div>
          ))}
        </div>

        {nextTier && (
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progress to {nextTier.name}</span>
              <span className="text-sm font-medium">
                {mockStats.tierProgress} / {mockStats.tierTarget} referrals
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', nextTier.bgColor.replace('/10', ''))}
                style={{
                  width: `${(mockStats.tierProgress / mockStats.tierTarget) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {mockStats.tierTarget - mockStats.tierProgress} more referrals to unlock {nextTier.commission}%
              commission
            </p>
          </div>
        )}
      </div>

      {/* Referrals List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Your Referrals</h2>
          <span className="text-sm text-muted-foreground">
            {mockReferrals.length} total referrals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Wallet
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  Joined
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Volume
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                  Your Earnings
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {mockReferrals.map((referral) => (
                <tr
                  key={referral.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30"
                >
                  <td className="py-3 px-4">
                    <code className="text-sm">{referral.address}</code>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {getRelativeTime(referral.joinedAt)}
                  </td>
                  <td className="py-3 px-4 text-right">${formatNumber(referral.volume)}</td>
                  <td className="py-3 px-4 text-right text-green-500">
                    +{formatNumber(referral.rewardsGenerated)} KR8TIV
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        referral.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-500/10 text-gray-500'
                      )}
                    >
                      {referral.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">1. Share Your Link</h3>
            <p className="text-sm text-muted-foreground">
              Share your unique referral link with friends, on social media, or in communities.
            </p>
          </div>
          <div className="card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">2. They Trade</h3>
            <p className="text-sm text-muted-foreground">
              When your referrals sign up and start trading, you earn a percentage of their fees.
            </p>
          </div>
          <div className="card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Claim your KR8TIV rewards anytime. The more referrals, the higher your tier and commission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
