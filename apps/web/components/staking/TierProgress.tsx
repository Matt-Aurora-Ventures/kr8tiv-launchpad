'use client';

import * as Progress from '@radix-ui/react-progress';
import { Check, ChevronRight, Crown, Star, Shield, Circle } from 'lucide-react';
import { cn, formatNumber, formatCompact } from '@/lib/utils';
import { STAKING_TIERS, TIER_COLORS } from '@/lib/constants';

interface TierProgressProps {
  currentTier: keyof typeof STAKING_TIERS;
  effectiveStake: number;
  className?: string;
}

const tierIcons = {
  NONE: Circle,
  HOLDER: Shield,
  PREMIUM: Star,
  VIP: Crown,
};

const tierOrder: (keyof typeof STAKING_TIERS)[] = ['NONE', 'HOLDER', 'PREMIUM', 'VIP'];

export function TierProgress({ currentTier, effectiveStake, className }: TierProgressProps) {
  const currentTierIndex = tierOrder.indexOf(currentTier);

  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    if (currentTier === 'VIP') return 100;

    const nextTier = tierOrder[currentTierIndex + 1];
    const currentMin = STAKING_TIERS[currentTier].minStake;
    const nextMin = STAKING_TIERS[nextTier].minStake;

    const progress = ((effectiveStake - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const progressToNext = getProgressToNextTier();
  const nextTier = currentTier === 'VIP' ? null : tierOrder[currentTierIndex + 1];
  const amountToNext = nextTier
    ? STAKING_TIERS[nextTier].minStake - effectiveStake
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Current Tier Display */}
      <div className="text-center">
        <div
          className={cn(
            'w-20 h-20 rounded-full mx-auto flex items-center justify-center border-2',
            TIER_COLORS[currentTier].bg,
            TIER_COLORS[currentTier].border
          )}
        >
          {(() => {
            const Icon = tierIcons[currentTier];
            return <Icon className={cn('h-10 w-10', TIER_COLORS[currentTier].text)} />;
          })()}
        </div>
        <h3 className={cn('text-2xl font-bold mt-4', TIER_COLORS[currentTier].text)}>
          {STAKING_TIERS[currentTier].name}
        </h3>
        <p className="text-muted-foreground">
          {STAKING_TIERS[currentTier].discount > 0
            ? `${STAKING_TIERS[currentTier].discount}% fee discount`
            : 'No discount'}
        </p>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to {STAKING_TIERS[nextTier].name}</span>
            <span className="font-medium">{progressToNext.toFixed(1)}%</span>
          </div>
          <Progress.Root
            className="h-3 bg-secondary rounded-full overflow-hidden"
            value={progressToNext}
          >
            <Progress.Indicator
              className={cn(
                'h-full transition-all duration-500 rounded-full bg-gradient-to-r',
                TIER_COLORS[nextTier].gradient
              )}
              style={{ width: `${progressToNext}%` }}
            />
          </Progress.Root>
          <p className="text-xs text-muted-foreground text-center">
            Stake {formatCompact(amountToNext)} more KR8TIV to reach {STAKING_TIERS[nextTier].name}
          </p>
        </div>
      )}

      {/* Tier Ladder */}
      <div className="space-y-3">
        {tierOrder.map((tier, index) => {
          const isCompleted = index < currentTierIndex;
          const isCurrent = tier === currentTier;
          const isNext = index === currentTierIndex + 1;
          const Icon = tierIcons[tier];

          return (
            <div
              key={tier}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border transition-all',
                isCurrent
                  ? cn(TIER_COLORS[tier].bg, TIER_COLORS[tier].border)
                  : isCompleted
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-card border-border opacity-60'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isCurrent
                    ? TIER_COLORS[tier].bg
                    : isCompleted
                    ? 'bg-primary/20'
                    : 'bg-secondary'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isCurrent ? TIER_COLORS[tier].text : 'text-muted-foreground'
                    )}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn('font-semibold', isCurrent && TIER_COLORS[tier].text)}>
                    {STAKING_TIERS[tier].name}
                  </h4>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      Current
                    </span>
                  )}
                  {isNext && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      Next
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tier === 'NONE'
                    ? 'No staking required'
                    : `${formatCompact(STAKING_TIERS[tier].minStake)} KR8TIV required`}
                </p>
              </div>

              {/* Discount */}
              <div className="text-right">
                <p className={cn('font-bold', isCurrent && TIER_COLORS[tier].text)}>
                  {STAKING_TIERS[tier].discount}%
                </p>
                <p className="text-xs text-muted-foreground">discount</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benefits */}
      {STAKING_TIERS[currentTier].benefits.length > 0 && (
        <div className="p-4 bg-background rounded-lg">
          <h4 className="font-medium mb-3">Your Benefits</h4>
          <ul className="space-y-2">
            {STAKING_TIERS[currentTier].benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TierProgress;
