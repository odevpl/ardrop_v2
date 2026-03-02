const fs = require("fs/promises");
const path = require("path");
const db = require("../config/db");

const uploadsDir = path.resolve(__dirname, "../../uploads/images");
const manifestPath = path.join(uploadsDir, "manifest.json");

const ensureManifest = async () => {
  await fs.mkdir(uploadsDir, { recursive: true });
  try {
    await fs.access(manifestPath);
  } catch (error) {
    await fs.writeFile(manifestPath, JSON.stringify([], null, 2), "utf8");
  }
};

const readManifest = async () => {
  await ensureManifest();
  const content = await fs.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(content || "[]");
  return Array.isArray(parsed) ? parsed : [];
};

const writeManifest = async (items) => {
  await fs.writeFile(manifestPath, JSON.stringify(items, null, 2), "utf8");
};

const ensureProductExists = async (productId) => {
  const product = await db("products").select("id").where({ id: productId }).first();
  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }
};

const saveProductImage = async ({ productId, file, userId }) => {
  await ensureProductExists(productId);
  const items = await readManifest();
  const image = {
    productId: Number(productId),
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    ownerUserId: Number(userId),
    createdAt: new Date().toISOString(),
  };
  items.push(image);
  await writeManifest(items);
  return image;
};

const listProductImages = async ({ productId }) => {
  await ensureProductExists(productId);
  const items = await readManifest();
  return items.filter((item) => Number(item.productId) === Number(productId));
};

const deleteProductImage = async ({ productId, filename, role, userId }) => {
  const items = await readManifest();
  const item = items.find(
    (entry) =>
      Number(entry.productId) === Number(productId) && entry.filename === filename,
  );

  if (!item) {
    const error = new Error("Image not found");
    error.status = 404;
    throw error;
  }

  if (role === "SELLER" && Number(item.ownerUserId) !== Number(userId)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  const nextItems = items.filter(
    (entry) =>
      !(Number(entry.productId) === Number(productId) && entry.filename === filename),
  );
  await writeManifest(nextItems);

  const filePath = path.join(uploadsDir, filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

module.exports = {
  saveProductImage,
  listProductImages,
  deleteProductImage,
};
