import { TokenConfig, StakingTier } from './types';
import { TAX_LIMITS, STAKING_TIERS } from './constants';

export function validateTokenConfig(config: TokenConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.name || config.name.length < 1 || config.name.length > 32) {
    errors.push('Name must be 1-32 characters');
  }
  if (!config.symbol || config.symbol.length < 1 || config.symbol.length > 10) {
    errors.push('Symbol must be 1-10 characters');
  }
  if (config.burnEnabled && (config.burnPercentage < 0 || config.burnPercentage > TAX_LIMITS.maxBurnPercentage)) {
    errors.push(`Burn percentage must be 0-${TAX_LIMITS.maxBurnPercentage}%`);
  }
  if (config.lpEnabled && (config.lpPercentage < 0 || config.lpPercentage > TAX_LIMITS.maxLpPercentage)) {
    errors.push(`LP percentage must be 0-${TAX_LIMITS.maxLpPercentage}%`);
  }

  const totalCustom = config.customAllocations.reduce((sum, a) => sum + a.percentage, 0);
  const totalTax = (config.burnEnabled ? config.burnPercentage : 0) +
                   (config.lpEnabled ? config.lpPercentage : 0) +
                   totalCustom;

  if (totalTax > TAX_LIMITS.maxTotalTax) {
    errors.push(`Total tax allocation cannot exceed ${TAX_LIMITS.maxTotalTax}%`);
  }

  return { valid: errors.length === 0, errors };
}

export function calculateTier(stakedAmount: number): StakingTier {
  if (stakedAmount >= STAKING_TIERS[StakingTier.VIP].minStake) return StakingTier.VIP;
  if (stakedAmount >= STAKING_TIERS[StakingTier.PREMIUM].minStake) return StakingTier.PREMIUM;
  if (stakedAmount >= STAKING_TIERS[StakingTier.HOLDER].minStake) return StakingTier.HOLDER;
  return StakingTier.NONE;
}

export function getPlatformFee(tier: StakingTier): number {
  return STAKING_TIERS[tier].platformFee;
}
