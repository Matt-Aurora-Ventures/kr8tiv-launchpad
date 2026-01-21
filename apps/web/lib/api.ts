import {
  API_BASE_URL,
  DEFAULT_TOKEN_DECIMALS,
  DEFAULT_TOKEN_SUPPLY,
  STAKING_TIERS,
} from './constants';
import { calculateEffectiveFee, getStakingTier } from './utils';

// Types
export interface TokenInfo {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image?: string;
  decimals: number;
  supply: number;
  creator: string;
  createdAt: string;
  taxConfig: TaxConfig;
  stats: TokenStats;
}

export interface TaxConfig {
  burnEnabled: boolean;
  burnPercent: number;
  lpEnabled: boolean;
  lpPercent: number;
  dividendsEnabled: boolean;
  dividendsPercent: number;
  customWalletsEnabled: boolean;
  customWallets: CustomWallet[];
}

export interface CustomWallet {
  address: string;
  percent: number;
  label: string;
}

export interface TokenStats {
  holders: number;
  transactions: number;
  volume24h: number;
  marketCap: number;
  price: number;
  priceChange24h: number;
}

export interface StakingPool {
  totalStaked: number;
  totalStakers: number;
  rewardRate: number;
  apr: number;
}

export interface UserStake {
  amount: number;
  effectiveAmount: number;
  lockDuration: number;
  unlockDate: string;
  pendingRewards: number;
  tier: string;
}

export interface LaunchRequest {
  name: string;
  symbol: string;
  description: string;
  image?: string;
  supply: number;
  decimals: number;
  taxConfig: TaxConfig;
  creatorWallet: string;
}

export interface LaunchResponse {
  success: boolean;
  mint?: string;
  tokenId?: string;
  configKey?: string;
  bagsPoolAddress?: string;
  launchUrl?: string;
  txSignature?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

interface BackendTokenDetails {
  id: string;
  tokenMint: string;
  name: string;
  symbol: string;
  description?: string | null;
  imageUrl?: string | null;
  creatorWallet: string;
  status: string;
  burnEnabled: boolean;
  burnPercentage: number;
  lpEnabled: boolean;
  lpPercentage: number;
  dividendsEnabled: boolean;
  dividendsPercentage: number;
  customAllocations?: unknown;
  totalVolumeUsd: number;
  totalVolumeSol: number;
  holderCount: number;
  currentPriceUsd: number;
  currentPriceSol: number;
  marketCapUsd: number;
  totalFeesCollected: string;
  totalBurned: string;
  totalToLp: string;
  totalDividendsPaid: string;
  launchedAt?: string | null;
  graduatedAt?: string | null;
}

interface BackendTokenListResponse {
  tokens: BackendTokenDetails[];
  total: number;
  page: number;
  limit: number;
}

interface BackendTokenStatsResponse {
  tokenMint: string;
  priceUsd: number;
  priceSol: number;
  volume24hUsd: number;
  volume24hSol: number;
  marketCapUsd: number;
  holderCount: number;
  bondingCurveProgress: number;
  isGraduated: boolean;
}

interface BackendLaunchResponse {
  success: boolean;
  tokenId: string;
  tokenMint?: string;
  configKey?: string;
  bagsPoolAddress?: string;
  launchUrl?: string;
  error?: string;
}

interface BackendStakingStatusResponse {
  wallet: string;
  stakedAmount: string;
  weightedStake: string;
  tier: string;
  lockEndTime?: string;
  lockDurationDays: number;
  pendingRewards: string;
  totalRewardsClaimed: string;
  feeDiscount: number;
}

interface BackendStakingPoolResponse {
  totalStaked: string;
  totalStakers: number;
  rewardsPool: string;
  apy: number;
}

interface BackendStakingTransactionResponse {
  success: boolean;
  signature?: string;
  newStakedAmount?: string;
  newTier?: string;
  error?: string;
}

interface BackendCreatorStatsResponse {
  wallet: string;
  tokensLaunched: number;
  totalVolumeUsd: number;
  totalFeesGenerated: number;
  tokens: {
    tokenMint: string;
    name: string;
    symbol: string;
    status: string;
    volumeUsd: number;
  }[];
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return Boolean(value) && typeof value === 'object' && 'success' in value;
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toPercent(bps: number | null | undefined): number {
  return toNumber(bps) / 100;
}

function toBps(percent: number | null | undefined): number {
  return Math.round(toNumber(percent) * 100);
}

function mapCustomWallets(customAllocations: unknown): CustomWallet[] {
  if (!Array.isArray(customAllocations)) return [];

  return customAllocations
    .map((allocation, index) => {
      if (!allocation || typeof allocation !== 'object') return null;
      const record = allocation as Record<string, unknown>;
      const address = typeof record.wallet === 'string' ? record.wallet : '';
      const percentRaw = record.percentage;
      const percent = toPercent(typeof percentRaw === 'number' ? percentRaw : Number(percentRaw));
      const label = typeof record.label === 'string' ? record.label : `Custom ${index + 1}`;

      if (!address) return null;

      return {
        address,
        percent,
        label,
      } as CustomWallet;
    })
    .filter((wallet): wallet is CustomWallet => Boolean(wallet));
}

function mapTokenDetails(
  token: BackendTokenDetails,
  stats?: BackendTokenStatsResponse | null
): TokenInfo {
  const customWallets = mapCustomWallets(token.customAllocations);

  const taxConfig: TaxConfig = {
    burnEnabled: token.burnEnabled,
    burnPercent: toPercent(token.burnPercentage),
    lpEnabled: token.lpEnabled,
    lpPercent: toPercent(token.lpPercentage),
    dividendsEnabled: token.dividendsEnabled,
    dividendsPercent: toPercent(token.dividendsPercentage),
    customWalletsEnabled: customWallets.length > 0,
    customWallets,
  };

  const statsPayload: TokenStats = {
    holders: toNumber(stats?.holderCount ?? token.holderCount),
    transactions: 0,
    volume24h: toNumber(stats?.volume24hUsd ?? token.totalVolumeUsd),
    marketCap: toNumber(stats?.marketCapUsd ?? token.marketCapUsd),
    price: toNumber(stats?.priceUsd ?? token.currentPriceUsd),
    priceChange24h: 0,
  };

  return {
    mint: token.tokenMint,
    name: token.name,
    symbol: token.symbol,
    description: token.description || '',
    image: token.imageUrl || undefined,
    decimals: DEFAULT_TOKEN_DECIMALS,
    supply: DEFAULT_TOKEN_SUPPLY,
    creator: token.creatorWallet,
    createdAt: token.launchedAt || new Date().toISOString(),
    taxConfig,
    stats: statsPayload,
  };
}

function mapStakingStatus(data: BackendStakingStatusResponse): UserStake {
  const stakedAmount = toNumber(data.stakedAmount);
  const weightedStake = toNumber(data.weightedStake);
  const effectiveAmount = weightedStake > 0 ? weightedStake : stakedAmount;
  const lockDuration = data.lockDurationDays || 0;
  const unlockDate = data.lockEndTime
    ? data.lockEndTime
    : new Date(Date.now() + lockDuration * 24 * 60 * 60 * 1000).toISOString();

  return {
    amount: stakedAmount,
    effectiveAmount,
    lockDuration,
    unlockDate,
    pendingRewards: toNumber(data.pendingRewards),
    tier: getStakingTier(effectiveAmount),
  };
}

// Fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (payload as ApiEnvelope<T>)?.error ||
        (payload as ApiEnvelope<T>)?.message ||
        `Request failed with status ${response.status}`;
      throw new ApiError(message, response.status, (payload as ApiEnvelope<T>)?.code);
    }

    if (isApiEnvelope<T>(payload)) {
      if (!payload.success) {
        throw new ApiError(payload.error || payload.message || 'Request failed', response.status, payload.code);
      }
      return payload.data as T;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Network error', 0, 'NETWORK_ERROR');
  }
}

// Token APIs
export const tokenApi = {
  async list(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: 'createdAt' | 'volume24h' | 'marketCap';
    order?: 'asc' | 'desc';
    creator?: string;
  }): Promise<PaginatedResponse<TokenInfo>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('limit', String(params.pageSize));
    if (params?.sortBy) {
      const sortMap: Record<string, string> = {
        createdAt: 'createdAt',
        volume24h: 'totalVolumeUsd',
        marketCap: 'marketCapUsd',
      };
      searchParams.set('sortBy', sortMap[params.sortBy] || params.sortBy);
    }
    if (params?.order) searchParams.set('sortOrder', params.order);
    if (params?.creator) searchParams.set('creator', params.creator);

    const query = searchParams.toString();
    const result = await fetchApi<BackendTokenListResponse>(
      `/api/tokens${query ? `?${query}` : ''}`
    );

    const items = result.tokens.map((token) => mapTokenDetails(token));

    return {
      items,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
      hasMore: result.page * result.limit < result.total,
    };
  },

  async get(mint: string): Promise<TokenInfo> {
    const token = await fetchApi<BackendTokenDetails>(`/api/tokens/${mint}`);
    let stats: BackendTokenStatsResponse | null = null;

    try {
      stats = await fetchApi<BackendTokenStatsResponse>(`/api/tokens/${mint}/stats`);
    } catch {
      stats = null;
    }

    return mapTokenDetails(token, stats);
  },

  async launch(data: LaunchRequest, signature?: string): Promise<LaunchResponse> {
    const payload = {
      name: data.name,
      symbol: data.symbol,
      description: data.description || undefined,
      imageUrl: data.image,
      creatorWallet: data.creatorWallet,
      burnEnabled: data.taxConfig.burnEnabled,
      burnPercentage: toBps(data.taxConfig.burnPercent),
      lpEnabled: data.taxConfig.lpEnabled,
      lpPercentage: toBps(data.taxConfig.lpPercent),
      dividendsEnabled: data.taxConfig.dividendsEnabled,
      dividendsPercentage: toBps(data.taxConfig.dividendsPercent),
      customAllocations: data.taxConfig.customWalletsEnabled
        ? data.taxConfig.customWallets.map((wallet) => ({
            wallet: wallet.address,
            percentage: toBps(wallet.percent),
          }))
        : undefined,
    };

    const headers: HeadersInit = signature ? { 'X-Signature': signature } : {};

    const result = await fetchApi<BackendLaunchResponse>('/api/launch', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
    });

    return {
      success: result.success,
      mint: result.tokenMint,
      tokenId: result.tokenId,
      configKey: result.configKey,
      bagsPoolAddress: result.bagsPoolAddress,
      launchUrl: result.launchUrl,
      error: result.error,
    };
  },

  async getByCreator(creator: string): Promise<TokenInfo[]> {
    const result = await this.list({ creator, pageSize: 100 });
    return result.items;
  },
};

// Staking APIs
export const stakingApi = {
  async getPool(): Promise<StakingPool> {
    const result = await fetchApi<BackendStakingPoolResponse>('/api/staking/pool');
    return {
      totalStaked: toNumber(result.totalStaked),
      totalStakers: result.totalStakers,
      rewardRate: 0,
      apr: result.apy,
    };
  },

  async getUserStake(wallet: string): Promise<UserStake | null> {
    try {
      const result = await fetchApi<BackendStakingStatusResponse>(
        `/api/staking/status/${wallet}`
      );
      return mapStakingStatus(result);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async stake(data: {
    wallet: string;
    amount: number;
    lockDuration: number;
  }): Promise<{ success: boolean; txSignature?: string; error?: string }> {
    const result = await fetchApi<BackendStakingTransactionResponse>('/api/staking/stake', {
      method: 'POST',
      body: JSON.stringify({
        wallet: data.wallet,
        amount: String(data.amount),
        lockDurationDays: data.lockDuration,
      }),
    });

    return {
      success: result.success,
      txSignature: result.signature,
      error: result.error,
    };
  },

  async unstake(data: {
    wallet: string;
    amount: number;
  }): Promise<{ success: boolean; txSignature?: string; error?: string }> {
    const result = await fetchApi<BackendStakingTransactionResponse>('/api/staking/unstake', {
      method: 'POST',
      body: JSON.stringify({
        wallet: data.wallet,
        amount: String(data.amount),
      }),
    });

    return {
      success: result.success,
      txSignature: result.signature,
      error: result.error,
    };
  },

  async claimRewards(data: {
    wallet: string;
  }): Promise<{ success: boolean; txSignature?: string; error?: string }> {
    const result = await fetchApi<BackendStakingTransactionResponse>('/api/staking/claim', {
      method: 'POST',
      body: JSON.stringify({
        wallet: data.wallet,
      }),
    });

    return {
      success: result.success,
      txSignature: result.signature,
      error: result.error,
    };
  },
};

// Dashboard APIs
export const dashboardApi = {
  async getCreatorStats(wallet: string): Promise<{
    tokensLaunched: number;
    totalVolume: number;
    totalFees: number;
    totalHolders: number;
  }> {
    const result = await fetchApi<BackendCreatorStatsResponse>(
      `/api/stats/creator/${wallet}`
    );

    let totalHolders = 0;
    try {
      const tokens = await tokenApi.list({ creator: wallet, pageSize: 100 });
      totalHolders = tokens.items.reduce((sum, token) => sum + token.stats.holders, 0);
    } catch {
      totalHolders = 0;
    }

    return {
      tokensLaunched: result.tokensLaunched,
      totalVolume: result.totalVolumeUsd,
      totalFees: result.totalFeesGenerated,
      totalHolders,
    };
  },

  async getTokenAnalytics(mint: string): Promise<{
    volumeHistory: { date: string; volume: number }[];
    holderHistory: { date: string; holders: number }[];
    priceHistory: { date: string; price: number }[];
  }> {
    try {
      const stats = await fetchApi<BackendTokenStatsResponse>(`/api/tokens/${mint}/stats`);
      const now = new Date().toISOString();
      return {
        volumeHistory: [{ date: now, volume: stats.volume24hUsd }],
        holderHistory: [{ date: now, holders: stats.holderCount }],
        priceHistory: [{ date: now, price: stats.priceUsd }],
      };
    } catch {
      return {
        volumeHistory: [],
        holderHistory: [],
        priceHistory: [],
      };
    }
  },
};

// Discount calculation API
export const discountApi = {
  async calculate(wallet: string): Promise<{
    tier: string;
    discount: number;
    effectiveFee: number;
    stakedAmount: number;
  }> {
    const stake = await stakingApi.getUserStake(wallet);
    const stakedAmount = stake?.amount || 0;
    const tier = getStakingTier(stakedAmount);
    const discount = STAKING_TIERS[tier].discount;
    const effectiveFee = calculateEffectiveFee(stakedAmount);

    return {
      tier,
      discount,
      effectiveFee,
      stakedAmount,
    };
  },
};

export default {
  token: tokenApi,
  staking: stakingApi,
  dashboard: dashboardApi,
  discount: discountApi,
};
