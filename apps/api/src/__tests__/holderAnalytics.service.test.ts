import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HolderAnalyticsService } from "../services/holderAnalytics.service";
import { prismaMock } from "./mocks/prisma.mock";
import { Connection, PublicKey } from "@solana/web3.js";

// Mock prisma
vi.mock("../db/prisma", () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

// Mock Redis
const redisMock = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
};

vi.mock("../utils/redis", () => ({
  redis: redisMock,
  default: redisMock,
}));

// Mock Solana connection
vi.mock("@solana/web3.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@solana/web3.js")>();
  return {
    ...actual,
    Connection: vi.fn().mockImplementation(() => ({
      getTokenLargestAccounts: vi.fn(),
      getTokenAccountsByMint: vi.fn(),
      getParsedTokenAccountsByOwner: vi.fn(),
    })),
  };
});

describe("HolderAnalyticsService", () => {
  let service: HolderAnalyticsService;
  let mockConnection: {
    getTokenLargestAccounts: ReturnType<typeof vi.fn>;
    getTokenAccountsByMint: ReturnType<typeof vi.fn>;
    getParsedTokenAccountsByOwner: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = new HolderAnalyticsService();
    mockConnection = {
      getTokenLargestAccounts: vi.fn(),
      getTokenAccountsByMint: vi.fn(),
      getParsedTokenAccountsByOwner: vi.fn(),
    };
    // Replace the service's connection with mock
    (service as any).connection = mockConnection;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getHolders", () => {
    it("should return paginated holder list", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      const mockHolders = [
        { address: "Wallet1111111111111111111111111111111111111", amount: BigInt(1000000000), uiAmount: 1000 },
        { address: "Wallet2222222222222222222222222222222222222", amount: BigInt(500000000), uiAmount: 500 },
        { address: "Wallet3333333333333333333333333333333333333", amount: BigInt(250000000), uiAmount: 250 },
      ];

      // Mock no cache hit
      redisMock.get.mockResolvedValue(null);

      // Mock on-chain data
      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: mockHolders.map((h) => ({
          address: h.address,
          amount: h.amount.toString(),
          uiAmount: h.uiAmount,
          uiAmountString: h.uiAmount.toString(),
          decimals: 9,
        })),
      });

      const result = await service.getHolders(tokenMint, { page: 1, limit: 10 });

      expect(result.holders).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should use cached data when available", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      const cachedData = {
        holders: [
          { wallet: "Wallet1111111111111111111111111111111111111", balance: "1000", percentage: 50 },
        ],
        total: 1,
        fetchedAt: new Date().toISOString(),
      };

      redisMock.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getHolders(tokenMint, { page: 1, limit: 10 });

      expect(result.holders).toHaveLength(1);
      expect(mockConnection.getTokenLargestAccounts).not.toHaveBeenCalled();
    });

    it("should handle pagination correctly", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      const mockHolders = Array.from({ length: 25 }, (_, i) => ({
        address: `Wallet${i.toString().padStart(40, "0")}`,
        amount: BigInt((25 - i) * 1000000000),
        uiAmount: (25 - i) * 1000,
      }));

      redisMock.get.mockResolvedValue(null);
      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: mockHolders.map((h) => ({
          address: h.address,
          amount: h.amount.toString(),
          uiAmount: h.uiAmount,
          uiAmountString: h.uiAmount.toString(),
          decimals: 9,
        })),
      });

      const page2 = await service.getHolders(tokenMint, { page: 2, limit: 10 });

      expect(page2.holders).toHaveLength(10);
      expect(page2.page).toBe(2);
    });

    it("should sort holders by balance descending", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [
          { address: "WalletSmall", amount: "100000000", uiAmount: 100, decimals: 9 },
          { address: "WalletLarge", amount: "900000000", uiAmount: 900, decimals: 9 },
          { address: "WalletMedium", amount: "500000000", uiAmount: 500, decimals: 9 },
        ],
      });

      const result = await service.getHolders(tokenMint, { page: 1, limit: 10 });

      expect(result.holders[0].balance).toBe("900");
      expect(result.holders[1].balance).toBe("500");
      expect(result.holders[2].balance).toBe("100");
    });

    it("should allow search by wallet address", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [
          { address: "WalletABC123", amount: "100000000", uiAmount: 100, decimals: 9 },
          { address: "WalletXYZ789", amount: "200000000", uiAmount: 200, decimals: 9 },
        ],
      });

      const result = await service.getHolders(tokenMint, { page: 1, limit: 10, search: "ABC" });

      expect(result.holders).toHaveLength(1);
      expect(result.holders[0].wallet).toContain("ABC");
    });
  });

  describe("getHolderStats", () => {
    it("should return holder statistics", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [
          { address: "Whale1", amount: "500000000000", uiAmount: 500000, decimals: 9 },
          { address: "Whale2", amount: "300000000000", uiAmount: 300000, decimals: 9 },
          { address: "Normal1", amount: "100000000", uiAmount: 100, decimals: 9 },
          { address: "Normal2", amount: "50000000", uiAmount: 50, decimals: 9 },
          { address: "Normal3", amount: "25000000", uiAmount: 25, decimals: 9 },
        ],
      });

      const stats = await service.getHolderStats(tokenMint);

      expect(stats.totalHolders).toBe(5);
      expect(stats.totalSupplyHeld).toBeGreaterThan(0);
      expect(stats.top10Percentage).toBeGreaterThan(0);
      expect(stats.giniCoefficient).toBeGreaterThanOrEqual(0);
      expect(stats.giniCoefficient).toBeLessThanOrEqual(1);
    });

    it("should identify whale wallets", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      // Total supply = 1B, whale threshold = 1%
      const totalSupply = 1000000000;
      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [
          { address: "WhaleWallet", amount: String(totalSupply * 0.02 * 1e9), uiAmount: totalSupply * 0.02, decimals: 9 }, // 2% = whale
          { address: "SmallHolder", amount: String(totalSupply * 0.001 * 1e9), uiAmount: totalSupply * 0.001, decimals: 9 }, // 0.1% = not whale
        ],
      });

      const stats = await service.getHolderStats(tokenMint);

      expect(stats.whaleCount).toBe(1);
      expect(stats.whaleWallets).toContainEqual(expect.objectContaining({ wallet: "WhaleWallet" }));
    });

    it("should calculate correct concentration metrics", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      // Highly concentrated distribution
      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [
          { address: "TopHolder", amount: "900000000000", uiAmount: 900000, decimals: 9 },
          { address: "SmallHolder", amount: "100000000000", uiAmount: 100000, decimals: 9 },
        ],
      });

      const stats = await service.getHolderStats(tokenMint);

      expect(stats.top10Percentage).toBeGreaterThan(80);
    });
  });

  describe("getHolderDistribution", () => {
    it("should return distribution buckets", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [
          { address: "Holder1", amount: "1000000000000", uiAmount: 1000000, decimals: 9 }, // >100k
          { address: "Holder2", amount: "50000000000", uiAmount: 50000, decimals: 9 }, // 10k-100k
          { address: "Holder3", amount: "5000000000", uiAmount: 5000, decimals: 9 }, // 1k-10k
          { address: "Holder4", amount: "500000000", uiAmount: 500, decimals: 9 }, // 100-1k
          { address: "Holder5", amount: "50000000", uiAmount: 50, decimals: 9 }, // <100
        ],
      });

      const distribution = await service.getHolderDistribution(tokenMint);

      expect(distribution.buckets).toBeDefined();
      expect(distribution.buckets.length).toBeGreaterThan(0);

      // Verify bucket structure
      const bucket = distribution.buckets[0];
      expect(bucket).toHaveProperty("range");
      expect(bucket).toHaveProperty("count");
      expect(bucket).toHaveProperty("percentage");
    });

    it("should calculate percentage correctly", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: Array.from({ length: 100 }, (_, i) => ({
          address: `Holder${i}`,
          amount: "1000000000",
          uiAmount: 1000,
          decimals: 9,
        })),
      });

      const distribution = await service.getHolderDistribution(tokenMint);

      // All percentages should sum to approximately 100
      const totalPercentage = distribution.buckets.reduce((sum, b) => sum + b.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });
  });

  describe("getHolderGrowth", () => {
    it("should return holder count history", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";

      // Mock database records
      prismaMock.holderSnapshot.findMany.mockResolvedValue([
        { id: "1", tokenMint, holderCount: 100, timestamp: new Date("2026-01-15") },
        { id: "2", tokenMint, holderCount: 120, timestamp: new Date("2026-01-16") },
        { id: "3", tokenMint, holderCount: 150, timestamp: new Date("2026-01-17") },
      ]);

      const history = await service.getHolderGrowth(tokenMint, { days: 7 });

      expect(history.dataPoints).toHaveLength(3);
      expect(history.dataPoints[0]).toHaveProperty("timestamp");
      expect(history.dataPoints[0]).toHaveProperty("holderCount");
    });

    it("should calculate growth percentage", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";

      prismaMock.holderSnapshot.findMany.mockResolvedValue([
        { id: "1", tokenMint, holderCount: 100, timestamp: new Date("2026-01-10") },
        { id: "2", tokenMint, holderCount: 150, timestamp: new Date("2026-01-17") },
      ]);

      const history = await service.getHolderGrowth(tokenMint, { days: 7 });

      expect(history.growthPercentage).toBe(50); // 50% growth
    });
  });

  describe("detectWhaleMovements", () => {
    it("should detect large holder movements", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";

      // Previous snapshot
      const previousHolders = [
        { wallet: "WhaleWallet", balance: 1000000 },
        { wallet: "NormalHolder", balance: 100 },
      ];

      // Current holders - whale sold 50%
      redisMock.get.mockResolvedValueOnce(JSON.stringify({ holders: previousHolders })); // Previous
      redisMock.get.mockResolvedValueOnce(null); // Current (force fetch)

      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [
          { address: "WhaleWallet", amount: "500000000000", uiAmount: 500000, decimals: 9 },
          { address: "NormalHolder", amount: "100000000", uiAmount: 100, decimals: 9 },
        ],
      });

      const movements = await service.detectWhaleMovements(tokenMint);

      expect(movements).toContainEqual(
        expect.objectContaining({
          wallet: "WhaleWallet",
          changeType: "sell",
        })
      );
    });

    it("should return empty array when no significant movements", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";

      const currentHolders = [
        { wallet: "Holder1", balance: 1000 },
        { wallet: "Holder2", balance: 500 },
      ];

      redisMock.get.mockResolvedValue(JSON.stringify({ holders: currentHolders }));

      const movements = await service.detectWhaleMovements(tokenMint);

      expect(movements).toHaveLength(0);
    });
  });

  describe("caching", () => {
    it("should cache holder data with 15 minute TTL", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";
      redisMock.get.mockResolvedValue(null);

      mockConnection.getTokenLargestAccounts.mockResolvedValue({
        value: [{ address: "Holder1", amount: "1000000000", uiAmount: 1000, decimals: 9 }],
      });

      await service.getHolders(tokenMint, { page: 1, limit: 10 });

      expect(redisMock.set).toHaveBeenCalled();
      const setCall = redisMock.set.mock.calls[0];
      expect(setCall[0]).toContain(tokenMint);
      // Check TTL is set (15 minutes = 900 seconds)
      expect(setCall[2]).toEqual(expect.objectContaining({ EX: 900 }));
    });

    it("should invalidate cache when requested", async () => {
      const tokenMint = "TokenMint11111111111111111111111111111111";

      await service.invalidateCache(tokenMint);

      expect(redisMock.del).toHaveBeenCalledWith(expect.stringContaining(tokenMint));
    });
  });
});
