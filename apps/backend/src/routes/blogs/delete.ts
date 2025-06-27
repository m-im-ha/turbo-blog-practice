import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { prisma } from "@repo/db";

const deleteBlogRoutes = new Hono();

// DELETE: delete blog by id
deleteBlogRoutes.delete("/:id", authMiddleware, async (c) => {
  const blogId = c.req.param("id");
  const userId = c.get("userId") as string;

  try {
    const existingBlog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: {
        id: true,
        authorId: true,
        title: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            notifications: true,
          },
        },
      },
    });

    if (!existingBlog) {
      return c.json({ error: "Blog not found" }, 404);
    }

    if (existingBlog.authorId !== userId) {
      return c.json(
        { error: "Unauthorized. You can only delete your own blogs" },
        403
      );
    }
    
    // Delete the blog (Prisma will handle cascading deletes for related data)
    await prisma.blog.delete({
      where: { id: blogId },
    });

    return c.json({
      success: true,
      message: "blog deleted successfully",
      data: {
        deletedBlogId: blogId,
        deletedBlogTitle: existingBlog.title,
        deletedRelatedData: {
          likes: existingBlog._count.likes,
          comment: existingBlog._count.comments,
          notification: existingBlog._count.notifications,
        },
      },
    });
  } catch (err: any) {
    console.error(err);
    return c.json(
      {
        error: "Failed to delete blog",
        details: err.message,
      },
      500
    );
  }
});

export {deleteBlogRoutes};
