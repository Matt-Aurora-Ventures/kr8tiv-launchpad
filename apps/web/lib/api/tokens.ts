/**
 * Token API Service
 * Handles all token-related API calls
 */

import { api } from './client';

export interface Token {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image?: string;
  creator: string;
  createdAt: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  totalSupply: number;
  circulatingSupply: number;
  bondingProgress: number;
  isGraduated: boolean;
  liquidity: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

export interface TokenListParams {
  page?: number;
  limit?: number;
  sort?: 'trending' | 'newest' | 'market_cap' | 'volume' | 'holders';
  order?: 'asc' | 'desc';
  search?: string;
  graduated?: boolean;
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume?: number;
  minHolders?: number;
}

export interface TokenListResponse {
  tokens: Token[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TokenPriceHistory {
  timestamp: number;
  price: number;
  volume: number;
}

export interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
}

export interface TokenTransaction {
  signature: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  price: number;
  value: number;
  from: string;
  to: string;
  timestamp: string;
}

export interface CreateTokenParams {
  name: string;
  symbol: string;
  description: string;
  image?: File;
  totalSupply: number;
  creatorAllocation: number;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  launchType: 'bonding' | 'fair' | 'presale';
  enableAntiBot?: boolean;
  maxWalletPercent?: number;
  enableBuyTax?: boolean;
  buyTaxPercent?: number;
}

// Get token list with filters
export async function getTokens(params: TokenListParams = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const query = queryParams.toString();
  return api.get<TokenListResponse>(`/tokens${query ? `?${query}` : ''}`, {
    cache: true,
    cacheTime: 30000, // 30 seconds
  });
}

// Get single token by mint address
export async function getToken(mint: string) {
  return api.get<Token>(`/tokens/${mint}`, {
    cache: true,
    cacheTime: 15000, // 15 seconds
  });
}

// Get token price history
export async function getTokenPriceHistory(
  mint: string,
  timeframe: '1h' | '24h' | '7d' | '30d' = '24h'
) {
  return api.get<TokenPriceHistory[]>(`/tokens/${mint}/price-history?timeframe=${timeframe}`, {
    cache: true,
    cacheTime: 60000, // 1 minute
  });
}

// Get token holders
export async function getTokenHolders(mint: string, page = 1, limit = 50) {
  return api.get<{ holders: TokenHolder[]; total: number }>(
    `/tokens/${mint}/holders?page=${page}&limit=${limit}`,
    {
      cache: true,
      cacheTime: 60000,
    }
  );
}

// Get token transactions
export async function getTokenTransactions(mint: string, page = 1, limit = 50) {
  return api.get<{ transactions: TokenTransaction[]; total: number }>(
    `/tokens/${mint}/transactions?page=${page}&limit=${limit}`,
    {
      cache: true,
      cacheTime: 15000,
    }
  );
}

// Get trending tokens
export async function getTrendingTokens(limit = 10) {
  return api.get<Token[]>(`/tokens/trending?limit=${limit}`, {
    cache: true,
    cacheTime: 60000,
  });
}

// Get new tokens (recently launched)
export async function getNewTokens(limit = 10) {
  return api.get<Token[]>(`/tokens/new?limit=${limit}`, {
    cache: true,
    cacheTime: 30000,
  });
}

// Get graduating tokens (near threshold)
export async function getGraduatingTokens(limit = 10) {
  return api.get<Token[]>(`/tokens/graduating?limit=${limit}`, {
    cache: true,
    cacheTime: 30000,
  });
}

// Search tokens
export async function searchTokens(query: string, limit = 10) {
  return api.get<Token[]>(`/tokens/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
    cache: true,
    cacheTime: 10000,
  });
}

// Create new token
export async function createToken(params: CreateTokenParams) {
  const formData = new FormData();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Use fetch directly for FormData
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tokens`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create token');
  }

  return response.json() as Promise<{ mint: string; signature: string }>;
}

// Add token to watchlist
export async function addToWatchlist(mint: string) {
  return api.post<{ success: boolean }>('/user/watchlist', { mint });
}

// Remove token from watchlist
export async function removeFromWatchlist(mint: string) {
  return api.delete<{ success: boolean }>(`/user/watchlist/${mint}`);
}

// Get user's watchlist
export async function getWatchlist() {
  return api.get<Token[]>('/user/watchlist');
}

export const tokenApi = {
  getTokens,
  getToken,
  getTokenPriceHistory,
  getTokenHolders,
  getTokenTransactions,
  getTrendingTokens,
  getNewTokens,
  getGraduatingTokens,
  searchTokens,
  createToken,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
};

export default tokenApi;
