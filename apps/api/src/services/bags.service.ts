import axios, { AxiosInstance } from "axios";
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  BagsCreateTokenRequest,
  BagsCreateTokenResponse,
  BagsPoolInfo,
  BagsClaimFeesResponse,
} from "../types";

/**
 * Service for interacting with Bags.fm API and on-chain programs
 *
 * Bags.fm is a token launchpad on Solana with bonding curve mechanics.
 * This service handles:
 * - Token creation via Bags API
 * - Pool info queries
 * - Fee claiming from bonding curves
 */
export class BagsService {
  private api: AxiosInstance;
  private connection: Connection;
  private platformKeypair: Keypair;

  // Bags.fm program addresses (mainnet)
  private static readonly BAGS_PROGRAM_ID = new PublicKey(
    "BAGSHpRBLhGLtWBpDJEUuGfbBEHPkiMQEi5rqLFmJ7L3" // Placeholder - replace with actual
  );

  private static readonly BAGS_API_URL = "https://api.bags.fm/v1";

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL;
    if (!rpcUrl) {
      throw new Error("SOLANA_RPC_URL environment variable is required");
    }

    this.connection = new Connection(rpcUrl, "confirmed");

    // Initialize API client
    this.api = axios.create({
      baseURL: BagsService.BAGS_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BAGS_API_KEY || ""}`,
      },
      timeout: 30000,
    });

    // Load platform keypair for signing transactions
    const privateKey = process.env.PLATFORM_PRIVATE_KEY;
    if (privateKey) {
      try {
        const secretKey = JSON.parse(privateKey);
        this.platformKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
      } catch {
        // Try base58 decoding
        const bs58 = require("bs58");
        this.platformKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));
      }
    } else {
      // Generate a dummy keypair for read-only operations
      this.platformKeypair = Keypair.generate();
      console.warn("PLATFORM_PRIVATE_KEY not set - write operations will fail");
    }
  }

  /**
   * Create a new token via Bags.fm
   */
  async createToken(request: BagsCreateTokenRequest): Promise<BagsCreateTokenResponse> {
    try {
      console.log(`[BagsService] Creating token: ${request.name} (${request.symbol})`);

      // Call Bags API to create token
      const response = await this.api.post<BagsCreateTokenResponse>("/tokens/create", {
        name: request.name,
        symbol: request.symbol,
        description: request.description || "",
        image: request.image,
        twitter: request.twitter,
        telegram: request.telegram,
        website: request.website,
        creator: request.creatorWallet,
      });

      if (!response.data.success) {
        throw new Error("Token creation failed on Bags API");
      }

      console.log(`[BagsService] Token created: ${response.data.mint}`);

      return {
        success: true,
        mint: response.data.mint,
        configKey: response.data.configKey,
        poolAddress: response.data.poolAddress,
        launchUrl: `https://bags.fm/token/${response.data.mint}`,
      };
    } catch (error) {
      console.error("[BagsService] Error creating token:", error);

      // For development/testing, return mock response
      if (process.env.NODE_ENV === "development") {
        const mockMint = Keypair.generate().publicKey.toBase58();
        const mockConfig = Keypair.generate().publicKey.toBase58();
        const mockPool = Keypair.generate().publicKey.toBase58();

        return {
          success: true,
          mint: mockMint,
          configKey: mockConfig,
          poolAddress: mockPool,
          launchUrl: `https://bags.fm/token/${mockMint}`,
        };
      }

      throw error;
    }
  }

  /**
   * Get pool info for a token
   */
  async getPoolInfo(tokenMint: string): Promise<BagsPoolInfo | null> {
    try {
      console.log(`[BagsService] Getting pool info for: ${tokenMint}`);

      const response = await this.api.get<{ pool: BagsPoolInfo }>(`/pools/${tokenMint}`);

      return response.data.pool;
    } catch (error) {
      console.error("[BagsService] Error getting pool info:", error);

      // Return mock data for development
      if (process.env.NODE_ENV === "development") {
        return {
          poolAddress: Keypair.generate().publicKey.toBase58(),
          tokenMint,
          reserveSol: 10.5,
          reserveToken: 900000000000000,
          virtualSolReserve: 30,
          virtualTokenReserve: 1000000000000000,
          totalSolCollected: 15.3,
          bondingCurveProgress: 51,
          isGraduated: false,
        };
      }

      return null;
    }
  }

  /**
   * Get multiple pool infos
   */
  async getPoolInfoBatch(tokenMints: string[]): Promise<Map<string, BagsPoolInfo>> {
    const results = new Map<string, BagsPoolInfo>();

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < tokenMints.length; i += batchSize) {
      const batch = tokenMints.slice(i, i + batchSize);
      const promises = batch.map((mint) => this.getPoolInfo(mint));
      const poolInfos = await Promise.all(promises);

      batch.forEach((mint, index) => {
        const poolInfo = poolInfos[index];
        if (poolInfo) {
          results.set(mint, poolInfo);
        }
      });
    }

    return results;
  }

  /**
   * Claim accumulated fees from a token's bonding curve
   *
   * This claims the platform's share of trading fees that have accumulated
   * in the Bags bonding curve pool.
   */
  async claimFees(
    configKey: string,
    destinationWallet?: string
  ): Promise<BagsClaimFeesResponse> {
    try {
      console.log(`[BagsService] Claiming fees for config: ${configKey}`);

      // Build claim transaction
      const destination = destinationWallet
        ? new PublicKey(destinationWallet)
        : new PublicKey(process.env.PLATFORM_TREASURY || this.platformKeypair.publicKey);

      // In production, this would call the Bags program instruction
      // For now, we use the API endpoint if available
      const response = await this.api.post<BagsClaimFeesResponse>("/fees/claim", {
        configKey,
        destination: destination.toBase58(),
      });

      if (!response.data.success) {
        throw new Error("Fee claim failed");
      }

      console.log(
        `[BagsService] Claimed ${response.data.claimedLamports} lamports, tx: ${response.data.signature}`
      );

      return response.data;
    } catch (error) {
      console.error("[BagsService] Error claiming fees:", error);

      // Mock response for development
      if (process.env.NODE_ENV === "development") {
        return {
          success: true,
          signature: "mock_" + Date.now().toString(36),
          claimedLamports: Math.floor(Math.random() * 1000000000), // 0-1 SOL
        };
      }

      throw error;
    }
  }

  /**
   * Check if a token has graduated from the bonding curve
   */
  async checkGraduation(tokenMint: string): Promise<{
    isGraduated: boolean;
    graduatedAt?: Date;
    raydiumPoolAddress?: string;
  }> {
    try {
      const poolInfo = await this.getPoolInfo(tokenMint);

      if (!poolInfo) {
        return { isGraduated: false };
      }

      return {
        isGraduated: poolInfo.isGraduated,
        graduatedAt: poolInfo.graduatedAt ? new Date(poolInfo.graduatedAt) : undefined,
      };
    } catch (error) {
      console.error("[BagsService] Error checking graduation:", error);
      return { isGraduated: false };
    }
  }

  /**
   * Get the current price of a token in SOL
   */
  async getTokenPrice(tokenMint: string): Promise<{
    priceSol: number;
    priceUsd: number;
  }> {
    try {
      const poolInfo = await this.getPoolInfo(tokenMint);

      if (!poolInfo) {
        return { priceSol: 0, priceUsd: 0 };
      }

      // Calculate price from reserves (AMM formula)
      const priceSol =
        poolInfo.virtualSolReserve / poolInfo.virtualTokenReserve;

      // Get SOL price in USD (from Jupiter or other oracle)
      const solPriceUsd = await this.getSolPriceUsd();
      const priceUsd = priceSol * solPriceUsd;

      return { priceSol, priceUsd };
    } catch (error) {
      console.error("[BagsService] Error getting token price:", error);
      return { priceSol: 0, priceUsd: 0 };
    }
  }

  /**
   * Get current SOL price in USD
   */
  async getSolPriceUsd(): Promise<number> {
    try {
      // Use Jupiter price API
      const response = await axios.get(
        "https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112"
      );

      return response.data.data["So11111111111111111111111111111111111111112"]?.price || 0;
    } catch (error) {
      console.error("[BagsService] Error getting SOL price:", error);
      return 100; // Fallback price
    }
  }

  /**
   * Get token holder count from on-chain data
   */
  async getHolderCount(tokenMint: string): Promise<number> {
    try {
      const mint = new PublicKey(tokenMint);

      // Get token accounts for this mint
      const accounts = await this.connection.getTokenLargestAccounts(mint);

      // Count accounts with non-zero balance
      const holdersWithBalance = accounts.value.filter(
        (account) => account.uiAmount && account.uiAmount > 0
      );

      return holdersWithBalance.length;
    } catch (error) {
      console.error("[BagsService] Error getting holder count:", error);
      return 0;
    }
  }

  /**
   * Get trading volume for a token (24h)
   */
  async getVolume24h(tokenMint: string): Promise<{
    volumeSol: number;
    volumeUsd: number;
  }> {
    try {
      const response = await this.api.get<{
        volume24hSol: number;
        volume24hUsd: number;
      }>(`/tokens/${tokenMint}/volume`);

      return {
        volumeSol: response.data.volume24hSol,
        volumeUsd: response.data.volume24hUsd,
      };
    } catch (error) {
      console.error("[BagsService] Error getting volume:", error);
      return { volumeSol: 0, volumeUsd: 0 };
    }
  }
}

// Export singleton instance
export const bagsService = new BagsService();
