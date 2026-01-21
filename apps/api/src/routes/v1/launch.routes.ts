/**
 * V1 Launch Routes
 *
 * POST /launch - Launch a new token through Bags.fm
 * GET /tokens - List all tokens with pagination
 * GET /tokens/recent - Get recently launched tokens
 * GET /tokens/graduated - Get graduated tokens
 * GET /tokens/top - Get top tokens by volume
 */

import { Router } from "express";
import { launchController } from "../../controllers/launch.controller";

const router = Router();

// POST /launch - Launch a new token
router.post("/launch", (req, res, next) => {
  launchController.launchToken(req, res, next);
});

// GET /tokens - List all tokens
router.get("/tokens", (req, res, next) => {
  launchController.listTokens(req, res, next);
});

// GET /tokens/recent - Get recently launched tokens
router.get("/tokens/recent", (req, res, next) => {
  launchController.getRecentTokens(req, res, next);
});

// GET /tokens/graduated - Get graduated tokens
router.get("/tokens/graduated", (req, res, next) => {
  launchController.getGraduatedTokens(req, res, next);
});

// GET /tokens/top - Get top tokens by volume
router.get("/tokens/top", (req, res, next) => {
  launchController.getTopTokens(req, res, next);
});

export default router;
