import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { prisma } from "@repo/db";

const likeRoutes = new Hono();

// POST: toggle like on a blog
likeRoutes.post("/:id/like", authMiddleware, async (c) => {
  const blogId = c.req.param("id");
  const userId = c.get("userId") as string;

  try {
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: {
        id: true,
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!blog) {
      return c.json({ error: "blog not found" }, 404);
    }

    // check if user already liked this blog
    const existingLike = await prisma.like.findUnique({
      where: {
        authorId_blogId: {
          authorId: userId,
          blogId: blogId,
        },
      },
    });

    let action: "liked" | "unliked";
    let likeId: string | null = null;

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      action = "unliked";
    } else {
      // create new like
      const newLike = await prisma.like.create({
        data: {
          authorId: userId,
          blogId: blogId,
        },
      });
      likeId = newLike.id;
      action = "liked";

      // create notification for blog author (only if its not their own blog)
      if (blog.authorId !== userId) {
        await prisma.notification.create({
          data: {
            actorId: userId,
            recipientId: blog.authorId,
            blogId: blogId,
            message: `liked your blog`,
            read: false,
          },
        });
      }
    }

    // get updated like count
    const likeCount = await prisma.like.count({
      where: { blogId: blogId },
    });

    return c.json({
      success: true,
      message: `blog ${action} successfully.`,
      data: {
        blog,
        action,
        likeId,
        totalLikes: likeCount,
        isLiked: action === "liked",
      },
    });
  } catch (err: any) {
    console.error(err);
    return c.json(
      {
        error: "Failed to toggle like",
        details: err.message,
      },
      500
    );
  }
});

// GET: get users who liked a specific blog
likeRoutes.get("/:id/likes", async (c) => {
  const blogId = c.req.param("id");

  try {
    // check if blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { id: true },
    });

    if (!blog) {
      return c.json({ error: "Blog not found" }, 404);
    }

    const likes = await prisma.like.findMany({
      where: { blogId: blogId },
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
    });

    const totalLikes = likes.length;
    const likedUsers = likes.map((like) => ({
      id: like.id,
      likedAt: like.createdAt,
      user: like.author,
    }));

    return c.json({
      success: true,
      data: {
        blogId,
        totalLikes,
        likes: likedUsers,
      },
    });
  } catch (err: any) {
    console.error("Get likes error:", err);
    return c.json(
      {
        error: "Failed to fetch likes",
        details: err.message,
      },
      500
    );
  }
});

export {likeRoutes};
