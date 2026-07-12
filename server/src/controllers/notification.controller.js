import { prisma } from "../config/prisma.js";
import { HttpError, notFound } from "../utils/httpError.js";

const notificationTypes = [
  "ASSET_ASSIGNED",
  "TRANSFER_APPROVED",
  "MAINTENANCE_APPROVED",
  "BOOKING_REMINDER",
  "OVERDUE_RETURN",
  "AUDIT_DISCREPANCY"
];

const categoryForType = (type) =>
  ({
    ASSET_ASSIGNED: "ALLOCATION",
    OVERDUE_RETURN: "ALLOCATION",
    BOOKING_REMINDER: "BOOKING",
    MAINTENANCE_APPROVED: "MAINTENANCE",
    AUDIT_DISCREPANCY: "AUDIT",
    TRANSFER_APPROVED: "TRANSFER"
  })[type] || "GENERAL";

const buildNotificationSummary = (notifications) => {
  const countsByType = Object.fromEntries(notificationTypes.map((type) => [type, 0]));
  const countsByCategory = {
    ALLOCATION: 0,
    BOOKING: 0,
    MAINTENANCE: 0,
    AUDIT: 0,
    TRANSFER: 0
  };

  for (const notification of notifications) {
    countsByType[notification.type] = (countsByType[notification.type] || 0) + 1;
    const category = categoryForType(notification.type);
    countsByCategory[category] = (countsByCategory[category] || 0) + 1;
  }

  return {
    unread: notifications.filter((item) => !item.readAt).length,
    countsByType,
    countsByCategory,
    types: notificationTypes.map((type) => ({ type, category: categoryForType(type) }))
  };
};

export const listNotifications = async (req, res) => {
  const { type, category, unread } = req.query;
  if (type && !notificationTypes.includes(type)) throw new HttpError(400, "Invalid notification type");
  if (category && !["ALLOCATION", "BOOKING", "MAINTENANCE", "AUDIT", "TRANSFER"].includes(category)) {
    throw new HttpError(400, "Invalid notification category");
  }

  const where = {
    userId: req.user.id,
    deletedAt: null,
    ...(type ? { type } : {}),
    ...(unread === "true" ? { readAt: null } : {})
  };

  if (category) {
    const categoryTypes = notificationTypes.filter((item) => categoryForType(item) === category);
    where.type = { in: categoryTypes };
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });
  const allUserNotifications = await prisma.notification.findMany({
    where: { userId: req.user.id, deletedAt: null },
    select: { type: true, readAt: true }
  });
  res.json({ ...buildNotificationSummary(allUserNotifications), notifications });
};

export const unreadCount = async (req, res) => {
  const unread = await prisma.notification.count({
    where: { userId: req.user.id, deletedAt: null, readAt: null }
  });
  res.json({ unread });
};

export const markRead = async (req, res) => {
  const notification = await prisma.notification.findFirst({
    where: { id: req.params.id, userId: req.user.id, deletedAt: null }
  });
  if (!notification) throw notFound("Notification");
  res.json(await prisma.notification.update({ where: { id: req.params.id }, data: { readAt: notification.readAt || new Date() } }));
};

export const markAllRead = async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user.id, deletedAt: null, readAt: null },
    data: { readAt: new Date() }
  });
  res.json({ updated: result.count });
};
