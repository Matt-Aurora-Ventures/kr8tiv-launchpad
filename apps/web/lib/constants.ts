// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Solana Configuration
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// Program IDs
export const STAKING_PROGRAM_ID = process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || '';
export const TOKEN_FACTORY_PROGRAM_ID = process.env.NEXT_PUBLIC_TOKEN_FACTORY_PROGRAM_ID || '';

// Platform Token
export const KR8TIV_TOKEN_MINT = process.env.NEXT_PUBLIC_KR8TIV_TOKEN_MINT || '';
export const KR8TIV_TOKEN_DECIMALS = 9;

// Fee Configuration
export const BASE_LAUNCH_FEE_SOL = 0.1;
export const BASE_LAUNCH_FEE_PERCENT = 2.0;

// Staking Tiers
export const STAKING_TIERS = {
  NONE: {
    name: 'None',
    minStake: 0,
    discount: 0,
    color: 'gray',
    benefits: [],
  },
  HOLDER: {
    name: 'Holder',
    minStake: 1000,
    discount: 10,
    color: 'blue',
    benefits: ['10% fee discount', 'Basic analytics'],
  },
  PREMIUM: {
    name: 'Premium',
    minStake: 10000,
    discount: 25,
    color: 'purple',
    benefits: ['25% fee discount', 'Advanced analytics', 'Priority support'],
  },
  VIP: {
    name: 'VIP',
    minStake: 100000,
    discount: 50,
    color: 'gold',
    benefits: ['50% fee discount', 'Full analytics suite', 'Dedicated support', 'Early access'],
  },
} as const;

// Lock Duration Options (days)
export const LOCK_DURATIONS = [
  { days: 7, multiplier: 1.0, label: '1 Week' },
  { days: 30, multiplier: 1.25, label: '1 Month' },
  { days: 90, multiplier: 1.5, label: '3 Months' },
  { days: 180, multiplier: 2.0, label: '6 Months' },
  { days: 365, multiplier: 3.0, label: '1 Year' },
] as const;

// Tax Configuration Defaults (all opt-in, default OFF)
export const DEFAULT_TAX_CONFIG = {
  burnEnabled: false,
  burnPercent: 0,
  lpEnabled: false,
  lpPercent: 0,
  dividendsEnabled: false,
  dividendsPercent: 0,
  customWalletsEnabled: false,
  customWallets: [] as { address: string; percent: number; label: string }[],
};

// Max Tax Limits
export const MAX_TOTAL_TAX_PERCENT = 25;
export const MAX_BURN_PERCENT = 10;
export const MAX_LP_PERCENT = 10;
export const MAX_DIVIDENDS_PERCENT = 10;
export const MAX_CUSTOM_WALLETS = 5;
export const MAX_CUSTOM_WALLET_PERCENT = 5;

// Token Defaults
export const DEFAULT_TOKEN_SUPPLY = 1_000_000_000;
export const DEFAULT_TOKEN_DECIMALS = 9;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Chart Colors
export const CHART_COLORS = {
  burn: '#ef4444',
  lp: '#22c55e',
  dividends: '#3b82f6',
  custom: '#a855f7',
  creator: '#f59e0b',
  platform: '#6366f1',
};

// Tier Colors for UI
export const TIER_COLORS = {
  NONE: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500',
    text: 'text-gray-400',
    gradient: 'from-gray-600 to-gray-700',
  },
  HOLDER: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-400',
    gradient: 'from-blue-600 to-blue-700',
  },
  PREMIUM: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-500',
    text: 'text-purple-400',
    gradient: 'from-purple-600 to-purple-700',
  },
  VIP: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-400',
    gradient: 'from-amber-600 to-amber-700',
  },
} as const;
