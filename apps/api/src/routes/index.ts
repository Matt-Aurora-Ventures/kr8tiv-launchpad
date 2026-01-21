/**
 * API Routes Index
 *
 * Main router that handles version routing.
 *
 * URL Structure:
 * - /api/v1/* - Version 1 (stable, default)
 * - /api/v2/* - Version 2 (enhanced features)
 * - /api/*    - Default to v1
 *
 * Version can also be specified via:
 * - Accept header: application/vnd.kr8tiv.v2+json
 * - Query param: ?version=2
 */

import { Router } from "express";
import v1Routes from "./v1";
import v2Routes from "./v2";

const router = Router();

// =============================================================================
// Versioned Routes
// =============================================================================

/**
 * V1 Routes - Stable, production-ready
 *
 * This is the default and recommended version for production use.
 */
router.use("/v1", v1Routes);

/**
 * V2 Routes - Enhanced features
 *
 * Includes improvements like:
 * - Better pagination
 * - Batch operations
 * - Search functionality
 * - Enhanced response formats
 */
router.use("/v2", v2Routes);

// =============================================================================
// Default Routes (no version prefix)
// =============================================================================

/**
 * Default routes fall through to V1
 *
 * For backward compatibility, requests without a version prefix
 * are handled by V1 routes.
 */
router.use("/", v1Routes);

// =============================================================================
// Exports
// =============================================================================

// Re-export individual route modules for direct imports
export { default as launchRoutes } from "./launch.routes";
export { default as tokensRoutes } from "./tokens.routes";
export { default as stakingRoutes } from "./staking.routes";
export { default as statsRoutes } from "./stats.routes";
export { default as adminRoutes } from "./admin.routes";

// Export versioned routes
export { default as v1Routes } from "./v1";
export { default as v2Routes } from "./v2";

export default router;
