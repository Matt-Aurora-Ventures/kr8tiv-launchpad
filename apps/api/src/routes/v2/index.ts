/**
 * V2 API Routes
 *
 * V2 inherits from V1 with the following enhancements:
 * - Enhanced token list response with additional metadata
 * - Batch operations support
 * - Improved error responses with error codes
 * - Rate limit headers
 *
 * Breaking changes from V1:
 * - Token list response format changed (pagination metadata at root level)
 * - Error response format includes error_code field
 */

import { Router, Request, Response, NextFunction } from "express";
import v1Routes from "../v1";
import { v2TokensController } from "../../controllers/v2/tokens.controller";
import { v2StatsController } from "../../controllers/v2/stats.controller";

const router = Router();

// =============================================================================
// V2-Specific Middleware
// =============================================================================

/**
 * Add V2-specific response headers
 */
const v2Headers = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader("X-API-Version", "2");
  res.setHeader("X-RateLimit-Policy", "sliding-window");
  next();
};

router.use(v2Headers);

// =============================================================================
// V2 Enhanced Endpoints
// =============================================================================

/**
 * GET /tokens - Enhanced token list with better pagination
 *
 * V2 changes:
 * - Pagination metadata at root level (not nested in data)
 * - Includes total_pages and has_more fields
 * - Supports cursor-based pagination via ?cursor=
 */
router.get("/tokens", (req, res, next) => {
  v2TokensController.listTokens(req, res, next);
});

/**
 * GET /tokens/search - Token search endpoint (V2 only)
 *
 * Supports:
 * - Full-text search on name, symbol, description
 * - Filter by status, graduation state
 * - Sort by various metrics
 */
router.get("/tokens/search", (req, res, next) => {
  v2TokensController.searchTokens(req, res, next);
});

/**
 * POST /tokens/batch - Batch token lookup (V2 only)
 *
 * Allows fetching multiple tokens in a single request.
 * Body: { mints: ["mint1", "mint2", ...] }
 */
router.post("/tokens/batch", (req, res, next) => {
  v2TokensController.batchGetTokens(req, res, next);
});

/**
 * GET /stats/summary - Enhanced platform summary (V2 only)
 *
 * Includes additional metrics not available in V1:
 * - Trading volume by timeframe
 * - User growth metrics
 * - Automation success rates
 */
router.get("/stats/summary", (req, res, next) => {
  v2StatsController.getSummary(req, res, next);
});

// =============================================================================
// Inherit V1 Routes (for non-overridden endpoints)
// =============================================================================

// All other routes fall through to V1 implementation
router.use("/", v1Routes);

export default router;
