const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const accountService = require("../services/account");

const router = express.Router();

router.get(
  "/account/me",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const profile = await accountService.getCurrentClientProfile({
      userId: req.user.userId,
    });

    res.status(200).json({ data: profile, profile });
  },
);

router.patch(
  "/account/me",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const profile = await accountService.updateCurrentClientProfile({
      userId: req.user.userId,
      payload: req.body || {},
    });

    res.status(200).json({ data: profile, profile });
  },
);

module.exports = router;
