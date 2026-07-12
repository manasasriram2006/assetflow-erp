import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParam } from "../validators/common.validators.js";
import { promoteBody } from "../validators/domain.validators.js";
import { listUsers, promoteUser } from "../controllers/user.controller.js";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get("/", authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"), asyncHandler(listUsers));
userRoutes.patch(
  "/:id/role",
  authorize("ADMIN"),
  validate(z.object({ params: idParam.shape.params, body: promoteBody })),
  asyncHandler(promoteUser)
);
