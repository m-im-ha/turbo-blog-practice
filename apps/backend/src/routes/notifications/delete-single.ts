import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { prisma } from "@repo/db";

const deleteSingleRoute = new Hono();

// Delete single notification
deleteSingleRoute.delete(
  "/notifications/:id",
  authMiddleware,
  async (c) => {
    const userId = c.get("userId");
    const notificationId = c.req.param("id");

    if (!notificationId) {
      return c.json({ error: "Notification ID is required" }, 400);
    }

    try {
      // Check if notification exists and belongs to the user
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { id: true, recipientId: true, read: true },
      });

      if (!notification) {
        return c.json({ error: "Notification not found" }, 404);
      }

      if (notification.recipientId !== userId) {
        return c.json({ error: "Unauthorized to delete this notification" }, 403);
      }

      // Delete the notification
      await prisma.notification.delete({
        where: { id: notificationId },
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
        message: "Notification deleted successfully",
        data: { 
          deletedId: notificationId,
          unreadCount 
        },
      });
    } catch (err: any) {
      console.error("Delete notification error:", err);
      return c.json(
        {
          error: "Failed to delete notification",
          details: err.message,
        },
        500
      );
    }
  }
);


export {deleteSingleRoute};