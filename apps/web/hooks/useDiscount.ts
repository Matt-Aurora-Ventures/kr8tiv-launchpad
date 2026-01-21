'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { discountApi } from '@/lib/api';
import { STAKING_TIERS, BASE_LAUNCH_FEE_PERCENT } from '@/lib/constants';
import { getStakingTier, calculateEffectiveFee } from '@/lib/utils';

interface DiscountData {
  tier: keyof typeof STAKING_TIERS;
  discount: number;
  effectiveFee: number;
  stakedAmount: number;
}

interface UseDiscountReturn {
  discount: DiscountData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDiscount(): UseDiscountReturn {
  const { publicKey } = useWallet();
  const [discount, setDiscount] = useState<DiscountData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscount = useCallback(async () => {
    if (!publicKey) {
      // If not connected, return default (no discount)
      setDiscount({
        tier: 'NONE',
        discount: 0,
        effectiveFee: BASE_LAUNCH_FEE_PERCENT,
        stakedAmount: 0,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await discountApi.calculate(publicKey.toBase58());
      setDiscount({
        tier: result.tier as keyof typeof STAKING_TIERS,
        discount: result.discount,
        effectiveFee: result.effectiveFee,
        stakedAmount: result.stakedAmount,
      });
    } catch (err) {
      // If API fails, calculate locally based on mock data
      setError(err instanceof Error ? err.message : 'Failed to fetch discount');
      setDiscount({
        tier: 'NONE',
        discount: 0,
        effectiveFee: BASE_LAUNCH_FEE_PERCENT,
        stakedAmount: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchDiscount();
  }, [fetchDiscount]);

  return {
    discount,
    isLoading,
    error,
    refresh: fetchDiscount,
  };
}

/**
 * Calculate discount locally without API call
 * Useful for simulating what discount would be at different stake levels
 */
export function calculateDiscount(stakedAmount: number): DiscountData {
  const tier = getStakingTier(stakedAmount);
  const discount = STAKING_TIERS[tier].discount;
  const effectiveFee = calculateEffectiveFee(stakedAmount);

  return {
    tier,
    discount,
    effectiveFee,
    stakedAmount,
  };
}

export default useDiscount;
