import { Hono } from "hono";
import { userProfileRoutes } from "./profile";
import { userBlogsRoutes } from "./blogs";

const userRouter = new Hono();


// profile routes
userRouter.route("/profile", userProfileRoutes);

// user blogs routes
userRouter.route("/blogs", userBlogsRoutes);

export { userRouter };