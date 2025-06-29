import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import {
  createCommentInput,
  createCommentSchema,
} from "../../utils/validation-schemas";
import { prisma } from "@repo/db";

const createCommentroutes = new Hono();

// POST: create comment on a blog
createCommentroutes.post(
  "/comment/:id",
  authMiddleware,
  validateBody(createCommentSchema),
  async (c) => {
    const blogId = c.req.param("id");
    const userId = c.get("userId");
    const { content } = c.get("validatedData") as createCommentInput;

    try {
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: {
          id: true,
          authorId: true,
          title: true,
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!blog) {
        return c.json({ error: "Blog not found" }, 404);
      }
      // create the comment
      const comment = await prisma.comment.create({
        data: {
          content,
          authorId: userId,
          blogId: blogId,
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
        },
      });

      // create notification for blog author(only if it is not thier own comment)
      if (blog.authorId !== userId) {
        await prisma.notification.create({
          data: {
            actorId: userId,
            recipientId: blog.authorId,
            blogId: blogId,
            message: `commented on your blog : "${blog.title}"`,
            read: false,
          },
        });
      }
      // get updated comment count
      const commentCount = await prisma.comment.count({
        where: { blogId: blogId },
      });

      return c.json(
        {
          success: true,
          message: "Comment created successfully",
          data: {
            comment,
            totalComments: commentCount,
          },
        },
        201
      );
    } catch (err: any) {
      console.error(err);
      return c.json(
        {
          error: "Failed to create comment",
          details: err.message,
        },
        500
      );
    }
  }
);

export {createCommentroutes}