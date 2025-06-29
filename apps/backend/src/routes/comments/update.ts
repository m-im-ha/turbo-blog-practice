import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import {
  updateCommentInput,
  updateCommentSchema,
} from "../../utils/validation-schemas";

const updateCommentRoutes = new Hono();

// PUT: update a comment
updateCommentRoutes.put(
  "/comment/:id",
  authMiddleware,
  validateBody(updateCommentSchema),
  async (c) => {
    const commentId = c.req.param("id");
    const userId = c.get("userId");
    const { content } = c.get("validatedData") as updateCommentInput;

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
          { error: "Unauthorized. You can only update your own comments" },
          403
        );
      }

      // update the comment
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
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

      return c.json({
        success: true,
        message: "Comment updated successfully",
        data: updatedComment,
      });
    } catch (err: any) {
      console.error(err);
    }
  }
);

export { updateCommentRoutes };
