import "dotenv/config"
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth";
import { prisma } from "@repo/db";
import { blogRoutes } from "./routes/blogs/index";
import { likesRouter } from "./routes/likes";
import { commentRouter } from "./routes/comments";
import { notificationRouter } from "./routes/notifications";

// Debug: Check if env variables are loaded
console.log("NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

const app = new Hono();

app.get("/", (c) => {
  return c.text("Blog server is running..");
});

// blog routes
app.route("/api/blogs",blogRoutes);

// like routes
app.route("/api/blog",likesRouter);

// comments routes
app.route("/api/blog",commentRouter);

// notifications routes
app.route("/api/blog",notificationRouter);

// protected test route
app.get("/api/protected", authMiddleware, async (c) => {
  const userId = c.get("userId") as string;
  const userEmail = c.get("userEmail") as string | undefined;
  const userName = c.get("userName") as string | undefined;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, image: true },
    });
    if (!user) {
      return c.json({ error: "user not found" }, 404);
    }
    return c.json({
      message: "access granted to protected route",
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        dbUser: user,
      },
      timestamp: new Date().toLocaleString(),
    });
  } catch (err: any) {
    return c.json(
      {
        error: "db error",
        details: err.message,
      },
      500
    );
  }
});

const port = 3001;
console.log(`server is running on the port:`, port);

serve({ port, fetch: app.fetch });
