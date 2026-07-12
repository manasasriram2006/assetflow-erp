import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new HttpError(401, "Authentication token is required");

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, departmentId: true }
    });
    if (!user) throw new HttpError(401, "Invalid authentication token");

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new HttpError(401, "Invalid or expired token"));
  }
};

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Insufficient permissions"));
    next();
  };
