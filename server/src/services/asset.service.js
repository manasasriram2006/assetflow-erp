import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { HttpError, notFound } from "../utils/httpError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetUploadDir = path.resolve(__dirname, "../uploads/assets");
const publicAssetUploadPath = "/uploads/assets";
const searchableFields = ["name", "assetTag", "serialNo", "location"];
const assetSelectFields = ["name", "serialNo", "status", "value", "purchaseDate", "location", "categoryId", "departmentId"];

const cleanAssetData = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value === "") return [key, null];
      return [key, value];
    })
  );

const assetIncludes = {
  category: true,
  department: true,
  history: {
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  }
};

const historyActor = (actorId) => (actorId ? { actorId } : {});

const createHistory = (tx, assetId, actorId, action, details = {}) =>
  tx.assetHistory.create({
    data: {
      assetId,
      ...historyActor(actorId),
      action,
      fromStatus: details.fromStatus,
      toStatus: details.toStatus,
      notes: details.notes,
      changes: details.changes
    }
  });

const buildChanges = (before, after, fields = assetSelectFields) => {
  const changes = {};
  for (const field of fields) {
    const oldValue = before[field] instanceof Date ? before[field].toISOString() : before[field];
    const newValue = after[field] instanceof Date ? after[field].toISOString() : after[field];
    if (String(oldValue ?? "") !== String(newValue ?? "")) changes[field] = { from: oldValue, to: newValue };
  }
  return Object.keys(changes).length ? changes : undefined;
};

export const listAssets = async ({ page = 1, limit = 10, search, status, categoryId, departmentId } = {}) => {
  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(search
      ? { OR: searchableFields.map((field) => ({ [field]: { contains: search, mode: "insensitive" } })) }
      : {})
  };

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { category: true, department: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" }
    }),
    prisma.asset.count({ where })
  ]);

  return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) || 1 } };
};

export const getAsset = async (id) => {
  const asset = await prisma.asset.findFirst({ where: { id, deletedAt: null }, include: assetIncludes });
  if (!asset) throw notFound("Asset");
  return asset;
};

export const getAssetHistory = async (id) => {
  await getAsset(id);
  return prisma.assetHistory.findMany({
    where: { assetId: id },
    include: { actor: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
};

const generateTag = async (tx, categoryId) => {
  const category = await tx.category.findFirst({ where: { id: categoryId, deletedAt: null } });
  if (!category) throw notFound("Category");
  const count = await tx.asset.count({ where: { categoryId } });
  return `${category.prefix}-${String(count + 1).padStart(5, "0")}`;
};

export const createAsset = async (data, actorId) =>
  prisma.$transaction(async (tx) => {
    const payload = cleanAssetData(data);
    const assetTag = await generateTag(tx, payload.categoryId);
    const asset = await tx.asset.create({ data: { ...payload, assetTag } });
    await createHistory(tx, asset.id, actorId, "CREATED", {
      toStatus: asset.status,
      notes: `Asset ${asset.assetTag} registered`,
      changes: { assetTag: { from: null, to: asset.assetTag } }
    });
    return tx.asset.findUnique({ where: { id: asset.id }, include: assetIncludes });
  });

export const updateAsset = async (id, data, actorId) =>
  prisma.$transaction(async (tx) => {
    const before = await tx.asset.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw notFound("Asset");

    const asset = await tx.asset.update({ where: { id }, data: cleanAssetData(data) });
    await createHistory(tx, asset.id, actorId, before.status !== asset.status ? "STATUS_CHANGED" : "UPDATED", {
      fromStatus: before.status,
      toStatus: asset.status,
      notes: before.status !== asset.status ? `Status changed to ${asset.status}` : "Asset details updated",
      changes: buildChanges(before, asset)
    });

    return tx.asset.findUnique({ where: { id: asset.id }, include: assetIncludes });
  });

export const deleteAsset = async (id, actorId) =>
  prisma.$transaction(async (tx) => {
    const asset = await tx.asset.findFirst({ where: { id, deletedAt: null } });
    if (!asset) throw notFound("Asset");
    await createHistory(tx, asset.id, actorId, "DELETED", {
      fromStatus: asset.status,
      toStatus: asset.status,
      notes: "Asset removed from active register"
    });
    return tx.asset.update({ where: { id }, data: { deletedAt: new Date() } });
  });

export const uploadAssetPhoto = async (id, { photoData, fileName }, actorId) => {
  const asset = await getAsset(id);
  const match = photoData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
  if (!match) throw new HttpError(400, "Photo must be a PNG, JPG, or WEBP image");

  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length || buffer.length > 5 * 1024 * 1024) throw new HttpError(400, "Photo must be smaller than 5MB");

  await mkdir(assetUploadDir, { recursive: true });
  const safeName = `${asset.assetTag}-${randomUUID()}.${extension}`;
  await writeFile(path.join(assetUploadDir, safeName), buffer);
  const photoUrl = `${publicAssetUploadPath}/${safeName}`;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.asset.update({ where: { id }, data: { photoUrl } });
    await createHistory(tx, id, actorId, "PHOTO_UPLOADED", {
      fromStatus: asset.status,
      toStatus: asset.status,
      notes: `Photo uploaded: ${fileName}`,
      changes: { photoUrl: { from: asset.photoUrl, to: photoUrl } }
    });
    return updated;
  });
};

export const setAssetStatus = async (tx, assetId, status, actorId, action, notes) => {
  const before = await tx.asset.findFirst({ where: { id: assetId, deletedAt: null } });
  if (!before) throw notFound("Asset");
  const asset = await tx.asset.update({ where: { id: assetId }, data: { status } });
  await createHistory(tx, assetId, actorId, action, {
    fromStatus: before.status,
    toStatus: asset.status,
    notes,
    changes: buildChanges(before, asset, ["status"])
  });
  return asset;
};

export const assertAssetAvailable = async (assetId) => {
  const asset = await prisma.asset.findFirst({ where: { id: assetId, deletedAt: null } });
  if (!asset) throw notFound("Asset");
  if (asset.status !== "AVAILABLE") throw new HttpError(409, `Asset ${asset.assetTag} is currently ${asset.status}`);
  return asset;
};
