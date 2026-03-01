const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const authController = require("../controllers/auth");
const sellerController = require("../controllers/sellers");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authController);
router.use("/admin", authMiddleware, roleMiddleware("ADMIN"), sellerController);

module.exports = router;
