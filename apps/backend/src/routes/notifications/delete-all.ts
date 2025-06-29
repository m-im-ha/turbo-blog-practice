import { prisma } from "@repo/db";
import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

const deleteAllRoute = new Hono();

// Delete all notifications for the user
deleteAllRoute.delete(
  "/notifications/all",
  authMiddleware,
  async (c) => {
    const userId = c.get("userId");

    try {
      // Count current notifications
      const [totalCount, unreadCount] = await Promise.all([
        prisma.notification.count({
          where: { recipientId: userId },
        }),
        prisma.notification.count({
          where: {
            recipientId: userId,
            read: false,
          },
        }),
      ]);

      if (totalCount === 0) {
        return c.json({
          success: true,
          message: "No notifications to delete",
          data: { deletedCount: 0, unreadCount: 0 },
        });
      }

      // Delete all notifications for the user
      const deleteResult = await prisma.notification.deleteMany({
        where: { recipientId: userId },
      });

      return c.json({
        success: true,
        message: `All ${deleteResult.count} notifications deleted successfully`,
        data: {
          deletedCount: deleteResult.count,
          unreadDeleted: unreadCount,
          unreadCount: 0,
        },
      });
    } catch (err: any) {
      console.error("Delete all notifications error:", err);
      return c.json(
        {
          error: "Failed to delete all notifications",
          details: err.message,
        },
        500
      );
    }
  }
);

export {deleteAllRoute};