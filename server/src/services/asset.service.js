import { prisma } from "../config/prisma.js";
import { HttpError, notFound } from "../utils/httpError.js";
import * as crud from "./crud.service.js";

export const listAssets = (query) => crud.list("asset", query, ["name", "assetTag", "serialNo", "location"]);

export const getAsset = (id) =>
  crud.get("asset", id, {
    category: true,
    department: true,
    allocations: {
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { issuedAt: "desc" }
    },
    bookings: { orderBy: { startsAt: "desc" } },
    maintenance: { orderBy: { createdAt: "desc" } }
  });

const generateTag = async (categoryId) => {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw notFound("Category");
  const count = await prisma.asset.count({ where: { categoryId } });
  return `${category.prefix}-${String(count + 1).padStart(5, "0")}`;
};

export const createAsset = async (data) => {
  const assetTag = await generateTag(data.categoryId);
  return prisma.asset.create({ data: { ...data, assetTag } });
};

export const updateAsset = (id, data) => crud.update("asset", id, data);
export const deleteAsset = (id) => crud.remove("asset", id);

export const assertAssetAvailable = async (assetId) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw notFound("Asset");
  if (asset.status !== "AVAILABLE") throw new HttpError(409, `Asset ${asset.assetTag} is currently ${asset.status}`);
  return asset;
};
