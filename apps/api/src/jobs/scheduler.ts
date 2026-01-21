import cron from "node-cron";
import { automationJob } from "./automation.job";

/**
 * Job Scheduler
 *
 * Manages cron jobs for automated tasks:
 * - Fee claiming and distribution (hourly)
 * - Graduation checks (every 15 minutes)
 * - Job cleanup (daily)
 */
export class Scheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Start all scheduled jobs
   */
  start(): void {
    if (this.isRunning) {
      console.log("[Scheduler] Already running");
      return;
    }

    console.log("[Scheduler] Starting job scheduler");

    // Automation job - runs every hour at minute 0
    // Collects fees, executes burns, LP additions, and dividend distributions
    const automationTask = cron.schedule(
      "0 * * * *", // Every hour at minute 0
      async () => {
        console.log("[Scheduler] Running automation job");
        await automationJob.run();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );
    this.jobs.set("automation", automationTask);

    // Graduation check - runs every 15 minutes
    // Checks if any tokens have graduated from the bonding curve
    const graduationTask = cron.schedule(
      "*/15 * * * *", // Every 15 minutes
      async () => {
        console.log("[Scheduler] Checking for graduations");
        await automationJob.checkGraduations();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );
    this.jobs.set("graduation", graduationTask);

    // Job cleanup - runs daily at midnight UTC
    // Removes old completed automation jobs from the database
    const cleanupTask = cron.schedule(
      "0 0 * * *", // Daily at midnight
      async () => {
        console.log("[Scheduler] Running job cleanup");
        await automationJob.cleanupOldJobs();
      },
      {
        scheduled: true,
        timezone: "UTC",
      }
    );
    this.jobs.set("cleanup", cleanupTask);

    this.isRunning = true;
    console.log("[Scheduler] Scheduled jobs:");
    console.log("  - Automation: Every hour at minute 0");
    console.log("  - Graduation check: Every 15 minutes");
    console.log("  - Job cleanup: Daily at midnight UTC");
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    console.log("[Scheduler] Stopping job scheduler");

    for (const [name, task] of this.jobs) {
      task.stop();
      console.log(`[Scheduler] Stopped job: ${name}`);
    }

    this.jobs.clear();
    this.isRunning = false;
  }

  /**
   * Get the status of all jobs
   */
  getStatus(): { name: string; running: boolean }[] {
    const status: { name: string; running: boolean }[] = [];

    for (const [name] of this.jobs) {
      status.push({
        name,
        running: this.isRunning,
      });
    }

    return status;
  }

  /**
   * Run a specific job immediately (for testing/debugging)
   */
  async runJob(name: string): Promise<void> {
    console.log(`[Scheduler] Manually running job: ${name}`);

    switch (name) {
      case "automation":
        await automationJob.run();
        break;
      case "graduation":
        await automationJob.checkGraduations();
        break;
      case "cleanup":
        await automationJob.cleanupOldJobs();
        break;
      default:
        throw new Error(`Unknown job: ${name}`);
    }
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
