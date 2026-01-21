'use client';

import { useState, useMemo } from 'react';
import { Calculator, Clock, TrendingUp, Percent, ChevronDown } from 'lucide-react';
import { formatNumber, formatCompact } from '@/lib/utils';
import { STAKING_TIERS, LOCK_DURATIONS, StakingTier, LockDuration } from '@kr8tiv/shared';

interface RewardsCalculatorProps {
  currentApr?: number;
  rewardRate?: number;
}

interface ProjectedRewards {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export function RewardsCalculator({ currentApr = 12, rewardRate = 1000 }: RewardsCalculatorProps) {
  const [stakeAmount, setStakeAmount] = useState<string>('10000');
  const [selectedDuration, setSelectedDuration] = useState<LockDuration>('30_DAYS');
  const [showComparison, setShowComparison] = useState(false);

  const amount = parseFloat(stakeAmount) || 0;

  const calculations = useMemo(() => {
    const duration = LOCK_DURATIONS[selectedDuration];
    const weightedStake = amount * duration.multiplier;

    // Determine tier based on stake amount
    let tier: StakingTier = STAKING_TIERS.NONE;
    if (amount >= 100000) tier = STAKING_TIERS.VIP;
    else if (amount >= 10000) tier = STAKING_TIERS.PREMIUM;
    else if (amount >= 1000) tier = STAKING_TIERS.HOLDER;

    // Calculate base rewards (before tier bonus)
    const dailyBase = (weightedStake / 1000000) * rewardRate;

    // Apply tier multiplier
    const tierMultiplier = tier.rewardMultiplierBps / 10000;
    const dailyWithBonus = dailyBase * tierMultiplier;

    const projected: ProjectedRewards = {
      daily: dailyWithBonus,
      weekly: dailyWithBonus * 7,
      monthly: dailyWithBonus * 30,
      yearly: dailyWithBonus * 365,
    };

    // Effective APR considering multipliers
    const effectiveApr = currentApr * duration.multiplier * tierMultiplier;

    return {
      weightedStake,
      tier,
      projected,
      effectiveApr,
      platformFee: tier.platformFeeBps / 100,
      durationDays: duration.days,
      durationMultiplier: duration.multiplier,
      tierMultiplier,
    };
  }, [amount, selectedDuration, currentApr, rewardRate]);

  const comparisonData = useMemo(() => {
    return Object.entries(STAKING_TIERS).map(([key, tier]) => {
      const duration = LOCK_DURATIONS[selectedDuration];
      const weightedStake = amount * duration.multiplier;
      const tierMultiplier = tier.rewardMultiplierBps / 10000;
      const dailyBase = (weightedStake / 1000000) * rewardRate;
      const dailyWithBonus = dailyBase * tierMultiplier;
      const effectiveApr = currentApr * duration.multiplier * tierMultiplier;

      return {
        key,
        tier,
        yearlyRewards: dailyWithBonus * 365,
        effectiveApr,
        minStake: tier.threshold,
        platformFee: tier.platformFeeBps / 100,
      };
    });
  }, [amount, selectedDuration, currentApr, rewardRate]);

  return (
    <div className="card space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Rewards Calculator</h3>
          <p className="text-sm text-muted-foreground">Estimate your staking rewards</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Stake Amount (KR8TIV)</label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="input w-full"
            placeholder="Enter amount to stake"
            min="0"
          />
          <div className="flex gap-2 mt-2">
            {[1000, 10000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                onClick={() => setStakeAmount(preset.toString())}
                className="btn-secondary text-xs py-1 px-2"
              >
                {formatCompact(preset)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lock Duration</label>
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(LOCK_DURATIONS).map(([key, duration]) => (
              <button
                key={key}
                onClick={() => setSelectedDuration(key as LockDuration)}
                className={`btn text-xs py-2 ${
                  selectedDuration === key ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{duration.label}</span>
                  <span className="text-[10px] opacity-70">{duration.multiplier}x</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="border-t pt-4 space-y-4">
        {/* Tier Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Your Tier</span>
          <span className={`badge ${
            calculations.tier.name === 'VIP' ? 'badge-success' :
            calculations.tier.name === 'PREMIUM' ? 'badge-warning' :
            calculations.tier.name === 'HOLDER' ? 'badge-info' : 'badge-secondary'
          }`}>
            {calculations.tier.name}
          </span>
        </div>

        {/* Weighted Stake */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Weighted Stake</span>
          </div>
          <span className="font-semibold">{formatCompact(calculations.weightedStake)} KR8TIV</span>
        </div>

        {/* Effective APR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Effective APR</span>
          </div>
          <span className="font-semibold text-green-500">{formatNumber(calculations.effectiveApr, 2)}%</span>
        </div>

        {/* Platform Fee */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Platform Fee Discount</span>
          <span className="font-semibold">{5 - calculations.platformFee}% off</span>
        </div>

        {/* Projected Rewards */}
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-medium">Projected Rewards</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Daily</p>
              <p className="font-semibold">{formatNumber(calculations.projected.daily, 2)} KR8TIV</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Weekly</p>
              <p className="font-semibold">{formatNumber(calculations.projected.weekly, 2)} KR8TIV</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly</p>
              <p className="font-semibold">{formatNumber(calculations.projected.monthly, 2)} KR8TIV</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly</p>
              <p className="font-semibold text-green-500">{formatCompact(calculations.projected.yearly)} KR8TIV</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Comparison Toggle */}
      <button
        onClick={() => setShowComparison(!showComparison)}
        className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        Compare All Tiers
        <ChevronDown className={`h-4 w-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
      </button>

      {/* Tier Comparison Table */}
      {showComparison && (
        <div className="border-t pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left py-2">Tier</th>
                  <th className="text-right py-2">Min Stake</th>
                  <th className="text-right py-2">Fee</th>
                  <th className="text-right py-2">APR</th>
                  <th className="text-right py-2">Yearly Rewards</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr
                    key={row.key}
                    className={row.tier.name === calculations.tier.name ? 'bg-primary/10' : ''}
                  >
                    <td className="py-2 font-medium">{row.tier.name}</td>
                    <td className="text-right">{formatCompact(row.minStake)}</td>
                    <td className="text-right">{row.platformFee}%</td>
                    <td className="text-right text-green-500">{formatNumber(row.effectiveApr, 1)}%</td>
                    <td className="text-right">{formatCompact(row.yearlyRewards)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        * Rewards are estimates based on current rates. Actual rewards may vary.
      </p>
    </div>
  );
}

export default RewardsCalculator;
