import { Hono } from "hono";
import { prisma } from "@repo/db";
import { validateQuery } from "../../middleware/validation";
import { PaginationInput, paginationSchema } from "../../utils/validation-schemas";

const userBlogsRoutes = new Hono();

// GET: Get user's blogs by user ID with pagination
userBlogsRoutes.get("/:id", validateQuery(paginationSchema), async (c) => {
  const targetUserId = c.req.param("id");
  const { page, limit } = c.get("validatedQuery") as PaginationInput;
  const skip = (page - 1) * limit;

  try {
    // First check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        image: true,
      },
    });

    if (!userExists) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get user's blogs with pagination
    const [blogs, totalCount] = await Promise.all([
      prisma.blog.findMany({
        where: { authorId: targetUserId },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              image: true,
            },
          },
          tags: {
            select: {
              id: true,
              tagName: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.blog.count({
        where: { authorId: targetUserId },
      }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return c.json({
      success: true,
      data: {
        user: userExists,
        blogs,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err: any) {
    console.error("Get user blogs error:", err);
    return c.json(
      {
        error: "Failed to fetch user blogs",
        details: err.message,
      },
      500
    );
  }
});

export { userBlogsRoutes };