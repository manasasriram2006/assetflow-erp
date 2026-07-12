import { z } from "zod";

export const departmentBody = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(12).toUpperCase(),
  description: z.string().trim().optional().nullable(),
  parentDepartmentId: z.string().uuid().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const categoryBody = z.object({
  name: z.string().trim().min(2).max(120),
  prefix: z.string().trim().min(2).max(8).toUpperCase(),
  description: z.string().trim().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const assetBody = z.object({
  name: z.string().trim().min(2).max(160),
  serialNo: z.string().trim().max(120).optional().nullable(),
  status: z.enum(["AVAILABLE", "ALLOCATED", "RESERVED", "MAINTENANCE", "LOST", "RETIRED", "DISPOSED"]).optional(),
  value: z.coerce.number().nonnegative().optional(),
  purchaseDate: z.coerce.date().optional(),
  location: z.string().trim().max(160).optional().nullable(),
  categoryId: z.string().uuid(),
  departmentId: z.string().uuid().optional().nullable()
});

export const assetPhotoBody = z.object({
  fileName: z.string().trim().min(1).max(180),
  photoData: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/i, "Photo must be a PNG, JPG, or WEBP data URL")
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

export const assignHeadBody = z.object({
  userId: z.string().uuid("Invalid employee")
});

export const employeeCreateBody = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  role: z.enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"]).default("EMPLOYEE"),
  departmentId: z.string().uuid().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const employeeUpdateBody = employeeCreateBody
  .omit({ password: true })
  .extend({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .optional()
  })
  .partial();
