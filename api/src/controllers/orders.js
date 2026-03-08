const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const ordersService = require("../services/orders");

const router = express.Router();

router.post(
  "/orders",
  roleMiddleware("ADMIN", "CLIENT"),
  async (req, res) => {
    const result = await ordersService.createOrderFromCurrentCart({
      userId: req.user.userId,
      role: req.user.role,
      clientId: req.body.clientId,
    });

    res.status(201).json({
      data: result,
      ...result,
    });
  },
);

router.get(
  "/orders",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const orders = await ordersService.getOrders({
      userId: req.user.userId,
      role: req.user.role,
    });

    res.status(200).json({ data: orders, orders });
  },
);

router.get(
  "/orders/:id",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const order = await ordersService.getOrderById({
      userId: req.user.userId,
      role: req.user.role,
      orderId: req.params.id,
    });

    res.status(200).json({ data: order, order });
  },
);

router.put(
  "/orders/:id",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const order = await ordersService.updateOrderById({
      orderId: req.params.id,
      payload: req.body || {},
    });

    res.status(200).json({ data: order, order });
  },
);

router.delete(
  "/orders/:id",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const result = await ordersService.deleteOrderById({
      orderId: req.params.id,
    });

    res.status(200).json({ data: result, ...result, meta: { deleted: true } });
  },
);

module.exports = router;
