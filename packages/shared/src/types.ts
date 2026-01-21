// Token launch types
export interface TokenConfig {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;

  // Tax config - ALL OPT-IN
  burnEnabled: boolean;
  burnPercentage: number;
  lpEnabled: boolean;
  lpPercentage: number;
  dividendsEnabled: boolean;
  customAllocations: CustomAllocation[];
}

export interface CustomAllocation {
  wallet: string;
  percentage: number;
  label: string;
}

// Staking types
export enum StakingTier {
  NONE = 'NONE',
  HOLDER = 'HOLDER',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP'
}

export interface StakerInfo {
  wallet: string;
  stakedAmount: number;
  weightedStake: number;
  lockEndTime: Date | null;
  tier: StakingTier;
  pendingRewards: number;
}

export interface StakePoolInfo {
  totalStaked: number;
  rewardRate: number;
  apr: number;
  minLockDays: number;
  maxLockDays: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Automation types
export interface AutomationResult {
  claimedLamports: bigint;
  burnedTokens: bigint;
  lpAddedLamports: bigint;
  signatures: string[];
}
