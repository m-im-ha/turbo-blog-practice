import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validation";
import { PaginationInput, paginationSchema } from "../../utils/validation-schemas";

const readBlogRoutes = new Hono();

// GET: get all blogs with pagination
readBlogRoutes.get("/", validateQuery(paginationSchema), async (c) => {
  const { page, limit } = c.get("validatedQuery") as PaginationInput;
  const skip = (page - 1) * limit;

  try {
    const [blogs, totalCount] = await Promise.all([
      prisma.blog.findMany({
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
      prisma.blog.count(),
    ]);

    // calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return c.json({
      success: true,
      data: blogs,
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
    console.error(`get blogs error`, err);
    return c.json(
      {
        error: "Failed to fetch blogs",
        details: err.message,
      },
      500
    );
  }
});

export { readBlogRoutes };
