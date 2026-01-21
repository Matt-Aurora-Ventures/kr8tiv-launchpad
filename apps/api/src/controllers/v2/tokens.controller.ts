/**
 * V2 Tokens Controller
 *
 * Enhanced token endpoints with improved response formats
 * and additional features like batch operations and search.
 */

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../db/prisma";

// =============================================================================
// Types
// =============================================================================

interface V2PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_more: boolean;
    cursor?: string;
  };
  timestamp: string;
}

interface V2TokenResponse {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creator: string;
  status: string;
  is_graduated: boolean;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
  holder_count?: number;
  created_at: string;
  updated_at: string;
  // V2 additions
  social_links?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  tags?: string[];
  verified: boolean;
}

// =============================================================================
// Controller
// =============================================================================

export const v2TokensController = {
  /**
   * GET /tokens - Enhanced token list
   *
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20, max: 100)
   * - cursor: Cursor for cursor-based pagination
   * - status: Filter by status
   * - graduated: Filter by graduation status
   * - sort: Sort field (created_at, market_cap, volume_24h)
   * - order: Sort order (asc, desc)
   */
  async listTokens(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20)
      );
      const cursor = req.query.cursor as string | undefined;
      const status = req.query.status as string | undefined;
      const graduated = req.query.graduated as string | undefined;
      const sort = (req.query.sort as string) || "created_at";
      const order = (req.query.order as string) || "desc";

      // Build where clause
      const where: Record<string, unknown> = {};
      if (status) {
        where.status = status;
      }
      if (graduated !== undefined) {
        where.isGraduated = graduated === "true";
      }

      // Build order clause
      const orderBy: Record<string, string> = {};
      const allowedSortFields = ["created_at", "market_cap", "volume_24h", "name"];
      if (allowedSortFields.includes(sort)) {
        const dbField = sort === "created_at" ? "createdAt" :
                       sort === "market_cap" ? "marketCap" :
                       sort === "volume_24h" ? "volume24h" : sort;
        orderBy[dbField] = order === "asc" ? "asc" : "desc";
      }

      // Get total count
      const total = await prisma.token.count({ where });

      // Get tokens
      const skip = cursor ? undefined : (page - 1) * limit;
      const tokens = await prisma.token.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      });

      const total_pages = Math.ceil(total / limit);
      const has_more = page < total_pages;
      const nextCursor = tokens.length > 0 ? tokens[tokens.length - 1].id : undefined;

      // Transform to V2 response format
      const data: V2TokenResponse[] = tokens.map((token) => ({
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        description: token.description || undefined,
        image: token.imageUrl || undefined,
        creator: token.creatorWallet,
        status: token.status,
        is_graduated: token.isGraduated,
        market_cap: token.marketCap?.toNumber() || undefined,
        volume_24h: token.volume24h?.toNumber() || undefined,
        price_change_24h: undefined, // TODO: Calculate from price history
        holder_count: token.holderCount || undefined,
        created_at: token.createdAt.toISOString(),
        updated_at: token.updatedAt.toISOString(),
        social_links: token.twitterUrl || token.telegramUrl || token.discordUrl || token.website
          ? {
              twitter: token.twitterUrl || undefined,
              telegram: token.telegramUrl || undefined,
              discord: token.discordUrl || undefined,
              website: token.website || undefined,
            }
          : undefined,
        tags: token.tags ? (token.tags as string[]) : undefined,
        verified: token.verified || false,
      }));

      const response: V2PaginatedResponse<V2TokenResponse> = {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          total_pages,
          has_more,
          cursor: nextCursor,
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /tokens/search - Full-text search
   *
   * Query params:
   * - q: Search query
   * - page: Page number
   * - limit: Items per page
   */
  async searchTokens(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query.q as string;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 20)
      );

      if (!query || query.length < 2) {
        res.status(400).json({
          success: false,
          error: "Search query must be at least 2 characters",
          error_code: "INVALID_SEARCH_QUERY",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Search in name, symbol, and description
      const where = {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { symbol: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      };

      const total = await prisma.token.count({ where });
      const tokens = await prisma.token.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });

      const total_pages = Math.ceil(total / limit);

      const data: V2TokenResponse[] = tokens.map((token) => ({
        mint: token.mint,
        name: token.name,
        symbol: token.symbol,
        description: token.description || undefined,
        image: token.imageUrl || undefined,
        creator: token.creatorWallet,
        status: token.status,
        is_graduated: token.isGraduated,
        market_cap: token.marketCap?.toNumber() || undefined,
        volume_24h: token.volume24h?.toNumber() || undefined,
        price_change_24h: undefined,
        holder_count: token.holderCount || undefined,
        created_at: token.createdAt.toISOString(),
        updated_at: token.updatedAt.toISOString(),
        verified: token.verified || false,
      }));

      res.json({
        success: true,
        data,
        query,
        pagination: {
          page,
          limit,
          total,
          total_pages,
          has_more: page < total_pages,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /tokens/batch - Batch token lookup
   *
   * Body: { mints: ["mint1", "mint2", ...] }
   * Max 50 mints per request
   */
  async batchGetTokens(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mints } = req.body;

      if (!Array.isArray(mints) || mints.length === 0) {
        res.status(400).json({
          success: false,
          error: "Request body must include a non-empty 'mints' array",
          error_code: "INVALID_REQUEST_BODY",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (mints.length > 50) {
        res.status(400).json({
          success: false,
          error: "Maximum 50 mints per batch request",
          error_code: "BATCH_SIZE_EXCEEDED",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const tokens = await prisma.token.findMany({
        where: {
          mint: { in: mints },
        },
      });

      // Create a map for easy lookup
      const tokenMap = new Map(tokens.map((t) => [t.mint, t]));

      // Return results in the same order as requested
      const data = mints.map((mint) => {
        const token = tokenMap.get(mint);
        if (!token) {
          return {
            mint,
            found: false,
          };
        }

        return {
          mint: token.mint,
          found: true,
          name: token.name,
          symbol: token.symbol,
          description: token.description || undefined,
          image: token.imageUrl || undefined,
          creator: token.creatorWallet,
          status: token.status,
          is_graduated: token.isGraduated,
          market_cap: token.marketCap?.toNumber() || undefined,
          volume_24h: token.volume24h?.toNumber() || undefined,
          holder_count: token.holderCount || undefined,
          created_at: token.createdAt.toISOString(),
          updated_at: token.updatedAt.toISOString(),
          verified: token.verified || false,
        };
      });

      res.json({
        success: true,
        data,
        requested: mints.length,
        found: tokens.length,
        not_found: mints.length - tokens.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};

export default v2TokensController;
