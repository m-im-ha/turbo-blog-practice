import { Hono } from "hono";
import { createBlogroutes } from "./create";
import { readBlogRoutes } from "./read";

const blogRoutes = new Hono();

// for testing
blogRoutes.get("/test", async (c) => {
  console.log(c);
  return c.json({
    message: "blogs route are working",
    user: {
      id: c.get("userId"),
      email: c.get("userEmail"),
      username: c.get("userName"),
    },
  });
});

blogRoutes.route("/",createBlogroutes);
blogRoutes.route("/",readBlogRoutes);

export {blogRoutes};
