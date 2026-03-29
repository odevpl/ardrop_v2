const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const sellerSettingsService = require("../services/seller-settings");

const router = express.Router();

router.get(
  "/seller/me/settings",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerSettingsService.getSellerSettings({
      userId: req.user.userId,
    });

    res.status(200).json({ data: payload, ...payload });
  },
);

router.patch(
  "/seller/me/settings",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerSettingsService.updateSellerSettings({
      userId: req.user.userId,
      payload: req.body || {},
    });

    res.status(200).json({ data: payload, ...payload });
  },
);

router.get(
  "/seller/me/shipping-methods",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerSettingsService.getShippingMethods({
      userId: req.user.userId,
    });

    res.status(200).json({ data: payload, shippingMethods: payload });
  },
);

router.get(
  "/seller/me/shipping-methods/:id",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerSettingsService.getShippingMethodById({
      userId: req.user.userId,
      shippingMethodId: req.params.id,
    });

    res.status(200).json({ data: payload, shippingMethod: payload });
  },
);

router.post(
  "/seller/me/shipping-methods",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerSettingsService.createShippingMethod({
      userId: req.user.userId,
      payload: req.body || {},
    });

    res.status(201).json({ data: payload, shippingMethod: payload });
  },
);

router.put(
  "/seller/me/shipping-methods/:id",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerSettingsService.updateShippingMethodById({
      userId: req.user.userId,
      shippingMethodId: req.params.id,
      payload: req.body || {},
    });

    res.status(200).json({ data: payload, shippingMethod: payload });
  },
);

router.delete(
  "/seller/me/shipping-methods/:id",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerSettingsService.deleteShippingMethodById({
      userId: req.user.userId,
      shippingMethodId: req.params.id,
    });

    res.status(200).json({ data: payload, ...payload });
  },
);

module.exports = router;
