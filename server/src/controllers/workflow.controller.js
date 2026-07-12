import { prisma } from "../config/prisma.js";
import * as workflow from "../services/workflow.service.js";

export const allocations = {
  list: async (req, res) =>
    res.json(
      await prisma.allocation.findMany({
        where: { deletedAt: null },
        include: { asset: true, user: true },
        orderBy: { issuedAt: "desc" }
      })
    ),
  create: async (req, res) => res.status(201).json(await workflow.allocateAsset(req.validated.body, req.user.id)),
  returnAsset: async (req, res) => res.json(await workflow.returnAsset(req.params.id, req.user.id)),
  history: async (req, res) => res.json(await workflow.allocationHistory())
};

export const transfers = {
  list: async (req, res) =>
    res.json(
      await prisma.transfer.findMany({
        where: { deletedAt: null },
        include: { asset: true, requester: true, receiver: true },
        orderBy: { createdAt: "desc" }
      })
    ),
  create: async (req, res) => res.status(201).json(await workflow.requestTransfer(req.validated.body, req.user)),
  approve: async (req, res) =>
    res.json(await workflow.decideTransfer(req.params.id, "APPROVED", req.user.id, req.validated?.body?.notes)),
  reject: async (req, res) =>
    res.json(await workflow.decideTransfer(req.params.id, "REJECTED", req.user.id, req.validated?.body?.notes))
};

export const bookings = {
  list: async (req, res) => res.json(await workflow.listBookings(req.validated?.query || req.query)),
  create: async (req, res) =>
    res.status(201).json(await workflow.createBooking({ ...req.validated.body, userId: req.user.id }, req.user.id)),
  cancel: async (req, res) => res.json(await workflow.cancelBooking(req.params.id, req.user.id)),
  reminders: async (req, res) => res.json(await workflow.sendBookingReminders(req.user.id))
};

export const maintenance = {
  list: async (req, res) => res.json(await workflow.listMaintenanceRequests()),
  history: async (req, res) => res.json(await workflow.maintenanceHistory()),
  create: async (req, res) =>
    res.status(201).json(
      await workflow.createMaintenance({ ...req.validated.body, requesterId: req.user.id }, req.user.id)
    ),
  updateStatus: async (req, res) =>
    res.json(await workflow.updateMaintenanceStatus(req.params.id, req.validated.body, req.user.id)),
  assignTechnician: async (req, res) =>
    res.json(await workflow.assignMaintenanceTechnician(req.params.id, req.validated.body, req.user.id)),
  uploadAttachment: async (req, res) =>
    res.json(await workflow.uploadMaintenanceAttachment(req.params.id, req.validated.body, req.user.id))
};

export const audits = {
  list: async (req, res) => res.json(await workflow.listAudits()),
  create: async (req, res) => res.status(201).json(await workflow.createAudit(req.validated.body, req.user.id)),
  history: async (req, res) => res.json(await workflow.auditHistory()),
  discrepancyReport: async (req, res) => res.json(await workflow.getAuditDiscrepancyReport(req.params.id)),
  assignAuditor: async (req, res) =>
    res.json(await workflow.assignAuditItemAuditor(req.params.id, req.validated.body, req.user.id)),
  verifyItem: async (req, res) => res.json(await workflow.verifyAuditItem(req.params.id, req.validated.body, req.user.id)),
  close: async (req, res) => res.json(await workflow.closeAudit(req.params.id, req.user.id))
};
