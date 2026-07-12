import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { activeListQuery, assetListQuery, idParam, withIdAndBody } from "../validators/common.validators.js";
import {
  assetBody,
  assetPhotoBody,
  categoryBody,
  departmentBody,
  assignHeadBody
} from "../validators/domain.validators.js";
import { assets } from "../controllers/resource.controller.js";
import { categories, departments } from "../controllers/organization.controller.js";

export const departmentRoutes = Router();
departmentRoutes.use(authenticate);
departmentRoutes.get("/", validate(activeListQuery), asyncHandler(departments.list));
departmentRoutes.get("/:id", validate(idParam), asyncHandler(departments.get));
departmentRoutes.post(
  "/",
  authorize("ADMIN"),
  validate(z.object({ body: departmentBody })),
  asyncHandler(departments.create)
);
departmentRoutes.put(
  "/:id",
  authorize("ADMIN"),
  validate(withIdAndBody(departmentBody.partial())),
  asyncHandler(departments.update)
);
departmentRoutes.patch(
  "/:id/head",
  authorize("ADMIN"),
  validate(withIdAndBody(assignHeadBody)),
  asyncHandler(departments.assignHead)
);
departmentRoutes.patch("/:id/activate", authorize("ADMIN"), validate(idParam), asyncHandler(departments.activate));
departmentRoutes.patch("/:id/deactivate", authorize("ADMIN"), validate(idParam), asyncHandler(departments.deactivate));

export const categoryRoutes = Router();
categoryRoutes.use(authenticate);
categoryRoutes.get("/", validate(activeListQuery), asyncHandler(categories.list));
categoryRoutes.get("/:id", validate(idParam), asyncHandler(categories.get));
categoryRoutes.post(
  "/",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(z.object({ body: categoryBody })),
  asyncHandler(categories.create)
);
categoryRoutes.put(
  "/:id",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(withIdAndBody(categoryBody.partial())),
  asyncHandler(categories.update)
);
categoryRoutes.patch(
  "/:id/activate",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(idParam),
  asyncHandler(categories.activate)
);
categoryRoutes.patch(
  "/:id/deactivate",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(idParam),
  asyncHandler(categories.deactivate)
);
export const assetRoutes = Router();
assetRoutes.use(authenticate);
assetRoutes.get("/", validate(assetListQuery), asyncHandler(assets.list));
assetRoutes.get("/:id", validate(idParam), asyncHandler(assets.get));
assetRoutes.get("/:id/history", validate(idParam), asyncHandler(assets.history));
assetRoutes.post(
  "/",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(z.object({ body: assetBody })),
  asyncHandler(assets.create)
);
assetRoutes.put(
  "/:id",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(withIdAndBody(assetBody.partial())),
  asyncHandler(assets.update)
);
assetRoutes.post(
  "/:id/photo",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(withIdAndBody(assetPhotoBody)),
  asyncHandler(assets.uploadPhoto)
);
assetRoutes.delete("/:id", authorize("ADMIN", "ASSET_MANAGER"), validate(idParam), asyncHandler(assets.remove));
