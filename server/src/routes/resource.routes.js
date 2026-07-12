import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParam, paginationQuery, withIdAndBody } from "../validators/common.validators.js";
import { assetBody, categoryBody, departmentBody, assignHeadBody } from "../validators/domain.validators.js";
import { assets } from "../controllers/resource.controller.js";
import { categories, departments } from "../controllers/organization.controller.js";

const resource = (controller, body, roles = ["ADMIN", "ASSET_MANAGER"]) => {
  const router = Router();
  router.use(authenticate);
  router.get("/", validate(paginationQuery), asyncHandler(controller.list));
  router.get("/:id", validate(idParam), asyncHandler(controller.get));
  router.post("/", authorize(...roles), validate(z.object({ body })), asyncHandler(controller.create));
  router.put(
    "/:id",
    authorize(...roles),
    validate(withIdAndBody(body.partial ? body.partial() : body)),
    asyncHandler(controller.update)
  );
  router.delete("/:id", authorize(...roles), validate(idParam), asyncHandler(controller.remove));
  return router;
};

export const departmentRoutes = Router();
departmentRoutes.use(authenticate);
departmentRoutes.get("/", validate(paginationQuery), asyncHandler(departments.list));
departmentRoutes.get("/:id", validate(idParam), asyncHandler(departments.get));
departmentRoutes.post("/", authorize("ADMIN"), validate(z.object({ body: departmentBody })), asyncHandler(departments.create));
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
categoryRoutes.get("/", validate(paginationQuery), asyncHandler(categories.list));
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
export const assetRoutes = resource(assets, assetBody, ["ADMIN", "ASSET_MANAGER"]);
