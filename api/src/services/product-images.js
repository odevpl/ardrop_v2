const fs = require("fs/promises");
const path = require("path");
const db = require("../config/db");

const uploadsDir = path.resolve(__dirname, "../../uploads/images");

const ensureProductExists = async (productId) => {
  const product = await db("products")
    .select("id", "sellerId")
    .where({ id: productId })
    .first();
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  return product;
};

const ensureSellerOwnsProduct = async ({ productId, userId }) => {
  const product = await ensureProductExists(productId);
  const seller = await db("sellers").select("id").where({ userId }).first();

  if (!seller || Number(seller.id) !== Number(product.sellerId)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }
};

const saveProductImage = async ({ productId, file, role, userId }) => {
  await fs.mkdir(uploadsDir, { recursive: true });

  try {
    if (role === "SELLER") {
      await ensureSellerOwnsProduct({ productId, userId });
    } else {
      await ensureProductExists(productId);
    }

    const inserted = await db("products_image").insert({
      productId: Number(productId),
      fileName: file.filename,
      alt: null,
      isMain: 0,
      position: 0,
    });

    const imageId = Array.isArray(inserted) ? inserted[0] : inserted;

    return db("products_image")
      .select(
        "id",
        "productId",
        "fileName",
        "alt",
        "isMain",
        "position",
        "createdAt",
      )
      .where({ id: imageId })
      .first();
  } catch (error) {
    const filePath = path.join(uploadsDir, file.filename);
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      if (unlinkError.code !== "ENOENT") {
        throw unlinkError;
      }
    }
    throw error;
  }
};

const getProductImages = async ({ productId }) => {
  await ensureProductExists(productId);

  return db("products_image")
    .select(
      "id",
      "productId",
      "fileName",
      "alt",
      "isMain",
      "position",
      "createdAt",
    )
    .where({ productId: Number(productId) })
    .orderBy("position", "asc")
    .orderBy("id", "asc");
};

const deleteProductImage = async ({ productId, filename, role, userId }) => {
  const item = await db("products_image")
    .select("id", "productId", "fileName")
    .where({ productId: Number(productId), fileName: filename })
    .first();

  if (!item) {
    const error = new Error("Image not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    await ensureSellerOwnsProduct({ productId, userId });
  }

  await db("products_image").where({ id: item.id }).del();

  const filePath = path.join(uploadsDir, filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const setMainProductImage = async ({ productId, imageId, role, userId }) => {
  const item = await db("products_image")
    .select("id", "productId")
    .where({ id: Number(imageId), productId: Number(productId) })
    .first();

  if (!item) {
    const error = new Error("Image not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER") {
    await ensureSellerOwnsProduct({ productId, userId });
  } else {
    await ensureProductExists(productId);
  }

  await db.transaction(async (trx) => {
    await trx("products_image")
      .where({ productId: Number(productId) })
      .update({ isMain: 0 });

    await trx("products_image")
      .where({ id: Number(imageId), productId: Number(productId) })
      .update({ isMain: 1 });
  });

  return db("products_image")
    .select(
      "id",
      "productId",
      "fileName",
      "alt",
      "isMain",
      "position",
      "createdAt",
    )
    .where({ id: Number(imageId) })
    .first();
};

module.exports = {
  saveProductImage,
  getProductImages,
  deleteProductImage,
  setMainProductImage,
};
