import { Request, Response, NextFunction } from "express";
import { stakingService } from "../services/staking.service";
import {
  StakeRequestSchema,
  UnstakeRequestSchema,
  ClaimRewardsRequestSchema,
  ApiResponse,
  StakingStatusResponse,
  StakingPoolResponse,
  StakingTransactionResponse,
} from "../types";
import { ZodError } from "zod";

/**
 * Controller for $KR8TIV staking operations
 */
export class StakingController {
  /**
   * POST /staking/stake
   * Stake $KR8TIV tokens
   */
  async stake(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const validatedData = StakeRequestSchema.parse(req.body);

      // Validate amount is positive
      const amount = BigInt(validatedData.amount);
      if (amount <= BigInt(0)) {
        res.status(400).json({
          success: false,
          error: "Amount must be positive",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Execute stake
      const result = await stakingService.stake(validatedData);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<StakingTransactionResponse>);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation error",
          data: error.errors,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /staking/unstake
   * Unstake $KR8TIV tokens
   */
  async unstake(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const validatedData = UnstakeRequestSchema.parse(req.body);

      // Validate amount is positive
      const amount = BigInt(validatedData.amount);
      if (amount <= BigInt(0)) {
        res.status(400).json({
          success: false,
          error: "Amount must be positive",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Execute unstake
      const result = await stakingService.unstake(validatedData);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<StakingTransactionResponse>);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation error",
          data: error.errors,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }
      next(error);
    }
  }

  /**
   * POST /staking/claim
   * Claim staking rewards
   */
  async claimRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const validatedData = ClaimRewardsRequestSchema.parse(req.body);

      // Execute claim
      const result = await stakingService.claimRewards(validatedData);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<StakingTransactionResponse>);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation error",
          data: error.errors,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }
      next(error);
    }
  }

  /**
   * GET /staking/status/:wallet
   * Get staking status for a wallet
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: "Invalid wallet address",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      const status = await stakingService.getStakingStatus(wallet);

      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      } as ApiResponse<StakingStatusResponse | null>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /staking/pool
   * Get staking pool information
   */
  async getPool(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const poolInfo = await stakingService.getPoolInfo();

      res.json({
        success: true,
        data: poolInfo,
        timestamp: new Date().toISOString(),
      } as ApiResponse<StakingPoolResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /staking/tiers
   * Get staking tier information
   */
  async getTiers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tiers = [
        {
          name: "NONE",
          minStake: "0",
          minStakeFormatted: "0 KR8TIV",
          discount: 0,
          benefits: ["Access to platform"],
        },
        {
          name: "BRONZE",
          minStake: "10000000000",
          minStakeFormatted: "10,000 KR8TIV",
          discount: 10,
          benefits: ["10% platform fee discount", "Early access to new features"],
        },
        {
          name: "SILVER",
          minStake: "50000000000",
          minStakeFormatted: "50,000 KR8TIV",
          discount: 25,
          benefits: [
            "25% platform fee discount",
            "Priority support",
            "Exclusive Discord channels",
          ],
        },
        {
          name: "GOLD",
          minStake: "100000000000",
          minStakeFormatted: "100,000 KR8TIV",
          discount: 50,
          benefits: [
            "50% platform fee discount",
            "Featured creator status",
            "Monthly AMA with team",
          ],
        },
        {
          name: "DIAMOND",
          minStake: "500000000000",
          minStakeFormatted: "500,000 KR8TIV",
          discount: 75,
          benefits: [
            "75% platform fee discount",
            "Governance voting rights",
            "Revenue share from platform",
            "Custom launch support",
          ],
        },
      ];

      res.json({
        success: true,
        data: { tiers },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{ tiers: typeof tiers }>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /staking/leaderboard
   * Get staking leaderboard
   */
  async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get top stakers
      const { default: prisma } = await import("../db/prisma");

      const topStakers = await prisma.staker.findMany({
        where: {
          stakedAmount: { gt: 0 },
        },
        orderBy: {
          weightedStake: "desc",
        },
        take: Math.min(limit, 100),
        select: {
          wallet: true,
          stakedAmount: true,
          weightedStake: true,
          tier: true,
          lockDuration: true,
        },
      });

      const leaderboard = topStakers.map((staker, index) => ({
        rank: index + 1,
        wallet: staker.wallet,
        stakedAmount: staker.stakedAmount.toString(),
        weightedStake: staker.weightedStake.toString(),
        tier: staker.tier,
        lockDays: staker.lockDuration,
      }));

      res.json({
        success: true,
        data: { leaderboard },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{ leaderboard: typeof leaderboard }>);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const stakingController = new StakingController();
