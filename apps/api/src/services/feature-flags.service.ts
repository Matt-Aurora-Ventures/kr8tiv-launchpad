import prisma from "../db/prisma";
import type { FeatureFlag, Prisma } from "@prisma/client";

/**
 * Context for feature flag evaluation
 */
export interface FeatureFlagContext {
  wallet?: string;
  environment?: string;
}

/**
 * Targeting rules structure
 */
interface TargetingRules {
  allowedWallets?: string[];
  blockedWallets?: string[];
  environments?: string[];
}

/**
 * Feature Flags Service
 *
 * Provides gradual rollout, A/B testing, and feature gating capabilities.
 */
export class FeatureFlagsService {
  /**
   * Get all feature flags as a simple key->enabled map
   * (For frontend consumption)
   */
  async getFlags(): Promise<Record<string, boolean>> {
    const flags = await prisma.featureFlag.findMany();

    return flags.reduce(
      (acc, flag) => {
        acc[flag.key] = flag.enabled;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }

  /**
   * Check if a specific feature flag is enabled
   * Takes into account percentage rollouts and targeting rules
   */
  async isEnabled(key: string, context?: FeatureFlagContext): Promise<boolean> {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });

    // Flag doesn't exist or is disabled
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check percentage rollout (only if wallet context is provided)
    if (flag.percentage < 100 && context?.wallet) {
      const hash = this.hashWallet(context.wallet);
      if (hash >= flag.percentage) {
        return false;
      }
    }

    // Check targeting rules
    if (flag.rules && context) {
      return this.evaluateRules(flag.rules as TargetingRules, context);
    }

    return true;
  }

  /**
   * Get all flags with full details (for admin)
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    return prisma.featureFlag.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new feature flag
   */
  async createFlag(
    data: Prisma.FeatureFlagCreateInput
  ): Promise<FeatureFlag> {
    return prisma.featureFlag.create({ data });
  }

  /**
   * Update an existing feature flag
   */
  async updateFlag(
    key: string,
    data: Prisma.FeatureFlagUpdateInput
  ): Promise<FeatureFlag> {
    return prisma.featureFlag.update({
      where: { key },
      data,
    });
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(key: string): Promise<void> {
    await prisma.featureFlag.delete({ where: { key } });
  }

  /**
   * Hash a wallet address to a value between 0-99
   * Used for consistent percentage-based rollouts
   */
  private hashWallet(wallet: string): number {
    let hash = 0;
    for (let i = 0; i < wallet.length; i++) {
      hash = (hash << 5) - hash + wallet.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Evaluate targeting rules against the provided context
   */
  private evaluateRules(
    rules: TargetingRules,
    context: FeatureFlagContext
  ): boolean {
    // Check allowed wallets whitelist
    if (rules.allowedWallets && rules.allowedWallets.length > 0) {
      if (!context.wallet || !rules.allowedWallets.includes(context.wallet)) {
        return false;
      }
    }

    // Check blocked wallets blacklist
    if (rules.blockedWallets && rules.blockedWallets.length > 0) {
      if (context.wallet && rules.blockedWallets.includes(context.wallet)) {
        return false;
      }
    }

    // Check environment restrictions
    if (rules.environments && rules.environments.length > 0) {
      const currentEnv = context.environment || process.env.NODE_ENV || "development";
      if (!rules.environments.includes(currentEnv)) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagsService();
