const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const ordersService = require("../services/orders");

const router = express.Router();

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

module.exports = router;
