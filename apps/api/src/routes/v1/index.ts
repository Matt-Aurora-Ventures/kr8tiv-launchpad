/**
 * V1 API Routes
 *
 * Aggregates all V1 routes into a single router.
 * This is the stable, production-ready API version.
 */

import { Router } from "express";
import launchRoutes from "./launch.routes";
import tokensRoutes from "./tokens.routes";
import stakingRoutes from "./staking.routes";
import statsRoutes from "./stats.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Launch routes (POST /launch, GET /tokens, etc.)
router.use("/", launchRoutes);

// Token detail routes (GET /tokens/:mint, etc.)
router.use("/tokens", tokensRoutes);

// Staking routes (POST /staking/stake, etc.)
router.use("/staking", stakingRoutes);

// Stats routes (GET /stats/platform, etc.)
router.use("/stats", statsRoutes);

// Admin routes (requires authentication)
router.use("/admin", adminRoutes);

export default router;
