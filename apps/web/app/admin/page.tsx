'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Coins,
  Users,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  DollarSign,
  Rocket,
  Ban,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Input } from '@/components/ui';

// Mock data for admin dashboard
const platformStats = {
  totalTokens: 12847,
  tokensToday: 156,
  totalVolume: 847000000,
  volumeToday: 12400000,
  activeUsers: 89421,
  usersToday: 2847,
  totalStaked: 8500000,
  pendingReviews: 23,
  flaggedTokens: 5,
  graduatedTokens: 3241,
};

const recentTokens = [
  {
    id: '1',
    name: 'Moon Cat',
    symbol: 'MCAT',
    creator: '7xKXtg...sgAsU',
    createdAt: '2 minutes ago',
    status: 'active',
    marketCap: 890000,
    flags: 0,
  },
  {
    id: '2',
    name: 'Scam Token',
    symbol: 'SCAM',
    creator: '8yLYuh...thBsV',
    createdAt: '15 minutes ago',
    status: 'flagged',
    marketCap: 45000,
    flags: 12,
  },
  {
    id: '3',
    name: 'Based Chad',
    symbol: 'CHAD',
    creator: '9zMZvi...uiCsW',
    createdAt: '1 hour ago',
    status: 'active',
    marketCap: 1560000,
    flags: 0,
  },
  {
    id: '4',
    name: 'Rug Pull',
    symbol: 'RUG',
    creator: 'AxNAwj...vjDsX',
    createdAt: '2 hours ago',
    status: 'banned',
    marketCap: 0,
    flags: 45,
  },
  {
    id: '5',
    name: 'Solana Pepe',
    symbol: 'SPEPE',
    creator: 'BxOBxk...wkEsY',
    createdAt: '3 hours ago',
    status: 'graduated',
    marketCap: 5200000,
    flags: 0,
  },
];

const pendingReviews = [
  {
    id: '1',
    type: 'token',
    name: 'Suspicious Token',
    reason: 'Similar name to existing project',
    reportedAt: '10 minutes ago',
    reportCount: 5,
  },
  {
    id: '2',
    type: 'token',
    name: 'Fake Bonk',
    reason: 'Impersonation attempt',
    reportedAt: '25 minutes ago',
    reportCount: 12,
  },
  {
    id: '3',
    type: 'user',
    name: '7xKXtg...sgAsU',
    reason: 'Multiple scam tokens created',
    reportedAt: '1 hour ago',
    reportCount: 8,
  },
];

type TabType = 'overview' | 'tokens' | 'users' | 'reviews' | 'settings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { value: TabType; label: string; icon: React.ElementType }[] = [
    { value: 'overview', label: 'Overview', icon: LayoutDashboard },
    { value: 'tokens', label: 'Tokens', icon: Coins },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'reviews', label: 'Reviews', icon: Shield },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
            Active
          </span>
        );
      case 'flagged':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500">
            Flagged
          </span>
        );
      case 'banned':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-500">
            Banned
          </span>
        );
      case 'graduated':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-500">
            Graduated
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                &larr; Back to Site
              </Link>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    activeTab === tab.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                  {tab.value === 'reviews' && platformStats.pendingReviews > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                      {platformStats.pendingReviews}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Coins className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Tokens</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(platformStats.totalTokens)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-500">
                      +{platformStats.tokensToday} today
                    </p>
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Volume</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(platformStats.totalVolume)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-500">
                      +{formatCurrency(platformStats.volumeToday)} today
                    </p>
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Users</p>
                        <p className="text-2xl font-bold">
                          {formatNumber(platformStats.activeUsers)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-green-500">
                      +{platformStats.usersToday} today
                    </p>
                  </div>

                  <div className="card">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Reviews</p>
                        <p className="text-2xl font-bold">{platformStats.pendingReviews}</p>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-500">
                      {platformStats.flaggedTokens} flagged tokens
                    </p>
                  </div>
                </div>

                {/* Recent Tokens */}
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Recent Tokens</h2>
                    <Link href="/admin/tokens">
                      <Button variant="ghost" size="sm">
                        View All
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Token
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Creator
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Created
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                            Market Cap
                          </th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTokens.map((token) => (
                          <tr
                            key={token.id}
                            className="border-b border-border last:border-0 hover:bg-secondary/30"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{token.name}</p>
                                <p className="text-xs text-muted-foreground">${token.symbol}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <code className="text-xs">{token.creator}</code>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {token.createdAt}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(token.status)}</td>
                            <td className="py-3 px-4 text-right">
                              {formatCurrency(token.marketCap)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                {token.status !== 'banned' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pending Reviews */}
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Pending Reviews</h2>
                    <Link href="/admin/reviews">
                      <Button variant="ghost" size="sm">
                        View All
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {pendingReviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'h-10 w-10 rounded-lg flex items-center justify-center',
                              review.type === 'token'
                                ? 'bg-blue-500/10'
                                : 'bg-purple-500/10'
                            )}
                          >
                            {review.type === 'token' ? (
                              <Coins className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Users className="h-5 w-5 text-purple-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{review.name}</p>
                            <p className="text-sm text-muted-foreground">{review.reason}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {review.reportCount} reports • {review.reportedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="text-green-500">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500">
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">Token Management</h2>
                <p className="text-muted-foreground">Token management interface coming soon...</p>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">User Management</h2>
                <p className="text-muted-foreground">User management interface coming soon...</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">Review Queue</h2>
                <p className="text-muted-foreground">Full review queue interface coming soon...</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-6">Platform Settings</h2>
                <p className="text-muted-foreground">Platform settings interface coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
