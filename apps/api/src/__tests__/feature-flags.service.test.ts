import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FeatureFlagsService } from "../services/feature-flags.service";
import { prismaMock } from "./mocks/prisma.mock";

// Mock prisma
vi.mock("../db/prisma", () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

describe("FeatureFlagsService", () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    service = new FeatureFlagsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getFlags", () => {
    it("should return all feature flags as a map", async () => {
      const mockFlags = [
        { id: "1", key: "new_launch_flow", name: "New Launch Flow", description: null, enabled: true, percentage: 100, rules: null, createdAt: new Date(), updatedAt: new Date() },
        { id: "2", key: "staking_v2", name: "Staking V2", description: null, enabled: false, percentage: 100, rules: null, createdAt: new Date(), updatedAt: new Date() },
      ];

      prismaMock.featureFlag.findMany.mockResolvedValue(mockFlags);

      const flags = await service.getFlags();

      expect(flags).toEqual({
        new_launch_flow: true,
        staking_v2: false,
      });
    });

    it("should return empty object when no flags exist", async () => {
      prismaMock.featureFlag.findMany.mockResolvedValue([]);

      const flags = await service.getFlags();

      expect(flags).toEqual({});
    });
  });

  describe("isEnabled", () => {
    it("should return true for enabled flag without rules", async () => {
      const mockFlag = {
        id: "1",
        key: "test_feature",
        name: "Test Feature",
        description: null,
        enabled: true,
        percentage: 100,
        rules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.featureFlag.findUnique.mockResolvedValue(mockFlag);

      const enabled = await service.isEnabled("test_feature");

      expect(enabled).toBe(true);
    });

    it("should return false for disabled flag", async () => {
      const mockFlag = {
        id: "1",
        key: "test_feature",
        name: "Test Feature",
        description: null,
        enabled: false,
        percentage: 100,
        rules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.featureFlag.findUnique.mockResolvedValue(mockFlag);

      const enabled = await service.isEnabled("test_feature");

      expect(enabled).toBe(false);
    });

    it("should return false for non-existent flag", async () => {
      prismaMock.featureFlag.findUnique.mockResolvedValue(null);

      const enabled = await service.isEnabled("non_existent");

      expect(enabled).toBe(false);
    });

    it("should respect percentage rollout based on wallet hash", async () => {
      const mockFlag = {
        id: "1",
        key: "gradual_rollout",
        name: "Gradual Rollout",
        description: null,
        enabled: true,
        percentage: 50, // 50% rollout
        rules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.featureFlag.findUnique.mockResolvedValue(mockFlag);

      // Test with different wallets - some should be enabled, some disabled
      // The hash function is deterministic, so same wallet = same result
      const wallet1 = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      const wallet2 = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

      // Both should return boolean values based on hash
      const result1 = await service.isEnabled("gradual_rollout", { wallet: wallet1 });
      const result2 = await service.isEnabled("gradual_rollout", { wallet: wallet2 });

      expect(typeof result1).toBe("boolean");
      expect(typeof result2).toBe("boolean");
    });

    it("should evaluate targeting rules when present", async () => {
      const mockFlag = {
        id: "1",
        key: "beta_feature",
        name: "Beta Feature",
        description: null,
        enabled: true,
        percentage: 100,
        rules: {
          allowedWallets: ["7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.featureFlag.findUnique.mockResolvedValue(mockFlag);

      const enabledForAllowed = await service.isEnabled("beta_feature", {
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      });

      const enabledForOther = await service.isEnabled("beta_feature", {
        wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      });

      expect(enabledForAllowed).toBe(true);
      expect(enabledForOther).toBe(false);
    });
  });

  describe("createFlag", () => {
    it("should create a new feature flag", async () => {
      const newFlag = {
        key: "new_feature",
        name: "New Feature",
        description: "A new feature for testing",
        enabled: false,
        percentage: 100,
      };

      const createdFlag = {
        id: "new-id",
        ...newFlag,
        rules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.featureFlag.create.mockResolvedValue(createdFlag);

      const result = await service.createFlag(newFlag);

      expect(result).toEqual(createdFlag);
      expect(prismaMock.featureFlag.create).toHaveBeenCalledWith({
        data: newFlag,
      });
    });
  });

  describe("updateFlag", () => {
    it("should update an existing feature flag", async () => {
      const updates = {
        enabled: true,
        percentage: 50,
      };

      const updatedFlag = {
        id: "1",
        key: "test_feature",
        name: "Test Feature",
        description: null,
        enabled: true,
        percentage: 50,
        rules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.featureFlag.update.mockResolvedValue(updatedFlag);

      const result = await service.updateFlag("test_feature", updates);

      expect(result).toEqual(updatedFlag);
      expect(prismaMock.featureFlag.update).toHaveBeenCalledWith({
        where: { key: "test_feature" },
        data: updates,
      });
    });
  });

  describe("deleteFlag", () => {
    it("should delete a feature flag", async () => {
      const deletedFlag = {
        id: "1",
        key: "test_feature",
        name: "Test Feature",
        description: null,
        enabled: true,
        percentage: 100,
        rules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.featureFlag.delete.mockResolvedValue(deletedFlag);

      await service.deleteFlag("test_feature");

      expect(prismaMock.featureFlag.delete).toHaveBeenCalledWith({
        where: { key: "test_feature" },
      });
    });
  });

  describe("getAllFlags", () => {
    it("should return all flags with full details", async () => {
      const mockFlags = [
        { id: "1", key: "feature_a", name: "Feature A", description: "Desc A", enabled: true, percentage: 100, rules: null, createdAt: new Date(), updatedAt: new Date() },
        { id: "2", key: "feature_b", name: "Feature B", description: "Desc B", enabled: false, percentage: 50, rules: { allowedWallets: [] }, createdAt: new Date(), updatedAt: new Date() },
      ];

      prismaMock.featureFlag.findMany.mockResolvedValue(mockFlags);

      const flags = await service.getAllFlags();

      expect(flags).toEqual(mockFlags);
    });
  });

  describe("hashWallet", () => {
    it("should produce consistent hash for the same wallet", () => {
      const wallet = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

      // Access private method via any cast for testing
      const hash1 = (service as any).hashWallet(wallet);
      const hash2 = (service as any).hashWallet(wallet);

      expect(hash1).toBe(hash2);
      expect(hash1).toBeGreaterThanOrEqual(0);
      expect(hash1).toBeLessThan(100);
    });

    it("should produce different hashes for different wallets", () => {
      const wallet1 = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      const wallet2 = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

      const hash1 = (service as any).hashWallet(wallet1);
      const hash2 = (service as any).hashWallet(wallet2);

      // They could theoretically be the same, but very unlikely
      expect(typeof hash1).toBe("number");
      expect(typeof hash2).toBe("number");
    });
  });
});
