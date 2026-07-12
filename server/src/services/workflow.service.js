import { prisma } from "../config/prisma.js";
import { HttpError, notFound } from "../utils/httpError.js";
import { assertAssetAvailable } from "./asset.service.js";

export const allocateAsset = async ({ assetId, userId, dueAt, notes }) => {
  await assertAssetAvailable(assetId);
  return prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.create({ data: { assetId, userId, dueAt, notes } });
    await tx.asset.update({ where: { id: assetId }, data: { status: "ALLOCATED" } });
    await tx.notification.create({
      data: { userId, type: "ASSET_ASSIGNED", title: "Asset assigned", message: "An asset has been allocated to you." }
    });
    return allocation;
  });
};

export const returnAsset = async (allocationId) => {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId } });
  if (!allocation) throw notFound("Allocation");
  if (allocation.status === "RETURNED") throw new HttpError(409, "Allocation is already returned");

  return prisma.$transaction(async (tx) => {
    const returned = await tx.allocation.update({
      where: { id: allocationId },
      data: { status: "RETURNED", returnedAt: new Date() }
    });
    await tx.asset.update({ where: { id: allocation.assetId }, data: { status: "AVAILABLE" } });
    return returned;
  });
};

export const requestTransfer = ({ assetId, receiverId, reason }, requesterId) => {
  return prisma.transfer.create({ data: { assetId, receiverId, reason, requesterId } });
};

export const decideTransfer = async (id, status) => {
  const transfer = await prisma.transfer.findUnique({ where: { id } });
  if (!transfer) throw notFound("Transfer");
  if (transfer.status !== "PENDING") throw new HttpError(409, "Only pending transfers can be decided");
  const updated = await prisma.transfer.update({ where: { id }, data: { status, decidedAt: new Date() } });
  if (status === "APPROVED" && transfer.requesterId) {
    await prisma.notification.create({
      data: {
        userId: transfer.requesterId,
        type: "TRANSFER_APPROVED",
        title: "Transfer approved",
        message: "Your transfer request was approved."
      }
    });
  }
  return updated;
};

export const createBooking = async ({ assetId, userId, startsAt, endsAt, purpose }) => {
  const overlap = await prisma.booking.findFirst({
    where: {
      assetId,
      status: { in: ["UPCOMING", "ONGOING"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });
  if (overlap) throw new HttpError(409, "Booking overlaps an existing booking");
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({ data: { assetId, userId, startsAt, endsAt, purpose } });
    await tx.asset.update({ where: { id: assetId }, data: { status: "RESERVED" } });
    return booking;
  });
};

export const createMaintenance = async ({ assetId, requesterId, title, description, scheduledAt }) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: { assetId, requesterId, title, description, scheduledAt }
    });
    await tx.asset.update({ where: { id: assetId }, data: { status: "MAINTENANCE" } });
    return request;
  });
};

export const updateMaintenanceStatus = async (id, data) => {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request) throw notFound("Maintenance request");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({ where: { id }, data });
    if (data.status === "RESOLVED") {
      await tx.asset.update({ where: { id: request.assetId }, data: { status: "AVAILABLE" } });
    }
    if (data.status === "APPROVED") {
      await tx.notification.create({
        data: {
          userId: request.requesterId,
          type: "MAINTENANCE_APPROVED",
          title: "Maintenance approved",
          message: request.title
        }
      });
    }
    return updated;
  });
};

export const createAudit = async ({ name, startsAt, endsAt, assetIds }) => {
  return prisma.auditCycle.create({
    data: {
      name,
      startsAt,
      endsAt,
      items: { create: assetIds.map((assetId) => ({ assetId })) }
    },
    include: { items: true }
  });
};
