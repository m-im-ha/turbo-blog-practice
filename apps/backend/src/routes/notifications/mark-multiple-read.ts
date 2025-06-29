import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { MarkNotificationReadInput, markNotificationReadSchema } from "../../utils/validation-schemas";

const markMultipleReadRoute = new Hono();

// mark multiple notification as read
markMultipleReadRoute.patch(
  "/notifications/mark-read",
  authMiddleware,
  validateBody(markNotificationReadSchema),
  async (c) => {
    const userId = c.get("userId");
    const { notificationIds } = c.get("validatedData") as MarkNotificationReadInput;

    try {
      // Verify all notifications belong to the user and get current read status
      const notifications = await prisma.notification.findMany({
        where: {
          id: { in: notificationIds },
          recipientId: userId,
        },
        select: { id: true, read: true },
      });

      if (notifications.length !== notificationIds.length) {
        return c.json(
          { 
            error: "Some notifications not found or unauthorized",
            details: "You can only mark your own notifications as read"
          }, 
          403
        );
      }

      // Filter out already read notifications
      const unreadNotificationIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadNotificationIds.length === 0) {
        return c.json({
          success: true,
          message: "All specified notifications are already marked as read",
          data: { 
            totalRequested: notificationIds.length,
            alreadyRead: notificationIds.length,
            newlyMarked: 0 
          },
        });
      }

      // Mark unread notifications as read
      const updateResult = await prisma.notification.updateMany({
        where: {
          id: { in: unreadNotificationIds },
          recipientId: userId,
        },
        data: { read: true },
      });

      // Get updated unread count
      const unreadCount = await prisma.notification.count({
        where: {
          recipientId: userId,
          read: false,
        },
      });

      return c.json({
        success: true,
        message: `${updateResult.count} notifications marked as read`,
        data: {
          totalRequested: notificationIds.length,
          alreadyRead: notificationIds.length - unreadNotificationIds.length,
          newlyMarked: updateResult.count,
          unreadCount,
        },
      });
    } catch (err: any) {
      console.error("Mark multiple notifications as read error:", err);
      return c.json(
        {
          error: "Failed to mark notifications as read",
          details: err.message,
        },
        500
      );
    }
  }
);

export {markMultipleReadRoute};