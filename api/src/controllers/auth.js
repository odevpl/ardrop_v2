const express = require("express");
const authService = require("../services/auth");
const businessRegistryService = require("../services/business-registry");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
const rateLimit = require("../middlewares/rate-limit.middleware");

const router = express.Router();

router.post(
  "/register",
  rateLimit({ keyPrefix: "auth:register", limit: 5, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.isActive),
    createdAt: user.createdAt,
  });
  },
);

router.get(
  "/company-lookup",
  rateLimit({ keyPrefix: "auth:company-lookup", limit: 30, windowMs: 15 * 60 * 1000 }),
  async (req, res) => {
    const result = await businessRegistryService.lookupBusinessByNip({
      nip: req.query?.nip,
    });

    res.status(200).json(result);
  },
);

router.post(
  "/activate",
  rateLimit({ keyPrefix: "auth:activate", limit: 10, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
  const result = await authService.activate(req.body || {});
  res.status(200).json(result);
  },
);

router.post(
  "/forgot-password",
  rateLimit({ keyPrefix: "auth:forgot", limit: 5, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
  const result = await authService.forgotPassword(req.body || {});
  res.status(200).json(result);
  },
);

router.post(
  "/reset-password",
  rateLimit({ keyPrefix: "auth:reset", limit: 10, windowMs: 60 * 60 * 1000 }),
  async (req, res) => {
  const result = await authService.resetPassword(req.body || {});
  res.status(200).json(result);
  },
);

router.post(
  "/login",
  rateLimit({ keyPrefix: "auth:login", limit: 10, windowMs: 15 * 60 * 1000 }),
  async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json(result);
  },
);

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
