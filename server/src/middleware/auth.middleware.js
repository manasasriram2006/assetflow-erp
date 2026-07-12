import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.type !== "access" || !payload.sub) throw new Error("Invalid token payload");
    return payload;
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
};

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) throw new HttpError(401, "Authentication token is required");

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true, name: true, email: true, role: true, departmentId: true, department: true }
    });
    if (!user) throw new HttpError(401, "Invalid authentication token");

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new HttpError(401, "Authentication required"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Insufficient permissions"));
    next();
  };
