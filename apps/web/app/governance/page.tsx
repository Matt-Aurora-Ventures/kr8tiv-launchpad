'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Vote,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Coins,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Timer,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'pending';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVotes: number;
  quorum: number;
  startTime: Date;
  endTime: Date;
  category: 'protocol' | 'treasury' | 'governance' | 'other';
}

// Mock proposals
const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Reduce Platform Fee from 1% to 0.5%',
    description:
      'This proposal aims to reduce the platform trading fee from 1% to 0.5% to attract more traders and increase overall volume on the platform.',
    proposer: '7xKXtg...sgAsU',
    status: 'active',
    votesFor: 8500000,
    votesAgainst: 2100000,
    votesAbstain: 400000,
    totalVotes: 11000000,
    quorum: 10000000,
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    category: 'protocol',
  },
  {
    id: '2',
    title: 'Allocate Treasury Funds for Marketing',
    description:
      'Proposal to allocate 500,000 KR8TIV tokens from the treasury for a marketing campaign targeting new users and creators.',
    proposer: '8yLYuh...thBsV',
    status: 'active',
    votesFor: 4200000,
    votesAgainst: 3800000,
    votesAbstain: 1000000,
    totalVotes: 9000000,
    quorum: 10000000,
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    category: 'treasury',
  },
  {
    id: '3',
    title: 'Increase Staking Lock Duration Multipliers',
    description:
      'Adjust the staking multipliers to reward long-term holders more. Proposed changes: 1 month 1.5x, 3 months 2x, 6 months 3x, 1 year 4x.',
    proposer: '9zMZvi...uiCsW',
    status: 'passed',
    votesFor: 12500000,
    votesAgainst: 1500000,
    votesAbstain: 500000,
    totalVotes: 14500000,
    quorum: 10000000,
    startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    category: 'governance',
  },
  {
    id: '4',
    title: 'Add Support for Multi-Sig Wallets',
    description:
      'Implement multi-signature wallet support for token launches, allowing creators to require multiple approvals for critical operations.',
    proposer: 'AxNAwj...vjDsX',
    status: 'rejected',
    votesFor: 3200000,
    votesAgainst: 8800000,
    votesAbstain: 2000000,
    totalVotes: 14000000,
    quorum: 10000000,
    startTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    category: 'protocol',
  },
];

const governanceStats = {
  totalProposals: 47,
  activeProposals: 2,
  passedProposals: 32,
  participationRate: 68.5,
  totalVotingPower: 85000000,
  yourVotingPower: 125000,
};

type FilterType = 'all' | 'active' | 'passed' | 'rejected' | 'pending';
type CategoryType = 'all' | 'protocol' | 'treasury' | 'governance' | 'other';

export default function GovernancePage() {
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const filteredProposals = mockProposals.filter((proposal) => {
    if (statusFilter !== 'all' && proposal.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && proposal.category !== categoryFilter) return false;
    return true;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const getStatusIcon = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Timer className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'passed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getCategoryColor = (category: Proposal['category']) => {
    switch (category) {
      case 'protocol':
        return 'bg-purple-500/10 text-purple-500';
      case 'treasury':
        return 'bg-green-500/10 text-green-500';
      case 'governance':
        return 'bg-blue-500/10 text-blue-500';
      case 'other':
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Vote className="h-5 w-5" />
          <span className="text-sm font-medium">Governance</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">DAO Proposals</h1>
        <p className="text-muted-foreground">
          Participate in governance by voting on proposals that shape the future of KR8TIV
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Vote className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Proposals</p>
              <p className="text-xl font-bold">{governanceStats.totalProposals}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Passed</p>
              <p className="text-xl font-bold">{governanceStats.passedProposals}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Participation Rate</p>
              <p className="text-xl font-bold">{governanceStats.participationRate}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Voting Power</p>
              <p className="text-xl font-bold">{formatNumber(governanceStats.yourVotingPower)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Voting Power CTA */}
      <div className="card bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1">Increase Your Voting Power</h3>
            <p className="text-sm text-muted-foreground">
              Stake more KR8TIV tokens to gain more voting power in governance decisions.
            </p>
          </div>
          <Link href="/staking">
            <Button>
              <Coins className="h-4 w-4 mr-2" />
              Stake KR8TIV
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'passed', 'rejected'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                statusFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap md:ml-auto">
          {(['all', 'protocol', 'treasury', 'governance'] as CategoryType[]).map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize',
                categoryFilter === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <div
            key={proposal.id}
            className="card hover:border-primary/50 transition-all cursor-pointer"
            onClick={() => setSelectedProposal(proposal)}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full border capitalize',
                      getStatusColor(proposal.status)
                    )}
                  >
                    {getStatusIcon(proposal.status)}
                    <span className="ml-1">{proposal.status}</span>
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full capitalize',
                      getCategoryColor(proposal.category)
                    )}
                  >
                    {proposal.category}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2">{proposal.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {proposal.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>by {proposal.proposer}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTimeRemaining(proposal.endTime)}
                  </span>
                </div>
              </div>

              {/* Voting Progress */}
              <div className="md:w-64 md:text-right">
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-green-500 flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      For: {formatNumber(proposal.votesFor)}
                    </span>
                    <span className="text-red-500 flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      Against: {formatNumber(proposal.votesAgainst)}
                    </span>
                  </div>

                  {/* Vote Bar */}
                  <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(proposal.votesFor / proposal.totalVotes) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-gray-400"
                      style={{
                        width: `${(proposal.votesAbstain / proposal.totalVotes) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${(proposal.votesAgainst / proposal.totalVotes) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Quorum Progress */}
                <div className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Quorum</span>
                    <span>
                      {formatNumber(proposal.totalVotes)} / {formatNumber(proposal.quorum)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        proposal.totalVotes >= proposal.quorum ? 'bg-green-500' : 'bg-blue-500'
                      )}
                      style={{
                        width: `${Math.min((proposal.totalVotes / proposal.quorum) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vote Buttons (only for active proposals) */}
            {proposal.status === 'active' && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <Button
                  size="sm"
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle vote
                  }}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Vote For
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle vote
                  }}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Abstain
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle vote
                  }}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Vote Against
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProposals.length === 0 && (
        <div className="card text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Proposals Found</h3>
          <p className="text-muted-foreground">
            No proposals match your current filters. Try adjusting your filters or check back later.
          </p>
        </div>
      )}

      {/* Create Proposal CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Have an idea to improve KR8TIV? You need at least 100,000 KR8TIV staked to create a
          proposal.
        </p>
        <Button variant="outline">
          Create Proposal
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
