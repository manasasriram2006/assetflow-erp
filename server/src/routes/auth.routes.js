import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { loginSchema, signupSchema } from "../validators/auth.validators.js";
import * as controller from "../controllers/auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/signup", validate(signupSchema), asyncHandler(controller.signup));
authRoutes.post("/login", validate(loginSchema), asyncHandler(controller.login));
authRoutes.post("/logout", authenticate, asyncHandler(controller.logout));
authRoutes.get("/me", authenticate, asyncHandler(controller.me));
