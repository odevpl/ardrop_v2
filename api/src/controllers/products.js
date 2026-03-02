const express = require("express");
const productsService = require("../services/products");
const roleMiddleware = require("../middlewares/role.middleware");

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

module.exports = router;
