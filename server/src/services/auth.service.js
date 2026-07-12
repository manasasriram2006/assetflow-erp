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

const signToken = (user) =>
  jwt.sign({ role: user.role }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.jwtExpiresIn
  });

export const signup = async ({ name, email, password, departmentId }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "Email is already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, departmentId, role: "EMPLOYEE" },
    select: publicUser
  });

  return { user, token: signToken(user) };
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email }, include: { department: true } });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, token: signToken(user) };
};
