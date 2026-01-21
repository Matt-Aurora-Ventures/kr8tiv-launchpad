/**
 * V1 Admin Routes
 *
 * All routes require admin authentication via X-API-Key header.
 *
 * POST /automation/trigger - Manually trigger automation for a token
 * POST /automation/run-all - Run automation cycle for all tokens
 * POST /graduations/check - Check and update token graduation status
 * GET /jobs/pending - Get pending automation jobs
 * GET /jobs/failed - Get failed automation jobs
 * POST /jobs/:id/retry - Retry a failed job
 * GET /health - Get system health status
 * POST /tokens/:id/update-stats - Manually update token stats
 */

import { Router, Request, Response, NextFunction } from "express";
import { adminController } from "../../controllers/admin.controller";

const router = Router();

/**
 * Admin API Key Authentication Middleware
 */
const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey =
    req.headers["x-api-key"] ||
    req.headers["authorization"]?.replace("Bearer ", "");

  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    console.warn("[AdminRoutes] ADMIN_API_KEY not configured");
    res.status(500).json({
      success: false,
      error: "Admin authentication not configured",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!apiKey || apiKey !== expectedKey) {
    res.status(401).json({
      success: false,
      error: "Unauthorized - Invalid or missing API key",
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

// Apply admin auth to all routes
router.use(adminAuth);

// POST /automation/trigger - Trigger automation for a token
router.post("/automation/trigger", (req, res, next) => {
  adminController.triggerAutomation(req, res, next);
});

// POST /automation/run-all - Run automation for all tokens
router.post("/automation/run-all", (req, res, next) => {
  adminController.runAllAutomation(req, res, next);
});

// POST /graduations/check - Check graduations
router.post("/graduations/check", (req, res, next) => {
  adminController.checkGraduations(req, res, next);
});

// GET /jobs/pending - Get pending jobs
router.get("/jobs/pending", (req, res, next) => {
  adminController.getPendingJobs(req, res, next);
});

// GET /jobs/failed - Get failed jobs
router.get("/jobs/failed", (req, res, next) => {
  adminController.getFailedJobs(req, res, next);
});

// POST /jobs/:id/retry - Retry a failed job
router.post("/jobs/:id/retry", (req, res, next) => {
  adminController.retryJob(req, res, next);
});

// GET /health - Get health status
router.get("/health", (req, res, next) => {
  adminController.getHealth(req, res, next);
});

// POST /tokens/:id/update-stats - Update token stats
router.post("/tokens/:id/update-stats", (req, res, next) => {
  adminController.updateTokenStats(req, res, next);
});

export default router;
