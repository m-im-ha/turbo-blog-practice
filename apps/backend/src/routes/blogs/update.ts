import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import {
  UpdateBlogInput,
  updateBlogSchema,
} from "../../utils/validation-schemas";
import { prisma } from "@repo/db";
import { processTagsInBackground } from "./utils";

const updateBlogRoutes = new Hono();

// PUT: update blog by id
updateBlogRoutes.put(
  "/:id",
  authMiddleware,
  validateBody(updateBlogSchema),
  async (c) => {
    const blogId = c.req.param("id");
    const userId = c.get("userId") as string;
    const validatedData = c.get("validatedData") as UpdateBlogInput;

    try {
      // first check it if blog exists and user owns it
      const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: { id: true, authorId: true },
      });

      if (!existingBlog) {
        return c.json({ error: "blog not found" }, 404);
      }

      if (existingBlog.authorId !== userId) {
        return c.json(
          {
            error: "Unauthorized. you can only update your own blogs",
          },
          403
        );
      }

      // prepare update data
      const updateData: any = {};
      if (validatedData.title !== undefined)
        updateData.title = validatedData.title;
      if (validatedData.content !== undefined)
        updateData.content = validatedData.content;
      if (validatedData.image !== undefined)
        updateData.image = validatedData.image || null;

      // update the blog
      const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: updateData,
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
      });

      // handle tags update if provided
      if (validatedData.tags !== undefined) {
        // remove all existing tags first
        await prisma.blog.update({
          where: { id: blogId },
          data: {
            tags: {
              set: [], // remove all connections
            },
          },
        });

        if (validatedData.tags.length > 0) {
          processTagsInBackground(blogId, validatedData.tags);
        }
      }

      return c.json({
        success: true,
        message: "Blog updated successfully",
        data: { ...updatedBlog, tags: validatedData.tags || updatedBlog.tags },
      });
    } catch (err: any) {
      console.error(err);
      return c.json(
        {
          error: "Failed to update blog",
          details: err.message,
        },
        500
      );
    }
  }
);

export {updateBlogRoutes};
