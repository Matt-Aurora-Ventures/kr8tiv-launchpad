'use client';

import { Users, Coins, TrendingUp, Percent } from 'lucide-react';
import { formatNumber, formatCompact } from '@/lib/utils';
import { StakingPool } from '@/lib/api';

interface StakingStatsProps {
  pool: StakingPool | null;
  isLoading?: boolean;
}

export function StakingStats({ pool, isLoading }: StakingStatsProps) {
  const stats = [
    {
      icon: Coins,
      label: 'Total Staked',
      value: pool ? formatCompact(pool.totalStaked) : '-',
      suffix: 'KR8TIV',
    },
    {
      icon: Users,
      label: 'Total Stakers',
      value: pool ? formatCompact(pool.totalStakers) : '-',
      suffix: '',
    },
    {
      icon: TrendingUp,
      label: 'Reward Rate',
      value: pool ? formatNumber(pool.rewardRate, 4) : '-',
      suffix: 'KR8TIV/day',
    },
    {
      icon: Percent,
      label: 'APR',
      value: pool ? formatNumber(pool.apr, 2) : '-',
      suffix: '%',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              {isLoading ? (
                <div className="h-6 w-20 bg-secondary rounded animate-pulse" />
              ) : (
                <p className="font-semibold">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-muted-foreground text-sm ml-1">{stat.suffix}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StakingStats;
