import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { HttpError, notFound } from "../utils/httpError.js";

const roleValues = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];

const statusWhere = (status) => {
  if (status === "ACTIVE") return { deletedAt: null };
  if (status === "INACTIVE") return { deletedAt: { not: null } };
  return {};
};

const statusOf = (row) => (row.deletedAt ? "INACTIVE" : "ACTIVE");

const pagination = ({ page = 1, limit = 10 } = {}) => ({
  page: Number(page),
  limit: Number(limit)
});

const paged = async (model, where, { page, limit }, args = {}) => {
  const [items, total] = await Promise.all([
    prisma[model].findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      ...args
    }),
    prisma[model].count({ where })
  ]);
  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
};

const ensureDepartment = async (id, { allowInactive = false } = {}) => {
  if (!id) return null;
  const department = await prisma.department.findFirst({
    where: { id, ...(allowInactive ? {} : { deletedAt: null }) }
  });
  if (!department) throw notFound("department");
  return department;
};

const ensureNoDepartmentCycle = async (departmentId, parentDepartmentId) => {
  if (!parentDepartmentId) return;
  if (departmentId === parentDepartmentId) throw new HttpError(400, "Parent department cannot be itself");

  let cursor = await prisma.department.findUnique({
    where: { id: parentDepartmentId },
    select: { id: true, parentDepartmentId: true }
  });

  while (cursor) {
    if (cursor.parentDepartmentId === departmentId) {
      throw new HttpError(400, "Parent department cannot be a child department");
    }
    cursor = cursor.parentDepartmentId
      ? await prisma.department.findUnique({
          where: { id: cursor.parentDepartmentId },
          select: { id: true, parentDepartmentId: true }
        })
      : null;
  }
};

const normalizeDepartmentData = (data, departmentId) => {
  const { status, ...rest } = data;
  const normalized = { ...rest };

  if (rest.description !== undefined) normalized.description = rest.description || null;
  if (rest.parentDepartmentId !== undefined) normalized.parentDepartmentId = rest.parentDepartmentId || null;

  if (departmentId && rest.parentDepartmentId !== undefined) {
    normalized.parentDepartmentId = rest.parentDepartmentId || null;
  }
  if (status) normalized.deletedAt = status === "INACTIVE" ? new Date() : null;
  return normalized;
};

const withDepartmentView = (department) => ({
  ...department,
  status: statusOf(department),
  head: department.users?.find((user) => user.role === "DEPARTMENT_HEAD") || null,
  employeesCount: department._count?.users ?? 0,
  assetsCount: department._count?.assets ?? 0
});

const departmentInclude = {
  parentDepartment: { select: { id: true, name: true, code: true } },
  users: {
    where: { role: "DEPARTMENT_HEAD", deletedAt: null },
    select: { id: true, name: true, email: true, role: true }
  },
  _count: {
    select: {
      users: { where: { deletedAt: null } },
      assets: { where: { deletedAt: null } },
      childDepartments: true
    }
  }
};

export const listDepartments = async (query = {}) => {
  const { page, limit } = pagination(query);
  const where = {
    ...statusWhere(query.status),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const result = await paged("department", where, { page, limit }, { include: departmentInclude });
  return { ...result, items: result.items.map(withDepartmentView) };
};

export const getDepartment = async (id) => {
  const department = await prisma.department.findUnique({ where: { id }, include: departmentInclude });
  if (!department) throw notFound("department");
  return withDepartmentView(department);
};

export const createDepartment = async (data) => {
  if (data.parentDepartmentId) await ensureDepartment(data.parentDepartmentId);
  const department = await prisma.department.create({
    data: normalizeDepartmentData(data),
    include: departmentInclude
  });
  return withDepartmentView(department);
};

export const updateDepartment = async (id, data) => {
  await ensureDepartment(id, { allowInactive: true });
  if (data.parentDepartmentId) await ensureDepartment(data.parentDepartmentId, { allowInactive: true });
  await ensureNoDepartmentCycle(id, data.parentDepartmentId);

  const department = await prisma.department.update({
    where: { id },
    data: normalizeDepartmentData(data, id),
    include: departmentInclude
  });
  return withDepartmentView(department);
};

export const setDepartmentStatus = async (id, status) =>
  updateDepartment(id, { status, parentDepartmentId: undefined, description: undefined });

export const assignDepartmentHead = async (departmentId, userId) => {
  await ensureDepartment(departmentId);
  const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
  if (!user) throw notFound("user");

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { departmentId, role: "DEPARTMENT_HEAD", id: { not: userId } },
      data: { role: "EMPLOYEE" }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { departmentId, role: "DEPARTMENT_HEAD", deletedAt: null }
    })
  ]);

  return getDepartment(departmentId);
};

const normalizeCategoryData = (data) => {
  const { status, ...rest } = data;
  const normalized = { ...rest };
  if (rest.description !== undefined) normalized.description = rest.description || null;
  if (status) normalized.deletedAt = status === "INACTIVE" ? new Date() : null;
  return normalized;
};

const withCategoryView = (category) => ({
  ...category,
  status: statusOf(category),
  assetsCount: category._count?.assets ?? 0
});

export const listCategories = async (query = {}) => {
  const { page, limit } = pagination(query);
  const where = {
    ...statusWhere(query.status),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { prefix: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const result = await paged("category", where, { page, limit }, {
    include: { _count: { select: { assets: { where: { deletedAt: null } } } } }
  });
  return { ...result, items: result.items.map(withCategoryView) };
};

export const getCategory = async (id) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { assets: { where: { deletedAt: null } } } } }
  });
  if (!category) throw notFound("category");
  return withCategoryView(category);
};

export const createCategory = async (data) => withCategoryView(await prisma.category.create({ data: normalizeCategoryData(data) }));

export const updateCategory = async (id, data) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw notFound("category");
  return withCategoryView(await prisma.category.update({ where: { id }, data: normalizeCategoryData(data) }));
};

export const setCategoryStatus = async (id, status) => updateCategory(id, { status });

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  departmentId: true,
  department: { select: { id: true, name: true, code: true } },
  createdAt: true,
  updatedAt: true,
  deletedAt: true
};

const withEmployeeView = (user) => ({ ...user, status: statusOf(user) });

const normalizeUserData = async (data) => {
  const { password, status, departmentId, ...rest } = data;
  if (departmentId) await ensureDepartment(departmentId);
  if (rest.role && !roleValues.includes(rest.role)) throw new HttpError(400, "Invalid role");

  return {
    ...rest,
    departmentId: departmentId === undefined ? undefined : departmentId || null,
    ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    ...(status ? { deletedAt: status === "INACTIVE" ? new Date() : null } : {})
  };
};

export const listEmployees = async (query = {}) => {
  const { page, limit } = pagination(query);
  const where = {
    ...statusWhere(query.status),
    ...(query.role ? { role: query.role } : {}),
    ...(query.departmentId ? { departmentId: query.departmentId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const result = await paged("user", where, { page, limit }, { select: userSelect });
  return { ...result, items: result.items.map(withEmployeeView) };
};

export const getEmployee = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw notFound("user");
  return withEmployeeView(user);
};

export const createEmployee = async (data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new HttpError(409, "Email is already registered");

  const user = await prisma.user.create({
    data: await normalizeUserData(data),
    select: userSelect
  });
  return withEmployeeView(user);
};

export const updateEmployee = async (id, data) => {
  await getEmployee(id);
  const user = await prisma.user.update({
    where: { id },
    data: await normalizeUserData(data),
    select: userSelect
  });
  return withEmployeeView(user);
};

export const setEmployeeStatus = async (id, status) => updateEmployee(id, { status });
