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

module.exports = router;
