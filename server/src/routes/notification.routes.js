import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParam } from "../validators/common.validators.js";
import { notificationQuery } from "../validators/domain.validators.js";
import * as controller from "../controllers/notification.controller.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get("/", validate(notificationQuery), asyncHandler(controller.listNotifications));
notificationRoutes.get("/unread-count", asyncHandler(controller.unreadCount));
notificationRoutes.patch("/read-all", asyncHandler(controller.markAllRead));
notificationRoutes.patch("/:id/read", validate(idParam), asyncHandler(controller.markRead));
