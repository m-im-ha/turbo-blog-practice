import { Hono } from "hono";
import { prisma } from "@repo/db";
import { authMiddleware } from "../../middleware/auth";
import { validateBody } from "../../middleware/validation";
import { UpdateUserProfileInput, updateUserProfileSchema } from "../../utils/validation-schemas";

const userProfileRoutes = new Hono();

// GET: Get current user profile (authenticated)
userProfileRoutes.get("/", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            blogs: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    console.error("Get user profile error:", err);
    return c.json(
      {
        error: "Failed to fetch user profile",
        details: err.message,
      },
      500
    );
  }
});

// PUT: Update current user profile (authenticated)
userProfileRoutes.put(
  "/",
  authMiddleware,
  validateBody(updateUserProfileSchema),
  async (c) => {
    const userId = c.get("userId") as string;
    const validatedData = c.get("validatedData") as UpdateUserProfileInput;

    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, image: true },
      });

      if (!existingUser) {
        return c.json({ error: "User not found" }, 404);
      }

      // Check if username is being updated and if it's already taken
      if (validatedData.username && validatedData.username !== existingUser.username) {
        const usernameExists = await prisma.user.findFirst({
          where: {
            username: validatedData.username,
            NOT: { id: userId },
          },
        });

        if (usernameExists) {
          return c.json(
            { error: "Username is already taken" },
            409
          );
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (validatedData.username !== undefined) {
        updateData.username = validatedData.username;
      }
      if (validatedData.image !== undefined) {
        updateData.image = validatedData.image || null;
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              blogs: true,
              likes: true,
              comments: true,
            },
          },
        },
      });

      return c.json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (err: any) {
      console.error("Update user profile error:", err);
      return c.json(
        {
          error: "Failed to update profile",
          details: err.message,
        },
        500
      );
    }
  }
);

// GET: Get public user profile by ID
userProfileRoutes.get("/:id", async (c) => {
  const targetUserId = c.req.param("id");

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            blogs: true,
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    console.error("Get public user profile error:", err);
    return c.json(
      {
        error: "Failed to fetch user profile",
        details: err.message,
      },
      500
    );
  }
});

export { userProfileRoutes };