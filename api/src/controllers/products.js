const express = require("express");
const productsService = require("../services/products");
const productImagesService = require("../services/product-images");
const roleMiddleware = require("../middlewares/role.middleware");
const {
  uploadProductImage,
} = require("../middlewares/upload-image.middleware");

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

const withImageUrls = (req, product) => {
  if (!product) return product;
  const baseUrl = getBaseUrl(req);
  const images = Array.isArray(product.images) ? product.images : [];

  return {
    ...product,
    images: images.map((image) => ({
      ...image,
      url: `${baseUrl}/uploads/images/${image.fileName}`,
      thumbUrl: `${baseUrl}/uploads/images/thumbs/${getThumbFileName(image.fileName)}`,
    })),
  };
};

router.get(
  "/products",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const result = await productsService.getProducts({
      userId: req.user.userId,
      role: req.user.role,
      search: req.query.search,
      status: req.query.status,
      sellerId: req.query.sellerId,
      category: req.query.category,
      page: req.query.page,
      limit: req.query.limit,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });
    const data = result.data.map((product) => withImageUrls(req, product));
    res.status(200).json({
      data,
      meta: {
        pagination: result.pagination,
        sort: result.sort,
        filters: {
          search: req.query.search || null,
          status: req.query.status || null,
          sellerId: req.query.sellerId ? Number(req.query.sellerId) : null,
          category: req.query.category || null,
        },
      },
    });
  },
);

router.get(
  "/products/suggested",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const result = await productsService.getSuggestedProducts({
      limit: 10,
      role: req.user.role,
    });
    const data = result.map((product) => withImageUrls(req, product));
    res.status(200).json({ data });
  },
);

router.get(
  "/products/:id",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const rawProduct = await productsService.getProductById({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
    });
    const product = withImageUrls(req, rawProduct);
    res.status(200).json({ data: product, product });
  },
);

router.post(
  "/products",
  roleMiddleware("SELLER", "ADMIN"),
  async (req, res) => {
    const rawProduct = await productsService.createProduct({
      ...req.body,
      userId: req.user.userId,
      role: req.user.role,
    });
    const product = withImageUrls(req, rawProduct);
    res.status(201).json({ data: product, product });
  },
);

router.put(
  "/products/:id",
  roleMiddleware("SELLER", "ADMIN"),
  async (req, res) => {
    const rawProduct = await productsService.updateProduct({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
      payload: req.body,
    });
    const product = withImageUrls(req, rawProduct);
    res.status(200).json({ data: product, product });
  },
);

router.delete(
  "/products/:id",
  roleMiddleware("SELLER", "ADMIN"),
  async (req, res) => {
    const result = await productsService.deleteProduct({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
    });
    res.status(200).json({
      data: result,
      ...result,
      meta: {
        deleted: true,
      },
    });
  },
);

router.get(
  "/products/:id/images",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const images = await productImagesService.getProductImages({
      productId: Number(req.params.id),
    });
    const baseUrl = getBaseUrl(req);
    const normalized = images.map((image) => ({
      ...image,
      url: `${baseUrl}/uploads/images/${image.fileName}`,
      thumbUrl: `${baseUrl}/uploads/images/thumbs/${getThumbFileName(image.fileName)}`,
    }));
    res.status(200).json({
      data: normalized,
      images: normalized,
    });
  },
);

router.post(
  "/products/:id/images",
  roleMiddleware("ADMIN", "SELLER"),
  uploadProductImage.single("image"),
  async (req, res) => {
    if (!req.file) {
      const error = new Error("Image file is required");
      error.status = 400;
      throw error;
    }

    const image = await productImagesService.saveProductImage({
      productId: Number(req.params.id),
      file: req.file,
      role: req.user.role,
      userId: req.user.userId,
    });

    const normalizedImage = {
      ...image,
      url: `${getBaseUrl(req)}/uploads/images/${image.fileName}`,
      thumbUrl: `${getBaseUrl(req)}/uploads/images/thumbs/${getThumbFileName(image.fileName)}`,
    };
    res.status(201).json({ data: normalizedImage, image: normalizedImage });
  },
);

router.delete(
  "/products/:id/images/:filename",
  roleMiddleware("ADMIN", "SELLER"),
  async (req, res) => {
    await productImagesService.deleteProductImage({
      productId: Number(req.params.id),
      filename: req.params.filename,
      role: req.user.role,
      userId: req.user.userId,
    });

    res.status(200).json({
      data: { ok: true },
      ok: true,
      meta: {
        deleted: true,
      },
    });
  },
);

router.post(
  "/products/:id/images/main",
  roleMiddleware("ADMIN", "SELLER"),
  async (req, res) => {
    const imageId = Number(req.body.imageId);
    if (!imageId) {
      const error = new Error("imageId is required");
      error.status = 400;
      throw error;
    }

    const image = await productImagesService.setMainProductImage({
      productId: Number(req.params.id),
      imageId,
      role: req.user.role,
      userId: req.user.userId,
    });

    const normalizedImage = {
      ...image,
      url: `${getBaseUrl(req)}/uploads/images/${image.fileName}`,
      thumbUrl: `${getBaseUrl(req)}/uploads/images/thumbs/${getThumbFileName(image.fileName)}`,
    };
    res.status(200).json({ data: normalizedImage, image: normalizedImage });
  },
);

router.get(
  "/products/:id/variants",
  roleMiddleware("ADMIN", "SELLER"),
  async (req, res) => {
    const variants = await productsService.getProductVariants({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
    });
    res.status(200).json({ data: variants, variants });
  },
);

router.post(
  "/products/:id/variants",
  roleMiddleware("ADMIN", "SELLER"),
  async (req, res) => {
    const variants = await productsService.createProductVariant({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
      payload: req.body || {},
    });
    res.status(201).json({ data: variants, variants });
  },
);

router.patch(
  "/products/:id/variants/:variantId",
  roleMiddleware("ADMIN", "SELLER"),
  async (req, res) => {
    const variants = await productsService.updateProductVariant({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
      variantId: Number(req.params.variantId),
      payload: req.body || {},
    });
    res.status(200).json({ data: variants, variants });
  },
);

router.put(
  "/products/:id/variants/:variantId",
  roleMiddleware("ADMIN", "SELLER"),
  async (req, res) => {
    const variants = await productsService.updateProductVariant({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
      variantId: Number(req.params.variantId),
      payload: req.body || {},
    });
    res.status(200).json({ data: variants, variants });
  },
);

router.delete(
  "/products/:id/variants/:variantId",
  roleMiddleware("ADMIN", "SELLER"),
  async (req, res) => {
    const variants = await productsService.deleteProductVariant({
      userId: req.user.userId,
      role: req.user.role,
      productId: Number(req.params.id),
      variantId: Number(req.params.variantId),
    });
    res.status(200).json({ data: variants, variants, meta: { deleted: true } });
  },
);

module.exports = router;
