const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const authController = require("../controllers/auth");
const sellerAdminController = require("../controllers/seller-admin");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authController);
router.use("/admin", authMiddleware, roleMiddleware("SUPER_ADMIN"), sellerAdminController);

module.exports = router;
