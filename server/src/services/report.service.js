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

const notificationTypes = [
  "ASSET_ASSIGNED",
  "TRANSFER_APPROVED",
  "MAINTENANCE_APPROVED",
  "BOOKING_REMINDER",
  "OVERDUE_RETURN",
  "AUDIT_DISCREPANCY"
];

const notificationCategory = (type) =>
  ({
    ASSET_ASSIGNED: "ALLOCATION",
    OVERDUE_RETURN: "ALLOCATION",
    BOOKING_REMINDER: "BOOKING",
    MAINTENANCE_APPROVED: "MAINTENANCE",
    AUDIT_DISCREPANCY: "AUDIT",
    TRANSFER_APPROVED: "TRANSFER"
  })[type] || "GENERAL";

const notificationSummary = (notifications) => {
  const countsByType = Object.fromEntries(notificationTypes.map((type) => [type, 0]));
  const countsByCategory = { ALLOCATION: 0, BOOKING: 0, MAINTENANCE: 0, AUDIT: 0, TRANSFER: 0 };
  for (const notification of notifications) {
    countsByType[notification.type] = (countsByType[notification.type] || 0) + 1;
    const category = notificationCategory(notification.type);
    countsByCategory[category] = (countsByCategory[category] || 0) + 1;
  }
  return { countsByType, countsByCategory };
};

const monthKey = (date) => new Date(date).toISOString().slice(0, 7);

const lastMonths = (count = 6) => {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - index - 1), 1);
    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
      start: date,
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1)
    };
  });
};

const buildTrend = (items, months) =>
  months.map((month) => ({
    month: month.label,
    count: items.filter((item) => monthKey(item.createdAt) === month.key).length
  }));

const csvRows = (rows) =>
  rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");

export const reports = async () => {
  const months = lastMonths(6);
  const firstTrendDate = months[0].start;

  const [assetsByStatus, categories, departments, maintenance, bookings] = await Promise.all([
    prisma.asset.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true
    }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        prefix: true,
        _count: { select: { assets: { where: { deletedAt: null } } } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.department.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        assets: { where: { deletedAt: null }, select: { status: true } },
        _count: { select: { users: { where: { deletedAt: null } } } }
      },
      orderBy: { name: "asc" }
    }),
    prisma.maintenanceRequest.findMany({
      where: { deletedAt: null, createdAt: { gte: firstTrendDate } },
      select: { id: true, status: true, createdAt: true }
    }),
    prisma.booking.findMany({
      where: { deletedAt: null, createdAt: { gte: firstTrendDate } },
      select: { id: true, status: true, createdAt: true }
    })
  ]);

  const statusChart = assetsByStatus.map((row) => ({ status: row.status, count: row._count }));
  const categoryChart = categories.map((category) => ({
    category: category.name,
    prefix: category.prefix,
    count: category._count.assets
  }));
  const departmentUtilization = departments.map((department) => {
    const totalAssets = department.assets.length;
    const allocatedAssets = department.assets.filter((asset) => asset.status === "ALLOCATED").length;
    const maintenanceAssets = department.assets.filter((asset) => asset.status === "MAINTENANCE").length;
    return {
      department: department.name,
      code: department.code,
      assets: totalAssets,
      allocated: allocatedAssets,
      maintenance: maintenanceAssets,
      employees: department._count.users,
      utilization: totalAssets ? Math.round((allocatedAssets / totalAssets) * 100) : 0
    };
  });

  return {
    charts: {
      assetsByStatus: statusChart,
      assetsByCategory: categoryChart,
      departmentUtilization,
      maintenanceTrend: buildTrend(maintenance, months),
      bookingTrend: buildTrend(bookings, months)
    },
    summary: {
      totalAssets: statusChart.reduce((sum, item) => sum + item.count, 0),
      categories: categoryChart.length,
      departments: departmentUtilization.length,
      maintenanceRequests: maintenance.length,
      bookings: bookings.length
    },
    meta: { generatedAt: new Date(), trendMonths: months.length }
  };
};

export const dashboard = async (userId) => {
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
    unreadNotifications,
    notificationCounts,
    unassignedAssets,
    bookingsToday
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
      where: { userId, deletedAt: null },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, title: true, message: true, readAt: true, createdAt: true }
    }),
    prisma.notification.count({ where: { userId, deletedAt: null, readAt: null } }),
    prisma.notification.findMany({
      where: { userId, deletedAt: null },
      select: { type: true }
    }),
    prisma.asset.count({ where: { deletedAt: null, departmentId: null } }),
    prisma.booking.count({
      where: { deletedAt: null, startsAt: { gte: todayStart, lt: todayEnd } }
    })
  ]);

  const assetsAvailable = assetStatus.find((row) => row.status === "AVAILABLE")?._count || 0;
  const allocated = assetStatus.find((row) => row.status === "ALLOCATED")?._count || 0;
  const departmentSummary = [
    ...departments.map((department) => ({
      id: department.id,
      name: department.name,
      code: department.code,
      assets: department._count.assets,
      employees: department._count.users
    })),
    ...(unassignedAssets
      ? [{ id: "unassigned", name: "Unassigned", code: "-", assets: unassignedAssets, employees: 0 }]
      : [])
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
      items: notifications,
      ...notificationSummary(notificationCounts)
    },
    meta: {
      generatedAt: new Date(),
      upcomingReturnsWindowDays: 7,
      bookingsToday
    }
  };
};

export const csv = async () => {
  const assets = await prisma.asset.findMany({
    where: { deletedAt: null },
    include: { category: true, department: true }
  });
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

export const reportsCsv = async () => {
  const data = await reports();
  const sections = [
    [["Assets by Status"], ["Status", "Count"], ...data.charts.assetsByStatus.map((item) => [item.status, item.count])],
    [
      ["Assets by Category"],
      ["Category", "Prefix", "Count"],
      ...data.charts.assetsByCategory.map((item) => [item.category, item.prefix, item.count])
    ],
    [
      ["Department Utilization"],
      ["Department", "Code", "Assets", "Allocated", "Maintenance", "Employees", "Utilization %"],
      ...data.charts.departmentUtilization.map((item) => [
        item.department,
        item.code,
        item.assets,
        item.allocated,
        item.maintenance,
        item.employees,
        item.utilization
      ])
    ],
    [
      ["Maintenance Trend"],
      ["Month", "Requests"],
      ...data.charts.maintenanceTrend.map((item) => [item.month, item.count])
    ],
    [["Booking Trend"], ["Month", "Bookings"], ...data.charts.bookingTrend.map((item) => [item.month, item.count])]
  ];

  return sections.map((section) => csvRows(section)).join("\n\n");
};
