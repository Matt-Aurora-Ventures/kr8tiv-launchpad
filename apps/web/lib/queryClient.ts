import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

/**
 * Default query client configuration optimized for performance
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Data considered fresh for 1 minute
      staleTime: 60 * 1000,

      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,

      // Don't refetch on window focus (reduces API calls)
      refetchOnWindowFocus: false,

      // Don't refetch on mount if data exists
      refetchOnMount: false,

      // Don't refetch on reconnect
      refetchOnReconnect: false,

      // Retry failed requests once
      retry: 1,

      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once
      retry: 1,

      // Network mode
      networkMode: 'offlineFirst',
    },
  },
};

/**
 * Create a new query client instance
 * Use this for SSR or when you need a fresh client
 */
export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig);
}

/**
 * Singleton query client for client-side usage
 * This ensures we don't create a new client on every render
 */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return createQueryClient();
  }

  // Browser: reuse client across renders
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

/**
 * Pre-configured stale times for different data types
 */
export const staleTimes = {
  // Real-time data (prices, balances)
  realtime: 10 * 1000, // 10 seconds

  // Semi-dynamic data (token lists, user positions)
  dynamic: 60 * 1000, // 1 minute

  // Mostly static data (token metadata)
  static: 5 * 60 * 1000, // 5 minutes

  // Very static data (chain config)
  permanent: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Query key factory for type-safe keys
 */
export const queryKeys = {
  // Token queries
  tokens: {
    all: ['tokens'] as const,
    list: (filters?: Record<string, unknown>) => ['tokens', 'list', filters] as const,
    detail: (address: string) => ['tokens', 'detail', address] as const,
    price: (address: string) => ['tokens', 'price', address] as const,
    prices: (addresses: string[]) => ['tokens', 'prices', addresses] as const,
  },

  // Launch queries
  launches: {
    all: ['launches'] as const,
    list: (filters?: Record<string, unknown>) => ['launches', 'list', filters] as const,
    detail: (id: string) => ['launches', 'detail', id] as const,
    active: () => ['launches', 'active'] as const,
    upcoming: () => ['launches', 'upcoming'] as const,
    completed: () => ['launches', 'completed'] as const,
  },

  // Staking queries
  staking: {
    all: ['staking'] as const,
    user: (address: string) => ['staking', 'user', address] as const,
    stats: () => ['staking', 'stats'] as const,
    tiers: () => ['staking', 'tiers'] as const,
  },

  // User queries
  user: {
    all: ['user'] as const,
    wallet: (address: string) => ['user', 'wallet', address] as const,
    balance: (address: string, mint?: string) => ['user', 'balance', address, mint] as const,
    positions: (address: string) => ['user', 'positions', address] as const,
    transactions: (address: string) => ['user', 'transactions', address] as const,
  },
} as const;

/**
 * Default query client instance
 */
export const queryClient = getQueryClient();

export default queryClient;
