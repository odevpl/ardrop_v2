const db = require("../config/db");

const ALLOWED_SORT_FIELDS = ["id", "name", "netPrice", "grossPrice", "vatRate", "status", "createdAt", "updatedAt", "sellerCompanyName"];
const SORT_FIELD_MAP = {
  id: "products.id",
  name: "products.name",
  netPrice: "products.netPrice",
  grossPrice: "products.grossPrice",
  vatRate: "products.vatRate",
  status: "products.status",
  createdAt: "products.createdAt",
  updatedAt: "products.updatedAt",
  sellerCompanyName: "sellers.companyName",
};

const getProducts = async ({
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

  if (sellerId !== undefined) {
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

const getProductById = async ({ productId }) => {
  const product = await db("products").select("*").where({ id: productId }).first();
  if (!product) {
    return null;
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

const createProduct = async ({
  userId,
  role,
  sellerId,
  name,
  description,
  netPrice,
  grossPrice,
  vatRate,
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
    name,
    description: description || null,
    netPrice,
    grossPrice,
    vatRate,
    status: status || "draft",
  });
  const productId = Array.isArray(inserted) ? inserted[0] : inserted;

  return getProductById({ productId });
};

const updateProduct = async ({ productId, payload }) => {
  const updates = { ...payload, updatedAt: db.fn.now() };
  await db("products").where({ id: productId }).update(updates);
  return getProductById({ productId });
};

const deleteProduct = async ({ productId }) => {
  await db("products").where({ id: productId }).del();
  return { id: productId };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
