const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const cartsService = require("../services/carts");

const router = express.Router();

router.get(
  "/carts/current",
  roleMiddleware("ADMIN", "CLIENT"),
  async (req, res) => {
    const cart = await cartsService.getOrCreateCurrentCart({
      userId: req.user.userId,
      role: req.user.role,
      clientId: req.query.clientId,
      currency: req.query.currency,
    });

    res.status(200).json({ data: cart, cart });
  },
);

router.post(
  "/carts/items",
  roleMiddleware("ADMIN", "CLIENT"),
  async (req, res) => {
    const cart = await cartsService.addItemToCurrentCart({
      userId: req.user.userId,
      role: req.user.role,
      clientId: req.body.clientId,
      currency: req.body.currency,
      productId: req.body.productId,
      quantity: req.body.quantity,
    });

    res.status(201).json({ data: cart, cart });
  },
);

router.patch(
  "/carts/items/:itemId",
  roleMiddleware("ADMIN", "CLIENT"),
  async (req, res) => {
    const cart = await cartsService.updateCurrentCartItem({
      userId: req.user.userId,
      role: req.user.role,
      clientId: req.body.clientId,
      itemId: Number(req.params.itemId),
      quantity: req.body.quantity,
    });

    res.status(200).json({ data: cart, cart });
  },
);

router.delete(
  "/carts/items/:itemId",
  roleMiddleware("ADMIN", "CLIENT"),
  async (req, res) => {
    const cart = await cartsService.removeItemFromCurrentCart({
      userId: req.user.userId,
      role: req.user.role,
      clientId: req.body.clientId || req.query.clientId,
      itemId: Number(req.params.itemId),
    });

    res.status(200).json({ data: cart, cart, meta: { deleted: true } });
  },
);

router.delete(
  "/carts/current/items",
  roleMiddleware("ADMIN", "CLIENT"),
  async (req, res) => {
    const cart = await cartsService.clearCurrentCart({
      userId: req.user.userId,
      role: req.user.role,
      clientId: req.body.clientId || req.query.clientId,
    });

    res.status(200).json({ data: cart, cart, meta: { cleared: true } });
  },
);

router.patch(
  "/carts/current",
  roleMiddleware("ADMIN", "CLIENT"),
  async (req, res) => {
    const cart = await cartsService.updateCurrentCartMeta({
      userId: req.user.userId,
      role: req.user.role,
      clientId: req.body.clientId,
      couponCode: req.body.couponCode,
      shippingMethodId: req.body.shippingMethodId,
      shippingNet: req.body.shippingNet,
      shippingGross: req.body.shippingGross,
      discountNet: req.body.discountNet,
      discountGross: req.body.discountGross,
      expiresAt: req.body.expiresAt,
    });

    res.status(200).json({ data: cart, cart });
  },
);

module.exports = router;
