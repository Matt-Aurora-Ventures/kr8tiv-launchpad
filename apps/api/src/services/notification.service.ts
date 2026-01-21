import webpush from "web-push";
import prisma from "../db/prisma";

// Configure VAPID credentials for push notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@kr8tiv.io";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Notification types
export type NotificationType =
  | "stake_complete"
  | "unstake_complete"
  | "rewards_claimed"
  | "token_launched"
  | "token_graduated"
  | "automation_complete"
  | "tier_upgrade"
  | "price_alert"
  | "system";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  icon?: string;
  badge?: string;
  tag?: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * NotificationService handles user notifications and push notifications
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   */
  async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ?? undefined,
      },
    });

    // Send push notification in background (don't await)
    this.sendPush(userId, { title, body: message, data }).catch((err) => {
      console.error("[NotificationService] Push notification failed:", err);
    });

    return notification;
  }

  /**
   * Get unread notifications for a user
   */
  async getUnread(userId: string) {
    return prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /**
   * Get all notifications for a user with pagination
   */
  async getAll(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip,
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return { notifications, total };
  }

  /**
   * Mark specific notifications as read
   */
  async markRead(userId: string, ids: string[]) {
    return prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId, // Security: only update user's own notifications
      },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Delete a notification
   */
  async delete(userId: string, notificationId: string) {
    return prisma.notification.delete({
      where: {
        id: notificationId,
        userId, // Security: only delete user's own notifications
      },
    });
  }

  /**
   * Subscribe to push notifications
   */
  async subscribePush(userId: string, subscription: PushSubscriptionInput) {
    return prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        keys: subscription.keys,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribePush(endpoint: string) {
    return prisma.pushSubscription.delete({
      where: { endpoint },
    });
  }

  /**
   * Send push notification to all user's subscriptions
   */
  async sendPush(userId: string, payload: PushPayload) {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            data: payload.data,
            icon: payload.icon || "/icon-192x192.png",
            badge: payload.badge || "/badge.png",
            tag: payload.tag,
          })
        )
      )
    );

    // Remove failed subscriptions (expired or unsubscribed)
    const failedEndpoints = results
      .map((result, index) => {
        if (result.status === "rejected") {
          const error = result.reason;
          // 410 Gone or 404 Not Found means subscription is invalid
          if (error?.statusCode === 410 || error?.statusCode === 404) {
            return subscriptions[index].endpoint;
          }
        }
        return null;
      })
      .filter((endpoint): endpoint is string => endpoint !== null);

    if (failedEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: failedEndpoints } },
      });
    }

    return results;
  }

  // ==========================================================================
  // Helper methods for specific notification types
  // ==========================================================================

  /**
   * Notify user when staking is complete
   */
  async notifyStakeComplete(userId: string, amount: string, tier: string) {
    return this.create(
      userId,
      "stake_complete",
      "Staking Complete",
      `You have successfully staked ${amount} KR8TIV tokens. Your tier: ${tier}`,
      { amount, tier }
    );
  }

  /**
   * Notify user when unstaking is complete
   */
  async notifyUnstakeComplete(userId: string, amount: string) {
    return this.create(
      userId,
      "unstake_complete",
      "Unstaking Complete",
      `You have successfully unstaked ${amount} KR8TIV tokens.`,
      { amount }
    );
  }

  /**
   * Notify user when rewards are claimed
   */
  async notifyRewardsClaimed(userId: string, amount: string) {
    return this.create(
      userId,
      "rewards_claimed",
      "Rewards Claimed",
      `You have successfully claimed ${amount} KR8TIV in rewards.`,
      { amount }
    );
  }

  /**
   * Notify user when their token is launched
   */
  async notifyTokenLaunched(
    userId: string,
    tokenName: string,
    tokenSymbol: string,
    tokenMint: string
  ) {
    return this.create(
      userId,
      "token_launched",
      "Token Launched!",
      `Your token ${tokenName} (${tokenSymbol}) has been successfully launched!`,
      { tokenName, tokenSymbol, tokenMint }
    );
  }

  /**
   * Notify user when their token graduates to Raydium
   */
  async notifyTokenGraduated(
    userId: string,
    tokenName: string,
    tokenSymbol: string,
    tokenMint: string
  ) {
    return this.create(
      userId,
      "token_graduated",
      "Token Graduated!",
      `Congratulations! ${tokenName} (${tokenSymbol}) has graduated to Raydium!`,
      { tokenName, tokenSymbol, tokenMint }
    );
  }

  /**
   * Notify user of automation job completion
   */
  async notifyAutomationComplete(
    userId: string,
    tokenSymbol: string,
    jobType: string,
    details: Record<string, unknown>
  ) {
    const jobNames: Record<string, string> = {
      CLAIM_FEES: "Fee collection",
      BURN: "Token burn",
      ADD_LP: "LP addition",
      PAY_DIVIDENDS: "Dividend distribution",
      FULL_CYCLE: "Full automation cycle",
    };

    const jobName = jobNames[jobType] || jobType;

    return this.create(
      userId,
      "automation_complete",
      `${jobName} Complete`,
      `${jobName} completed for ${tokenSymbol}.`,
      { tokenSymbol, jobType, ...details }
    );
  }

  /**
   * Notify user of tier upgrade
   */
  async notifyTierUpgrade(
    userId: string,
    previousTier: string,
    newTier: string
  ) {
    return this.create(
      userId,
      "tier_upgrade",
      "Tier Upgraded!",
      `Congratulations! You've been upgraded from ${previousTier} to ${newTier}.`,
      { previousTier, newTier }
    );
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
