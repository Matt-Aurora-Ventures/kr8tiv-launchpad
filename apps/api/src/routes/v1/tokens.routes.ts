/**
 * V1 Token Routes
 *
 * GET /tokens/:mint - Get token details by mint address
 * GET /tokens/:mint/stats - Get live token statistics
 * GET /tokens/:mint/automation - Get automation history
 * GET /tokens/:mint/holders - Get token holder information
 * GET /tokens/:mint/chart - Get price chart data
 */

import { Router } from "express";
import { tokensController } from "../../controllers/tokens.controller";

const router = Router();

// GET /tokens/:mint - Get token details
router.get("/:mint", (req, res, next) => {
  tokensController.getToken(req, res, next);
});

// GET /tokens/:mint/stats - Get live token statistics
router.get("/:mint/stats", (req, res, next) => {
  tokensController.getTokenStats(req, res, next);
});

// GET /tokens/:mint/automation - Get automation history
router.get("/:mint/automation", (req, res, next) => {
  tokensController.getAutomationHistory(req, res, next);
});

// GET /tokens/:mint/holders - Get token holders
router.get("/:mint/holders", (req, res, next) => {
  tokensController.getHolders(req, res, next);
});

// GET /tokens/:mint/chart - Get price chart data
router.get("/:mint/chart", (req, res, next) => {
  tokensController.getChartData(req, res, next);
});

export default router;
