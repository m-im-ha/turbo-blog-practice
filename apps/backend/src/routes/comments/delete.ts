import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";

const deleteCommentRoutes = new Hono();

// DELETE: delete a comment
deleteCommentRoutes.delete("/comment/:id", authMiddleware, async (c) => {
  const commentId = c.req.param("id");
  const userId = c.get("userId") as string;

  try {
    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        content: true,
        blogId: true,
      },
    });

    if (!existingComment) {
      return c.json({ error: "Comment not found" }, 404);
    }

    if (existingComment.authorId !== userId) {
      return c.json(
        { error: "Unauthorized. You can only delete your own comments" },
        403
      );
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Get updated comment count for the blog
    const commentCount = await prisma.comment.count({
      where: { blogId: existingComment.blogId },
    });

    return c.json({
      success: true,
      message: "Comment deleted successfully",
      data: {
        deletedCommentId: commentId,
        blogId: existingComment.blogId,
        totalComments: commentCount,
      },
    });
  } catch (err: any) {
    console.error("Delete comment error:", err);
    return c.json(
      {
        error: "Failed to delete comment",
        details: err.message,
      },
      500
    );
  }
});

export {deleteCommentRoutes};