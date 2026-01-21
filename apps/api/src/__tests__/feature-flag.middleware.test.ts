import { describe, it, expect, beforeEach, vi } from "vitest";
import { Request, Response, NextFunction } from "express";
import { requireFlag } from "../middleware/feature-flag.middleware";

// Mock the feature flags service
const mockIsEnabled = vi.fn();

vi.mock("../services/feature-flags.service", () => ({
  featureFlags: {
    isEnabled: mockIsEnabled,
  },
}));

describe("Feature Flag Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe("requireFlag", () => {
    it("should call next() when flag is enabled", async () => {
      mockIsEnabled.mockResolvedValue(true);

      const middleware = requireFlag("test_feature");
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should return 403 when flag is disabled", async () => {
      mockIsEnabled.mockResolvedValue(false);

      const middleware = requireFlag("disabled_feature");
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Feature not available",
        timestamp: expect.any(String),
      });
    });

    it("should pass wallet context from request body", async () => {
      mockIsEnabled.mockResolvedValue(true);
      mockReq.body = { wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" };

      const middleware = requireFlag("wallet_feature");
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockIsEnabled).toHaveBeenCalledWith("wallet_feature", {
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      });
    });

    it("should pass wallet context from query params", async () => {
      mockIsEnabled.mockResolvedValue(true);
      mockReq.query = { wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU" };

      const middleware = requireFlag("query_feature");
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockIsEnabled).toHaveBeenCalledWith("query_feature", {
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      });
    });

    it("should handle errors gracefully", async () => {
      mockIsEnabled.mockRejectedValue(new Error("Database error"));

      const middleware = requireFlag("error_feature");
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Failed to check feature flag",
        timestamp: expect.any(String),
      });
    });
  });
});
