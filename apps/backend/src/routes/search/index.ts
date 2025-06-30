import { Hono } from "hono";
import { searchRoutes } from "./search-blog";

const searchRouter = new Hono();

searchRouter.route("/",searchRoutes);

export {searchRouter};