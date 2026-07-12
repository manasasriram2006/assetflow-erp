import { prisma } from "../config/prisma.js";

const startOfToday = () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart;
};

const daysFrom = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const dashboard = async () => {
  const todayStart = startOfToday();
  const todayEnd = daysFrom(todayStart, 1);
  const nextWeek = daysFrom(todayStart, 7);

  const [
    assetStatus,
    departments,
    pendingMaintenance,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    recentAssets,
    recentAllocations,
    recentTransfers,
    recentBookings,
    recentMaintenance,
    notifications,
    unreadNotifications
  ] = await Promise.all([
    prisma.asset.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true
    }),
    prisma.department.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            assets: { where: { deletedAt: null } },
            users: { where: { deletedAt: null } }
          }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.maintenanceRequest.count({
      where: {
        deletedAt: null,
        status: { in: ["PENDING", "APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] }
      }
    }),
    prisma.booking.count({
      where: {
        deletedAt: null,
        status: { in: ["UPCOMING", "ONGOING"] }
      }
    }),
    prisma.transfer.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.allocation.count({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        dueAt: { gte: todayStart, lt: nextWeek }
      }
    }),
    prisma.asset.findMany({
      where: { deletedAt: null },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, assetTag: true, status: true, createdAt: true }
    }),
    prisma.allocation.findMany({
      where: { deletedAt: null },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        dueAt: true,
        asset: { select: { name: true, assetTag: true } },
        user: { select: { name: true } }
      }
    }),
    prisma.transfer.findMany({
      where: { deletedAt: null },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        reason: true,
        createdAt: true,
        asset: { select: { name: true, assetTag: true } },
        requester: { select: { name: true } }
      }
    }),
    prisma.booking.findMany({
      where: { deletedAt: null },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        purpose: true,
        startsAt: true,
        createdAt: true,
        asset: { select: { name: true, assetTag: true } },
        user: { select: { name: true } }
      }
    }),
    prisma.maintenanceRequest.findMany({
      where: { deletedAt: null },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        asset: { select: { name: true, assetTag: true } },
        requester: { select: { name: true } }
      }
    }),
    prisma.notification.findMany({
      where: { deletedAt: null },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, title: true, message: true, readAt: true, createdAt: true }
    }),
    prisma.notification.count({ where: { deletedAt: null, readAt: null } })
  ]);

  const assetsAvailable = assetStatus.find((row) => row.status === "AVAILABLE")?._count || 0;
  const allocated = assetStatus.find((row) => row.status === "ALLOCATED")?._count || 0;
  const unassignedAssets = await prisma.asset.count({ where: { deletedAt: null, departmentId: null } });
  const departmentSummary = [
    ...departments.map((department) => ({
      id: department.id,
      name: department.name,
      code: department.code,
      assets: department._count.assets,
      employees: department._count.users
    })),
    ...(unassignedAssets ? [{ id: "unassigned", name: "Unassigned", code: "-", assets: unassignedAssets, employees: 0 }] : [])
  ];

  const recentActivities = [
    ...recentAssets.map((asset) => ({
      id: `asset-${asset.id}`,
      type: "Asset",
      title: asset.name,
      description: `${asset.assetTag} was registered with ${asset.status.replaceAll("_", " ").toLowerCase()} status.`,
      status: asset.status,
      createdAt: asset.createdAt
    })),
    ...recentAllocations.map((allocation) => ({
      id: `allocation-${allocation.id}`,
      type: "Allocation",
      title: allocation.asset.name,
      description: `${allocation.asset.assetTag} assigned to ${allocation.user.name}.`,
      status: allocation.status,
      dueAt: allocation.dueAt,
      createdAt: allocation.createdAt
    })),
    ...recentTransfers.map((transfer) => ({
      id: `transfer-${transfer.id}`,
      type: "Transfer",
      title: transfer.asset.name,
      description: `${transfer.requester.name} requested transfer for ${transfer.asset.assetTag}.`,
      status: transfer.status,
      createdAt: transfer.createdAt
    })),
    ...recentBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      type: "Booking",
      title: booking.asset.name,
      description: `${booking.user.name} booked ${booking.asset.assetTag} for ${booking.purpose}.`,
      status: booking.status,
      startsAt: booking.startsAt,
      createdAt: booking.createdAt
    })),
    ...recentMaintenance.map((maintenance) => ({
      id: `maintenance-${maintenance.id}`,
      type: "Maintenance",
      title: maintenance.title,
      description: `${maintenance.requester.name} reported ${maintenance.asset.assetTag}.`,
      status: maintenance.status,
      createdAt: maintenance.createdAt
    }))
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return {
    cards: {
      assetsAvailable,
      assetsAllocated: allocated,
      pendingMaintenance,
      bookings: activeBookings,
      pendingTransfers,
      upcomingReturns
    },
    charts: {
      assetsByStatus: assetStatus.map((row) => ({ status: row.status, count: row._count })),
      departmentSummary
    },
    recentActivities,
    notifications: {
      unread: unreadNotifications,
      items: notifications
    },
    meta: {
      generatedAt: new Date(),
      upcomingReturnsWindowDays: 7,
      bookingsToday: await prisma.booking.count({
        where: { deletedAt: null, startsAt: { gte: todayStart, lt: todayEnd } }
      })
    }
  };
};

export const csv = async () => {
  const assets = await prisma.asset.findMany({ where: { deletedAt: null }, include: { category: true, department: true } });
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
