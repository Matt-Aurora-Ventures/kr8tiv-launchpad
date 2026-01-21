import { Request, Response, NextFunction } from "express";
import { launchpadService } from "../services/launchpad.service";
import { automationService } from "../services/automation.service";
import { ApiResponse, TokenDetailsResponse, TokenStatsResponse } from "../types";

/**
 * Controller for token queries
 */
export class TokensController {
  /**
   * GET /tokens/:mint
   * Get token details by mint address
   */
  async getToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mint } = req.params;

      if (!mint || mint.length < 32) {
        res.status(400).json({
          success: false,
          error: "Invalid token mint address",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      const token = await launchpadService.getTokenByMint(mint);

      if (!token) {
        res.status(404).json({
          success: false,
          error: "Token not found",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      res.json({
        success: true,
        data: token,
        timestamp: new Date().toISOString(),
      } as ApiResponse<TokenDetailsResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tokens/:mint/stats
   * Get live token statistics from Bags
   */
  async getTokenStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mint } = req.params;

      if (!mint || mint.length < 32) {
        res.status(400).json({
          success: false,
          error: "Invalid token mint address",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      const stats = await launchpadService.getTokenStats(mint);

      if (!stats) {
        res.status(404).json({
          success: false,
          error: "Token not found",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      } as ApiResponse<TokenStatsResponse>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tokens/:mint/automation
   * Get automation history for a token
   */
  async getAutomationHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mint } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!mint || mint.length < 32) {
        res.status(400).json({
          success: false,
          error: "Invalid token mint address",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Get token by mint
      const token = await launchpadService.getTokenByMint(mint);

      if (!token) {
        res.status(404).json({
          success: false,
          error: "Token not found",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      const history = await automationService.getJobHistory(token.id, limit);

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
      } as ApiResponse<typeof history>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tokens/:mint/holders
   * Get token holder information
   */
  async getHolders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mint } = req.params;

      if (!mint || mint.length < 32) {
        res.status(400).json({
          success: false,
          error: "Invalid token mint address",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // In production, this would fetch holder data from on-chain
      // For now, return basic info from the database
      const token = await launchpadService.getTokenByMint(mint);

      if (!token) {
        res.status(404).json({
          success: false,
          error: "Token not found",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Placeholder response
      res.json({
        success: true,
        data: {
          tokenMint: mint,
          holderCount: token.holderCount,
          topHolders: [], // Would be populated from on-chain data
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{
        tokenMint: string;
        holderCount: number;
        topHolders: { wallet: string; balance: string; percentage: number }[];
      }>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /tokens/:mint/chart
   * Get price chart data for a token
   */
  async getChartData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mint } = req.params;
      const interval = (req.query.interval as string) || "1h";
      const limit = parseInt(req.query.limit as string) || 100;

      if (!mint || mint.length < 32) {
        res.status(400).json({
          success: false,
          error: "Invalid token mint address",
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // Validate interval
      const validIntervals = ["1m", "5m", "15m", "1h", "4h", "1d"];
      if (!validIntervals.includes(interval)) {
        res.status(400).json({
          success: false,
          error: `Invalid interval. Must be one of: ${validIntervals.join(", ")}`,
          timestamp: new Date().toISOString(),
        } as ApiResponse<never>);
        return;
      }

      // In production, this would fetch OHLCV data from an indexer or Bags API
      // For now, return placeholder data
      res.json({
        success: true,
        data: {
          tokenMint: mint,
          interval,
          candles: [], // Would contain OHLCV data
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<{
        tokenMint: string;
        interval: string;
        candles: {
          timestamp: number;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }[];
      }>);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const tokensController = new TokensController();
