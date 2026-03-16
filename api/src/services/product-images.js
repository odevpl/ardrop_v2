const fs = require("fs/promises");
const path = require("path");
const db = require("../config/db");
const { processSquareImageVariants } = require("./image-processor");

const uploadsDir = path.resolve(__dirname, "../../uploads/images");
const thumbsDir = path.resolve(__dirname, "../../uploads/images/thumbs");
const THUMB_SIZE = 400;
const MAIN_MAX_SIZE = 800;
const JPEG_QUALITY = 70;

const getThumbFileName = (fileName) => {
  const parsed = path.parse(String(fileName || ""));
  return `${parsed.name}.jpg`;
};

const safeUnlink = async (targetPath) => {
  try {
    await fs.unlink(targetPath);
  } catch (error) {
    // On Windows, file can be temporarily locked by AV/indexer.
    if (["ENOENT", "EPERM", "EACCES"].includes(error.code)) {
      return;
    }
    throw error;
  }
};

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
  await fs.mkdir(thumbsDir, { recursive: true });

  const filePath = path.join(uploadsDir, file.filename);
  const thumbFileName = getThumbFileName(file.filename);
  const thumbPath = path.join(thumbsDir, thumbFileName);

  try {
    if (role === "SELLER") {
      await ensureSellerOwnsProduct({ productId, userId });
    } else {
      await ensureProductExists(productId);
    }

    await processSquareImageVariants({
      sourcePath: filePath,
      mainOutputPath: filePath,
      thumbOutputPath: thumbPath,
      mainSize: MAIN_MAX_SIZE,
      thumbSize: THUMB_SIZE,
      quality: JPEG_QUALITY,
    });

    const existingImagesCountRow = await db("products_image")
      .count({ total: "id" })
      .where({ productId: Number(productId) })
      .first();
    const existingImagesCount = Number(existingImagesCountRow?.total || 0);
    const isFirstImage = existingImagesCount === 0;

    const inserted = await db("products_image").insert({
      productId: Number(productId),
      fileName: file.filename,
      alt: null,
      isMain: isFirstImage ? 1 : 0,
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
    await safeUnlink(filePath);
    await safeUnlink(thumbPath);
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
  const thumbPath = path.join(thumbsDir, getThumbFileName(filename));

  await safeUnlink(filePath);
  await safeUnlink(thumbPath);
};

const deleteAllProductImages = async ({ productId, trx = db }) => {
  const items = await trx("products_image")
    .select("id", "fileName")
    .where({ productId: Number(productId) });

  if (items.length === 0) {
    return;
  }

  await trx("products_image").where({ productId: Number(productId) }).del();

  await Promise.all(
    items.flatMap((item) => {
      const fileName = String(item.fileName || "");
      if (!fileName) return [];
      return [
        safeUnlink(path.join(uploadsDir, fileName)),
        safeUnlink(path.join(thumbsDir, getThumbFileName(fileName))),
      ];
    }),
  );
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
  deleteAllProductImages,
};
