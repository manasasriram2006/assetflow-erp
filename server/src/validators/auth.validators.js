import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    departmentId: z.string().uuid().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1)
  })
});
