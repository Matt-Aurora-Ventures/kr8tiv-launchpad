import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { createApp } from "./app";
import { scheduler } from "./jobs/scheduler";
import prisma from "./db/prisma";

const PORT = parseInt(process.env.PORT || "3001", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * KR8TIV Launchpad API Server
 *
 * Entry point for the Express API backend.
 * Handles:
 * - Token launches via Bags.fm
 * - $KR8TIV staking
 * - Automated fee collection and distribution
 * - Platform statistics
 */
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("KR8TIV Launchpad API");
  console.log("=".repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log("=".repeat(60));

  // Test database connection
  try {
    await prisma.$connect();
    console.log("[Database] Connected successfully");
  } catch (error) {
    console.error("[Database] Connection failed:", error);
    process.exit(1);
  }

  // Create Express app
  const app = createApp();

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`[Server] Listening on port ${PORT}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
    console.log(`[Server] API base: http://localhost:${PORT}/api`);
  });

  // Start job scheduler (only in production or when explicitly enabled)
  if (NODE_ENV === "production" || process.env.ENABLE_SCHEDULER === "true") {
    scheduler.start();
    console.log("[Scheduler] Started");
  } else {
    console.log("[Scheduler] Disabled in development (set ENABLE_SCHEDULER=true to enable)");
  }

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[Server] ${signal} received, shutting down gracefully...`);

    // Stop scheduler
    scheduler.stop();
    console.log("[Scheduler] Stopped");

    // Close server
    server.close(() => {
      console.log("[Server] HTTP server closed");
    });

    // Disconnect from database
    await prisma.$disconnect();
    console.log("[Database] Disconnected");

    console.log("[Server] Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("[Server] Uncaught exception:", error);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("[Server] Unhandled rejection at:", promise, "reason:", reason);
  });
}

// Run the server
main().catch((error) => {
  console.error("[Server] Fatal error:", error);
  process.exit(1);
});
