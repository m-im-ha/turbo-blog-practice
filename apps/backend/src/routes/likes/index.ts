import { Hono } from "hono";
import { likeRoutes } from "./like";

const likesRouter = new Hono();

likesRouter.route("/blog",likeRoutes);

export {likesRouter};