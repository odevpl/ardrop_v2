const db = require("../config/db");

const PRODUCT_UNITS = ["pcs", "g", "l"];

const ALLOWED_SORT_FIELDS = ["id", "name", "netPrice", "grossPrice", "vatRate", "unit", "stockQuantity", "status", "createdAt", "updatedAt", "sellerCompanyName"];
const SORT_FIELD_MAP = {
  id: "products.id",
  name: "products.name",
  netPrice: "products.netPrice",
  grossPrice: "products.grossPrice",
  vatRate: "products.vatRate",
  unit: "products.unit",
  stockQuantity: "products.stockQuantity",
  status: "products.status",
  createdAt: "products.createdAt",
  updatedAt: "products.updatedAt",
  sellerCompanyName: "sellers.companyName",
};

const normalizeUnit = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!PRODUCT_UNITS.includes(normalized)) {
    const error = new Error(`Invalid unit. Allowed: ${PRODUCT_UNITS.join(", ")}`);
    error.status = 400;
    throw error;
  }

  return normalized;
};

const normalizeStockQuantity = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    const error = new Error("stockQuantity must be a number >= 0");
    error.status = 400;
    throw error;
  }

  return Number(numeric.toFixed(3));
};

const resolveSellerIdByUserId = async (userId) => {
  const seller = await db("sellers").select("id").where({ userId: Number(userId) }).first();
  if (!seller) {
    const error = new Error("Seller profile not found");
    error.status = 404;
    throw error;
  }
  return Number(seller.id);
};

const getProducts = async ({
  userId,
  role,
  search,
  status,
  sellerId,
  page = 1,
  limit = 20,
  sortBy = "id",
  sortOrder = "desc",
}) => {
  const normalizedPage = Number(page) > 0 ? Number(page) : 1;
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 20;
  const normalizedSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "id";
  const normalizedSortOrder = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

  const baseQuery = db("products")
    .leftJoin("sellers", "products.sellerId", "sellers.id");

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    baseQuery.where("products.sellerId", currentSellerId);
  } else if (sellerId !== undefined) {
    baseQuery.where({ sellerId: Number(sellerId) });
  }

  if (search) {
    baseQuery.andWhere("name", "like", `%${search}%`);
  }

  if (status) {
    baseQuery.andWhere({ status });
  }

  const countRow = await baseQuery.clone().count({ total: "products.id" }).first();
  const total = Number(countRow?.total || 0);
  const offset = (normalizedPage - 1) * normalizedLimit;
  const sortColumn = SORT_FIELD_MAP[normalizedSortBy] || "products.id";

  const products = await baseQuery
    .clone()
    .select("products.*", "sellers.companyName as sellerCompanyName")
    .orderBy(sortColumn, normalizedSortOrder)
    .limit(normalizedLimit)
    .offset(offset);

  if (products.length === 0) {
    return {
      data: [],
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / normalizedLimit),
        hasNext: normalizedPage * normalizedLimit < total,
        hasPrev: normalizedPage > 1,
      },
      sort: {
        by: normalizedSortBy,
        order: normalizedSortOrder,
      },
    };
  }

  const productIds = products.map((product) => Number(product.id));
  const images = await db("products_image")
    .select("id", "productId", "fileName", "alt", "isMain", "position", "createdAt")
    .whereIn("productId", productIds)
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  const imagesByProductId = images.reduce((acc, image) => {
    const key = Number(image.productId);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(image);
    return acc;
  }, {});

  const data = products.map((product) => ({
    ...product,
    images: imagesByProductId[Number(product.id)] || [],
  }));

  return {
    data,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / normalizedLimit),
      hasNext: normalizedPage * normalizedLimit < total,
      hasPrev: normalizedPage > 1,
    },
    sort: {
      by: normalizedSortBy,
      order: normalizedSortOrder,
    },
  };
};

const getProductById = async ({ userId, role, productId }) => {
  const product = await db("products").select("*").where({ id: productId }).first();
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    if (Number(product.sellerId) !== currentSellerId) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
  }

  const images = await db("products_image")
    .select("id", "productId", "fileName", "alt", "isMain", "position", "createdAt")
    .where({ productId: Number(productId) })
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  return {
    ...product,
    images,
  };
};

const getSuggestedProducts = async ({ limit = 10 }) => {
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 20) : 10;

  const products = await db("products")
    .select("products.*", "sellers.companyName as sellerCompanyName")
    .leftJoin("sellers", "products.sellerId", "sellers.id")
    .orderBy("products.id", "asc")
    .limit(normalizedLimit);

  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => Number(product.id));
  const images = await db("products_image")
    .select("id", "productId", "fileName", "alt", "isMain", "position", "createdAt")
    .whereIn("productId", productIds)
    .orderBy("position", "asc")
    .orderBy("id", "asc");

  const imagesByProductId = images.reduce((acc, image) => {
    const key = Number(image.productId);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(image);
    return acc;
  }, {});

  return products.map((product) => ({
    ...product,
    images: imagesByProductId[Number(product.id)] || [],
  }));
};

const createProduct = async ({
  userId,
  role,
  sellerId,
  name,
  description,
  netPrice,
  grossPrice,
  vatRate,
  unit = "pcs",
  stockQuantity = 0,
  status,
}) => {
  let targetSellerId = sellerId !== undefined ? Number(sellerId) : null;

  if (role === "SELLER") {
    const seller = await db("sellers").select("id").where({ userId }).first();
    if (!seller) {
      const error = new Error("Seller profile not found");
      error.status = 404;
      throw error;
    }
    targetSellerId = seller.id;
  }

  if (!targetSellerId) {
    const error = new Error("sellerId is required");
    error.status = 400;
    throw error;
  }

  const inserted = await db("products").insert({
    sellerId: targetSellerId,
    name: String(name || "").trim(),
    description: description || null,
    netPrice,
    grossPrice,
    vatRate,
    unit: normalizeUnit(unit),
    stockQuantity: normalizeStockQuantity(stockQuantity),
    status: status || "draft",
  });
  const productId = Array.isArray(inserted) ? inserted[0] : inserted;

  return getProductById({ productId });
};

const updateProduct = async ({ userId, role, productId, payload }) => {
  const existing = await db("products").select("id", "sellerId").where({ id: productId }).first();
  if (!existing) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    if (Number(existing.sellerId) !== currentSellerId) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
  }

  const updates = { updatedAt: db.fn.now() };

  if (payload.name !== undefined) {
    const normalizedName = String(payload.name || "").trim();
    if (!normalizedName) {
      const error = new Error("name is required");
      error.status = 400;
      throw error;
    }
    updates.name = normalizedName;
  }

  if (payload.description !== undefined) {
    updates.description = payload.description ? String(payload.description).trim() : null;
  }

  if (payload.netPrice !== undefined) {
    updates.netPrice = Number(payload.netPrice);
  }

  if (payload.grossPrice !== undefined) {
    updates.grossPrice = Number(payload.grossPrice);
  }

  if (payload.vatRate !== undefined) {
    updates.vatRate = Number(payload.vatRate);
  }

  if (payload.status !== undefined) {
    updates.status = payload.status;
  }

  if (payload.sellerId !== undefined && role === "ADMIN") {
    const normalizedSellerId = Number(payload.sellerId);
    if (!normalizedSellerId) {
      const error = new Error("sellerId must be a valid number");
      error.status = 400;
      throw error;
    }
    updates.sellerId = normalizedSellerId;
  }

  if (payload.unit !== undefined) {
    updates.unit = normalizeUnit(payload.unit);
  }

  if (payload.stockQuantity !== undefined) {
    updates.stockQuantity = normalizeStockQuantity(payload.stockQuantity);
  }

  await db("products").where({ id: productId }).update(updates);
  return getProductById({ userId, role, productId });
};

const deleteProduct = async ({ userId, role, productId }) => {
  const existing = await db("products").select("id", "sellerId").where({ id: productId }).first();
  if (!existing) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    const currentSellerId = await resolveSellerIdByUserId(userId);
    if (Number(existing.sellerId) !== currentSellerId) {
      const error = new Error("Forbidden");
      error.status = 403;
      throw error;
    }
  }

  try {
    await db("products").where({ id: productId }).del();
  } catch (dbError) {
    if (dbError && (dbError.code === "ER_ROW_IS_REFERENCED_2" || dbError.code === "ER_ROW_IS_REFERENCED")) {
      const error = new Error("Nie mozna usunac produktu, bo jest powiazany z zamowieniem lub koszykiem");
      error.status = 409;
      throw error;
    }
    throw dbError;
  }

  return { id: productId };
};

module.exports = {
  getProducts,
  getSuggestedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  PRODUCT_UNITS,
};
