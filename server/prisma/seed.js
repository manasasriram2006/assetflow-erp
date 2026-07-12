import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ids = {
  allocation: "00000000-0000-4000-8000-000000000001",
  transfer: "00000000-0000-4000-8000-000000000002",
  booking: "00000000-0000-4000-8000-000000000003",
  maintenance: "00000000-0000-4000-8000-000000000004",
  auditCycle: "00000000-0000-4000-8000-000000000005",
  notificationAssigned: "00000000-0000-4000-8000-000000000006",
  notificationMaintenance: "00000000-0000-4000-8000-000000000007"
};

const addDays = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const main = async () => {
  const passwordHash = await bcrypt.hash("Password@123", 12);

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: "IT" },
      update: {},
      create: { name: "Information Technology", code: "IT", description: "Core systems and support" }
    }),
    prisma.department.upsert({
      where: { code: "OPS" },
      update: {},
      create: { name: "Operations", code: "OPS", description: "Facilities and operations" }
    }),
    prisma.department.upsert({
      where: { code: "FIN" },
      update: {},
      create: { name: "Finance", code: "FIN", description: "Finance and procurement" }
    })
  ]);

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { prefix: "LPT" },
      update: {},
      create: { name: "Laptop", prefix: "LPT", description: "Employee computing devices" }
    }),
    prisma.category.upsert({
      where: { prefix: "PRJ" },
      update: {},
      create: { name: "Projector", prefix: "PRJ", description: "Shared meeting room equipment" }
    }),
    prisma.category.upsert({
      where: { prefix: "FUR" },
      update: {},
      create: { name: "Furniture", prefix: "FUR", description: "Office furniture" }
    }),
    prisma.category.upsert({
      where: { prefix: "NET" },
      update: {},
      create: { name: "Network Device", prefix: "NET", description: "Routers, switches, and access points" }
    })
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@assetflow.local" },
    update: {},
    create: {
      name: "AssetFlow Admin",
      email: "admin@assetflow.local",
      passwordHash,
      role: "ADMIN",
      departmentId: departments[0].id
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@assetflow.local" },
    update: {},
    create: {
      name: "Priya Asset Manager",
      email: "manager@assetflow.local",
      passwordHash,
      role: "ASSET_MANAGER",
      departmentId: departments[0].id
    }
  });

  const departmentHead = await prisma.user.upsert({
    where: { email: "head@assetflow.local" },
    update: {},
    create: {
      name: "Asha Department Head",
      email: "head@assetflow.local",
      passwordHash,
      role: "DEPARTMENT_HEAD",
      departmentId: departments[1].id
    }
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@assetflow.local" },
    update: {},
    create: {
      name: "Rahul Employee",
      email: "employee@assetflow.local",
      passwordHash,
      role: "EMPLOYEE",
      departmentId: departments[1].id
    }
  });

  const laptop = await prisma.asset.upsert({
    where: { assetTag: "LPT-00001" },
    update: {},
    create: {
      assetTag: "LPT-00001",
      name: "Dell Latitude 7440",
      serialNo: "DL-7440-001",
      status: "ALLOCATED",
      value: 115000,
      purchaseDate: addDays(-120),
      location: "Bengaluru HQ",
      categoryId: categories[0].id,
      departmentId: departments[0].id
    }
  });

  const projector = await prisma.asset.upsert({
    where: { assetTag: "PRJ-00001" },
    update: {},
    create: {
      assetTag: "PRJ-00001",
      name: "Epson Conference Projector",
      serialNo: "EP-PRJ-001",
      status: "RESERVED",
      value: 68000,
      purchaseDate: addDays(-90),
      location: "Conference Room A",
      categoryId: categories[1].id,
      departmentId: departments[1].id
    }
  });

  const router = await prisma.asset.upsert({
    where: { assetTag: "NET-00001" },
    update: {},
    create: {
      assetTag: "NET-00001",
      name: "Cisco Meraki MX75",
      serialNo: "NET-MX75-001",
      status: "MAINTENANCE",
      value: 185000,
      purchaseDate: addDays(-240),
      location: "Network Rack 2",
      categoryId: categories[3].id,
      departmentId: departments[0].id
    }
  });

  await prisma.allocation.upsert({
    where: { id: ids.allocation },
    update: {},
    create: {
      id: ids.allocation,
      assetId: laptop.id,
      userId: employee.id,
      dueAt: addDays(14),
      notes: "Issued for operations work"
    }
  });

  await prisma.transfer.upsert({
    where: { id: ids.transfer },
    update: {},
    create: {
      id: ids.transfer,
      assetId: laptop.id,
      requesterId: employee.id,
      receiverId: departmentHead.id,
      status: "PENDING",
      reason: "Temporary handover during team onboarding"
    }
  });

  await prisma.booking.upsert({
    where: { id: ids.booking },
    update: {},
    create: {
      id: ids.booking,
      assetId: projector.id,
      userId: departmentHead.id,
      startsAt: addDays(2),
      endsAt: addDays(2.125),
      purpose: "Quarterly operations review"
    }
  });

  await prisma.maintenanceRequest.upsert({
    where: { id: ids.maintenance },
    update: {},
    create: {
      id: ids.maintenance,
      assetId: router.id,
      requesterId: manager.id,
      technicianId: admin.id,
      title: "Intermittent packet loss",
      description: "Network monitoring reports intermittent packet loss during peak office hours.",
      status: "TECHNICIAN_ASSIGNED",
      scheduledAt: addDays(1)
    }
  });

  await prisma.auditCycle.upsert({
    where: { id: ids.auditCycle },
    update: {},
    create: {
      id: ids.auditCycle,
      name: "Q3 Physical Asset Verification",
      startsAt: addDays(7),
      endsAt: addDays(21),
      status: "DRAFT",
      items: {
        create: [
          { assetId: laptop.id, auditorId: manager.id, status: "UNCHECKED" },
          { assetId: projector.id, auditorId: manager.id, status: "UNCHECKED" },
          { assetId: router.id, auditorId: admin.id, status: "DAMAGED", notes: "Marked for maintenance validation" }
        ]
      }
    }
  });

  await prisma.notification.upsert({
    where: { id: ids.notificationAssigned },
    update: {},
    create: {
      id: ids.notificationAssigned,
      userId: employee.id,
      type: "ASSET_ASSIGNED",
      title: "Laptop allocated",
      message: "Dell Latitude 7440 has been assigned to you."
    }
  });

  await prisma.notification.upsert({
    where: { id: ids.notificationMaintenance },
    update: {},
    create: {
      id: ids.notificationMaintenance,
      userId: manager.id,
      type: "MAINTENANCE_APPROVED",
      title: "Maintenance scheduled",
      message: "Cisco Meraki MX75 maintenance has been scheduled."
    }
  });

  console.log("Seed complete");
  console.log(
    "Demo logins: admin@assetflow.local / manager@assetflow.local / head@assetflow.local / employee@assetflow.local"
  );
  console.log("Password: Password@123");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
