import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createBurnInstruction,
  createTransferInstruction,
} from "@solana/spl-token";
import prisma from "../db/prisma";
import { bagsService } from "./bags.service";
import { AutomationJobType, JobStatus, TriggerType, TokenStatus } from "@prisma/client";

/**
 * Automation service for fee claiming, burning, and LP operations
 *
 * This service handles the automated execution of:
 * - Fee claiming from Bags bonding curves
 * - Token burns (buy and burn)
 * - LP additions (add to Raydium pools)
 * - Dividend distributions
 */
export class AutomationService {
  private connection: Connection;
  private burnAgentKeypair: Keypair | null = null;
  private lpAgentKeypair: Keypair | null = null;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("SOLANA_RPC_URL environment variable is required");
    }

    this.connection = new Connection(rpcUrl, "confirmed");

    // Load agent keypairs
    this.loadAgentKeypairs();
  }

  private loadAgentKeypairs(): void {
    // Burn agent
    const burnKey = process.env.BURN_AGENT_PRIVATE_KEY;
    if (burnKey) {
      try {
        const secretKey = JSON.parse(burnKey);
        this.burnAgentKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
      } catch {
        const bs58 = require("bs58");
        this.burnAgentKeypair = Keypair.fromSecretKey(bs58.decode(burnKey));
      }
    }

    // LP agent
    const lpKey = process.env.LP_AGENT_PRIVATE_KEY;
    if (lpKey) {
      try {
        const secretKey = JSON.parse(lpKey);
        this.lpAgentKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
      } catch {
        const bs58 = require("bs58");
        this.lpAgentKeypair = Keypair.fromSecretKey(bs58.decode(lpKey));
      }
    }
  }

  /**
   * Run automation for all active tokens
   */
  async runAutomationCycle(): Promise<void> {
    console.log("[AutomationService] Starting automation cycle");

    // Get all active tokens with automation enabled
    const tokens = await prisma.token.findMany({
      where: {
        status: TokenStatus.ACTIVE,
        OR: [
          { burnEnabled: true },
          { lpEnabled: true },
          { dividendsEnabled: true },
        ],
      },
    });

    console.log(`[AutomationService] Processing ${tokens.length} tokens`);

    for (const token of tokens) {
      try {
        await this.processToken(token.id);
      } catch (error) {
        console.error(
          `[AutomationService] Error processing token ${token.id}:`,
          error
        );
      }
    }

    console.log("[AutomationService] Automation cycle complete");
  }

  /**
   * Process automation for a single token
   */
  async processToken(tokenId: string): Promise<void> {
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
    });

    if (!token || !token.configKey) {
      console.log(`[AutomationService] Token ${tokenId} not found or no config key`);
      return;
    }

    // Create automation job
    const job = await prisma.automationJob.create({
      data: {
        tokenId,
        jobType: AutomationJobType.FULL_CYCLE,
        triggerType: TriggerType.SCHEDULED,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      // Step 1: Claim fees from Bags
      const claimResult = await this.claimFees(token.configKey);

      if (!claimResult.success) {
        throw new Error("Failed to claim fees");
      }

      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          claimedLamports: BigInt(claimResult.claimedLamports),
          claimTxSignature: claimResult.signature,
        },
      });

      // Calculate fee distribution
      const totalFeesLamports = claimResult.claimedLamports;
      let burnAmount = 0;
      let lpAmount = 0;
      let dividendsAmount = 0;

      // Step 2: Execute burn if enabled
      if (token.burnEnabled && token.burnPercentage > 0) {
        burnAmount = Math.floor(
          (totalFeesLamports * token.burnPercentage) / 10000
        );

        if (burnAmount > 0 && token.tokenMint) {
          const burnResult = await this.executeBurn(
            token.tokenMint,
            burnAmount
          );

          if (burnResult.success) {
            await prisma.automationJob.update({
              where: { id: job.id },
              data: {
                burnedTokens: BigInt(burnResult.burnedTokens),
                burnTxSignature: burnResult.signature,
              },
            });
          }
        }
      }

      // Step 3: Add to LP if enabled
      if (token.lpEnabled && token.lpPercentage > 0) {
        lpAmount = Math.floor((totalFeesLamports * token.lpPercentage) / 10000);

        if (lpAmount > 0 && token.tokenMint) {
          const lpResult = await this.addToLiquidity(
            token.tokenMint,
            lpAmount
          );

          if (lpResult.success) {
            await prisma.automationJob.update({
              where: { id: job.id },
              data: {
                lpTokensAdded: BigInt(lpResult.lpTokensAdded),
                lpTxSignature: lpResult.signature,
              },
            });
          }
        }
      }

      // Step 4: Distribute dividends if enabled
      if (token.dividendsEnabled && token.dividendsPercentage > 0) {
        dividendsAmount = Math.floor(
          (totalFeesLamports * token.dividendsPercentage) / 10000
        );

        if (dividendsAmount > 0 && token.tokenMint) {
          const dividendResult = await this.distributeDividends(
            token.tokenMint,
            dividendsAmount
          );

          if (dividendResult.success) {
            await prisma.automationJob.update({
              where: { id: job.id },
              data: {
                dividendsPaid: BigInt(dividendResult.totalPaid),
                dividendsTxSig: dividendResult.signature,
              },
            });
          }
        }
      }

      // Update job status
      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Update token stats
      await prisma.token.update({
        where: { id: tokenId },
        data: {
          totalFeesCollected: { increment: BigInt(totalFeesLamports) },
          totalBurned: { increment: BigInt(burnAmount) },
          totalToLp: { increment: BigInt(lpAmount) },
          totalDividendsPaid: { increment: BigInt(dividendsAmount) },
          lastAutomationRun: new Date(),
        },
      });

      console.log(
        `[AutomationService] Token ${tokenId} processed: claimed=${totalFeesLamports}, burned=${burnAmount}, lp=${lpAmount}, dividends=${dividendsAmount}`
      );
    } catch (error) {
      console.error(`[AutomationService] Job ${job.id} failed:`, error);

      await prisma.automationJob.update({
        where: { id: job.id },
        data: {
          status: JobStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          retryCount: { increment: 1 },
        },
      });
    }
  }

  /**
   * Trigger automation for a specific token (manual trigger)
   */
  async triggerAutomation(
    tokenId?: string,
    tokenMint?: string,
    jobType: AutomationJobType = AutomationJobType.FULL_CYCLE
  ): Promise<{
    success: boolean;
    jobId?: string;
    message: string;
  }> {
    let id = tokenId;

    // Find by mint if tokenId not provided
    if (!id && tokenMint) {
      const token = await prisma.token.findUnique({
        where: { tokenMint },
      });
      if (token) {
        id = token.id;
      }
    }

    if (!id) {
      return {
        success: false,
        message: "Token not found",
      };
    }

    // Create manual job
    const job = await prisma.automationJob.create({
      data: {
        tokenId: id,
        jobType,
        triggerType: TriggerType.MANUAL,
        status: JobStatus.PENDING,
      },
    });

    // Process immediately
    try {
      if (jobType === AutomationJobType.FULL_CYCLE) {
        await this.processToken(id);
      } else {
        await this.processSpecificJob(id, jobType);
      }

      return {
        success: true,
        jobId: job.id,
        message: `Automation triggered successfully for token ${id}`,
      };
    } catch (error) {
      return {
        success: false,
        jobId: job.id,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process a specific job type for a token
   */
  private async processSpecificJob(
    tokenId: string,
    jobType: AutomationJobType
  ): Promise<void> {
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
    });

    if (!token || !token.configKey || !token.tokenMint) {
      throw new Error("Token not found or missing config");
    }

    switch (jobType) {
      case AutomationJobType.CLAIM_FEES:
        await this.claimFees(token.configKey);
        break;
      case AutomationJobType.BURN:
        // Claim first, then burn
        const claimForBurn = await this.claimFees(token.configKey);
        if (claimForBurn.success && token.burnPercentage > 0) {
          const burnAmount = Math.floor(
            (claimForBurn.claimedLamports * token.burnPercentage) / 10000
          );
          await this.executeBurn(token.tokenMint, burnAmount);
        }
        break;
      case AutomationJobType.ADD_LP:
        // Claim first, then add LP
        const claimForLp = await this.claimFees(token.configKey);
        if (claimForLp.success && token.lpPercentage > 0) {
          const lpAmount = Math.floor(
            (claimForLp.claimedLamports * token.lpPercentage) / 10000
          );
          await this.addToLiquidity(token.tokenMint, lpAmount);
        }
        break;
      case AutomationJobType.PAY_DIVIDENDS:
        // Claim first, then distribute
        const claimForDiv = await this.claimFees(token.configKey);
        if (claimForDiv.success && token.dividendsPercentage > 0) {
          const divAmount = Math.floor(
            (claimForDiv.claimedLamports * token.dividendsPercentage) / 10000
          );
          await this.distributeDividends(token.tokenMint, divAmount);
        }
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }

  /**
   * Claim fees from Bags bonding curve
   */
  private async claimFees(
    configKey: string
  ): Promise<{
    success: boolean;
    claimedLamports: number;
    signature: string;
  }> {
    try {
      const result = await bagsService.claimFees(configKey);
      return {
        success: result.success,
        claimedLamports: result.claimedLamports,
        signature: result.signature,
      };
    } catch (error) {
      console.error("[AutomationService] Error claiming fees:", error);
      return {
        success: false,
        claimedLamports: 0,
        signature: "",
      };
    }
  }

  /**
   * Execute buy and burn
   *
   * 1. Swap SOL for tokens on Jupiter
   * 2. Burn the acquired tokens
   */
  private async executeBurn(
    tokenMint: string,
    solAmount: number
  ): Promise<{
    success: boolean;
    burnedTokens: number;
    signature: string;
  }> {
    try {
      console.log(
        `[AutomationService] Executing burn: ${solAmount} lamports for ${tokenMint}`
      );

      if (!this.burnAgentKeypair) {
        throw new Error("Burn agent keypair not configured");
      }

      // In production:
      // 1. Get quote from Jupiter for SOL -> Token
      // 2. Execute swap
      // 3. Burn received tokens

      // Mock implementation for development
      const mockTokensReceived = Math.floor(solAmount * 1000); // Mock: 1000 tokens per lamport
      const mockSignature = `burn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

      console.log(
        `[AutomationService] Burned ${mockTokensReceived} tokens, tx: ${mockSignature}`
      );

      return {
        success: true,
        burnedTokens: mockTokensReceived,
        signature: mockSignature,
      };
    } catch (error) {
      console.error("[AutomationService] Error executing burn:", error);
      return {
        success: false,
        burnedTokens: 0,
        signature: "",
      };
    }
  }

  /**
   * Add liquidity to Raydium pool
   */
  private async addToLiquidity(
    tokenMint: string,
    solAmount: number
  ): Promise<{
    success: boolean;
    lpTokensAdded: number;
    signature: string;
  }> {
    try {
      console.log(
        `[AutomationService] Adding LP: ${solAmount} lamports for ${tokenMint}`
      );

      if (!this.lpAgentKeypair) {
        throw new Error("LP agent keypair not configured");
      }

      // In production:
      // 1. Check if Raydium pool exists (token must be graduated)
      // 2. Calculate optimal amounts
      // 3. Add liquidity to Raydium

      // Mock implementation
      const mockLpTokens = Math.floor(solAmount / 1000);
      const mockSignature = `lp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

      console.log(
        `[AutomationService] Added ${mockLpTokens} LP tokens, tx: ${mockSignature}`
      );

      return {
        success: true,
        lpTokensAdded: mockLpTokens,
        signature: mockSignature,
      };
    } catch (error) {
      console.error("[AutomationService] Error adding liquidity:", error);
      return {
        success: false,
        lpTokensAdded: 0,
        signature: "",
      };
    }
  }

  /**
   * Distribute dividends to token holders
   */
  private async distributeDividends(
    tokenMint: string,
    solAmount: number
  ): Promise<{
    success: boolean;
    totalPaid: number;
    signature: string;
  }> {
    try {
      console.log(
        `[AutomationService] Distributing dividends: ${solAmount} lamports for ${tokenMint}`
      );

      // In production:
      // 1. Get token holder list from on-chain
      // 2. Calculate proportional distribution
      // 3. Execute batch transfers

      // Mock implementation
      const mockSignature = `div_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

      console.log(
        `[AutomationService] Distributed ${solAmount} lamports, tx: ${mockSignature}`
      );

      return {
        success: true,
        totalPaid: solAmount,
        signature: mockSignature,
      };
    } catch (error) {
      console.error("[AutomationService] Error distributing dividends:", error);
      return {
        success: false,
        totalPaid: 0,
        signature: "",
      };
    }
  }

  /**
   * Get automation history for a token
   */
  async getJobHistory(
    tokenId: string,
    limit = 20
  ): Promise<{
    jobs: {
      id: string;
      jobType: string;
      status: string;
      claimedLamports: string;
      burnedTokens: string;
      lpTokensAdded: string;
      dividendsPaid: string;
      createdAt: string;
      completedAt?: string;
      errorMessage?: string;
    }[];
  }> {
    const jobs = await prisma.automationJob.findMany({
      where: { tokenId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        jobType: job.jobType,
        status: job.status,
        claimedLamports: job.claimedLamports.toString(),
        burnedTokens: job.burnedTokens.toString(),
        lpTokensAdded: job.lpTokensAdded.toString(),
        dividendsPaid: job.dividendsPaid.toString(),
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
        errorMessage: job.errorMessage || undefined,
      })),
    };
  }
}

// Export singleton instance
export const automationService = new AutomationService();
