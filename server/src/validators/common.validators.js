import { z } from "zod";

export const idParam = z.object({
  params: z.object({ id: z.string().uuid("Invalid id") })
});

export const paginationQuery = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    status: z.string().optional(),
    role: z.string().optional(),
    departmentId: z.string().uuid().optional()
  })
});

export const withIdAndBody = (body) => z.object({ params: idParam.shape.params, body });
