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
    notes: z.string().trim().max(500).optional()
  })
  .refine((data) => !data.dueAt || data.dueAt > new Date(), {
    message: "Return date must be in the future",
    path: ["dueAt"]
  });

export const transferBody = z.object({
  assetId: z.string().uuid(),
  receiverId: z.string().uuid("Receiver is required"),
  reason: z.string().trim().min(5).max(500)
});

export const transferDecisionBody = z.object({
  notes: z.string().trim().max(500).optional()
});

export const bookingBody = z
  .object({
    assetId: z.string().uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    purpose: z.string().trim().min(3).max(500)
  })
  .refine((data) => data.startsAt > new Date(), {
    message: "Booking start must be in the future",
    path: ["startsAt"]
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "Booking end must be after start",
    path: ["endsAt"]
  });

export const bookingQuery = z.object({
  query: z.object({
    status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
  })
});

export const maintenanceBody = z.object({
  assetId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(5).max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  scheduledAt: z.coerce.date().optional()
});

export const maintenanceStatusBody = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "RESOLVED"]),
  notes: z.string().trim().max(500).optional(),
  scheduledAt: z.coerce.date().optional(),
  technicianId: z.string().uuid().optional().nullable()
});

export const maintenanceAssignBody = z.object({
  technicianId: z.string().uuid("Technician is required"),
  scheduledAt: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional()
});

export const maintenanceAttachmentBody = z.object({
  fileName: z.string().trim().min(1).max(180),
  attachmentData: z
    .string()
    .regex(/^data:[\w/+.-]+\/[\w.+-]+;base64,/i, "Attachment must be a data URL")
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
