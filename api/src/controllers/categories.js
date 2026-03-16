const express = require("express");
const categoriesService = require("../services/categories");
const categoryImagesService = require("../services/category-images");
const roleMiddleware = require("../middlewares/role.middleware");
const { uploadCategoryImage } = require("../middlewares/upload-image.middleware");

const router = express.Router();

const getBaseUrl = (req) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${protocol}://${host}`;
};

const getThumbFileName = (fileName) => {
  const dotIndex = String(fileName || "").lastIndexOf(".");
  if (dotIndex <= 0) {
    return `${fileName}.jpg`;
  }
  return `${String(fileName).slice(0, dotIndex)}.jpg`;
};

const withImageUrls = (req, category) => {
  if (!category) return category;
  const baseUrl = getBaseUrl(req);
  const images = Array.isArray(category.images) ? category.images : [];
  const children = Array.isArray(category.children) ? category.children : [];
  return {
    ...category,
    images: images.map((image) => ({
      ...image,
      url: `${baseUrl}/uploads/categories/${image.fileName}`,
      thumbUrl: `${baseUrl}/uploads/categories/thumbs/${getThumbFileName(image.fileName)}`,
    })),
    children: children.map((child) => withImageUrls(req, child)),
  };
};

router.get(
  "/categories",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const result = await categoriesService.listCategories({
      role: req.user.role,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      parentId: req.query.parentId,
      activeOnly: req.query.activeOnly === "1",
      view: req.query.view === "tree" ? "tree" : "flat",
    });

    const normalizedData = result.data.map((category) => withImageUrls(req, category));
    const normalizedTree = Array.isArray(result.tree)
      ? result.tree.map((category) => withImageUrls(req, category))
      : null;

    res.status(200).json({
      data: req.query.view === "tree" && normalizedTree ? normalizedTree : normalizedData,
      meta: {
        pagination: result.pagination,
        view: req.query.view === "tree" ? "tree" : "flat",
      },
    });
  },
);

router.get(
  "/categories/:id",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const category = await categoriesService.getCategoryById({ categoryId: Number(req.params.id) });
    res.status(200).json({ data: withImageUrls(req, category), category: withImageUrls(req, category) });
  },
);

router.post(
  "/categories",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const category = await categoriesService.createCategory({ payload: req.body || {} });
    res.status(201).json({ data: withImageUrls(req, category), category: withImageUrls(req, category) });
  },
);

router.put(
  "/categories/:id",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const category = await categoriesService.updateCategory({
      categoryId: Number(req.params.id),
      payload: req.body || {},
    });
    res.status(200).json({ data: withImageUrls(req, category), category: withImageUrls(req, category) });
  },
);

router.delete(
  "/categories/:id",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const result = await categoriesService.deleteCategory({ categoryId: Number(req.params.id) });
    res.status(200).json({ data: result, meta: { deleted: true } });
  },
);

router.get(
  "/categories/:id/images",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const images = await categoryImagesService.getCategoryImages({ categoryId: Number(req.params.id) });
    const baseUrl = getBaseUrl(req);
    res.status(200).json({
      data: images.map((image) => ({
        ...image,
        url: `${baseUrl}/uploads/categories/${image.fileName}`,
        thumbUrl: `${baseUrl}/uploads/categories/thumbs/${getThumbFileName(image.fileName)}`,
      })),
    });
  },
);

router.post(
  "/categories/:id/images",
  roleMiddleware("ADMIN"),
  uploadCategoryImage.single("image"),
  async (req, res) => {
    if (!req.file) {
      const error = new Error("Image file is required");
      error.status = 400;
      throw error;
    }

    const image = await categoryImagesService.saveCategoryImage({
      categoryId: Number(req.params.id),
      file: req.file,
    });

    res.status(201).json({
      data: {
        ...image,
        url: `${getBaseUrl(req)}/uploads/categories/${image.fileName}`,
        thumbUrl: `${getBaseUrl(req)}/uploads/categories/thumbs/${getThumbFileName(image.fileName)}`,
      },
    });
  },
);

router.delete(
  "/categories/:id/images/:filename",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    await categoryImagesService.deleteCategoryImage({
      categoryId: Number(req.params.id),
      filename: req.params.filename,
    });
    res.status(200).json({ data: { ok: true }, meta: { deleted: true } });
  },
);

router.post(
  "/categories/:id/images/main",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const imageId = Number(req.body?.imageId);
    if (!imageId) {
      const error = new Error("imageId is required");
      error.status = 400;
      throw error;
    }

    const image = await categoryImagesService.setMainCategoryImage({
      categoryId: Number(req.params.id),
      imageId,
    });
    res.status(200).json({
      data: {
        ...image,
        url: `${getBaseUrl(req)}/uploads/categories/${image.fileName}`,
        thumbUrl: `${getBaseUrl(req)}/uploads/categories/thumbs/${getThumbFileName(image.fileName)}`,
      },
    });
  },
);

module.exports = router;
