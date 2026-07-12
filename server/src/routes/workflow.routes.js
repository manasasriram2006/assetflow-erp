import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { idParam } from "../validators/common.validators.js";
import {
  allocationBody,
  auditAssignBody,
  auditBody,
  auditVerifyBody,
  bookingBody,
  bookingQuery,
  maintenanceAssignBody,
  maintenanceAttachmentBody,
  maintenanceBody,
  maintenanceStatusBody,
  transferBody,
  transferDecisionBody
} from "../validators/domain.validators.js";
import { allocations, audits, bookings, maintenance, transfers } from "../controllers/workflow.controller.js";

export const allocationRoutes = Router();
allocationRoutes.use(authenticate);
allocationRoutes.get("/", authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"), asyncHandler(allocations.list));
allocationRoutes.get(
  "/history",
  authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"),
  asyncHandler(allocations.history)
);
allocationRoutes.post(
  "/",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(z.object({ body: allocationBody })),
  asyncHandler(allocations.create)
);
allocationRoutes.post(
  "/:id/return",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(idParam),
  asyncHandler(allocations.returnAsset)
);

export const transferRoutes = Router();
transferRoutes.use(authenticate);
transferRoutes.get("/", asyncHandler(transfers.list));
transferRoutes.post("/", validate(z.object({ body: transferBody })), asyncHandler(transfers.create));
transferRoutes.post(
  "/:id/approve",
  authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"),
  validate(z.object({ params: idParam.shape.params, body: transferDecisionBody.default({}) })),
  asyncHandler(transfers.approve)
);
transferRoutes.post(
  "/:id/reject",
  authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"),
  validate(z.object({ params: idParam.shape.params, body: transferDecisionBody.default({}) })),
  asyncHandler(transfers.reject)
);

export const bookingRoutes = Router();
bookingRoutes.use(authenticate);
bookingRoutes.get("/", validate(bookingQuery), asyncHandler(bookings.list));
bookingRoutes.post("/", validate(z.object({ body: bookingBody })), asyncHandler(bookings.create));
bookingRoutes.post("/:id/cancel", validate(idParam), asyncHandler(bookings.cancel));
bookingRoutes.post(
  "/reminders",
  authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"),
  asyncHandler(bookings.reminders)
);

export const maintenanceRoutes = Router();
maintenanceRoutes.use(authenticate);
maintenanceRoutes.get("/", asyncHandler(maintenance.list));
maintenanceRoutes.get("/history", asyncHandler(maintenance.history));
maintenanceRoutes.post("/", validate(z.object({ body: maintenanceBody })), asyncHandler(maintenance.create));
maintenanceRoutes.patch(
  "/:id/status",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(z.object({ params: idParam.shape.params, body: maintenanceStatusBody })),
  asyncHandler(maintenance.updateStatus)
);
maintenanceRoutes.patch(
  "/:id/technician",
  authorize("ADMIN", "ASSET_MANAGER"),
  validate(z.object({ params: idParam.shape.params, body: maintenanceAssignBody })),
  asyncHandler(maintenance.assignTechnician)
);
maintenanceRoutes.post(
  "/:id/attachments",
  validate(z.object({ params: idParam.shape.params, body: maintenanceAttachmentBody })),
  asyncHandler(maintenance.uploadAttachment)
);

export const auditRoutes = Router();
auditRoutes.use(authenticate, authorize("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"));
auditRoutes.get("/", asyncHandler(audits.list));
auditRoutes.get("/history", asyncHandler(audits.history));
auditRoutes.post("/", validate(z.object({ body: auditBody })), asyncHandler(audits.create));
auditRoutes.get("/:id/discrepancies", validate(idParam), asyncHandler(audits.discrepancyReport));
auditRoutes.patch(
  "/items/:id/auditor",
  validate(z.object({ params: idParam.shape.params, body: auditAssignBody })),
  asyncHandler(audits.assignAuditor)
);
auditRoutes.patch(
  "/items/:id/verify",
  validate(z.object({ params: idParam.shape.params, body: auditVerifyBody })),
  asyncHandler(audits.verifyItem)
);
auditRoutes.post("/:id/close", validate(idParam), asyncHandler(audits.close));
