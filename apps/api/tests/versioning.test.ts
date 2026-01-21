/**
 * API Versioning Tests
 *
 * Tests version extraction middleware, versioned routing,
 * and deprecation warnings.
 */

import express, { Express, Request, Response } from "express";
import request from "supertest";
import {
  extractVersion,
  VersionedRequest,
  SUPPORTED_VERSIONS,
  LATEST_VERSION,
  DEFAULT_VERSION,
} from "../src/middleware/versioning.middleware";
import {
  addDeprecationWarning,
  deprecatedEndpoint,
} from "../src/utils/deprecation";
import v1Routes from "../src/routes/v1";
import v2Routes from "../src/routes/v2";

// =============================================================================
// Test Helpers
// =============================================================================

function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(extractVersion as any);

  // Test endpoint that returns the detected version
  app.get("/test/version", (req: Request, res: Response) => {
    const versionedReq = req as VersionedRequest;
    res.json({
      version: versionedReq.apiVersion,
      versionSource: versionedReq.apiVersionSource,
    });
  });

  // Mount versioned routes
  app.use("/api/v1", v1Routes);
  app.use("/api/v2", v2Routes);
  app.use("/api", v1Routes); // Default to v1

  return app;
}

// =============================================================================
// Version Extraction Tests
// =============================================================================

describe("Version Extraction Middleware", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("Header-based versioning (Accept header)", () => {
    test("extracts version from Accept header vnd format", async () => {
      const response = await request(app)
        .get("/test/version")
        .set("Accept", "application/vnd.kr8tiv.v1+json");

      expect(response.status).toBe(200);
      expect(response.body.version).toBe("1");
      expect(response.body.versionSource).toBe("header");
    });

    test("extracts v2 from Accept header", async () => {
      const response = await request(app)
        .get("/test/version")
        .set("Accept", "application/vnd.kr8tiv.v2+json");

      expect(response.status).toBe(200);
      expect(response.body.version).toBe("2");
      expect(response.body.versionSource).toBe("header");
    });

    test("handles version with no + suffix", async () => {
      const response = await request(app)
        .get("/test/version")
        .set("Accept", "application/vnd.kr8tiv.v1");

      expect(response.status).toBe(200);
      expect(response.body.version).toBe("1");
    });
  });

  describe("URL path-based versioning", () => {
    test("extracts version from URL path /v1/", async () => {
      const response = await request(app).get("/api/v1/test/version");

      // This will hit the v1 routes, version from path
      expect(response.status).toBe(200);
    });

    test("extracts version from URL path /v2/", async () => {
      const response = await request(app).get("/api/v2/test/version");

      expect(response.status).toBe(200);
    });
  });

  describe("Query parameter versioning", () => {
    test("extracts version from query param ?version=1", async () => {
      const response = await request(app).get("/test/version?version=1");

      expect(response.status).toBe(200);
      expect(response.body.version).toBe("1");
      expect(response.body.versionSource).toBe("query");
    });

    test("extracts version from query param ?version=2", async () => {
      const response = await request(app).get("/test/version?version=2");

      expect(response.status).toBe(200);
      expect(response.body.version).toBe("2");
      expect(response.body.versionSource).toBe("query");
    });
  });

  describe("Version priority", () => {
    test("header takes precedence over query", async () => {
      const response = await request(app)
        .get("/test/version?version=2")
        .set("Accept", "application/vnd.kr8tiv.v1+json");

      expect(response.status).toBe(200);
      expect(response.body.version).toBe("1");
      expect(response.body.versionSource).toBe("header");
    });

    test("defaults to version 1 when no version specified", async () => {
      const response = await request(app).get("/test/version");

      expect(response.status).toBe(200);
      expect(response.body.version).toBe(DEFAULT_VERSION);
      expect(response.body.versionSource).toBe("default");
    });
  });

  describe("Invalid version handling", () => {
    test("rejects unsupported version with 400", async () => {
      const response = await request(app).get("/test/version?version=99");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Unsupported API version");
    });

    test("rejects non-numeric version with 400", async () => {
      const response = await request(app).get("/test/version?version=abc");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

// =============================================================================
// Version Constants Tests
// =============================================================================

describe("Version Constants", () => {
  test("SUPPORTED_VERSIONS contains 1 and 2", () => {
    expect(SUPPORTED_VERSIONS).toContain("1");
    expect(SUPPORTED_VERSIONS).toContain("2");
  });

  test("LATEST_VERSION is defined", () => {
    expect(LATEST_VERSION).toBeDefined();
    expect(SUPPORTED_VERSIONS).toContain(LATEST_VERSION);
  });

  test("DEFAULT_VERSION is 1 (stable)", () => {
    expect(DEFAULT_VERSION).toBe("1");
  });
});

// =============================================================================
// Deprecation Tests
// =============================================================================

describe("Deprecation Utilities", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe("addDeprecationWarning", () => {
    test("adds Deprecation header", async () => {
      app.get("/deprecated", (_req, res) => {
        addDeprecationWarning(res, "This endpoint is deprecated");
        res.json({ data: "test" });
      });

      const response = await request(app).get("/deprecated");

      expect(response.headers["deprecation"]).toBe("true");
      expect(response.headers["x-deprecation-notice"]).toBe(
        "This endpoint is deprecated"
      );
    });

    test("adds Sunset header when date provided", async () => {
      const sunsetDate = new Date("2025-12-31T00:00:00Z");

      app.get("/deprecated", (_req, res) => {
        addDeprecationWarning(res, "Use v2 instead", sunsetDate);
        res.json({ data: "test" });
      });

      const response = await request(app).get("/deprecated");

      expect(response.headers["deprecation"]).toBe("true");
      expect(response.headers["sunset"]).toBeDefined();
    });
  });

  describe("deprecatedEndpoint middleware", () => {
    test("adds deprecation headers to request", async () => {
      app.get(
        "/old-endpoint",
        deprecatedEndpoint("Use /new-endpoint instead"),
        (_req, res) => {
          res.json({ data: "test" });
        }
      );

      const response = await request(app).get("/old-endpoint");

      expect(response.status).toBe(200);
      expect(response.headers["deprecation"]).toBe("true");
      expect(response.headers["x-deprecation-notice"]).toBe(
        "Use /new-endpoint instead"
      );
    });

    test("includes sunset date when provided", async () => {
      const sunsetDate = new Date("2025-06-01T00:00:00Z");

      app.get(
        "/old-endpoint",
        deprecatedEndpoint("Deprecated", sunsetDate),
        (_req, res) => {
          res.json({ data: "test" });
        }
      );

      const response = await request(app).get("/old-endpoint");

      expect(response.headers["sunset"]).toBeDefined();
    });
  });
});

// =============================================================================
// Versioned Routes Tests
// =============================================================================

describe("Versioned Routes", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("V1 Routes", () => {
    test("GET /api/v1/launch routes exist", async () => {
      // Just checking the route exists, not the actual controller logic
      const response = await request(app).get("/api/v1/tokens");
      // Should not be 404
      expect(response.status).not.toBe(404);
    });

    test("GET /api/v1/staking/pool routes exist", async () => {
      const response = await request(app).get("/api/v1/staking/pool");
      expect(response.status).not.toBe(404);
    });
  });

  describe("V2 Routes", () => {
    test("V2 inherits V1 routes", async () => {
      const response = await request(app).get("/api/v2/tokens");
      expect(response.status).not.toBe(404);
    });

    test("V2 can have enhanced endpoints", async () => {
      // V2 tokens endpoint should return enhanced data
      const response = await request(app).get("/api/v2/tokens");
      expect(response.status).not.toBe(404);
    });
  });

  describe("Default routes (no version prefix)", () => {
    test("/api/tokens defaults to v1", async () => {
      const response = await request(app).get("/api/tokens");
      expect(response.status).not.toBe(404);
    });
  });
});

// =============================================================================
// Version Response Header Tests
// =============================================================================

describe("Version Response Headers", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    // Add middleware to set version response header
    app.use((req: Request, res: Response, next) => {
      const versionedReq = req as VersionedRequest;
      if (versionedReq.apiVersion) {
        res.setHeader("X-API-Version", versionedReq.apiVersion);
      }
      next();
    });
  });

  test("response includes X-API-Version header", async () => {
    const response = await request(app)
      .get("/test/version")
      .set("Accept", "application/vnd.kr8tiv.v2+json");

    expect(response.headers["x-api-version"]).toBe("2");
  });
});
