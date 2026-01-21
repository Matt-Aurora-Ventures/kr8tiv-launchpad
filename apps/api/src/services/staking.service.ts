import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";
import prisma from "../db/prisma";
import {
  StakeRequest,
  UnstakeRequest,
  ClaimRewardsRequest,
  StakingStatusResponse,
  StakingPoolResponse,
  StakingTransactionResponse,
  getTierFromStake,
  getDiscountFromTier,
  getLockMultiplier,
  STAKING_TIERS,
  StakingTierName,
} from "../types";
import { StakingTier } from "@prisma/client";

/**
 * Service for $KR8TIV staking operations
 *
 * This service manages:
 * - Staking/unstaking $KR8TIV tokens
 * - Tier calculations and fee discounts
 * - Reward distribution
 */
export class StakingService {
  private connection: Connection;
  private programId: PublicKey;
  private kr8tivMint: PublicKey;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("SOLANA_RPC_URL environment variable is required");
    }

    this.connection = new Connection(rpcUrl, "confirmed");

    // Staking program ID
    const programId = process.env.STAKING_PROGRAM_ID;
    if (programId) {
      this.programId = new PublicKey(programId);
    } else {
      // Default placeholder
      this.programId = new PublicKey("11111111111111111111111111111111");
    }

    // $KR8TIV token mint
    const kr8tivMint = process.env.KR8TIV_TOKEN_MINT;
    if (kr8tivMint) {
      this.kr8tivMint = new PublicKey(kr8tivMint);
    } else {
      // Default placeholder
      this.kr8tivMint = new PublicKey("11111111111111111111111111111111");
    }
  }

  /**
   * Get staking status for a wallet
   */
  async getStakingStatus(wallet: string): Promise<StakingStatusResponse | null> {
    const staker = await prisma.staker.findUnique({
      where: { wallet },
    });

    if (!staker) {
      return {
        wallet,
        stakedAmount: "0",
        weightedStake: "0",
        tier: "NONE",
        lockDurationDays: 0,
        pendingRewards: "0",
        totalRewardsClaimed: "0",
        feeDiscount: 0,
      };
    }

    // Calculate pending rewards
    const pendingRewards = await this.calculatePendingRewards(wallet);

    return {
      wallet: staker.wallet,
      stakedAmount: staker.stakedAmount.toString(),
      weightedStake: staker.weightedStake.toString(),
      tier: staker.tier,
      lockEndTime: staker.lockEndTime?.toISOString(),
      lockDurationDays: staker.lockDuration,
      pendingRewards: pendingRewards.toString(),
      totalRewardsClaimed: staker.totalRewardsClaimed.toString(),
      feeDiscount: getDiscountFromTier(staker.tier as StakingTierName),
    };
  }

  /**
   * Get staking pool info
   */
  async getPoolInfo(): Promise<StakingPoolResponse> {
    // Get aggregated stats
    const [totalStaked, stakerCounts] = await Promise.all([
      prisma.staker.aggregate({
        _sum: { stakedAmount: true },
      }),
      prisma.staker.groupBy({
        by: ["tier"],
        _count: true,
      }),
    ]);

    // Format tier counts
    const tierCountMap = new Map(
      stakerCounts.map((tc) => [tc.tier, tc._count])
    );

    const tiers = Object.entries(STAKING_TIERS).map(([name, config]) => ({
      name,
      minStake: config.minStake.toString(),
      discount: config.discount,
      count: tierCountMap.get(name as StakingTier) || 0,
    }));

    const totalStakers = stakerCounts.reduce((sum, tc) => sum + tc._count, 0);

    // Calculate APY based on rewards pool and total staked
    // This is a simplified calculation
    const rewardsPoolBalance = await this.getRewardsPoolBalance();
    const totalStakedAmount = totalStaked._sum.stakedAmount || BigInt(0);
    const apy = this.calculateApy(totalStakedAmount, rewardsPoolBalance);

    return {
      totalStaked: (totalStaked._sum.stakedAmount || BigInt(0)).toString(),
      totalStakers,
      rewardsPool: rewardsPoolBalance.toString(),
      apy,
      tiers,
    };
  }

  /**
   * Stake $KR8TIV tokens
   *
   * Returns transaction to be signed by the user
   */
  async stake(request: StakeRequest): Promise<StakingTransactionResponse> {
    try {
      const amount = BigInt(request.amount);
      const lockDays = request.lockDurationDays;

      console.log(
        `[StakingService] Staking ${amount} for wallet ${request.wallet}, lock: ${lockDays} days`
      );

      // Get or create staker record
      let staker = await prisma.staker.findUnique({
        where: { wallet: request.wallet },
      });

      // Calculate lock end time
      const lockEndTime = lockDays > 0
        ? new Date(Date.now() + lockDays * 24 * 60 * 60 * 1000)
        : null;

      // Calculate weighted stake with lock multiplier
      const multiplier = getLockMultiplier(lockDays);
      const weightedAmount = BigInt(Math.floor(Number(amount) * multiplier));

      if (!staker) {
        // Create new staker
        staker = await prisma.staker.create({
          data: {
            wallet: request.wallet,
            stakedAmount: amount,
            weightedStake: weightedAmount,
            lockDuration: lockDays,
            lockEndTime,
            tier: getTierFromStake(amount) as StakingTier,
          },
        });

        // Update platform stats
        await prisma.platformStats.upsert({
          where: { id: "platform" },
          create: {
            id: "platform",
            uniqueStakers: 1,
            totalStakedKr8tiv: amount,
          },
          update: {
            uniqueStakers: { increment: 1 },
            totalStakedKr8tiv: { increment: amount },
          },
        });
      } else {
        // Update existing staker
        const newTotal = staker.stakedAmount + amount;
        const newWeighted = staker.weightedStake + weightedAmount;
        const newTier = getTierFromStake(newTotal);

        // Handle lock extension (take the longer lock)
        const newLockEnd = lockEndTime && (!staker.lockEndTime || lockEndTime > staker.lockEndTime)
          ? lockEndTime
          : staker.lockEndTime;
        const newLockDuration = lockEndTime && (!staker.lockEndTime || lockEndTime > staker.lockEndTime)
          ? lockDays
          : staker.lockDuration;

        staker = await prisma.staker.update({
          where: { wallet: request.wallet },
          data: {
            stakedAmount: newTotal,
            weightedStake: newWeighted,
            lockEndTime: newLockEnd,
            lockDuration: newLockDuration,
            tier: newTier as StakingTier,
          },
        });

        // Update platform stats
        await prisma.platformStats.update({
          where: { id: "platform" },
          data: {
            totalStakedKr8tiv: { increment: amount },
          },
        });
      }

      // Update creator discount tier if applicable
      await this.updateCreatorDiscount(request.wallet);

      // In production, this would build and return an unsigned transaction
      // For now, we return success with a mock signature
      const mockSignature = `stake_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

      return {
        success: true,
        signature: mockSignature,
        newStakedAmount: staker.stakedAmount.toString(),
        newTier: staker.tier,
      };
    } catch (error) {
      console.error("[StakingService] Error staking:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Unstake $KR8TIV tokens
   */
  async unstake(request: UnstakeRequest): Promise<StakingTransactionResponse> {
    try {
      const amount = BigInt(request.amount);

      console.log(
        `[StakingService] Unstaking ${amount} for wallet ${request.wallet}`
      );

      const staker = await prisma.staker.findUnique({
        where: { wallet: request.wallet },
      });

      if (!staker) {
        return {
          success: false,
          error: "Staker not found",
        };
      }

      // Check lock period
      if (staker.lockEndTime && staker.lockEndTime > new Date()) {
        return {
          success: false,
          error: `Tokens locked until ${staker.lockEndTime.toISOString()}`,
        };
      }

      // Check sufficient balance
      if (staker.stakedAmount < amount) {
        return {
          success: false,
          error: "Insufficient staked balance",
        };
      }

      // Calculate new values
      const newStaked = staker.stakedAmount - amount;
      const unstakeRatio = Number(amount) / Number(staker.stakedAmount);
      const weightedReduction = BigInt(
        Math.floor(Number(staker.weightedStake) * unstakeRatio)
      );
      const newWeighted = staker.weightedStake - weightedReduction;
      const newTier = getTierFromStake(newStaked);

      // Update staker
      const updatedStaker = await prisma.staker.update({
        where: { wallet: request.wallet },
        data: {
          stakedAmount: newStaked,
          weightedStake: newWeighted,
          tier: newTier as StakingTier,
          // Clear lock if fully unstaked
          lockEndTime: newStaked === BigInt(0) ? null : staker.lockEndTime,
          lockDuration: newStaked === BigInt(0) ? 0 : staker.lockDuration,
        },
      });

      // Update platform stats
      await prisma.platformStats.update({
        where: { id: "platform" },
        data: {
          totalStakedKr8tiv: { decrement: amount },
        },
      });

      // Update creator discount tier
      await this.updateCreatorDiscount(request.wallet);

      const mockSignature = `unstake_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

      return {
        success: true,
        signature: mockSignature,
        newStakedAmount: updatedStaker.stakedAmount.toString(),
        newTier: updatedStaker.tier,
      };
    } catch (error) {
      console.error("[StakingService] Error unstaking:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(request: ClaimRewardsRequest): Promise<StakingTransactionResponse> {
    try {
      console.log(`[StakingService] Claiming rewards for wallet ${request.wallet}`);

      const staker = await prisma.staker.findUnique({
        where: { wallet: request.wallet },
      });

      if (!staker) {
        return {
          success: false,
          error: "Staker not found",
        };
      }

      // Calculate pending rewards
      const pendingRewards = await this.calculatePendingRewards(request.wallet);

      if (pendingRewards === BigInt(0)) {
        return {
          success: false,
          error: "No rewards to claim",
        };
      }

      // Update staker
      await prisma.staker.update({
        where: { wallet: request.wallet },
        data: {
          totalRewardsClaimed: { increment: pendingRewards },
          pendingRewards: 0,
          lastClaimTime: new Date(),
        },
      });

      const mockSignature = `claim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

      return {
        success: true,
        signature: mockSignature,
        newStakedAmount: staker.stakedAmount.toString(),
        newTier: staker.tier,
      };
    } catch (error) {
      console.error("[StakingService] Error claiming rewards:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Calculate pending rewards for a staker
   */
  private async calculatePendingRewards(wallet: string): Promise<bigint> {
    const staker = await prisma.staker.findUnique({
      where: { wallet },
    });

    if (!staker || staker.stakedAmount === BigInt(0)) {
      return BigInt(0);
    }

    // Get rewards pool balance
    const rewardsPool = await this.getRewardsPoolBalance();

    // Get total weighted stake
    const totalWeighted = await prisma.staker.aggregate({
      _sum: { weightedStake: true },
    });

    const totalWeightedStake = totalWeighted._sum.weightedStake || BigInt(1);

    // Calculate share of rewards
    // Simplified: staker gets their weighted proportion of the rewards pool
    // In production, this would be based on time since last claim
    const shareRatio = Number(staker.weightedStake) / Number(totalWeightedStake);
    const dailyRewards = rewardsPool / BigInt(365); // Distribute over a year

    // Time since last claim
    const lastClaim = staker.lastClaimTime || staker.createdAt;
    const daysSinceClaim = Math.floor(
      (Date.now() - lastClaim.getTime()) / (24 * 60 * 60 * 1000)
    );

    const pendingRewards = BigInt(
      Math.floor(Number(dailyRewards) * shareRatio * daysSinceClaim)
    );

    return pendingRewards;
  }

  /**
   * Get rewards pool balance
   */
  private async getRewardsPoolBalance(): Promise<bigint> {
    // In production, this would query the on-chain rewards pool
    // For now, return a mock balance
    return BigInt(10_000_000_000_000); // 10M KR8TIV
  }

  /**
   * Calculate APY based on rewards and total staked
   */
  private calculateApy(totalStaked: bigint, rewardsPool: bigint): number {
    if (totalStaked === BigInt(0)) {
      return 0;
    }

    // Simplified APY calculation
    // APY = (annual rewards / total staked) * 100
    const annualRewards = rewardsPool; // Assume pool is distributed annually
    const apy = (Number(annualRewards) / Number(totalStaked)) * 100;

    return Math.min(apy, 1000); // Cap at 1000%
  }

  /**
   * Update creator's discount tier based on staking
   */
  private async updateCreatorDiscount(wallet: string): Promise<void> {
    const staker = await prisma.staker.findUnique({
      where: { wallet },
    });

    const creator = await prisma.creator.findUnique({
      where: { wallet },
    });

    if (creator) {
      const stakedAmount = staker?.stakedAmount || BigInt(0);
      const newTier = getTierFromStake(stakedAmount);

      await prisma.creator.update({
        where: { wallet },
        data: {
          kr8tivStaked: stakedAmount,
          discountTier: newTier as StakingTier,
        },
      });
    }
  }
}

// Export singleton instance
export const stakingService = new StakingService();
