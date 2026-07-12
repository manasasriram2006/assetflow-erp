import { z } from "zod";

export const departmentBody = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(12).toUpperCase(),
  description: z.string().optional()
});

export const categoryBody = z.object({
  name: z.string().min(2),
  prefix: z.string().min(2).max(8).toUpperCase(),
  description: z.string().optional()
});

export const assetBody = z.object({
  name: z.string().min(2),
  serialNo: z.string().optional(),
  status: z.enum(["AVAILABLE", "ALLOCATED", "RESERVED", "MAINTENANCE", "LOST", "RETIRED", "DISPOSED"]).optional(),
  value: z.coerce.number().nonnegative().optional(),
  purchaseDate: z.coerce.date().optional(),
  location: z.string().optional(),
  categoryId: z.string().uuid(),
  departmentId: z.string().uuid().optional()
});

export const allocationBody = z
  .object({
    assetId: z.string().uuid(),
    userId: z.string().uuid(),
    dueAt: z.coerce.date().optional(),
    notes: z.string().optional()
  })
  .refine((data) => !data.dueAt || data.dueAt > new Date(), {
    message: "Return date must be in the future",
    path: ["dueAt"]
  });

export const transferBody = z.object({
  assetId: z.string().uuid(),
  receiverId: z.string().uuid().optional(),
  reason: z.string().min(5)
});

export const bookingBody = z
  .object({
    assetId: z.string().uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    purpose: z.string().min(3)
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "Booking end must be after start",
    path: ["endsAt"]
  });

export const maintenanceBody = z.object({
  assetId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(5),
  scheduledAt: z.coerce.date().optional()
});

export const auditBody = z.object({
  name: z.string().min(3),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  assetIds: z.array(z.string().uuid()).default([])
});

export const promoteBody = z.object({
  role: z.enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"])
});
