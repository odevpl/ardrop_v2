const express = require("express");
const authService = require("../services/auth");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/register", async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.isActive),
    createdAt: user.createdAt,
  });
});

router.post("/login", async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json(result);
});

router.get(
  "/me",
  authMiddleware,
  roleMiddleware("ADMIN", "SELLER", "CLIENT"),
  async (req, res) => {
  const user = await authService.me(req.user.userId);

  res.status(200).json({ user });
  }
);

module.exports = router;
