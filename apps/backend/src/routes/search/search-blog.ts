import { Hono } from "hono";
import { prisma } from "@repo/db";
import { validateQuery } from "../../middleware/validation";
import {
  FilterBlogInput,
  filterBlogsSchema,
  SearchBlogInput,
  searchBlogsSchema,
} from "../../utils/validation-schemas";

const searchRoutes = new Hono();

// search blogs by title / content
searchRoutes.get("/search", validateQuery(searchBlogsSchema), async (c) => {
  try {
    const { q, page, limit } = c.get("validatedQuery") as SearchBlogInput;

    if (!q) {
      return c.json({ error: "Search query is required" }, 400);
    }

    const skip = (page - 1) * limit;

    const [blogs, totalCount] = await Promise.all([
      prisma.blog.findMany({
        where: {
          OR: [
            {
              title: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          author: {
            select: {
              id: true,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.blog.count({
        where: {
          OR: [
            {
              title: {
                contains: q,
                mode: "insensitive",
              },
            },
            {
              title: {
                contains: q,
                mode: "insensitive",
              },
            },
          ],
        },
      }),
    ]);

    return c.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      searchQuery: q,
    });
  } catch (err: any) {
    console.error(err);
    return c.json(
      {
        error: "Failed to search blogs",
        details: err.message,
      },
      500
    );
  }
});

// Filter blogs by tag
searchRoutes.get("/", validateQuery(filterBlogsSchema), async (c) => {
  try {
    const { tag, author, page, limit } = c.get(
      "validatedQuery"
    ) as FilterBlogInput;

    // Build filter conditions
    const whereConditions: any = {};

    if (tag) {
      whereConditions.tags = {
        some: {
          tagName: {
            equals: tag,
            mode: "insensitive",
          },
        },
      };
    }

    if (author) {
      whereConditions.authorId = author;
    }

    // If no filters provided, return all blogs
    const skip = (page - 1) * limit;

    const [blogs, totalCount] = await Promise.all([
      prisma.blog.findMany({
        where:
          Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
        include: {
          author: {
            select: {
              id: true,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.blog.count({
        where:
          Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      }),
    ]);

    // Verify author exists if author filter is applied
    if (author) {
      const authorExists = await prisma.user.findUnique({
        where: { id: author },
        select: { id: true, username: true },
      });

      if (!authorExists) {
        return c.json({ error: "Author not found" }, 404);
      }
    }

    return c.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      filters: {
        tag: tag || null,
        author: author || null,
      },
    });
  } catch (error: any) {
    console.error("Filter blogs error:", error);
    return c.json(
      {
        error: "Failed to filter blogs",
        details: error.message,
      },
      500
    );
  }
});

export {searchRoutes};
