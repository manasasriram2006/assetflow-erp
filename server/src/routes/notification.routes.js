import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParam } from "../validators/common.validators.js";
import * as controller from "../controllers/notification.controller.js";

export const notificationRoutes = Router();

notificationRoutes.use(authenticate);
notificationRoutes.get("/", asyncHandler(controller.listNotifications));
notificationRoutes.patch("/:id/read", validate(idParam), asyncHandler(controller.markRead));
