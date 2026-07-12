import { prisma } from "../config/prisma.js";
import * as workflow from "../services/workflow.service.js";

export const allocations = {
  list: async (req, res) =>
    res.json(await prisma.allocation.findMany({ include: { asset: true, user: true }, orderBy: { issuedAt: "desc" } })),
  create: async (req, res) => res.status(201).json(await workflow.allocateAsset(req.validated.body, req.user.id)),
  returnAsset: async (req, res) => res.json(await workflow.returnAsset(req.params.id, req.user.id))
};

export const transfers = {
  list: async (req, res) =>
    res.json(
      await prisma.transfer.findMany({
        include: { asset: true, requester: true, receiver: true },
        orderBy: { createdAt: "desc" }
      })
    ),
  create: async (req, res) => res.status(201).json(await workflow.requestTransfer(req.validated.body, req.user.id)),
  approve: async (req, res) => res.json(await workflow.decideTransfer(req.params.id, "APPROVED")),
  reject: async (req, res) => res.json(await workflow.decideTransfer(req.params.id, "REJECTED"))
};

export const bookings = {
  list: async (req, res) =>
    res.json(await prisma.booking.findMany({ include: { asset: true, user: true }, orderBy: { startsAt: "desc" } })),
  create: async (req, res) =>
    res.status(201).json(await workflow.createBooking({ ...req.validated.body, userId: req.user.id }, req.user.id))
};

export const maintenance = {
  list: async (req, res) =>
    res.json(
      await prisma.maintenanceRequest.findMany({
        include: { asset: true, requester: true, technician: true },
        orderBy: { createdAt: "desc" }
      })
    ),
  create: async (req, res) =>
    res.status(201).json(
      await workflow.createMaintenance({ ...req.validated.body, requesterId: req.user.id }, req.user.id)
    ),
  updateStatus: async (req, res) => res.json(await workflow.updateMaintenanceStatus(req.params.id, req.body, req.user.id))
};

export const audits = {
  list: async (req, res) =>
    res.json(await prisma.auditCycle.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } })),
  create: async (req, res) => res.status(201).json(await workflow.createAudit(req.validated.body)),
  verifyItem: async (req, res) => {
    const item = await prisma.auditItem.update({
      where: { id: req.params.id },
      data: { status: req.body.status, notes: req.body.notes, auditorId: req.user.id, verifiedAt: new Date() }
    });
    res.json(item);
  },
  close: async (req, res) =>
    res.json(await prisma.auditCycle.update({ where: { id: req.params.id }, data: { status: "CLOSED" } }))
};
