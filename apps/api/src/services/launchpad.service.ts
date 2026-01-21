import prisma from "../db/prisma";
import { bagsService } from "./bags.service";
import {
  LaunchTokenRequest,
  LaunchTokenResponse,
  TokenDetailsResponse,
  TokenListResponse,
  TokenStatsResponse,
  getTierFromStake,
  getDiscountFromTier,
} from "../types";
import { TokenStatus } from "@prisma/client";

/**
 * Core launchpad service for token management
 */
export class LaunchpadService {
  // Platform fee: 5% (500 basis points)
  private static readonly PLATFORM_FEE_BPS = 500;

  /**
   * Launch a new token through Bags.fm
   */
  async launchToken(request: LaunchTokenRequest): Promise<LaunchTokenResponse> {
    try {
      console.log(`[LaunchpadService] Launching token: ${request.name}`);

      // 1. Get or create creator profile
      const creator = await this.getOrCreateCreator(request.creatorWallet);

      // 2. Calculate platform fee discount based on staking
      const discountTier = getTierFromStake(creator.kr8tivStaked);
      const discountPercent = getDiscountFromTier(discountTier);
      const platformFee = Math.floor(
        LaunchpadService.PLATFORM_FEE_BPS * (1 - discountPercent / 100)
      );

      // 3. Create token record in database (PENDING status)
      const token = await prisma.token.create({
        data: {
          name: request.name,
          symbol: request.symbol,
          description: request.description,
          imageUrl: request.imageUrl,
          creatorWallet: request.creatorWallet,
          burnEnabled: request.burnEnabled,
          burnPercentage: request.burnPercentage,
          lpEnabled: request.lpEnabled,
          lpPercentage: request.lpPercentage,
          dividendsEnabled: request.dividendsEnabled,
          dividendsPercentage: request.dividendsPercentage,
          customAllocations: request.customAllocations,
          platformFeeApplied: platformFee,
          platformFeeDiscount: discountPercent,
          status: TokenStatus.PENDING,
        },
      });

      // 4. Create token on Bags.fm
      const bagsResult = await bagsService.createToken({
        name: request.name,
        symbol: request.symbol,
        description: request.description,
        image: request.imageUrl,
        creatorWallet: request.creatorWallet,
      });

      if (!bagsResult.success) {
        // Mark as failed
        await prisma.token.update({
          where: { id: token.id },
          data: { status: TokenStatus.FAILED },
        });

        return {
          success: false,
          tokenId: token.id,
          error: "Failed to create token on Bags.fm",
        };
      }

      // 5. Update token with Bags info
      const updatedToken = await prisma.token.update({
        where: { id: token.id },
        data: {
          tokenMint: bagsResult.mint,
          configKey: bagsResult.configKey,
          bagsPoolAddress: bagsResult.poolAddress,
          status: TokenStatus.ACTIVE,
          launchedAt: new Date(),
        },
      });

      // 6. Update creator stats
      await prisma.creator.update({
        where: { wallet: request.creatorWallet },
        data: {
          tokensLaunched: { increment: 1 },
        },
      });

      // 7. Update platform stats
      await this.updatePlatformStats({ tokensLaunched: 1 });

      console.log(`[LaunchpadService] Token launched: ${bagsResult.mint}`);

      return {
        success: true,
        tokenId: updatedToken.id,
        tokenMint: bagsResult.mint,
        configKey: bagsResult.configKey,
        bagsPoolAddress: bagsResult.poolAddress,
        launchUrl: bagsResult.launchUrl,
      };
    } catch (error) {
      console.error("[LaunchpadService] Error launching token:", error);
      return {
        success: false,
        tokenId: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get token details by mint address
   */
  async getTokenByMint(tokenMint: string): Promise<TokenDetailsResponse | null> {
    const token = await prisma.token.findUnique({
      where: { tokenMint },
    });

    if (!token) {
      return null;
    }

    return this.formatTokenResponse(token);
  }

  /**
   * Get token details by ID
   */
  async getTokenById(tokenId: string): Promise<TokenDetailsResponse | null> {
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      return null;
    }

    return this.formatTokenResponse(token);
  }

  /**
   * List tokens with pagination and filtering
   */
  async listTokens(params: {
    page?: number;
    limit?: number;
    status?: TokenStatus;
    creatorWallet?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<TokenListResponse> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.creatorWallet) {
      where.creatorWallet = params.creatorWallet;
    }

    const orderBy: Record<string, string> = {};
    const sortBy = params.sortBy || "launchedAt";
    const sortOrder = params.sortOrder || "desc";
    orderBy[sortBy] = sortOrder;

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.token.count({ where }),
    ]);

    return {
      tokens: tokens.map((t) => this.formatTokenResponse(t)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get token stats (live data from Bags)
   */
  async getTokenStats(tokenMint: string): Promise<TokenStatsResponse | null> {
    const token = await prisma.token.findUnique({
      where: { tokenMint },
    });

    if (!token) {
      return null;
    }

    // Get live data from Bags
    const [poolInfo, price, volume] = await Promise.all([
      bagsService.getPoolInfo(tokenMint),
      bagsService.getTokenPrice(tokenMint),
      bagsService.getVolume24h(tokenMint),
    ]);

    // Update cached stats in database
    if (poolInfo) {
      await prisma.token.update({
        where: { tokenMint },
        data: {
          currentPriceSol: price.priceSol,
          currentPriceUsd: price.priceUsd,
          marketCapUsd: price.priceUsd * 1_000_000_000, // 1B supply
          totalVolumeSol: { increment: volume.volumeSol },
          totalVolumeUsd: { increment: volume.volumeUsd },
        },
      });
    }

    return {
      tokenMint,
      priceSol: price.priceSol,
      priceUsd: price.priceUsd,
      volume24hSol: volume.volumeSol,
      volume24hUsd: volume.volumeUsd,
      marketCapUsd: price.priceUsd * 1_000_000_000,
      holderCount: token.holderCount,
      bondingCurveProgress: poolInfo?.bondingCurveProgress || 0,
      isGraduated: poolInfo?.isGraduated || false,
    };
  }

  /**
   * Check and update graduation status for tokens
   */
  async checkGraduations(): Promise<void> {
    // Get active tokens that haven't graduated
    const activeTokens = await prisma.token.findMany({
      where: {
        status: TokenStatus.ACTIVE,
        graduatedAt: null,
      },
    });

    for (const token of activeTokens) {
      if (!token.tokenMint) continue;

      const graduation = await bagsService.checkGraduation(token.tokenMint);

      if (graduation.isGraduated) {
        await prisma.token.update({
          where: { id: token.id },
          data: {
            status: TokenStatus.GRADUATED,
            graduatedAt: graduation.graduatedAt || new Date(),
          },
        });

        // Update platform stats
        await this.updatePlatformStats({ graduatedTokens: 1 });

        console.log(`[LaunchpadService] Token graduated: ${token.tokenMint}`);
      }
    }
  }

  /**
   * Get or create creator profile
   */
  private async getOrCreateCreator(wallet: string) {
    let creator = await prisma.creator.findUnique({
      where: { wallet },
    });

    if (!creator) {
      creator = await prisma.creator.create({
        data: { wallet },
      });

      // Update platform stats
      await this.updatePlatformStats({ uniqueCreators: 1 });
    }

    return creator;
  }

  /**
   * Update platform statistics
   */
  private async updatePlatformStats(updates: {
    tokensLaunched?: number;
    graduatedTokens?: number;
    uniqueCreators?: number;
    volumeUsd?: number;
    volumeSol?: number;
    feesCollectedSol?: number;
  }): Promise<void> {
    await prisma.platformStats.upsert({
      where: { id: "platform" },
      create: {
        id: "platform",
        totalTokensLaunched: updates.tokensLaunched || 0,
        graduatedTokens: updates.graduatedTokens || 0,
        uniqueCreators: updates.uniqueCreators || 0,
        totalVolumeUsd: updates.volumeUsd || 0,
        totalVolumeSol: updates.volumeSol || 0,
        totalFeesCollectedSol: updates.feesCollectedSol || 0,
      },
      update: {
        totalTokensLaunched: updates.tokensLaunched
          ? { increment: updates.tokensLaunched }
          : undefined,
        graduatedTokens: updates.graduatedTokens
          ? { increment: updates.graduatedTokens }
          : undefined,
        uniqueCreators: updates.uniqueCreators
          ? { increment: updates.uniqueCreators }
          : undefined,
        totalVolumeUsd: updates.volumeUsd
          ? { increment: updates.volumeUsd }
          : undefined,
        totalVolumeSol: updates.volumeSol
          ? { increment: updates.volumeSol }
          : undefined,
        totalFeesCollectedSol: updates.feesCollectedSol
          ? { increment: updates.feesCollectedSol }
          : undefined,
      },
    });
  }

  /**
   * Format token database record to API response
   */
  private formatTokenResponse(token: {
    id: string;
    tokenMint: string;
    name: string;
    symbol: string;
    description: string | null;
    imageUrl: string | null;
    creatorWallet: string;
    status: TokenStatus;
    burnEnabled: boolean;
    burnPercentage: number;
    lpEnabled: boolean;
    lpPercentage: number;
    dividendsEnabled: boolean;
    dividendsPercentage: number;
    totalVolumeUsd: number;
    totalVolumeSol: number;
    holderCount: number;
    currentPriceUsd: number;
    currentPriceSol: number;
    marketCapUsd: number;
    totalFeesCollected: bigint;
    totalBurned: bigint;
    totalToLp: bigint;
    totalDividendsPaid: bigint;
    launchedAt: Date | null;
    graduatedAt: Date | null;
  }): TokenDetailsResponse {
    return {
      id: token.id,
      tokenMint: token.tokenMint,
      name: token.name,
      symbol: token.symbol,
      description: token.description || undefined,
      imageUrl: token.imageUrl || undefined,
      creatorWallet: token.creatorWallet,
      status: token.status,
      burnEnabled: token.burnEnabled,
      burnPercentage: token.burnPercentage,
      lpEnabled: token.lpEnabled,
      lpPercentage: token.lpPercentage,
      dividendsEnabled: token.dividendsEnabled,
      dividendsPercentage: token.dividendsPercentage,
      totalVolumeUsd: token.totalVolumeUsd,
      totalVolumeSol: token.totalVolumeSol,
      holderCount: token.holderCount,
      currentPriceUsd: token.currentPriceUsd,
      currentPriceSol: token.currentPriceSol,
      marketCapUsd: token.marketCapUsd,
      totalFeesCollected: token.totalFeesCollected.toString(),
      totalBurned: token.totalBurned.toString(),
      totalToLp: token.totalToLp.toString(),
      totalDividendsPaid: token.totalDividendsPaid.toString(),
      launchedAt: token.launchedAt?.toISOString(),
      graduatedAt: token.graduatedAt?.toISOString(),
    };
  }
}

// Export singleton instance
export const launchpadService = new LaunchpadService();
