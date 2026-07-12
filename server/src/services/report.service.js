import { prisma } from "../config/prisma.js";

export const dashboard = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [
    assetStatus,
    categoryCounts,
    departmentCounts,
    maintenanceToday,
    bookingsToday,
    pendingTransfers,
    upcomingReturns
  ] = await Promise.all([
    prisma.asset.groupBy({ by: ["status"], _count: true }),
    prisma.asset.groupBy({ by: ["categoryId"], _count: true }),
    prisma.asset.groupBy({ by: ["departmentId"], _count: true }),
    prisma.maintenanceRequest.count({ where: { scheduledAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.booking.count({ where: { startsAt: { gte: todayStart, lt: todayEnd } } }),
    prisma.transfer.count({ where: { status: "PENDING" } }),
    prisma.allocation.count({ where: { status: "ACTIVE", dueAt: { gte: todayStart, lt: todayEnd } } })
  ]);

  const assetsAvailable = assetStatus.find((row) => row.status === "AVAILABLE")?._count || 0;
  const allocated = assetStatus.find((row) => row.status === "ALLOCATED")?._count || 0;

  return {
    cards: { assetsAvailable, allocated, maintenanceToday, upcomingReturns, pendingTransfers, bookingsToday },
    charts: { assetStatus, categoryCounts, departmentCounts },
    recentActivities: await prisma.notification.findMany({ take: 8, orderBy: { createdAt: "desc" } })
  };
};

export const csv = async () => {
  const assets = await prisma.asset.findMany({ include: { category: true, department: true } });
  const rows = assets.map((asset) => [
    asset.assetTag,
    asset.name,
    asset.status,
    asset.category.name,
    asset.department?.name || "",
    asset.location || ""
  ]);
  return [["Asset Tag", "Name", "Status", "Category", "Department", "Location"], ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
};
