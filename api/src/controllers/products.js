const express = require("express");
const productsService = require("../services/products");
const productImagesService = require("../services/product-images");
const roleMiddleware = require("../middlewares/role.middleware");
const { uploadProductImage } = require("../middlewares/upload-image.middleware");

const router = express.Router();

router.get("/products", roleMiddleware("ADMIN", "SELLER", "CLIENT"), async (req, res) => {
  const products = await productsService.getProducts({
    userId: req.user.userId,
    role: req.user.role,
    search: req.query.search,
    status: req.query.status,
    sellerId: req.query.sellerId,
  });
  res.status(200).json({ products });
});

router.get("/products/:id", roleMiddleware("ADMIN", "SELLER", "CLIENT"), async (req, res) => {
  const product = await productsService.getProductById({
    userId: req.user.userId,
    role: req.user.role,
    productId: Number(req.params.id),
  });
  res.status(200).json({ product });
});

router.post("/products", roleMiddleware("SELLER", "ADMIN"), async (req, res) => {
  const product = await productsService.createProduct({
    userId: req.user.userId,
    role: req.user.role,
    ...req.body,
  });
  res.status(201).json({ product });
});

router.put("/products/:id", roleMiddleware("SELLER", "ADMIN"), async (req, res) => {
  const product = await productsService.updateProduct({
    userId: req.user.userId,
    role: req.user.role,
    productId: Number(req.params.id),
    payload: req.body,
  });
  res.status(200).json({ product });
});

router.delete("/products/:id", roleMiddleware("SELLER", "ADMIN"), async (req, res) => {
  const result = await productsService.deleteProduct({
    userId: req.user.userId,
    role: req.user.role,
    productId: Number(req.params.id),
  });
  res.status(200).json(result);
});

router.get(
  "/products/:id/images",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const images = await productImagesService.listProductImages({
      productId: Number(req.params.id),
    });
    const normalized = images.map((image) => ({
      ...image,
      url: `/uploads/images/${image.filename}`,
    }));
    res.status(200).json({ images: normalized });
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
      userId: req.user.userId,
    });

    res.status(201).json({
      image: {
        ...image,
        url: `/uploads/images/${image.filename}`,
      },
    });
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

    res.status(200).json({ ok: true });
  },
);

module.exports = router;
