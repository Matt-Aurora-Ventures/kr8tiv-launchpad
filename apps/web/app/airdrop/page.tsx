'use client';

import { useState } from 'react';
import {
  Gift,
  Wallet,
  Check,
  Clock,
  AlertCircle,
  ChevronRight,
  Twitter,
  MessageCircle,
  Users,
  Rocket,
  Shield,
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  PartyPopper,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface AirdropTask {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  points: number;
  completed: boolean;
  link?: string;
  verification?: 'auto' | 'manual';
}

interface AirdropTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  allocation: string;
  color: string;
  bgColor: string;
}

// Mock data
const mockTasks: AirdropTask[] = [
  {
    id: '1',
    name: 'Connect Wallet',
    description: 'Connect your Solana wallet to verify eligibility',
    icon: Wallet,
    points: 100,
    completed: true,
    verification: 'auto',
  },
  {
    id: '2',
    name: 'Follow on Twitter',
    description: 'Follow @KR8TIV on Twitter',
    icon: Twitter,
    points: 200,
    completed: true,
    link: 'https://twitter.com/kr8tiv',
    verification: 'auto',
  },
  {
    id: '3',
    name: 'Join Discord',
    description: 'Join the KR8TIV Discord community',
    icon: MessageCircle,
    points: 200,
    completed: true,
    link: 'https://discord.gg/kr8tiv',
    verification: 'auto',
  },
  {
    id: '4',
    name: 'Join Telegram',
    description: 'Join the KR8TIV Telegram group',
    icon: Users,
    points: 200,
    completed: false,
    link: 'https://t.me/kr8tiv',
    verification: 'auto',
  },
  {
    id: '5',
    name: 'Retweet Announcement',
    description: 'Retweet our airdrop announcement post',
    icon: Twitter,
    points: 300,
    completed: false,
    link: 'https://twitter.com/kr8tiv/status/123',
    verification: 'manual',
  },
  {
    id: '6',
    name: 'Launch a Token',
    description: 'Launch any token on KR8TIV platform',
    icon: Rocket,
    points: 500,
    completed: false,
    verification: 'auto',
  },
  {
    id: '7',
    name: 'Make Your First Trade',
    description: 'Complete at least one trade on KR8TIV',
    icon: Shield,
    points: 300,
    completed: true,
    verification: 'auto',
  },
  {
    id: '8',
    name: 'Refer 5 Friends',
    description: 'Invite 5 friends using your referral link',
    icon: Users,
    points: 500,
    completed: false,
    verification: 'auto',
  },
  {
    id: '9',
    name: 'Stake KR8TIV',
    description: 'Stake any amount of KR8TIV tokens',
    icon: Shield,
    points: 400,
    completed: false,
    verification: 'auto',
  },
  {
    id: '10',
    name: 'OG Holder',
    description: 'Hold at least 10,000 KR8TIV before snapshot',
    icon: Sparkles,
    points: 1000,
    completed: false,
    verification: 'auto',
  },
];

const tiers: AirdropTier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    allocation: '100 KR8TIV',
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
  },
  {
    name: 'Silver',
    minPoints: 500,
    maxPoints: 999,
    allocation: '500 KR8TIV',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
  {
    name: 'Gold',
    minPoints: 1000,
    maxPoints: 1999,
    allocation: '1,000 KR8TIV',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    name: 'Platinum',
    minPoints: 2000,
    maxPoints: 2999,
    allocation: '2,500 KR8TIV',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    name: 'Diamond',
    minPoints: 3000,
    maxPoints: Infinity,
    allocation: '5,000 KR8TIV',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
];

export default function AirdropPage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const totalPoints = mockTasks.reduce((sum, task) => (task.completed ? sum + task.points : sum), 0);
  const maxPoints = mockTasks.reduce((sum, task) => sum + task.points, 0);
  const completedTasks = mockTasks.filter((t) => t.completed).length;
  const totalTasks = mockTasks.length;

  const currentTier = tiers.find((t) => totalPoints >= t.minPoints && totalPoints <= t.maxPoints) || tiers[0];
  const nextTier = tiers.find((t) => t.minPoints > totalPoints);

  // Mock countdown
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Gift className="h-5 w-5" />
          <span className="text-sm font-medium">Airdrop</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">KR8TIV Airdrop</h1>
        <p className="text-muted-foreground">
          Complete tasks to earn points and qualify for the KR8TIV token airdrop
        </p>
      </div>

      {/* Countdown Banner */}
      <div className="card mb-8 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border-primary/30">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center">
              <Clock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Airdrop Ends In</h2>
              <p className="text-3xl font-bold">
                {daysLeft} Days <span className="text-xl text-muted-foreground">remaining</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Total Pool</p>
            <p className="text-2xl font-bold gradient-text">10,000,000 KR8TIV</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Points</p>
              <p className="text-xl font-bold">{totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', currentTier.bgColor)}>
              <Gift className={cn('h-5 w-5', currentTier.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Tier</p>
              <p className={cn('text-xl font-bold', currentTier.color)}>{currentTier.name}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
              <p className="text-xl font-bold">
                {completedTasks} / {totalTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <PartyPopper className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Allocation</p>
              <p className="text-xl font-bold">{currentTier.allocation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Tier Progress</h2>

        <div className="grid grid-cols-5 gap-2 mb-6">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={cn(
                'p-3 rounded-lg border-2 text-center transition-all',
                totalPoints >= tier.minPoints
                  ? cn(tier.bgColor, `border-${tier.color.replace('text-', '')}`)
                  : 'bg-secondary/30 border-transparent'
              )}
            >
              <p className={cn('font-semibold text-sm', totalPoints >= tier.minPoints ? tier.color : 'text-muted-foreground')}>
                {tier.name}
              </p>
              <p className="text-xs text-muted-foreground">{tier.minPoints}+ pts</p>
              <p className="text-sm font-bold mt-1">{tier.allocation}</p>
            </div>
          ))}
        </div>

        {nextTier && (
          <div className="p-4 rounded-lg bg-secondary/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progress to {nextTier.name}</span>
              <span className="text-sm font-medium">
                {totalPoints} / {nextTier.minPoints} points
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
                style={{ width: `${Math.min((totalPoints / nextTier.minPoints) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {nextTier.minPoints - totalPoints} more points to unlock {nextTier.allocation}
            </p>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Complete Tasks to Earn Points</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>Tasks are verified automatically or manually</span>
          </div>
        </div>

        <div className="space-y-3">
          {mockTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-lg border transition-all',
                task.completed
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-secondary/30 border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
                    task.completed ? 'bg-green-500/20' : 'bg-secondary'
                  )}
                >
                  {task.completed ? (
                    <Check className="h-6 w-6 text-green-500" />
                  ) : (
                    <task.icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{task.name}</h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        task.completed
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      +{task.points} pts
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {task.completed ? (
                    <span className="text-green-500 text-sm font-medium">Completed</span>
                  ) : task.link ? (
                    <Button
                      size="sm"
                      onClick={() => window.open(task.link, '_blank')}
                    >
                      Complete
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline">
                      Verify
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Important Information
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Airdrop tokens will be distributed within 7 days after the campaign ends</li>
            <li>• You must complete at least 3 tasks to be eligible</li>
            <li>• Wallet must remain connected during verification</li>
            <li>• Multiple accounts will be disqualified</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Anti-Sybil Measures
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• All participants are verified for unique identity</li>
            <li>• Social accounts must be at least 30 days old</li>
            <li>• On-chain activity is analyzed for authenticity</li>
            <li>• Suspicious accounts will be removed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
