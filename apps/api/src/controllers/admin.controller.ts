import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import { automationService } from "../services/automation.service";
import { launchpadService } from "../services/launchpad.service";
import {
  TriggerAutomationRequestSchema,
  ApiResponse,
  TriggerAutomationResponse,
} from "../types";
import { ZodError } from "zod";
import { AutomationJobType } from "@prisma/client";

/**
 * Controller for admin operations
 */
export class AdminController {
  /**
   * POST /admin/automation/trigger
   * Manually trigger automation for a token
   */
  async triggerAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const validatedData = TriggerAutomationRequestSchema.parse(req.body);

      // Must provide either tokenId or tokenMint
      if (!validatedData.tokenId && !validatedData.tokenMint) {
        res.status(400).json({
          success: false,
          error: "Must provide either tokenId or tokenMint",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Trigger automation
      const result = await automationService.triggerAutomation(
        validatedData.tokenId,
        validatedData.tokenMint,
        validatedData.jobType as AutomationJobType
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.message,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<TriggerAutomationResponse>);
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
   * POST /admin/automation/run-all
   * Run automation cycle for all tokens
   */
  async runAllAutomation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Start automation cycle in background
      automationService.runAutomationCycle().catch((error) => {
        console.error("[AdminController] Automation cycle error:", error);
      });

      res.json({
        success: true,
        data: {
          message: "Automation cycle started",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{ message: string }>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/graduations/check
   * Check and update token graduation status
   */
  async checkGraduations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Start graduation check in background
      launchpadService.checkGraduations().catch((error) => {
        console.error("[AdminController] Graduation check error:", error);
      });

      res.json({
        success: true,
        data: {
          message: "Graduation check started",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{ message: string }>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/jobs/pending
   * Get pending automation jobs
   */
  async getPendingJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const jobs = await prisma.automationJob.findMany({
        where: {
          status: { in: ["PENDING", "RUNNING"] },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: limit,
        include: {
          token: {
            select: {
              tokenMint: true,
              name: true,
              symbol: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          jobs: jobs.map((job) => ({
            id: job.id,
            tokenId: job.tokenId,
            token: job.token,
            jobType: job.jobType,
            status: job.status,
            triggerType: job.triggerType,
            scheduledFor: job.scheduledFor?.toISOString(),
            startedAt: job.startedAt?.toISOString(),
            retryCount: job.retryCount,
            createdAt: job.createdAt.toISOString(),
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/jobs/failed
   * Get failed automation jobs
   */
  async getFailedJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const jobs = await prisma.automationJob.findMany({
        where: {
          status: "FAILED",
        },
        orderBy: {
          completedAt: "desc",
        },
        take: limit,
        include: {
          token: {
            select: {
              tokenMint: true,
              name: true,
              symbol: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          jobs: jobs.map((job) => ({
            id: job.id,
            tokenId: job.tokenId,
            token: job.token,
            jobType: job.jobType,
            errorMessage: job.errorMessage,
            retryCount: job.retryCount,
            completedAt: job.completedAt?.toISOString(),
            createdAt: job.createdAt.toISOString(),
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/jobs/:id/retry
   * Retry a failed job
   */
  async retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const job = await prisma.automationJob.findUnique({
        where: { id },
      });

      if (!job) {
        res.status(404).json({
          success: false,
          error: "Job not found",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      if (job.status !== "FAILED") {
        res.status(400).json({
          success: false,
          error: "Can only retry failed jobs",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Reset job status
      await prisma.automationJob.update({
        where: { id },
        data: {
          status: "PENDING",
          errorMessage: null,
          completedAt: null,
        },
      });

      // Trigger processing
      const result = await automationService.triggerAutomation(
        job.tokenId,
        undefined,
        job.jobType
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<typeof result>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/health
   * Get system health status
   */
  async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check database
      const dbHealthy = await prisma.$queryRaw`SELECT 1`
        .then(() => true)
        .catch(() => false);

      // Get counts
      const [tokenCount, jobCount, stakerCount] = await Promise.all([
        prisma.token.count(),
        prisma.automationJob.count({ where: { status: "PENDING" } }),
        prisma.staker.count(),
      ]);

      res.json({
        success: true,
        data: {
          status: dbHealthy ? "healthy" : "degraded",
          database: dbHealthy ? "connected" : "disconnected",
          metrics: {
            totalTokens: tokenCount,
            pendingJobs: jobCount,
            totalStakers: stakerCount,
          },
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /admin/tokens/:id/update-stats
   * Manually update token stats from Bags
   */
  async updateTokenStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const token = await prisma.token.findUnique({
        where: { id },
      });

      if (!token) {
        res.status(404).json({
          success: false,
          error: "Token not found",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      if (!token.tokenMint) {
        res.status(400).json({
          success: false,
          error: "Token has no mint address",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Update stats from Bags
      const stats = await launchpadService.getTokenStats(token.tokenMint);

      res.json({
        success: true,
        data: {
          message: "Stats updated",
          stats,
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{ message: string; stats: typeof stats }>);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const adminController = new AdminController();
