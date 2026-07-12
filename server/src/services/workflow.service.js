import { prisma } from "../config/prisma.js";
import { HttpError, notFound } from "../utils/httpError.js";
import { assertAssetAvailable, setAssetStatus } from "./asset.service.js";

const activeAllocationInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true } },
  user: { select: { id: true, name: true, email: true } }
};

const ensureActiveAllocation = async (assetId) => {
  const allocation = await prisma.allocation.findFirst({
    where: { assetId, status: "ACTIVE", deletedAt: null },
    include: activeAllocationInclude
  });
  if (!allocation) throw new HttpError(409, "Asset does not have an active allocation to transfer");
  return allocation;
};

export const allocateAsset = async ({ assetId, userId, dueAt, notes }, actorId) => {
  const asset = await assertAssetAvailable(assetId);
  const activeAllocation = await prisma.allocation.findFirst({ where: { assetId, status: "ACTIVE", deletedAt: null } });
  if (activeAllocation) throw new HttpError(409, "Asset already has an active allocation");

  return prisma.$transaction(async (tx) => {
    const allocation = await tx.allocation.create({ data: { assetId, userId, dueAt, notes } });
    await setAssetStatus(tx, assetId, "ALLOCATED", actorId, "ALLOCATED", `Asset ${asset.assetTag} allocated`);
    await tx.notification.create({
      data: {
        userId,
        type: "ASSET_ASSIGNED",
        title: "Asset assigned",
        message: `${asset.assetTag} has been allocated to you.`
      }
    });
    return tx.allocation.findUnique({ where: { id: allocation.id }, include: activeAllocationInclude });
  });
};

export const returnAsset = async (allocationId, actorId) => {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId }, include: activeAllocationInclude });
  if (!allocation) throw notFound("Allocation");
  if (allocation.status === "RETURNED") throw new HttpError(409, "Allocation is already returned");
  if (allocation.status !== "ACTIVE") throw new HttpError(409, "Only active allocations can be returned");

  return prisma.$transaction(async (tx) => {
    const returned = await tx.allocation.update({
      where: { id: allocationId },
      data: { status: "RETURNED", returnedAt: new Date() }
    });
    await setAssetStatus(
      tx,
      allocation.assetId,
      "AVAILABLE",
      actorId,
      "RETURNED",
      `${allocation.asset.assetTag} returned by ${allocation.user.name}`
    );
    return returned;
  });
};

export const requestTransfer = async ({ assetId, receiverId, reason }, requester) => {
  const allocation = await ensureActiveAllocation(assetId);
  if (allocation.asset.status === "MAINTENANCE") throw new HttpError(409, "Asset is currently under maintenance");
  if (allocation.userId === receiverId) throw new HttpError(409, "Receiver already holds this asset");
  if (requester.role === "EMPLOYEE" && allocation.userId !== requester.id) {
    throw new HttpError(403, "Only the current holder can request this transfer");
  }

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transfer.create({ data: { assetId, receiverId, reason, requesterId: requester.id } });
    await tx.assetHistory.create({
      data: {
        assetId,
        actorId: requester.id,
        action: "TRANSFER_REQUESTED",
        fromStatus: allocation.asset.status,
        toStatus: allocation.asset.status,
        notes: reason,
        changes: { receiverId: { from: allocation.userId, to: receiverId } }
      }
    });
    return tx.transfer.findUnique({
      where: { id: transfer.id },
      include: { asset: true, requester: true, receiver: true }
    });
  });
};

export const decideTransfer = async (id, status, actorId, notes) => {
  const transfer = await prisma.transfer.findUnique({
    where: { id },
    include: { asset: true, requester: true, receiver: true }
  });
  if (!transfer) throw notFound("Transfer");
  if (transfer.status !== "PENDING") throw new HttpError(409, "Only pending transfers can be decided");
  if (!transfer.receiverId) throw new HttpError(409, "Transfer receiver is required before approval");

  if (status === "REJECTED") {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.transfer.update({ where: { id }, data: { status, decidedAt: new Date() } });
      await tx.assetHistory.create({
        data: {
          assetId: transfer.assetId,
          actorId,
          action: "TRANSFER_REJECTED",
          fromStatus: transfer.asset.status,
          toStatus: transfer.asset.status,
          notes: notes || "Transfer request rejected"
        }
      });
      return updated;
    });
  }

  const activeAllocation = await ensureActiveAllocation(transfer.assetId);
  if (activeAllocation.userId === transfer.receiverId) throw new HttpError(409, "Receiver already holds this asset");
  if (["MAINTENANCE", "LOST", "RETIRED", "DISPOSED"].includes(transfer.asset.status)) {
    throw new HttpError(409, `Asset cannot be transferred while ${transfer.asset.status}`);
  }

  return prisma.$transaction(async (tx) => {
    await tx.allocation.update({
      where: { id: activeAllocation.id },
      data: { status: "RETURNED", returnedAt: new Date(), notes: activeAllocation.notes || "Closed by transfer approval" }
    });
    const nextAllocation = await tx.allocation.create({
      data: {
        assetId: transfer.assetId,
        userId: transfer.receiverId,
        notes: `Transfer approved from ${activeAllocation.user.name}`
      }
    });
    const updated = await tx.transfer.update({
      where: { id },
      data: { status: "COMPLETED", decidedAt: new Date(), completedAt: new Date() }
    });
    await setAssetStatus(
      tx,
      transfer.assetId,
      "ALLOCATED",
      actorId,
      "TRANSFER_COMPLETED",
      notes || `${transfer.asset.assetTag} transferred to ${transfer.receiver?.name || "receiver"}`
    );
    await tx.notification.create({
      data: {
        userId: transfer.requesterId,
        type: "TRANSFER_APPROVED",
        title: "Transfer approved",
        message: `${transfer.asset.assetTag} transfer request was approved.`
      }
    });
    await tx.notification.create({
      data: {
        userId: transfer.receiverId,
        type: "ASSET_ASSIGNED",
        title: "Asset transferred to you",
        message: `${transfer.asset.assetTag} has been transferred to you.`
      }
    });
    return { ...updated, allocation: nextAllocation };
  });
};

export const allocationHistory = () =>
  prisma.assetHistory.findMany({
    where: {
      action: { in: ["ALLOCATED", "RETURNED", "TRANSFER_REQUESTED", "TRANSFER_REJECTED", "TRANSFER_COMPLETED"] }
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      actor: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

const activeBookingStatuses = ["UPCOMING", "ONGOING"];

const bookingInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true, location: true } },
  user: { select: { id: true, name: true, email: true } }
};

const updateBookingStatuses = async (tx = prisma) => {
  const now = new Date();
  await tx.booking.updateMany({
    where: { deletedAt: null, status: "UPCOMING", startsAt: { lte: now }, endsAt: { gt: now } },
    data: { status: "ONGOING" }
  });
  await tx.booking.updateMany({
    where: { deletedAt: null, status: { in: ["UPCOMING", "ONGOING"] }, endsAt: { lte: now } },
    data: { status: "COMPLETED" }
  });
};

const releaseAssetIfNoActiveBookings = async (tx, assetId, actorId, notes = "Booking window closed") => {
  const activeBooking = await tx.booking.findFirst({
    where: { assetId, deletedAt: null, status: { in: activeBookingStatuses } }
  });
  const activeAllocation = await tx.allocation.findFirst({
    where: { assetId, deletedAt: null, status: "ACTIVE" }
  });
  if (!activeBooking && !activeAllocation) {
    const asset = await tx.asset.findFirst({ where: { id: assetId, deletedAt: null } });
    if (asset && asset.status === "RESERVED") {
      await setAssetStatus(tx, assetId, "AVAILABLE", actorId, "BOOKING_RELEASED", notes);
    }
  }
};

export const listBookings = async ({ status, from, to } = {}) => {
  await prisma.$transaction(async (tx) => {
    await updateBookingStatuses(tx);
    const completed = await tx.booking.findMany({
      where: { deletedAt: null, status: "COMPLETED" },
      select: { assetId: true },
      distinct: ["assetId"]
    });
    for (const item of completed) await releaseAssetIfNoActiveBookings(tx, item.assetId, null, "Completed booking released");
  });

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          startsAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {})
          }
        }
      : {})
  };
  return prisma.booking.findMany({ where, include: bookingInclude, orderBy: { startsAt: "asc" } });
};

export const createBooking = async ({ assetId, userId, startsAt, endsAt, purpose }, actorId) => {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, deletedAt: null } });
  if (!asset) throw notFound("Asset");
  if (!["AVAILABLE", "RESERVED"].includes(asset.status)) {
    throw new HttpError(409, `Asset cannot be booked while ${asset.status}`);
  }
  const overlap = await prisma.booking.findFirst({
    where: {
      assetId,
      deletedAt: null,
      status: { in: activeBookingStatuses },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });
  if (overlap) throw new HttpError(409, "Booking overlaps an existing booking");
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({ data: { assetId, userId, startsAt, endsAt, purpose } });
    await setAssetStatus(tx, assetId, "RESERVED", actorId, "RESERVED", `Booked for ${purpose}`);
    await tx.notification.create({
      data: {
        userId,
        type: "BOOKING_REMINDER",
        title: "Booking confirmed",
        message: `${asset.assetTag} is booked for ${startsAt.toLocaleString()}.`
      }
    });
    return tx.booking.findUnique({ where: { id: booking.id }, include: bookingInclude });
  });
};

export const cancelBooking = async (id, actorId) => {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking || booking.deletedAt) throw notFound("Booking");
  if (["COMPLETED", "CANCELLED"].includes(booking.status)) throw new HttpError(409, `Booking is already ${booking.status}`);

  return prisma.$transaction(async (tx) => {
    const cancelled = await tx.booking.update({ where: { id }, data: { status: "CANCELLED" } });
    await tx.assetHistory.create({
      data: {
        assetId: booking.assetId,
        actorId,
        action: "BOOKING_CANCELLED",
        fromStatus: booking.asset.status,
        toStatus: booking.asset.status,
        notes: booking.purpose
      }
    });
    await releaseAssetIfNoActiveBookings(tx, booking.assetId, actorId, "Booking cancelled");
    await tx.notification.create({
      data: {
        userId: booking.userId,
        type: "BOOKING_REMINDER",
        title: "Booking cancelled",
        message: `${booking.asset.assetTag} booking has been cancelled.`
      }
    });
    return cancelled;
  });
};

export const sendBookingReminders = async (actorId) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await updateBookingStatuses();
  const bookings = await prisma.booking.findMany({
    where: { deletedAt: null, status: "UPCOMING", startsAt: { gte: now, lte: soon } },
    include: bookingInclude,
    orderBy: { startsAt: "asc" }
  });

  if (bookings.length) {
    await prisma.$transaction(
      bookings.map((booking) =>
        prisma.notification.create({
          data: {
            userId: booking.userId,
            type: "BOOKING_REMINDER",
            title: "Upcoming booking reminder",
            message: `${booking.asset.assetTag} is booked for ${booking.startsAt.toLocaleString()}.`
          }
        })
      )
    );
  }

  if (actorId && bookings.length) {
    await prisma.assetHistory.createMany({
      data: bookings.map((booking) => ({
        assetId: booking.assetId,
        actorId,
        action: "BOOKING_REMINDER_SENT",
        fromStatus: booking.asset.status,
        toStatus: booking.asset.status,
        notes: `Reminder sent for booking ${booking.id}`
      }))
    });
  }

  return { sent: bookings.length, bookings };
};

export const createMaintenance = async ({ assetId, requesterId, title, description, scheduledAt }, actorId) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: { assetId, requesterId, title, description, scheduledAt }
    });
    await setAssetStatus(tx, assetId, "MAINTENANCE", actorId, "MAINTENANCE_REQUESTED", title);
    return request;
  });
};

export const updateMaintenanceStatus = async (id, data, actorId) => {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request) throw notFound("Maintenance request");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({ where: { id }, data });
    if (data.status === "RESOLVED") {
      await setAssetStatus(tx, request.assetId, "AVAILABLE", actorId, "MAINTENANCE_RESOLVED", request.title);
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
