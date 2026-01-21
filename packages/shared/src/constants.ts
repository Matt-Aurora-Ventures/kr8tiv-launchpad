import { StakingTier } from './types';

// Staking tiers
export const STAKING_TIERS: Record<StakingTier, { minStake: number; platformFee: number; rewardMultiplier: number }> = {
  [StakingTier.NONE]: { minStake: 0, platformFee: 500, rewardMultiplier: 0 },
  [StakingTier.HOLDER]: { minStake: 1000, platformFee: 400, rewardMultiplier: 10000 },
  [StakingTier.PREMIUM]: { minStake: 10000, platformFee: 200, rewardMultiplier: 15000 },
  [StakingTier.VIP]: { minStake: 100000, platformFee: 0, rewardMultiplier: 20000 },
};

// Lock duration options
export const LOCK_OPTIONS = [
  { days: 7, label: '7 Days', multiplier: 10000 },
  { days: 30, label: '30 Days', multiplier: 12500 },
  { days: 90, label: '90 Days', multiplier: 15000 },
  { days: 180, label: '180 Days', multiplier: 17500 },
  { days: 365, label: '1 Year', multiplier: 20000 },
];

// Tax limits
export const TAX_LIMITS = {
  maxBurnPercentage: 50,
  maxLpPercentage: 50,
  maxCustomPerWallet: 50,
  maxTotalTax: 100,
};

// Program IDs
export const PROGRAM_IDS = {
  BAGS_FEE_SHARE_V1: 'FEEhPbKVKnco9EXnaY3i4R5rQVUx91wgVfu8qokixywi',
  BAGS_FEE_SHARE_V2: 'FEE2tBhCKAt7shrod19QttSVREUYPiyMzoku1mL1sGG',
  METEORA_AMM: 'cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG',
};

// LUT
export const BAGS_LUT = 'Eq1EVs15EAWww1YtPTtWPzJRLPJoS6VYP9oW9SbNr3yp';
