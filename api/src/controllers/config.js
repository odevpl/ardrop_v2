const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const configService = require("../services/config");

const router = express.Router();

router.get(
  "/config",
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
    const config = configService.getConfig({
      role: req.user?.role,
    });

    res.status(200).json({
      data: config,
      ...config,
    });
  },
);

module.exports = router;
