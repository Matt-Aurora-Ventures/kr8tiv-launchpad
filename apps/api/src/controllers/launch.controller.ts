import { Request, Response, NextFunction } from "express";
import { launchpadService } from "../services/launchpad.service";
import { LaunchTokenRequestSchema, ApiResponse, LaunchTokenResponse, TokenListResponse } from "../types";
import { TokenStatus } from "@prisma/client";
import { ZodError } from "zod";

/**
 * Controller for token launch operations
 */
export class LaunchController {
  /**
   * POST /launch
   * Launch a new token through Bags.fm
   */
  async launchToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = LaunchTokenRequestSchema.parse(req.body);

      // Validate fee percentages don't exceed 100%
      const totalFees =
        (validatedData.burnEnabled ? validatedData.burnPercentage : 0) +
        (validatedData.lpEnabled ? validatedData.lpPercentage : 0) +
        (validatedData.dividendsEnabled ? validatedData.dividendsPercentage : 0);

      if (totalFees > 10000) {
        res.status(400).json({
          success: false,
          error: "Total fee percentages cannot exceed 100% (10000 basis points)",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Validate custom allocations don't exceed limits
      if (validatedData.customAllocations) {
        const totalAllocation = validatedData.customAllocations.reduce(
          (sum, a) => sum + a.percentage,
          0
        );
        if (totalAllocation > 5000) {
          // Max 50% to custom allocations
          res.status(400).json({
            success: false,
            error: "Custom allocations cannot exceed 50% (5000 basis points)",
            timestamp: new Date().toISOString(),
          } as ApiResponse<never>);
          return;
        }
      }

      // Launch token
      const result = await launchpadService.launchToken(validatedData);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<LaunchTokenResponse>);
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
   * GET /tokens
   * List all tokens with pagination and filtering
   */
  async listTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as TokenStatus | undefined;
      const creatorWallet = req.query.creator as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      // Validate status if provided
      if (status && !Object.values(TokenStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${Object.values(TokenStatus).join(", ")}`,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      const result = await launchpadService.listTokens({
        page,
        limit,
        status,
        creatorWallet,
        sortBy,
        sortOrder,
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<TokenListResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tokens/recent
   * Get recently launched tokens
   */
  async getRecentTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await launchpadService.listTokens({
        page: 1,
        limit: Math.min(limit, 50),
        status: TokenStatus.ACTIVE,
        sortBy: "launchedAt",
        sortOrder: "desc",
      });

      res.json({
        success: true,
        data: result.tokens,
        timestamp: new Date().toISOString(),
      } as ApiResponse<typeof result.tokens>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tokens/graduated
   * Get tokens that have graduated from bonding curve
   */
  async getGraduatedTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const page = parseInt(req.query.page as string) || 1;

      const result = await launchpadService.listTokens({
        page,
        limit,
        status: TokenStatus.GRADUATED,
        sortBy: "graduatedAt",
        sortOrder: "desc",
      });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      } as ApiResponse<TokenListResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tokens/top
   * Get top tokens by volume
   */
  async getTopTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await launchpadService.listTokens({
        page: 1,
        limit: Math.min(limit, 50),
        sortBy: "totalVolumeUsd",
        sortOrder: "desc",
      });

      res.json({
        success: true,
        data: result.tokens,
        timestamp: new Date().toISOString(),
      } as ApiResponse<typeof result.tokens>);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const launchController = new LaunchController();
