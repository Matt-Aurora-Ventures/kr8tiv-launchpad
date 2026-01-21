/**
 * V2 Stats Controller
 *
 * Enhanced statistics endpoints with additional metrics
 * and improved response formats.
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/prisma";

// =============================================================================
// Controller
// =============================================================================

export const v2StatsController = {
  /**
   * GET /stats/summary - Enhanced platform summary
   *
   * Returns comprehensive platform metrics including:
   * - Token statistics
   * - Trading volume by timeframe
   * - User activity metrics
   * - Automation success rates
   */
  async getSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get time boundaries
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Token statistics
      const [totalTokens, activeTokens, graduatedTokens, newTokens24h] =
        await Promise.all([
          prisma.token.count(),
          prisma.token.count({ where: { status: "ACTIVE" } }),
          prisma.token.count({ where: { isGraduated: true } }),
          prisma.token.count({ where: { createdAt: { gte: oneDayAgo } } }),
        ]);

      // Volume aggregations
      const [volume24h, volume7d, volume30d] = await Promise.all([
        prisma.token.aggregate({
          _sum: { volume24h: true },
        }),
        prisma.token.aggregate({
          _sum: { volumeTotal: true },
          where: { updatedAt: { gte: oneWeekAgo } },
        }),
        prisma.token.aggregate({
          _sum: { volumeTotal: true },
          where: { updatedAt: { gte: oneMonthAgo } },
        }),
      ]);

      // User statistics
      const uniqueCreators = await prisma.token.groupBy({
        by: ["creatorWallet"],
      });

      // Staking statistics (if staking table exists)
      let stakingStats = {
        total_staked: 0,
        total_stakers: 0,
        avg_stake: 0,
      };

      try {
        const [totalStaked, totalStakers] = await Promise.all([
          prisma.stakingPosition.aggregate({
            _sum: { amount: true },
            where: { status: "ACTIVE" },
          }),
          prisma.stakingPosition.count({
            where: { status: "ACTIVE" },
          }),
        ]);

        stakingStats = {
          total_staked: totalStaked._sum.amount?.toNumber() || 0,
          total_stakers: totalStakers,
          avg_stake:
            totalStakers > 0
              ? (totalStaked._sum.amount?.toNumber() || 0) / totalStakers
              : 0,
        };
      } catch {
        // Staking table might not exist yet
      }

      // Automation statistics
      let automationStats = {
        total_executions: 0,
        successful_executions: 0,
        failed_executions: 0,
        success_rate: 0,
      };

      try {
        const [totalExec, successExec, failedExec] = await Promise.all([
          prisma.automationLog.count(),
          prisma.automationLog.count({ where: { status: "SUCCESS" } }),
          prisma.automationLog.count({ where: { status: "FAILED" } }),
        ]);

        automationStats = {
          total_executions: totalExec,
          successful_executions: successExec,
          failed_executions: failedExec,
          success_rate: totalExec > 0 ? (successExec / totalExec) * 100 : 0,
        };
      } catch {
        // Automation table might not exist yet
      }

      // Build response
      const summary = {
        tokens: {
          total: totalTokens,
          active: activeTokens,
          graduated: graduatedTokens,
          graduation_rate:
            totalTokens > 0
              ? ((graduatedTokens / totalTokens) * 100).toFixed(2)
              : "0.00",
          new_24h: newTokens24h,
        },
        volume: {
          last_24h: volume24h._sum.volume24h?.toNumber() || 0,
          last_7d: volume7d._sum.volumeTotal?.toNumber() || 0,
          last_30d: volume30d._sum.volumeTotal?.toNumber() || 0,
          currency: "USD",
        },
        users: {
          unique_creators: uniqueCreators.length,
        },
        staking: stakingStats,
        automation: automationStats,
        generated_at: now.toISOString(),
      };

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};

export default v2StatsController;
