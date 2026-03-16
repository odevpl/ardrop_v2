const fs = require("fs/promises");
const path = require("path");
const db = require("../config/db");
const { processSquareImageVariants } = require("./image-processor");

const uploadsDir = path.resolve(__dirname, "../../uploads/categories");
const thumbsDir = path.resolve(__dirname, "../../uploads/categories/thumbs");
const THUMB_SIZE = 400;
const MAIN_SIZE = 800;
const JPEG_QUALITY = 75;

const getThumbFileName = (fileName) => {
  const parsed = path.parse(String(fileName || ""));
  return `${parsed.name}.jpg`;
};

const safeUnlink = async (targetPath) => {
  try {
    await fs.unlink(targetPath);
  } catch (error) {
    if (["ENOENT", "EPERM", "EACCES"].includes(error.code)) {
      return;
    }
    throw error;
  }
};

const ensureCategoryExists = async (categoryId) => {
  const category = await db("categories").select("id").where({ id: Number(categoryId) }).first();
  if (!category) {
    const error = new Error("Category not found");
    error.status = 404;
    throw error;
  }
  return category;
};

const saveCategoryImage = async ({ categoryId, file }) => {
  await ensureCategoryExists(categoryId);
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.mkdir(thumbsDir, { recursive: true });

  const filePath = path.join(uploadsDir, file.filename);
  const thumbFileName = getThumbFileName(file.filename);
  const thumbPath = path.join(thumbsDir, thumbFileName);

  try {
    const existingImage = await db("categories_image")
      .select("id", "fileName")
      .where({ categoryId: Number(categoryId) })
      .first();

    await processSquareImageVariants({
      sourcePath: filePath,
      mainOutputPath: filePath,
      thumbOutputPath: thumbPath,
      mainSize: MAIN_SIZE,
      thumbSize: THUMB_SIZE,
      quality: JPEG_QUALITY,
    });

    if (existingImage) {
      await db("categories_image").where({ id: Number(existingImage.id) }).del();
      await safeUnlink(path.join(uploadsDir, existingImage.fileName));
      await safeUnlink(path.join(thumbsDir, getThumbFileName(existingImage.fileName)));
    }

    const inserted = await db("categories_image").insert({
      categoryId: Number(categoryId),
      fileName: file.filename,
      alt: null,
      isMain: 1,
      position: 0,
    });
    const imageId = Array.isArray(inserted) ? inserted[0] : inserted;

    return db("categories_image")
      .select("id", "categoryId", "fileName", "alt", "isMain", "position", "createdAt")
      .where({ id: imageId })
      .first();
  } catch (error) {
    await safeUnlink(filePath);
    await safeUnlink(thumbPath);
    throw error;
  }
};

const getCategoryImages = async ({ categoryId }) => {
  await ensureCategoryExists(categoryId);
  return db("categories_image")
    .select("id", "categoryId", "fileName", "alt", "isMain", "position", "createdAt")
    .where({ categoryId: Number(categoryId) })
    .orderBy("position", "asc")
    .orderBy("id", "asc");
};

const deleteCategoryImage = async ({ categoryId, filename }) => {
  const item = await db("categories_image")
    .select("id", "fileName")
    .where({ categoryId: Number(categoryId), fileName: filename })
    .first();

  if (!item) {
    const error = new Error("Image not found");
    error.status = 404;
    throw error;
  }

  await db("categories_image").where({ id: Number(item.id) }).del();
  await safeUnlink(path.join(uploadsDir, filename));
  await safeUnlink(path.join(thumbsDir, getThumbFileName(filename)));
};

const setMainCategoryImage = async ({ categoryId, imageId }) => {
  await ensureCategoryExists(categoryId);
  const item = await db("categories_image")
    .select("id")
    .where({ id: Number(imageId), categoryId: Number(categoryId) })
    .first();

  if (!item) {
    const error = new Error("Image not found");
    error.status = 404;
    throw error;
  }

  await db.transaction(async (trx) => {
    await trx("categories_image").where({ categoryId: Number(categoryId) }).update({ isMain: 0 });
    await trx("categories_image")
      .where({ id: Number(imageId), categoryId: Number(categoryId) })
      .update({ isMain: 1 });
  });

  return db("categories_image")
    .select("id", "categoryId", "fileName", "alt", "isMain", "position", "createdAt")
    .where({ id: Number(imageId) })
    .first();
};

module.exports = {
  saveCategoryImage,
  getCategoryImages,
  deleteCategoryImage,
  setMainCategoryImage,
};
