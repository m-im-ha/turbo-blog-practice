import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { MarkNotificationReadInput, markNotificationReadSchema } from "../../utils/validation-schemas";

const deleteMultipleRoute = new Hono();

// Delete multiple notifications
deleteMultipleRoute.delete(
  "/notifications",
  authMiddleware,
  validateBody(markNotificationReadSchema), // Reusing the same schema for IDs
  async (c) => {
    const userId = c.get("userId");
    const { notificationIds } = c.get("validatedData") as MarkNotificationReadInput;

    try {
      // Verify all notifications belong to the user
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
            details: "You can only delete your own notifications"
          }, 
          403
        );
      }

      // Count how many were unread before deletion
      const unreadBeforeDelete = notifications.filter(n => !n.read).length;

      // Delete the notifications
      const deleteResult = await prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
          recipientId: userId,
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
        message: `${deleteResult.count} notifications deleted successfully`,
        data: {
          deletedCount: deleteResult.count,
          unreadCount,
          unreadDeleted: unreadBeforeDelete,
        },
      });
    } catch (err: any) {
      console.error("Delete multiple notifications error:", err);
      return c.json(
        {
          error: "Failed to delete notifications",
          details: err.message,
        },
        500
      );
    }
  }
);

export {deleteMultipleRoute};