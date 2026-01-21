import { automationService } from "../services/automation.service";
import { launchpadService } from "../services/launchpad.service";

/**
 * Automation Job
 *
 * This job handles automated fee collection, burning, LP additions,
 * and dividend distributions for all active tokens.
 */
export class AutomationJob {
  private running = false;

  /**
   * Run the automation job for all tokens
   */
  async run(): Promise<void> {
    if (this.running) {
      console.log("[AutomationJob] Job already running, skipping");
      return;
    }

    this.running = true;
    const startTime = Date.now();

    console.log("[AutomationJob] Starting automation job");

    try {
      // Run the automation cycle
      await automationService.runAutomationCycle();

      const duration = Date.now() - startTime;
      console.log(`[AutomationJob] Completed in ${duration}ms`);
    } catch (error) {
      console.error("[AutomationJob] Error during execution:", error);
    } finally {
      this.running = false;
    }
  }

  /**
   * Check for token graduations
   */
  async checkGraduations(): Promise<void> {
    console.log("[AutomationJob] Checking for token graduations");

    try {
      await launchpadService.checkGraduations();
      console.log("[AutomationJob] Graduation check complete");
    } catch (error) {
      console.error("[AutomationJob] Error checking graduations:", error);
    }
  }

  /**
   * Clean up old completed jobs
   */
  async cleanupOldJobs(): Promise<void> {
    console.log("[AutomationJob] Cleaning up old jobs");

    try {
      const { default: prisma } = await import("../db/prisma");

      // Delete completed jobs older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deleted = await prisma.automationJob.deleteMany({
        where: {
          status: "COMPLETED",
          completedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      console.log(`[AutomationJob] Deleted ${deleted.count} old jobs`);
    } catch (error) {
      console.error("[AutomationJob] Error cleaning up jobs:", error);
    }
  }
}

// Export singleton instance
export const automationJob = new AutomationJob();
