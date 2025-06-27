import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validation";
import {
  PaginationInput,
  paginationSchema,
} from "../../utils/validation-schemas";

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

// GET: get single blog by id
readBlogRoutes.get("/:id", async (c) => {
  const blogId = c.req.param("id");

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            image: true,
          },
        },
        tags: {
          select: {
            id: true,
            tagName: true,
          },
        },
        comments: {
          take: 5, //latest 5 comments for preview
          orderBy: {
            createdAt: "desc",
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    if (!blog) {
      return c.json({ error: "blog not found" }, 404);
    }

    return c.json({ success: true, data: blog });
  } catch (err: any) {
    console.error(err);
    return c.json(
      {
        error: "failed to fetch specific blog",
        details: err.message,
      },
      500
    );
  }
});

export { readBlogRoutes };
