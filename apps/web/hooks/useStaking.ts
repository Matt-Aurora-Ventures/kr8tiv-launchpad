'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { stakingApi, StakingPool, UserStake } from '@/lib/api';
import { getStakingTier, getNextTier } from '@/lib/utils';
import { STAKING_TIERS } from '@/lib/constants';

interface UseStakingReturn {
  // Pool data
  pool: StakingPool | null;
  isLoadingPool: boolean;
  poolError: string | null;

  // User stake data
  userStake: UserStake | null;
  isLoadingStake: boolean;
  stakeError: string | null;

  // Derived data
  currentTier: keyof typeof STAKING_TIERS;
  nextTier: { tier: keyof typeof STAKING_TIERS | null; amountNeeded: number };
  tierProgress: number;
  isLocked: boolean;
  timeUntilUnlock: number | null;

  // Actions
  stake: (amount: number, lockDuration: number) => Promise<boolean>;
  unstake: () => Promise<boolean>;
  claimRewards: () => Promise<{ success: boolean; amount?: number }>;

  // State
  isStaking: boolean;
  isUnstaking: boolean;
  isClaiming: boolean;
  actionError: string | null;

  // Refresh
  refresh: () => Promise<void>;
}

export function useStaking(): UseStakingReturn {
  const { publicKey } = useWallet();

  // Pool state
  const [pool, setPool] = useState<StakingPool | null>(null);
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [poolError, setPoolError] = useState<string | null>(null);

  // User stake state
  const [userStake, setUserStake] = useState<UserStake | null>(null);
  const [isLoadingStake, setIsLoadingStake] = useState(true);
  const [stakeError, setStakeError] = useState<string | null>(null);

  // Action state
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Derived values
  const effectiveAmount = userStake?.effectiveAmount || 0;
  const currentTier = getStakingTier(effectiveAmount);
  const nextTier = getNextTier(currentTier);

  // Calculate tier progress
  const tierProgress = (() => {
    if (currentTier === 'VIP') return 100;
    if (!nextTier.tier) return 100;

    const currentMin = STAKING_TIERS[currentTier].minStake;
    const nextMin = STAKING_TIERS[nextTier.tier].minStake;
    const progress = ((effectiveAmount - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  })();

  // Lock status
  const isLocked = userStake
    ? new Date(userStake.unlockDate).getTime() > Date.now()
    : false;

  const timeUntilUnlock = userStake && isLocked
    ? new Date(userStake.unlockDate).getTime() - Date.now()
    : null;

  // Fetch pool data
  const fetchPool = useCallback(async () => {
    setIsLoadingPool(true);
    setPoolError(null);

    try {
      const result = await stakingApi.getPool();
      setPool(result);
    } catch (err) {
      setPoolError(err instanceof Error ? err.message : 'Failed to fetch pool');
    } finally {
      setIsLoadingPool(false);
    }
  }, []);

  // Fetch user stake
  const fetchUserStake = useCallback(async () => {
    if (!publicKey) {
      setUserStake(null);
      setIsLoadingStake(false);
      return;
    }

    setIsLoadingStake(true);
    setStakeError(null);

    try {
      const result = await stakingApi.getUserStake(publicKey.toBase58());
      setUserStake(result);
    } catch (err) {
      setStakeError(err instanceof Error ? err.message : 'Failed to fetch stake');
    } finally {
      setIsLoadingStake(false);
    }
  }, [publicKey]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchPool(), fetchUserStake()]);
  }, [fetchPool, fetchUserStake]);

  // Initial fetch
  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    fetchUserStake();
  }, [fetchUserStake]);

  // Stake action
  const stake = async (amount: number, lockDuration: number): Promise<boolean> => {
    if (!publicKey) {
      setActionError('Wallet not connected');
      return false;
    }

    setIsStaking(true);
    setActionError(null);

    try {
      const result = await stakingApi.stake({
        wallet: publicKey.toBase58(),
        amount,
        lockDuration,
      });

      if (result.success) {
        await fetchUserStake();
        await fetchPool();
        return true;
      } else {
        setActionError(result.error || 'Stake failed');
        return false;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to stake');
      return false;
    } finally {
      setIsStaking(false);
    }
  };

  // Unstake action
  const unstake = async (): Promise<boolean> => {
    if (!publicKey) {
      setActionError('Wallet not connected');
      return false;
    }

    if (isLocked) {
      setActionError('Stake is still locked');
      return false;
    }

    setIsUnstaking(true);
    setActionError(null);

    try {
      const unstakeAmount = userStake?.amount || 0;
      if (unstakeAmount <= 0) {
        setActionError('No staked balance to unstake');
        return false;
      }

      const result = await stakingApi.unstake({
        wallet: publicKey.toBase58(),
        amount: unstakeAmount,
      });

      if (result.success) {
        await fetchUserStake();
        await fetchPool();
        return true;
      } else {
        setActionError(result.error || 'Unstake failed');
        return false;
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to unstake');
      return false;
    } finally {
      setIsUnstaking(false);
    }
  };

  // Claim rewards action
  const claimRewards = async (): Promise<{ success: boolean; amount?: number }> => {
    if (!publicKey) {
      setActionError('Wallet not connected');
      return { success: false };
    }

    setIsClaiming(true);
    setActionError(null);

    try {
      const claimAmount = userStake?.pendingRewards || 0;
      const result = await stakingApi.claimRewards({
        wallet: publicKey.toBase58(),
      });

      if (result.success) {
        await fetchUserStake();
        return { success: true, amount: claimAmount };
      } else {
        setActionError(result.error || 'Claim failed');
        return { success: false };
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to claim');
      return { success: false };
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    pool,
    isLoadingPool,
    poolError,
    userStake,
    isLoadingStake,
    stakeError,
    currentTier,
    nextTier,
    tierProgress,
    isLocked,
    timeUntilUnlock,
    stake,
    unstake,
    claimRewards,
    isStaking,
    isUnstaking,
    isClaiming,
    actionError,
    refresh,
  };
}

export default useStaking;
