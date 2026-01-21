import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { launchpadService } from "../services/launchpad.service";
import {
  ApiResponse,
  PlatformStatsResponse,
  CreatorStatsResponse,
  getDiscountFromTier,
  StakingTierName,
} from "../types";

/**
 * Controller for platform and creator statistics
 */
export class StatsController {
  /**
   * GET /stats/platform
   * Get overall platform statistics
   */
  async getPlatformStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get or create platform stats
      const stats = await prisma.platformStats.upsert({
        where: { id: "platform" },
        create: { id: "platform" },
        update: {},
      });

      // Get real-time counts
      const [activeTokens, graduatedTokens, uniqueCreators, uniqueStakers] =
        await Promise.all([
          prisma.token.count({ where: { status: "ACTIVE" } }),
          prisma.token.count({ where: { status: "GRADUATED" } }),
          prisma.creator.count(),
          prisma.staker.count({ where: { stakedAmount: { gt: 0 } } }),
        ]);

      const response: PlatformStatsResponse = {
        totalTokensLaunched: stats.totalTokensLaunched,
        activeTokens,
        graduatedTokens,
        totalVolumeUsd: stats.totalVolumeUsd,
        totalVolumeSol: stats.totalVolumeSol,
        totalFeesCollectedSol: stats.totalFeesCollectedSol,
        totalBurnedUsd: stats.totalBurnedUsd,
        totalStakedKr8tiv: stats.totalStakedKr8tiv.toString(),
        uniqueCreators,
        uniqueStakers,
      };

      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      } as ApiResponse<PlatformStatsResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stats/creator/:wallet
   * Get statistics for a specific creator
   */
  async getCreatorStats(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      // Get creator profile
      const creator = await prisma.creator.findUnique({
        where: { wallet },
        include: {
          tokens: {
            select: {
              tokenMint: true,
              name: true,
              symbol: true,
              status: true,
              totalVolumeUsd: true,
            },
            orderBy: { launchedAt: "desc" },
          },
        },
      });

      if (!creator) {
        // Return empty stats for non-existent creator
        res.json({
          success: true,
          data: {
            wallet,
            tokensLaunched: 0,
            totalVolumeUsd: 0,
            totalFeesGenerated: 0,
            kr8tivStaked: "0",
            discountTier: "NONE",
            feeDiscount: 0,
            tokens: [],
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<CreatorStatsResponse>);
        return;
      }

      const response: CreatorStatsResponse = {
        wallet: creator.wallet,
        displayName: creator.displayName || undefined,
        tokensLaunched: creator.tokensLaunched,
        totalVolumeUsd: creator.totalVolumeUsd,
        totalFeesGenerated: creator.totalFeesGenerated,
        kr8tivStaked: creator.kr8tivStaked.toString(),
        discountTier: creator.discountTier,
        feeDiscount: getDiscountFromTier(creator.discountTier as StakingTierName),
        tokens: creator.tokens.map((t) => ({
          tokenMint: t.tokenMint,
          name: t.name,
          symbol: t.symbol,
          status: t.status,
          volumeUsd: t.totalVolumeUsd,
        })),
      };

      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      } as ApiResponse<CreatorStatsResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stats/trending
   * Get trending tokens (by 24h volume)
   */
  async getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // Get tokens sorted by volume
      const tokens = await prisma.token.findMany({
        where: {
          status: { in: ["ACTIVE", "GRADUATED"] },
        },
        orderBy: {
          totalVolumeUsd: "desc",
        },
        take: Math.min(limit, 50),
        select: {
          tokenMint: true,
          name: true,
          symbol: true,
          imageUrl: true,
          status: true,
          currentPriceUsd: true,
          currentPriceSol: true,
          totalVolumeUsd: true,
          totalVolumeSol: true,
          holderCount: true,
          marketCapUsd: true,
        },
      });

      res.json({
        success: true,
        data: { tokens },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{ tokens: typeof tokens }>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stats/new
   * Get newly launched tokens
   */
  async getNewTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const hours = parseInt(req.query.hours as string) || 24;

      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const tokens = await prisma.token.findMany({
        where: {
          status: "ACTIVE",
          launchedAt: { gte: since },
        },
        orderBy: {
          launchedAt: "desc",
        },
        take: Math.min(limit, 50),
        select: {
          tokenMint: true,
          name: true,
          symbol: true,
          imageUrl: true,
          currentPriceUsd: true,
          currentPriceSol: true,
          totalVolumeUsd: true,
          holderCount: true,
          launchedAt: true,
        },
      });

      res.json({
        success: true,
        data: { tokens },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{ tokens: typeof tokens }>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /stats/automation
   * Get automation statistics
   */
  async getAutomationStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get aggregated automation stats
      const [totalJobs, completedJobs, failedJobs, recentJobs] = await Promise.all([
        prisma.automationJob.count(),
        prisma.automationJob.count({ where: { status: "COMPLETED" } }),
        prisma.automationJob.count({ where: { status: "FAILED" } }),
        prisma.automationJob.findMany({
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 10,
          select: {
            id: true,
            jobType: true,
            claimedLamports: true,
            burnedTokens: true,
            lpTokensAdded: true,
            completedAt: true,
            token: {
              select: {
                tokenMint: true,
                name: true,
                symbol: true,
              },
            },
          },
        }),
      ]);

      // Calculate totals
      const totals = await prisma.automationJob.aggregate({
        _sum: {
          claimedLamports: true,
          burnedTokens: true,
          lpTokensAdded: true,
          dividendsPaid: true,
        },
        where: { status: "COMPLETED" },
      });

      res.json({
        success: true,
        data: {
          totalJobs,
          completedJobs,
          failedJobs,
          successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
          totals: {
            claimedLamports: (totals._sum.claimedLamports || BigInt(0)).toString(),
            burnedTokens: (totals._sum.burnedTokens || BigInt(0)).toString(),
            lpTokensAdded: (totals._sum.lpTokensAdded || BigInt(0)).toString(),
            dividendsPaid: (totals._sum.dividendsPaid || BigInt(0)).toString(),
          },
          recentJobs: recentJobs.map((job) => ({
            id: job.id,
            jobType: job.jobType,
            claimedLamports: job.claimedLamports.toString(),
            burnedTokens: job.burnedTokens.toString(),
            lpTokensAdded: job.lpTokensAdded.toString(),
            completedAt: job.completedAt?.toISOString(),
            token: job.token,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const statsController = new StatsController();
