import { prisma } from "../config/prisma.js";

export const listUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  });
  res.json(users);
};

export const promoteUser = async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role: req.validated.body.role },
    select: { id: true, name: true, email: true, role: true }
  });
  res.json(user);
};
