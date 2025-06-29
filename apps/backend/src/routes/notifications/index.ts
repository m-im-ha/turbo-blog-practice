import { Hono } from "hono";
import { readNotificationRoutes } from "./read";

const notificationRouter = new Hono();

notificationRouter.route("/",readNotificationRoutes);

export {notificationRouter};