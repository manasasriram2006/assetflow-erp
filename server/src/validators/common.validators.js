import { z } from "zod";

const activeStatus = z.enum(["ACTIVE", "INACTIVE"]);
const assetStatus = z.enum(["AVAILABLE", "ALLOCATED", "RESERVED", "MAINTENANCE", "LOST", "RETIRED", "DISPOSED"]);
const role = z.enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"]);

export const idParam = z.object({
  params: z.object({ id: z.string().uuid("Invalid id") })
});

const basePagination = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().max(120).optional()
};

export const paginationQuery = z.object({
  query: z.object(basePagination)
});

export const activeListQuery = z.object({
  query: z.object({
    ...basePagination,
    status: activeStatus.optional()
  })
});

export const userListQuery = z.object({
  query: z.object({
    ...basePagination,
    status: activeStatus.optional(),
    role: role.optional(),
    departmentId: z.string().uuid().optional()
  })
});

export const assetListQuery = z.object({
  query: z.object({
    ...basePagination,
    status: assetStatus.optional(),
    departmentId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional()
  })
});

export const withIdAndBody = (body) => z.object({ params: idParam.shape.params, body });
