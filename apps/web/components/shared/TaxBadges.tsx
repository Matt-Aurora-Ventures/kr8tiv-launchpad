'use client';

import { Flame, Droplets, Users, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaxConfig } from '@/lib/api';

interface TaxBadgesProps {
  taxConfig: TaxConfig;
  size?: 'sm' | 'md';
  showEmpty?: boolean;
  className?: string;
}

const badges = [
  {
    key: 'burn' as const,
    check: (config: TaxConfig) => config.burnEnabled && config.burnPercent > 0,
    getPercent: (config: TaxConfig) => config.burnPercent,
    icon: Flame,
    label: 'Burn',
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
  {
    key: 'lp' as const,
    check: (config: TaxConfig) => config.lpEnabled && config.lpPercent > 0,
    getPercent: (config: TaxConfig) => config.lpPercent,
    icon: Droplets,
    label: 'LP',
    color: 'text-green-500 bg-green-500/10 border-green-500/20',
  },
  {
    key: 'dividends' as const,
    check: (config: TaxConfig) => config.dividendsEnabled && config.dividendsPercent > 0,
    getPercent: (config: TaxConfig) => config.dividendsPercent,
    icon: Users,
    label: 'Dividends',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    key: 'custom' as const,
    check: (config: TaxConfig) =>
      config.customWalletsEnabled && config.customWallets.some((w) => w.percent > 0),
    getPercent: (config: TaxConfig) =>
      config.customWallets.reduce((sum, w) => sum + w.percent, 0),
    icon: Wallet,
    label: 'Custom',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
];

export function TaxBadges({
  taxConfig,
  size = 'md',
  showEmpty = false,
  className,
}: TaxBadgesProps) {
  const activeBadges = badges.filter((badge) => badge.check(taxConfig));

  if (activeBadges.length === 0) {
    if (showEmpty) {
      return (
        <div className={cn('text-muted-foreground text-sm', className)}>
          No taxes enabled
        </div>
      );
    }
    return null;
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-2.5 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {activeBadges.map((badge) => (
        <div
          key={badge.key}
          className={cn(
            'inline-flex items-center rounded-full border font-medium',
            badge.color,
            sizeClasses
          )}
        >
          <badge.icon className={iconSize} />
          <span>{badge.label}</span>
          <span className="opacity-75">{badge.getPercent(taxConfig)}%</span>
        </div>
      ))}
    </div>
  );
}

export default TaxBadges;
