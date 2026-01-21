'use client';

import { useState } from 'react';
import {
  Trophy,
  Star,
  Rocket,
  Zap,
  Target,
  Crown,
  Shield,
  Flame,
  Diamond,
  Heart,
  Gift,
  Clock,
  Users,
  TrendingUp,
  Award,
  Medal,
  Lock,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'trading' | 'social' | 'loyalty' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  reward?: string;
}

// Mock achievements
const mockAchievements: Achievement[] = [
  // Trading Achievements
  {
    id: '1',
    name: 'First Trade',
    description: 'Complete your first trade on KR8TIV',
    icon: Rocket,
    category: 'trading',
    rarity: 'common',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    reward: '10 KR8TIV',
  },
  {
    id: '2',
    name: 'Volume Trader',
    description: 'Achieve $10,000 in total trading volume',
    icon: TrendingUp,
    category: 'trading',
    rarity: 'rare',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    reward: '50 KR8TIV',
  },
  {
    id: '3',
    name: 'Whale',
    description: 'Achieve $100,000 in total trading volume',
    icon: Diamond,
    category: 'trading',
    rarity: 'epic',
    unlocked: false,
    progress: 45000,
    maxProgress: 100000,
    reward: '500 KR8TIV',
  },
  {
    id: '4',
    name: 'Market Maker',
    description: 'Achieve $1,000,000 in total trading volume',
    icon: Crown,
    category: 'trading',
    rarity: 'legendary',
    unlocked: false,
    progress: 45000,
    maxProgress: 1000000,
    reward: '5,000 KR8TIV',
  },
  {
    id: '5',
    name: 'Lucky 10x',
    description: 'Make a trade with 10x profit or more',
    icon: Sparkles,
    category: 'trading',
    rarity: 'epic',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    reward: '200 KR8TIV',
  },
  {
    id: '6',
    name: 'Winning Streak',
    description: 'Win 10 trades in a row',
    icon: Flame,
    category: 'trading',
    rarity: 'rare',
    unlocked: false,
    progress: 6,
    maxProgress: 10,
    reward: '100 KR8TIV',
  },

  // Social Achievements
  {
    id: '7',
    name: 'Socialite',
    description: 'Refer 5 friends to KR8TIV',
    icon: Users,
    category: 'social',
    rarity: 'common',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    reward: '25 KR8TIV',
  },
  {
    id: '8',
    name: 'Influencer',
    description: 'Refer 50 friends to KR8TIV',
    icon: Star,
    category: 'social',
    rarity: 'epic',
    unlocked: false,
    progress: 32,
    maxProgress: 50,
    reward: '500 KR8TIV',
  },
  {
    id: '9',
    name: 'Ambassador',
    description: 'Refer 100 friends to KR8TIV',
    icon: Award,
    category: 'social',
    rarity: 'legendary',
    unlocked: false,
    progress: 32,
    maxProgress: 100,
    reward: '2,500 KR8TIV',
  },
  {
    id: '10',
    name: 'Community Helper',
    description: 'Leave 50 helpful comments on tokens',
    icon: Heart,
    category: 'social',
    rarity: 'rare',
    unlocked: false,
    progress: 23,
    maxProgress: 50,
    reward: '75 KR8TIV',
  },

  // Loyalty Achievements
  {
    id: '11',
    name: 'Staker',
    description: 'Stake your first KR8TIV tokens',
    icon: Shield,
    category: 'loyalty',
    rarity: 'common',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    reward: '15 KR8TIV',
  },
  {
    id: '12',
    name: 'Diamond Hands',
    description: 'Stake KR8TIV for 30 days',
    icon: Diamond,
    category: 'loyalty',
    rarity: 'rare',
    unlocked: false,
    progress: 18,
    maxProgress: 30,
    reward: '100 KR8TIV',
  },
  {
    id: '13',
    name: 'True Believer',
    description: 'Stake KR8TIV for 365 days',
    icon: Medal,
    category: 'loyalty',
    rarity: 'legendary',
    unlocked: false,
    progress: 18,
    maxProgress: 365,
    reward: '2,000 KR8TIV',
  },
  {
    id: '14',
    name: 'Voter',
    description: 'Vote on 10 governance proposals',
    icon: Target,
    category: 'loyalty',
    rarity: 'rare',
    unlocked: false,
    progress: 4,
    maxProgress: 10,
    reward: '50 KR8TIV',
  },

  // Special Achievements
  {
    id: '15',
    name: 'Early Adopter',
    description: 'Joined KR8TIV in the first month',
    icon: Clock,
    category: 'special',
    rarity: 'legendary',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    reward: 'Exclusive NFT',
  },
  {
    id: '16',
    name: 'Token Creator',
    description: 'Launch your first token on KR8TIV',
    icon: Rocket,
    category: 'special',
    rarity: 'rare',
    unlocked: false,
    reward: '100 KR8TIV',
  },
  {
    id: '17',
    name: 'Successful Launch',
    description: 'Launch a token that graduates to Raydium',
    icon: Trophy,
    category: 'special',
    rarity: 'epic',
    unlocked: false,
    reward: '1,000 KR8TIV',
  },
  {
    id: '18',
    name: 'Beta Tester',
    description: 'Participated in the KR8TIV beta',
    icon: Zap,
    category: 'special',
    rarity: 'legendary',
    unlocked: true,
    unlockedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    reward: 'OG Badge',
  },
];

type CategoryType = 'all' | 'trading' | 'social' | 'loyalty' | 'special';
type FilterType = 'all' | 'unlocked' | 'locked';

export default function AchievementsPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');

  const filteredAchievements = mockAchievements.filter((achievement) => {
    if (categoryFilter !== 'all' && achievement.category !== categoryFilter) return false;
    if (statusFilter === 'unlocked' && !achievement.unlocked) return false;
    if (statusFilter === 'locked' && achievement.unlocked) return false;
    return true;
  });

  const unlockedCount = mockAchievements.filter((a) => a.unlocked).length;
  const totalCount = mockAchievements.length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  const getRarityStyles = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          gradient: 'from-gray-400 to-gray-500',
        };
      case 'rare':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          gradient: 'from-blue-400 to-blue-500',
        };
      case 'epic':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/30',
          text: 'text-purple-400',
          gradient: 'from-purple-400 to-purple-500',
        };
      case 'legendary':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          gradient: 'from-yellow-400 to-yellow-500',
        };
    }
  };

  const categories: { value: CategoryType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'trading', label: 'Trading' },
    { value: 'social', label: 'Social' },
    { value: 'loyalty', label: 'Loyalty' },
    { value: 'special', label: 'Special' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Trophy className="h-5 w-5" />
          <span className="text-sm font-medium">Achievements</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Badges</h1>
        <p className="text-muted-foreground">
          Complete achievements to earn badges and rewards
        </p>
      </div>

      {/* Progress Overview */}
      <div className="card mb-8 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-2">Overall Progress</h2>
            <p className="text-3xl font-bold mb-2">
              {unlockedCount} / {totalCount} Achievements
            </p>
            <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{completionPercent}% complete</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:w-64">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-yellow-400">
                {mockAchievements.filter((a) => a.unlocked && a.rarity === 'legendary').length}
              </p>
              <p className="text-xs text-muted-foreground">Legendary</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-purple-400">
                {mockAchievements.filter((a) => a.unlocked && a.rarity === 'epic').length}
              </p>
              <p className="text-xs text-muted-foreground">Epic</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setCategoryFilter(category.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                categoryFilter === category.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 md:ml-auto">
          {(['all', 'unlocked', 'locked'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-colors capitalize',
                statusFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const styles = getRarityStyles(achievement.rarity);

          return (
            <div
              key={achievement.id}
              className={cn(
                'card border-2 transition-all',
                achievement.unlocked
                  ? cn(styles.bg, styles.border)
                  : 'bg-secondary/30 border-border opacity-60'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0',
                    achievement.unlocked
                      ? `bg-gradient-to-br ${styles.gradient}`
                      : 'bg-secondary'
                  )}
                >
                  {achievement.unlocked ? (
                    <achievement.icon className="h-7 w-7 text-white" />
                  ) : (
                    <Lock className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{achievement.name}</h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full capitalize',
                        styles.bg,
                        styles.text
                      )}
                    >
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>

                  {/* Progress or Unlocked Date */}
                  {achievement.unlocked ? (
                    <div className="flex items-center gap-1 text-xs text-green-500">
                      <Check className="h-3 w-3" />
                      Unlocked{' '}
                      {achievement.unlockedAt &&
                        new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  ) : (
                    achievement.progress !== undefined &&
                    achievement.maxProgress !== undefined && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span>
                            {achievement.progress} / {achievement.maxProgress}
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full bg-gradient-to-r', styles.gradient)}
                            style={{
                              width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}

                  {/* Reward */}
                  {achievement.reward && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <Gift className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">Reward:</span>
                      <span className="font-medium">{achievement.reward}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="card text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Achievements Found</h3>
          <p className="text-muted-foreground">Try adjusting your filters to see more achievements.</p>
        </div>
      )}
    </div>
  );
}
