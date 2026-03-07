const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const db = require("../config/db");

const uploadsDir = path.resolve(__dirname, "../../uploads/images");
const thumbsDir = path.resolve(__dirname, "../../uploads/images/thumbs");
const THUMB_SIZE = 400;
const MAIN_MAX_SIZE = 1000;

const getThumbFileName = (fileName) => {
  const parsed = path.parse(String(fileName || ""));
  return `${parsed.name}.webp`;
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

    // Normalize main image to max 1000x1000 while preserving aspect ratio.
    const inputBuffer = await fs.readFile(filePath);

    const normalizedMainBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(MAIN_MAX_SIZE, MAIN_MAX_SIZE, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    await fs.writeFile(filePath, normalizedMainBuffer);

    const thumbBuffer = await sharp(normalizedMainBuffer)
      .rotate()
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    await fs.writeFile(thumbPath, thumbBuffer);

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
