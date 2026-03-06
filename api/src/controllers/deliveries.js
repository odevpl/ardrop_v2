const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const deliveriesService = require("../services/deliveries");

const router = express.Router();

router.get(
  "/deliveries/current",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const delivery = await deliveriesService.getCurrentDelivery({
      userId: req.user.userId,
    });

    res.status(200).json({ data: delivery, delivery });
  },
);

router.put(
  "/deliveries/current",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const delivery = await deliveriesService.upsertCurrentDelivery({
      userId: req.user.userId,
      payload: req.body || {},
    });

    res.status(200).json({ data: delivery, delivery });
  },
);

module.exports = router;
