import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as controller from "../controllers/report.controller.js";

export const reportRoutes = Router();

reportRoutes.use(authenticate);
reportRoutes.get("/dashboard", asyncHandler(controller.dashboard));
reportRoutes.get("/assets.csv", authorize("ADMIN", "ASSET_MANAGER"), asyncHandler(controller.csv));
