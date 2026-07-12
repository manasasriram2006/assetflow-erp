import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParam, paginationQuery, withIdAndBody } from "../validators/common.validators.js";
import { assetBody, categoryBody, departmentBody } from "../validators/domain.validators.js";
import { assets, crudController } from "../controllers/resource.controller.js";

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

export const departmentRoutes = resource(crudController("department", ["name", "code"]), departmentBody, ["ADMIN"]);
export const categoryRoutes = resource(crudController("category", ["name", "prefix"]), categoryBody, [
  "ADMIN",
  "ASSET_MANAGER"
]);
export const assetRoutes = resource(assets, assetBody, ["ADMIN", "ASSET_MANAGER"]);
