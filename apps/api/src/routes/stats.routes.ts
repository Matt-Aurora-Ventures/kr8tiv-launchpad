import { Router } from "express";
import { statsController } from "../controllers/stats.controller";

const router = Router();

/**
 * Stats Routes
 *
 * GET /platform - Get overall platform statistics
 * GET /creator/:wallet - Get statistics for a specific creator
 * GET /trending - Get trending tokens
 * GET /new - Get newly launched tokens
 * GET /automation - Get automation statistics
 */

// GET /platform - Get platform stats
router.get("/platform", (req, res, next) => {
  statsController.getPlatformStats(req, res, next);
});

// GET /creator/:wallet - Get creator stats
router.get("/creator/:wallet", (req, res, next) => {
  statsController.getCreatorStats(req, res, next);
});

// GET /trending - Get trending tokens
router.get("/trending", (req, res, next) => {
  statsController.getTrending(req, res, next);
});

// GET /new - Get new tokens
router.get("/new", (req, res, next) => {
  statsController.getNewTokens(req, res, next);
});

// GET /automation - Get automation stats
router.get("/automation", (req, res, next) => {
  statsController.getAutomationStats(req, res, next);
});

export default router;
