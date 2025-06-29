import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { prisma } from "@repo/db";

const markAllReadRoute = new Hono();

//mark all notification as read for the user
markAllReadRoute.patch(
  "/notifications/mark-all-read",
  authMiddleware,
  async (c) => {
    const userId = c.get("userId");

    try {
      // Count current unread notifications
      const currentUnreadCount = await prisma.notification.count({
        where: {
          recipientId: userId,
          read: false,
        },
      });

      if (currentUnreadCount === 0) {
        return c.json({
          success: true,
          message: "No unread notifications to mark",
          data: { markedCount: 0, unreadCount: 0 },
        });
      }

      // Mark all unread notifications as read
      const updateResult = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          read: false,
        },
        data: { read: true },
      });

      return c.json({
        success: true,
        message: `All ${updateResult.count} notifications marked as read`,
        data: {
          markedCount: updateResult.count,
          unreadCount: 0,
        },
      });
    } catch (err: any) {
      console.error("Mark all notifications as read error:", err);
      return c.json(
        {
          error: "Failed to mark all notifications as read",
          details: err.message,
        },
        500
      );
    }
  }
);

export {markAllReadRoute};