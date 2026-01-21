import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Security middleware
import {
  securityHeaders,
  additionalSecurityHeaders
} from "./middleware/security-headers.middleware";
import { ipFilter } from "./middleware/ip-filter.middleware";
import { auditLogger, sensitiveOperationLogger } from "./middleware/audit-logger.middleware";

// Versioning middleware
import { extractVersion, VersionedRequest } from "./middleware/versioning.middleware";

// Import versioned routes
import routes from "./routes";

// Legacy route imports (for backward compatibility)
import launchRoutes from "./routes/launch.routes";
import tokensRoutes from "./routes/tokens.routes";
import stakingRoutes from "./routes/staking.routes";
import statsRoutes from "./routes/stats.routes";
import adminRoutes from "./routes/admin.routes";

/**
 * Create and configure Express application
 *
 * Security features enabled:
 * - Helmet security headers (CSP, HSTS, etc.)
 * - IP filtering and auto-blocking
 * - Rate limiting (general + strict for sensitive endpoints)
 * - CORS with explicit origin whitelist
 * - Audit logging for sensitive operations
 * - Request size limits
 *
 * API Versioning:
 * - URL path: /api/v1/*, /api/v2/*
 * - Accept header: application/vnd.kr8tiv.v1+json
 * - Query param: ?version=1
 */
export function createApp(): Express {
  const app = express();

  // ==========================================================================
  // Security Middleware (Order matters!)
  // ==========================================================================

  // 1. Trust proxy (required for rate limiting behind reverse proxy)
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // 2. Security headers (Helmet + custom)
  app.use(securityHeaders);
  app.use(additionalSecurityHeaders);

  // 3. IP filtering (block bad actors)
  app.use(ipFilter);

  // 4. CORS configuration
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://kr8tiv.io",
        "https://www.kr8tiv.io",
        "https://app.kr8tiv.io",
      ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
          callback(null, true);
        } else {
          console.warn("[CORS] Rejected origin:", origin);
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-ID", "Accept"],
      exposedHeaders: [
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-API-Version",
        "Deprecation",
        "X-Deprecation-Notice",
        "Sunset",
      ],
    })
  );

  // 5. Request logging
  if (process.env.NODE_ENV !== "test") {
    app.use(
      morgan(process.env.NODE_ENV === "development" ? "dev" : "combined")
    );
  }

  // 6. Body parsing with size limits
  app.use(express.json({ 
    limit: "1mb",  // Reduced from 10mb for security
    strict: true,  // Only accept arrays and objects
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: "1mb",
    parameterLimit: 100,  // Limit URL parameters
  }));

  // 7. Audit logging for all requests
  if (process.env.ENABLE_AUDIT_LOG !== "false") {
    app.use(auditLogger);
  }

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================

  // General rate limit
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "development" 
      ? 1000 
      : parseInt(process.env.RATE_LIMIT_MAX || "100"),
    message: {
      success: false,
      error: "Too many requests, please try again later",
      code: "RATE_LIMITED",
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use X-Forwarded-For if behind proxy
      const forwarded = req.headers["x-forwarded-for"];
      if (forwarded) {
        return typeof forwarded === "string" ? forwarded.split(",")[0].trim() : forwarded[0];
      }
      return req.ip || "unknown";
    },
  });

  // Strict rate limit for sensitive operations
  const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: parseInt(process.env.LAUNCH_RATE_LIMIT_MAX || "10"),
    message: {
      success: false,
      error: "Rate limit exceeded for this operation, please try again later",
      code: "STRICT_RATE_LIMITED",
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to API routes
  app.use("/api/", generalLimiter);

  // ==========================================================================
  // Health Check (no auth required)
  // ==========================================================================

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0",
      },
    });
  });

  // ==========================================================================
  // API Routes
  // ==========================================================================

  // Launch routes with strict rate limit
  app.use("/api/launch", strictLimiter, sensitiveOperationLogger, launchRoutes);

  // Token routes (public)
  app.use("/api", launchRoutes);

  // Token detail routes
  app.use("/api/tokens", tokensRoutes);

  // Staking routes with audit logging
  app.use("/api/staking", sensitiveOperationLogger, stakingRoutes);

  // Stats routes (public)
  app.use("/api/stats", statsRoutes);

  // Admin routes (protected, with additional audit logging)
  app.use("/api/admin", strictLimiter, sensitiveOperationLogger, adminRoutes);

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "Not found",
      code: "NOT_FOUND",
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Log full error internally
    console.error("[App] Unhandled error:", {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    // Don't expose internal errors in production
    const isProduction = process.env.NODE_ENV === "production";
    
    // Check for CORS error
    if (err.message === "Not allowed by CORS") {
      res.status(403).json({
        success: false,
        error: "Origin not allowed",
        code: "CORS_ERROR",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: isProduction ? "Internal server error" : err.message,
      code: "INTERNAL_ERROR",
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export default createApp;
