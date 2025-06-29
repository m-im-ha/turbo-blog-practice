import { Hono } from "hono";
import { validateQuery } from "../../middleware/validation";
import {
  commentPagination,
  commentPaginationSchema,
} from "../../utils/validation-schemas";
import { prisma } from "@repo/db";

const readCommentRoutes = new Hono();

// GET: get all comments for a blog with pagination
readCommentRoutes.get(
  "/comment/:id",
  validateQuery(commentPaginationSchema),
  async (c) => {
    const blogId = c.req.param("id");
    const { page, limit } = c.get("validatedQuery") as commentPagination;
    const skip = (page - 1) * limit;

    try {
      // Single query to get blog with comments and count
      const blogWithComments = await prisma.blog.findUnique({
        where: { id: blogId },
        select: {
          id: true,
          title: true,
          comments: {
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: { comments: true },
          },
        },
      });

      if (!blogWithComments) {
        return c.json({ error: "Blog not found" }, 404);
      }

      const totalCount = blogWithComments._count.comments;
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return c.json({
        success: true,
        data: {
          blogId: blogWithComments.id,
          blogTitle: blogWithComments.title,
          comments: blogWithComments.comments,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage,
            hasPrevPage,
          },
        },
      });

    } catch (err: any) {
      console.error(err);
       return c.json(
        {
          error: "Failed to fetch comments",
          details: err.message,
        },
        500
      );
    }
  }
);

export { readCommentRoutes };
