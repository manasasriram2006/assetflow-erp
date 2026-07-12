import { prisma } from "../config/prisma.js";

export const listNotifications = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" }
  });
  const unread = notifications.filter((item) => !item.readAt).length;
  res.json({ unread, notifications });
};

export const markRead = async (req, res) => {
  res.json(await prisma.notification.update({ where: { id: req.params.id }, data: { readAt: new Date() } }));
};
