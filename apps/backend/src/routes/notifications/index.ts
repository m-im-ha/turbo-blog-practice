import { Hono } from "hono";
import { readNotificationRoutes } from "./read";
import { markSingleReadRoute } from "./mark-single-read";
import { markMultipleReadRoute } from "./mark-multiple-read";
import { markAllReadRoute } from "./mark-all-read";
import { deleteSingleRoute } from "./delete-single";
import { deleteMultipleRoute } from "./delete-multiple";
import { deleteAllRoute } from "./delete-all";

const notificationRouter = new Hono();

notificationRouter.route("/",readNotificationRoutes);
notificationRouter.route("/",markSingleReadRoute);
notificationRouter.route("/",markMultipleReadRoute);
notificationRouter.route("/",markAllReadRoute);
notificationRouter.route("/",deleteAllRoute);
notificationRouter.route("/",deleteMultipleRoute);
notificationRouter.route("/",deleteSingleRoute); // keep this route at last( safest rule in all routing systems : Always define static and specific routes first, and dynamic ones like :id last.)

export {notificationRouter};