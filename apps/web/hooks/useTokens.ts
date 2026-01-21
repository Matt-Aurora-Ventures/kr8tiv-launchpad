'use client';

import { useState, useEffect, useCallback } from 'react';
import { tokenApi, TokenInfo, PaginatedResponse } from '@/lib/api';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

interface UseTokensOptions {
  pageSize?: number;
  sortBy?: 'createdAt' | 'volume24h' | 'marketCap';
  order?: 'asc' | 'desc';
  creator?: string;
  autoFetch?: boolean;
}

interface UseTokensReturn {
  tokens: TokenInfo[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  hasMore: boolean;
  total: number;
  fetchTokens: (page?: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTokens(options: UseTokensOptions = {}): UseTokensReturn {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = 'createdAt',
    order = 'desc',
    creator,
    autoFetch = true,
  } = options;

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;

  const fetchTokens = useCallback(
    async (targetPage = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const result: PaginatedResponse<TokenInfo> = await tokenApi.list({
          page: targetPage,
          pageSize,
          sortBy,
          order,
          creator,
        });

        setTokens(result.items);
        setTotal(result.total);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, sortBy, order, creator]
  );

  const nextPage = useCallback(async () => {
    if (hasMore) {
      await fetchTokens(page + 1);
    }
  }, [fetchTokens, page, hasMore]);

  const prevPage = useCallback(async () => {
    if (page > 1) {
      await fetchTokens(page - 1);
    }
  }, [fetchTokens, page]);

  const refresh = useCallback(async () => {
    await fetchTokens(1);
  }, [fetchTokens]);

  useEffect(() => {
    if (autoFetch) {
      fetchTokens(1);
    }
  }, [fetchTokens, autoFetch]);

  return {
    tokens,
    isLoading,
    error,
    page,
    totalPages,
    hasMore,
    total,
    fetchTokens,
    nextPage,
    prevPage,
    refresh,
  };
}

// Hook for fetching a single token
export function useToken(mint: string) {
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    if (!mint) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await tokenApi.get(mint);
      setToken(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token');
    } finally {
      setIsLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return { token, isLoading, error, refresh: fetchToken };
}

export default useTokens;
