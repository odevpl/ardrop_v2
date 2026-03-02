const db = require("../config/db");

const getProducts = async ({ search, status, sellerId }) => {
  const query = db("products").select("*").orderBy("id", "desc");

  if (sellerId !== undefined) {
    query.where({ sellerId: Number(sellerId) });
  }

  if (search) {
    query.andWhere("name", "like", `%${search}%`);
  }

  if (status) {
    query.andWhere({ status });
  }

  return query;
};

const getProductById = async ({ productId }) => {
  return db("products").select("*").where({ id: productId }).first();
};

const createProduct = async ({
  sellerId,
  name,
  description,
  netPrice,
  grossPrice,
  vatRate,
  status,
}) => {
  const inserted = await db("products").insert({
    sellerId: sellerId !== undefined ? Number(sellerId) : null,
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
