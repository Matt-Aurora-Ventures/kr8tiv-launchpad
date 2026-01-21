import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NotificationService } from "../services/notification.service";
import { prismaMock } from "./mocks/prisma.mock";

// Mock prisma
vi.mock("../db/prisma", () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

// Mock web-push
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

describe("NotificationService", () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("create", () => {
    it("should create a notification and return it", async () => {
      const mockNotification = {
        id: "notif-1",
        userId: "user-wallet-123",
        type: "stake_complete",
        title: "Staking Complete",
        message: "Your 1000 KR8TIV tokens have been staked",
        data: { amount: "1000" },
        read: false,
        createdAt: new Date(),
      };

      prismaMock.notification.create.mockResolvedValue(mockNotification);
      prismaMock.pushSubscription.findMany.mockResolvedValue([]);

      const result = await service.create(
        "user-wallet-123",
        "stake_complete",
        "Staking Complete",
        "Your 1000 KR8TIV tokens have been staked",
        { amount: "1000" }
      );

      expect(result).toEqual(mockNotification);
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "user-wallet-123",
          type: "stake_complete",
          title: "Staking Complete",
          message: "Your 1000 KR8TIV tokens have been staked",
          data: { amount: "1000" },
        },
      });
    });

    it("should create notification without data", async () => {
      const mockNotification = {
        id: "notif-2",
        userId: "user-wallet-456",
        type: "token_launched",
        title: "Token Launched",
        message: "Your token MEME has been launched",
        data: null,
        read: false,
        createdAt: new Date(),
      };

      prismaMock.notification.create.mockResolvedValue(mockNotification);
      prismaMock.pushSubscription.findMany.mockResolvedValue([]);

      const result = await service.create(
        "user-wallet-456",
        "token_launched",
        "Token Launched",
        "Your token MEME has been launched"
      );

      expect(result).toEqual(mockNotification);
    });
  });

  describe("getUnread", () => {
    it("should return unread notifications for a user", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          userId: "user-wallet-123",
          type: "stake_complete",
          title: "Staking Complete",
          message: "Your tokens have been staked",
          data: null,
          read: false,
          createdAt: new Date("2026-01-20T10:00:00Z"),
        },
        {
          id: "notif-2",
          userId: "user-wallet-123",
          type: "token_launched",
          title: "Token Launched",
          message: "Your token is live",
          data: null,
          read: false,
          createdAt: new Date("2026-01-20T09:00:00Z"),
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await service.getUnread("user-wallet-123");

      expect(result).toEqual(mockNotifications);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-wallet-123", read: false },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    });

    it("should return empty array when no unread notifications", async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);

      const result = await service.getUnread("user-wallet-empty");

      expect(result).toEqual([]);
    });
  });

  describe("getAll", () => {
    it("should return all notifications with pagination", async () => {
      const mockNotifications = [
        {
          id: "notif-1",
          userId: "user-wallet-123",
          type: "stake_complete",
          title: "Staking Complete",
          message: "Your tokens have been staked",
          data: null,
          read: true,
          createdAt: new Date("2026-01-20T10:00:00Z"),
        },
      ];

      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.notification.count.mockResolvedValue(1);

      const result = await service.getAll("user-wallet-123", 1, 20);

      expect(result.notifications).toEqual(mockNotifications);
      expect(result.total).toBe(1);
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-wallet-123" },
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: 0,
      });
    });

    it("should handle pagination correctly", async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);
      prismaMock.notification.count.mockResolvedValue(50);

      await service.getAll("user-wallet-123", 3, 10);

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "user-wallet-123" },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 20, // (page - 1) * pageSize = (3 - 1) * 10
      });
    });
  });

  describe("markRead", () => {
    it("should mark specified notifications as read", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.markRead("user-wallet-123", ["notif-1", "notif-2"]);

      expect(result.count).toBe(2);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["notif-1", "notif-2"] },
          userId: "user-wallet-123",
        },
        data: { read: true },
      });
    });

    it("should only update notifications belonging to the user", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });

      // Trying to mark a notification that doesn't belong to user
      const result = await service.markRead("user-wallet-123", ["notif-other-user"]);

      // Should have attempted the update with userId filter
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["notif-other-user"] },
          userId: "user-wallet-123",
        },
        data: { read: true },
      });
    });
  });

  describe("markAllRead", () => {
    it("should mark all notifications as read for a user", async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 10 });

      const result = await service.markAllRead("user-wallet-123");

      expect(result.count).toBe(10);
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-wallet-123",
          read: false,
        },
        data: { read: true },
      });
    });
  });

  describe("getUnreadCount", () => {
    it("should return count of unread notifications", async () => {
      prismaMock.notification.count.mockResolvedValue(5);

      const count = await service.getUnreadCount("user-wallet-123");

      expect(count).toBe(5);
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: {
          userId: "user-wallet-123",
          read: false,
        },
      });
    });
  });

  describe("delete", () => {
    it("should delete a notification", async () => {
      prismaMock.notification.delete.mockResolvedValue({
        id: "notif-1",
        userId: "user-wallet-123",
        type: "stake_complete",
        title: "Staking Complete",
        message: "Your tokens have been staked",
        data: null,
        read: true,
        createdAt: new Date(),
      });

      await service.delete("user-wallet-123", "notif-1");

      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: {
          id: "notif-1",
          userId: "user-wallet-123",
        },
      });
    });
  });

  describe("subscribePush", () => {
    it("should create a push subscription", async () => {
      const subscription = {
        endpoint: "https://fcm.googleapis.com/fcm/send/xxx",
        keys: {
          p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
          auth: "tBHItJI5svbpez7KI4CCXg",
        },
      };

      const mockPushSub = {
        id: "push-1",
        userId: "user-wallet-123",
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: new Date(),
      };

      prismaMock.pushSubscription.upsert.mockResolvedValue(mockPushSub);

      const result = await service.subscribePush("user-wallet-123", subscription);

      expect(result).toEqual(mockPushSub);
      expect(prismaMock.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: subscription.endpoint },
        update: { userId: "user-wallet-123", keys: subscription.keys },
        create: {
          userId: "user-wallet-123",
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
      });
    });
  });

  describe("unsubscribePush", () => {
    it("should remove a push subscription", async () => {
      prismaMock.pushSubscription.delete.mockResolvedValue({
        id: "push-1",
        userId: "user-wallet-123",
        endpoint: "https://fcm.googleapis.com/fcm/send/xxx",
        keys: {},
        createdAt: new Date(),
      });

      await service.unsubscribePush("https://fcm.googleapis.com/fcm/send/xxx");

      expect(prismaMock.pushSubscription.delete).toHaveBeenCalledWith({
        where: { endpoint: "https://fcm.googleapis.com/fcm/send/xxx" },
      });
    });
  });

  describe("sendPush", () => {
    it("should send push notifications to all user subscriptions", async () => {
      const webpush = await import("web-push");
      const mockSubscriptions = [
        {
          id: "push-1",
          userId: "user-wallet-123",
          endpoint: "https://fcm.googleapis.com/fcm/send/aaa",
          keys: { p256dh: "key1", auth: "auth1" },
          createdAt: new Date(),
        },
        {
          id: "push-2",
          userId: "user-wallet-123",
          endpoint: "https://fcm.googleapis.com/fcm/send/bbb",
          keys: { p256dh: "key2", auth: "auth2" },
          createdAt: new Date(),
        },
      ];

      prismaMock.pushSubscription.findMany.mockResolvedValue(mockSubscriptions);

      await service.sendPush("user-wallet-123", {
        title: "Test Notification",
        body: "This is a test",
        data: { type: "test" },
      });

      expect(prismaMock.pushSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: "user-wallet-123" },
      });
      expect(webpush.default.sendNotification).toHaveBeenCalledTimes(2);
    });

    it("should handle failed push notifications gracefully", async () => {
      const webpush = await import("web-push");
      (webpush.default.sendNotification as any).mockRejectedValueOnce(new Error("Push failed"));

      const mockSubscriptions = [
        {
          id: "push-1",
          userId: "user-wallet-123",
          endpoint: "https://fcm.googleapis.com/fcm/send/aaa",
          keys: { p256dh: "key1", auth: "auth1" },
          createdAt: new Date(),
        },
      ];

      prismaMock.pushSubscription.findMany.mockResolvedValue(mockSubscriptions);

      // Should not throw
      await expect(
        service.sendPush("user-wallet-123", { title: "Test", body: "Test" })
      ).resolves.not.toThrow();
    });
  });
});
