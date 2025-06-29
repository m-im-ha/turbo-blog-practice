import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validation";
import {
  NotificationPaginationInput,
  notificationPaginationSchema,
} from "../../utils/validation-schemas";

const readNotificationRoutes = new Hono();

readNotificationRoutes.get(
  "/notifications",
  authMiddleware,
  validateQuery(notificationPaginationSchema),
  async (c) => {
    const userId = c.get("userId");
    const { page, limit, unreadOnly } = c.get(
      "validatedQuery"
    ) as NotificationPaginationInput;
    const skip = (page - 1) * limit;

    try {
      const whereClause: any = {
        recipientId: userId,
      };
      if (unreadOnly) {
        whereClause.read = false;
      }

      // fetch notification and total count in parallel
      const [notifications, totalCount, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: {
            createdAt: "desc",
          },
          include: {
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
        }),
        prisma.notification.count({
          where: whereClause,
        }),

        // always get unread count for ui badge
        prisma.notification.count({
          where: {
            recipientId: userId,
            read: false,
          },
        }),
      ]);

      // calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return c.json({
        success: true,
        data: notifications,
        meta: {
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage,
          },
          unreadCount,
          filter: {
            unreadOnly,
          },
        },
      });
    } catch (err: any) {
      console.error(`get notification error:`,err);
      return c.json(
        {
          error: "Failed to fetch notifications",
          details: err.message,
        },
        500
      );
    }
  }
);

export {readNotificationRoutes};
