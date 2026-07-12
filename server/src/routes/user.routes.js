import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParam, paginationQuery, withIdAndBody } from "../validators/common.validators.js";
import { employeeCreateBody, employeeUpdateBody, promoteBody } from "../validators/domain.validators.js";
import {
  activateUser,
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  promoteUser,
  updateUser
} from "../controllers/user.controller.js";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get(
  "/",
  authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"),
  validate(paginationQuery),
  asyncHandler(listUsers)
);
userRoutes.get("/:id", authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"), validate(idParam), asyncHandler(getUser));
userRoutes.post("/", authorize("ADMIN"), validate(z.object({ body: employeeCreateBody })), asyncHandler(createUser));
userRoutes.put(
  "/:id",
  authorize("ADMIN"),
  validate(withIdAndBody(employeeUpdateBody)),
  asyncHandler(updateUser)
);
userRoutes.patch(
  "/:id/role",
  authorize("ADMIN"),
  validate(z.object({ params: idParam.shape.params, body: promoteBody })),
  asyncHandler(promoteUser)
);
userRoutes.patch("/:id/activate", authorize("ADMIN"), validate(idParam), asyncHandler(activateUser));
userRoutes.patch("/:id/deactivate", authorize("ADMIN"), validate(idParam), asyncHandler(deactivateUser));
