import { prisma } from "../config/prisma.js";
import { notFound } from "../utils/httpError.js";

export const list = async (model, { page = 1, limit = 10, search, status } = {}, searchFields = []) => {
  const where = {
    ...(status ? { status } : {}),
    ...(search && searchFields.length
      ? { OR: searchFields.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })) }
      : {})
  };
  const [items, total] = await Promise.all([
    prisma[model].findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma[model].count({ where })
  ]);
  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const get = async (model, id, include) => {
  const item = await prisma[model].findUnique({ where: { id }, include });
  if (!item) throw notFound(model);
  return item;
};

export const create = (model, data) => prisma[model].create({ data });

export const update = async (model, id, data) => {
  await get(model, id);
  return prisma[model].update({ where: { id }, data });
};

export const remove = async (model, id) => {
  await get(model, id);
  return prisma[model].delete({ where: { id } });
};
