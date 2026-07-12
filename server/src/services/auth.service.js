import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  department: true,
  createdAt: true
};

const signAccessToken = (user) =>
  jwt.sign({ role: user.role, type: "access" }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn
  });

const signRefreshToken = (user) =>
  jwt.sign({ type: "refresh" }, env.jwtRefreshSecret, {
    subject: user.id,
    expiresIn: env.jwtRefreshExpiresIn
  });

const buildSession = (user) => ({
  user,
  token: signAccessToken(user),
  refreshToken: signRefreshToken(user)
});

export const signup = async ({ name, email, password, departmentId }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "Email is already registered");

  if (departmentId) {
    const department = await prisma.department.findFirst({ where: { id: departmentId, deletedAt: null } });
    if (!department) throw new HttpError(400, "Selected department does not exist");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, departmentId, role: "EMPLOYEE" },
    select: publicUser
  });

  return buildSession(user);
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null }, include: { department: true } });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return buildSession(safeUser);
};

export const refresh = async ({ refreshToken }) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  if (payload.type !== "refresh") throw new HttpError(401, "Invalid refresh token");

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, deletedAt: null },
    select: publicUser
  });
  if (!user) throw new HttpError(401, "Invalid refresh token");

  return buildSession(user);
};

export const updateProfile = async (userId, { name, departmentId }) => {
  if (departmentId) {
    const department = await prisma.department.findFirst({ where: { id: departmentId, deletedAt: null } });
    if (!department) throw new HttpError(400, "Selected department does not exist");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, departmentId: departmentId === undefined ? undefined : departmentId },
    select: publicUser
  });

  return { user };
};

export const forgotPassword = async ({ email }) => {
  await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return {
    message: "If an account exists for that email, password reset instructions will be sent."
  };
};
