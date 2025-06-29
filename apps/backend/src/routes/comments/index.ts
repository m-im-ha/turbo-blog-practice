import { Hono } from "hono";
import { createCommentroutes } from "./create";
import { readCommentRoutes } from "./read";
import { updateCommentRoutes } from "./update";
import { deleteCommentRoutes } from "./delete";

const commentRouter = new Hono();

commentRouter.route("/",createCommentroutes);
commentRouter.route("/",readCommentRoutes);
commentRouter.route("/",updateCommentRoutes);
commentRouter.route("/",deleteCommentRoutes);

export {commentRouter};