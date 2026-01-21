import { Router } from "express";
import { stakingController } from "../controllers/staking.controller";

const router = Router();

/**
 * Staking Routes
 *
 * POST /stake - Stake $KR8TIV tokens
 * POST /unstake - Unstake $KR8TIV tokens
 * POST /claim - Claim staking rewards
 * GET /status/:wallet - Get staking status for a wallet
 * GET /pool - Get staking pool information
 * GET /tiers - Get staking tier information
 * GET /leaderboard - Get staking leaderboard
 */

// POST /stake - Stake tokens
router.post("/stake", (req, res, next) => {
  stakingController.stake(req, res, next);
});

// POST /unstake - Unstake tokens
router.post("/unstake", (req, res, next) => {
  stakingController.unstake(req, res, next);
});

// POST /claim - Claim rewards
router.post("/claim", (req, res, next) => {
  stakingController.claimRewards(req, res, next);
});

// GET /status/:wallet - Get staking status
router.get("/status/:wallet", (req, res, next) => {
  stakingController.getStatus(req, res, next);
});

// GET /pool - Get pool info
router.get("/pool", (req, res, next) => {
  stakingController.getPool(req, res, next);
});

// GET /tiers - Get tier info
router.get("/tiers", (req, res, next) => {
  stakingController.getTiers(req, res, next);
});

// GET /leaderboard - Get leaderboard
router.get("/leaderboard", (req, res, next) => {
  stakingController.getLeaderboard(req, res, next);
});

export default router;
