import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { notificationService } from "../services/notification.service";

const router = Router();

// ============================================================================
// Request Validation Schemas
// ============================================================================

const WalletParamSchema = z.object({
  wallet: z.string().min(32).max(44),
});

const MarkReadSchema = z.object({
  ids: z.array(z.string()).min(1),
});

const PushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const PushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /notifications/:wallet
 * Get all notifications for a wallet with pagination
 */
router.get("/:wallet", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = WalletParamSchema.parse(req.params);
    const { page, pageSize } = PaginationSchema.parse(req.query);

    const { notifications, total } = await notificationService.getAll(wallet, page, pageSize);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasMore: page * pageSize < total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /notifications/:wallet/unread
 * Get unread notifications for a wallet
 */
router.get("/:wallet/unread", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = WalletParamSchema.parse(req.params);
    const notifications = await notificationService.getUnread(wallet);

    res.json({
      success: true,
      data: { notifications },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /notifications/:wallet/count
 * Get count of unread notifications
 */
router.get("/:wallet/count", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = WalletParamSchema.parse(req.params);
    const count = await notificationService.getUnreadCount(wallet);

    res.json({
      success: true,
      data: { unreadCount: count },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /notifications/:wallet/read
 * Mark specific notifications as read
 */
router.post("/:wallet/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = WalletParamSchema.parse(req.params);
    const { ids } = MarkReadSchema.parse(req.body);

    const result = await notificationService.markRead(wallet, ids);

    res.json({
      success: true,
      data: { markedCount: result.count },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /notifications/:wallet/read-all
 * Mark all notifications as read
 */
router.post("/:wallet/read-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = WalletParamSchema.parse(req.params);
    const result = await notificationService.markAllRead(wallet);

    res.json({
      success: true,
      data: { markedCount: result.count },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /notifications/:wallet/:id
 * Delete a specific notification
 */
router.delete("/:wallet/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = WalletParamSchema.parse(req.params);
    const { id } = req.params;

    await notificationService.delete(wallet, id);

    res.json({
      success: true,
      data: { deleted: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /notifications/:wallet/subscribe
 * Subscribe to push notifications
 */
router.post("/:wallet/subscribe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wallet } = WalletParamSchema.parse(req.params);
    const subscription = PushSubscribeSchema.parse(req.body);

    await notificationService.subscribePush(wallet, subscription);

    res.json({
      success: true,
      data: { subscribed: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /notifications/:wallet/subscribe
 * Unsubscribe from push notifications
 */
router.delete("/:wallet/subscribe", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = PushUnsubscribeSchema.parse(req.body);

    await notificationService.unsubscribePush(endpoint);

    res.json({
      success: true,
      data: { unsubscribed: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
