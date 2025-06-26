import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { CreateBlogInput, createBlogSchema } from "../../utils/validation-schemas";
import { prisma } from "@repo/db";
import { processTagsInBackground } from "./utils";

const createBlogroutes = new Hono();

// POST: create blog
createBlogroutes.post(
  "/",
  authMiddleware,
  validateBody(createBlogSchema),
  async (c) => {
    const userId = c.get("userId") as string;
    const validatedData = c.get("validatedData") as CreateBlogInput;

    try {
      const blog = await prisma.blog.create({
        data: {
          title: validatedData.title,
          content: validatedData.content,
          image: validatedData.image || null,
          authorId: userId,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      // Process tags in background (don't wait)
      if (validatedData.tags && validatedData.tags.length > 0) {
        processTagsInBackground(blog.id, validatedData.tags);
      }
      return c.json(
        {
          success: true,
          message: "blog created successfully",
          data: { ...blog, tags: validatedData.tags || [] },
        },
        201
      );
    } catch (err: any) {
      console.error("create blog error", err);
      return c.json(
        {
          error: "failed to create blog",
          details: err.message,
        },
        500
      );
    }
  }
);

export {createBlogroutes}