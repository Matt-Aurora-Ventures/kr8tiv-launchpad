import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";

// Mock the feature flags service
const mockFeatureFlagsService = {
  getFlags: vi.fn(),
  isEnabled: vi.fn(),
  getAllFlags: vi.fn(),
  createFlag: vi.fn(),
  updateFlag: vi.fn(),
  deleteFlag: vi.fn(),
};

vi.mock("../services/feature-flags.service", () => ({
  featureFlags: mockFeatureFlagsService,
  FeatureFlagsService: vi.fn(() => mockFeatureFlagsService),
}));

// Import routes after mocking
import featureFlagsRoutes from "../routes/feature-flags.routes";

describe("Feature Flags Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Set up admin API key for tests
    process.env.ADMIN_API_KEY = "test-admin-key";

    app.use("/api/flags", featureFlagsRoutes);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/flags", () => {
    it("should return all flags as a map (public endpoint)", async () => {
      mockFeatureFlagsService.getFlags.mockResolvedValue({
        new_launch_flow: true,
        staking_v2: false,
      });

      const response = await request(app).get("/api/flags");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          new_launch_flow: true,
          staking_v2: false,
        },
        timestamp: expect.any(String),
      });
    });
  });

  describe("GET /api/flags/check/:key", () => {
    it("should check if a specific flag is enabled", async () => {
      mockFeatureFlagsService.isEnabled.mockResolvedValue(true);

      const response = await request(app)
        .get("/api/flags/check/test_feature")
        .query({ wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: {
          key: "test_feature",
          enabled: true,
        },
        timestamp: expect.any(String),
      });
    });

    it("should return false for disabled flag", async () => {
      mockFeatureFlagsService.isEnabled.mockResolvedValue(false);

      const response = await request(app)
        .get("/api/flags/check/disabled_feature");

      expect(response.status).toBe(200);
      expect(response.body.data.enabled).toBe(false);
    });
  });

  describe("Admin Routes (require authentication)", () => {
    describe("GET /api/flags/admin", () => {
      it("should return 401 without API key", async () => {
        const response = await request(app).get("/api/flags/admin");

        expect(response.status).toBe(401);
      });

      it("should return all flags with details when authenticated", async () => {
        const mockFlags = [
          { id: "1", key: "feature_a", name: "Feature A", enabled: true, percentage: 100 },
          { id: "2", key: "feature_b", name: "Feature B", enabled: false, percentage: 50 },
        ];

        mockFeatureFlagsService.getAllFlags.mockResolvedValue(mockFlags);

        const response = await request(app)
          .get("/api/flags/admin")
          .set("X-API-Key", "test-admin-key");

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockFlags);
      });
    });

    describe("POST /api/flags/admin", () => {
      it("should create a new flag when authenticated", async () => {
        const newFlag = {
          key: "new_feature",
          name: "New Feature",
          description: "A new feature",
          enabled: false,
          percentage: 100,
        };

        const createdFlag = { id: "new-id", ...newFlag };
        mockFeatureFlagsService.createFlag.mockResolvedValue(createdFlag);

        const response = await request(app)
          .post("/api/flags/admin")
          .set("X-API-Key", "test-admin-key")
          .send(newFlag);

        expect(response.status).toBe(201);
        expect(response.body.data).toEqual(createdFlag);
      });

      it("should return 400 for invalid flag data", async () => {
        const response = await request(app)
          .post("/api/flags/admin")
          .set("X-API-Key", "test-admin-key")
          .send({ name: "Missing key field" });

        expect(response.status).toBe(400);
      });
    });

    describe("PATCH /api/flags/admin/:key", () => {
      it("should update an existing flag", async () => {
        const updates = { enabled: true, percentage: 75 };
        const updatedFlag = {
          id: "1",
          key: "test_feature",
          name: "Test Feature",
          enabled: true,
          percentage: 75,
        };

        mockFeatureFlagsService.updateFlag.mockResolvedValue(updatedFlag);

        const response = await request(app)
          .patch("/api/flags/admin/test_feature")
          .set("X-API-Key", "test-admin-key")
          .send(updates);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(updatedFlag);
      });
    });

    describe("DELETE /api/flags/admin/:key", () => {
      it("should delete a flag", async () => {
        mockFeatureFlagsService.deleteFlag.mockResolvedValue(undefined);

        const response = await request(app)
          .delete("/api/flags/admin/test_feature")
          .set("X-API-Key", "test-admin-key");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
