import { z } from "zod";

// ============================================================================
// Request/Response Types
// ============================================================================

// Launch token request
export const LaunchTokenRequestSchema = z.object({
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(10).toUpperCase(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  creatorWallet: z.string().min(32).max(44),

  // Fee configuration (basis points)
  burnEnabled: z.boolean().default(false),
  burnPercentage: z.number().min(0).max(10000).default(0),
  lpEnabled: z.boolean().default(false),
  lpPercentage: z.number().min(0).max(10000).default(0),
  dividendsEnabled: z.boolean().default(false),
  dividendsPercentage: z.number().min(0).max(10000).default(0),

  // Custom allocations
  customAllocations: z
    .array(
      z.object({
        wallet: z.string(),
        percentage: z.number().min(0).max(10000),
        vestingMonths: z.number().min(0).max(48).optional(),
      })
    )
    .optional(),
});

export type LaunchTokenRequest = z.infer<typeof LaunchTokenRequestSchema>;

// Launch token response
export interface LaunchTokenResponse {
  success: boolean;
  tokenId: string;
  tokenMint?: string;
  configKey?: string;
  bagsPoolAddress?: string;
  launchUrl?: string;
  error?: string;
}

// Token details response
export interface TokenDetailsResponse {
  id: string;
  tokenMint: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  creatorWallet: string;
  status: string;

  // Configuration
  burnEnabled: boolean;
  burnPercentage: number;
  lpEnabled: boolean;
  lpPercentage: number;
  dividendsEnabled: boolean;
  dividendsPercentage: number;

  // Stats
  totalVolumeUsd: number;
  totalVolumeSol: number;
  holderCount: number;
  currentPriceUsd: number;
  currentPriceSol: number;
  marketCapUsd: number;

  // Automation stats
  totalFeesCollected: string;
  totalBurned: string;
  totalToLp: string;
  totalDividendsPaid: string;

  launchedAt?: string;
  graduatedAt?: string;
}

// Token list response
export interface TokenListResponse {
  tokens: TokenDetailsResponse[];
  total: number;
  page: number;
  limit: number;
}

// Token stats response
export interface TokenStatsResponse {
  tokenMint: string;
  priceUsd: number;
  priceSol: number;
  volume24hUsd: number;
  volume24hSol: number;
  marketCapUsd: number;
  holderCount: number;
  bondingCurveProgress: number; // 0-100%
  isGraduated: boolean;
}

// ============================================================================
// Staking Types
// ============================================================================

export const StakeRequestSchema = z.object({
  wallet: z.string().min(32).max(44),
  amount: z.string(), // BigInt as string
  lockDurationDays: z.number().min(0).max(365).default(0),
});

export type StakeRequest = z.infer<typeof StakeRequestSchema>;

export const UnstakeRequestSchema = z.object({
  wallet: z.string().min(32).max(44),
  amount: z.string(), // BigInt as string
});

export type UnstakeRequest = z.infer<typeof UnstakeRequestSchema>;

export const ClaimRewardsRequestSchema = z.object({
  wallet: z.string().min(32).max(44),
});

export type ClaimRewardsRequest = z.infer<typeof ClaimRewardsRequestSchema>;

export interface StakingStatusResponse {
  wallet: string;
  stakedAmount: string;
  weightedStake: string;
  tier: string;
  lockEndTime?: string;
  lockDurationDays: number;
  pendingRewards: string;
  totalRewardsClaimed: string;
  feeDiscount: number; // Percentage discount on platform fees
}

export interface StakingPoolResponse {
  totalStaked: string;
  totalStakers: number;
  rewardsPool: string;
  apy: number;
  tiers: {
    name: string;
    minStake: string;
    discount: number;
    count: number;
  }[];
}

export interface StakingTransactionResponse {
  success: boolean;
  signature?: string;
  newStakedAmount?: string;
  newTier?: string;
  error?: string;
}

// ============================================================================
// Platform Stats Types
// ============================================================================

export interface PlatformStatsResponse {
  totalTokensLaunched: number;
  activeTokens: number;
  graduatedTokens: number;
  totalVolumeUsd: number;
  totalVolumeSol: number;
  totalFeesCollectedSol: number;
  totalBurnedUsd: number;
  totalStakedKr8tiv: string;
  uniqueCreators: number;
  uniqueStakers: number;
}

export interface CreatorStatsResponse {
  wallet: string;
  displayName?: string;
  tokensLaunched: number;
  totalVolumeUsd: number;
  totalFeesGenerated: number;
  kr8tivStaked: string;
  discountTier: string;
  feeDiscount: number;
  tokens: {
    tokenMint: string;
    name: string;
    symbol: string;
    status: string;
    volumeUsd: number;
  }[];
}

// ============================================================================
// Admin Types
// ============================================================================

export const TriggerAutomationRequestSchema = z.object({
  tokenId: z.string().uuid().optional(),
  tokenMint: z.string().optional(),
  jobType: z.enum(["CLAIM_FEES", "BURN", "ADD_LP", "PAY_DIVIDENDS", "FULL_CYCLE"]),
  immediate: z.boolean().default(true),
});

export type TriggerAutomationRequest = z.infer<typeof TriggerAutomationRequestSchema>;

export interface TriggerAutomationResponse {
  success: boolean;
  jobId?: string;
  message: string;
  error?: string;
}

// ============================================================================
// Bags.fm API Types
// ============================================================================

export interface BagsCreateTokenRequest {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  creatorWallet: string;
}

export interface BagsCreateTokenResponse {
  success: boolean;
  mint: string;
  configKey: string;
  poolAddress: string;
  launchUrl: string;
}

export interface BagsPoolInfo {
  poolAddress: string;
  tokenMint: string;
  reserveSol: number;
  reserveToken: number;
  virtualSolReserve: number;
  virtualTokenReserve: number;
  totalSolCollected: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
  graduatedAt?: string;
}

export interface BagsClaimFeesResponse {
  success: boolean;
  signature: string;
  claimedLamports: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Staking tier thresholds (in base units, 6 decimals)
export const STAKING_TIERS = {
  NONE: { minStake: BigInt(0), discount: 0 },
  BRONZE: { minStake: BigInt(10_000_000_000), discount: 10 }, // 10,000 KR8TIV
  SILVER: { minStake: BigInt(50_000_000_000), discount: 25 }, // 50,000 KR8TIV
  GOLD: { minStake: BigInt(100_000_000_000), discount: 50 }, // 100,000 KR8TIV
  DIAMOND: { minStake: BigInt(500_000_000_000), discount: 75 }, // 500,000 KR8TIV
} as const;

export type StakingTierName = keyof typeof STAKING_TIERS;

export function getTierFromStake(amount: bigint): StakingTierName {
  if (amount >= STAKING_TIERS.DIAMOND.minStake) return "DIAMOND";
  if (amount >= STAKING_TIERS.GOLD.minStake) return "GOLD";
  if (amount >= STAKING_TIERS.SILVER.minStake) return "SILVER";
  if (amount >= STAKING_TIERS.BRONZE.minStake) return "BRONZE";
  return "NONE";
}

export function getDiscountFromTier(tier: StakingTierName): number {
  return STAKING_TIERS[tier].discount;
}

// Lock duration multipliers for weighted staking
export const LOCK_MULTIPLIERS: Record<number, number> = {
  0: 1.0, // No lock
  30: 1.25, // 1 month
  90: 1.5, // 3 months
  180: 2.0, // 6 months
  365: 3.0, // 1 year
};

export function getLockMultiplier(days: number): number {
  const sortedDays = Object.keys(LOCK_MULTIPLIERS)
    .map(Number)
    .sort((a, b) => b - a);
  for (const threshold of sortedDays) {
    if (days >= threshold) {
      return LOCK_MULTIPLIERS[threshold];
    }
  }
  return 1.0;
}
