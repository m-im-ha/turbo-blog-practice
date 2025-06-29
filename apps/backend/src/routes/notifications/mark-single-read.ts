import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";

const markSingleReadRoute = new Hono();
// Mark single notification as read
markSingleReadRoute.patch(
  "/notifications/read/:id",
  authMiddleware,
  async (c) => {
    const userId = c.get("userId");
    const notificationId = c.req.param("id");

    if (!notificationId) {
      return c.json({ error: "Notification ID is required" }, 400);
    }

    try {
      // check if notification exists and belongs to the user
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { id: true, recipientId: true, read: true },
      });

      if (!notification) {
        return c.json({ error: "Notification not found" }, 404);
      }

      if (notification.recipientId !== userId) {
        return c.json(
          { error: "Unauthorized to modify this notification" },
          403
        );
      }

      if (notification.read) {
        return c.json({
          success: true,
          message: "Notification already marked as read",
          data: { id: notificationId, read: true },
        });
      }

      // Mark as read
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
        select: {
          id: true,
          read: true,
          message: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              username: true,
              image: true,
            },
          },
          blog: {
            select: {
              id: true,
              title: true,
            },
          },
        },
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
        message: "Notification marked as read",
        data: updatedNotification,
        meta: { unreadCount },
      });
    } catch (err: any) {
      console.error(err);
      return c.json(
        {
          error: "Failed to mark notification as read",
          details: err.message,
        },
        500
      );
    }
  }
);

export { markSingleReadRoute };
