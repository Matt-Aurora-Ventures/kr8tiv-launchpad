import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { STAKING_TIERS, LOCK_DURATIONS, BASE_LAUNCH_FEE_PERCENT } from './constants';

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a number as compact (1K, 1M, etc.)
 */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format SOL amount
 */
export function formatSOL(lamports: number): string {
  return formatNumber(lamports / 1e9, 4);
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: number, decimals: number = 9): string {
  return formatNumber(amount / Math.pow(10, decimals), 2);
}

/**
 * Shorten a Solana address for display
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Calculate staking tier from amount
 */
export function getStakingTier(stakedAmount: number): keyof typeof STAKING_TIERS {
  if (stakedAmount >= STAKING_TIERS.VIP.minStake) return 'VIP';
  if (stakedAmount >= STAKING_TIERS.PREMIUM.minStake) return 'PREMIUM';
  if (stakedAmount >= STAKING_TIERS.HOLDER.minStake) return 'HOLDER';
  return 'NONE';
}

/**
 * Get next tier info
 */
export function getNextTier(currentTier: keyof typeof STAKING_TIERS): {
  tier: keyof typeof STAKING_TIERS | null;
  amountNeeded: number;
} {
  const tiers: (keyof typeof STAKING_TIERS)[] = ['NONE', 'HOLDER', 'PREMIUM', 'VIP'];
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex === tiers.length - 1) {
    return { tier: null, amountNeeded: 0 };
  }

  const nextTier = tiers[currentIndex + 1];
  return {
    tier: nextTier,
    amountNeeded: STAKING_TIERS[nextTier].minStake,
  };
}

/**
 * Calculate fee discount based on staked amount
 */
export function calculateFeeDiscount(stakedAmount: number): number {
  const tier = getStakingTier(stakedAmount);
  return STAKING_TIERS[tier].discount;
}

/**
 * Calculate effective fee after discount
 */
export function calculateEffectiveFee(stakedAmount: number): number {
  const discount = calculateFeeDiscount(stakedAmount);
  return BASE_LAUNCH_FEE_PERCENT * (1 - discount / 100);
}

/**
 * Get lock duration multiplier
 */
export function getLockMultiplier(days: number): number {
  const duration = LOCK_DURATIONS.find((d) => d.days === days);
  return duration?.multiplier || 1.0;
}

/**
 * Calculate effective staked amount (with lock multiplier)
 */
export function calculateEffectiveStake(amount: number, lockDays: number): number {
  return amount * getLockMultiplier(lockDays);
}

/**
 * Calculate unlock date from lock duration
 */
export function calculateUnlockDate(lockDays: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + lockDays);
  return now;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return 'Unlocked';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}

/**
 * Calculate total tax percent from config
 */
export function calculateTotalTax(config: {
  burnPercent: number;
  lpPercent: number;
  dividendsPercent: number;
  customWallets: { percent: number }[];
}): number {
  const customTotal = config.customWallets.reduce((sum, w) => sum + w.percent, 0);
  return config.burnPercent + config.lpPercent + config.dividendsPercent + customTotal;
}

/**
 * Validate tax configuration
 */
export function validateTaxConfig(config: {
  burnPercent: number;
  lpPercent: number;
  dividendsPercent: number;
  customWallets: { percent: number }[];
}): { valid: boolean; error?: string } {
  const total = calculateTotalTax(config);

  if (total > 25) {
    return { valid: false, error: 'Total tax cannot exceed 25%' };
  }
  if (config.burnPercent > 10) {
    return { valid: false, error: 'Burn tax cannot exceed 10%' };
  }
  if (config.lpPercent > 10) {
    return { valid: false, error: 'LP tax cannot exceed 10%' };
  }
  if (config.dividendsPercent > 10) {
    return { valid: false, error: 'Dividends tax cannot exceed 10%' };
  }
  if (config.customWallets.length > 5) {
    return { valid: false, error: 'Maximum 5 custom wallets allowed' };
  }
  for (const wallet of config.customWallets) {
    if (wallet.percent > 5) {
      return { valid: false, error: 'Each custom wallet cannot exceed 5%' };
    }
  }

  return { valid: true };
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
