const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const sellerFinancialHistoryService = require("../services/seller-financial-history");

const router = express.Router();

router.get(
  "/seller/me/financial-history",
  roleMiddleware("SELLER"),
  async (req, res) => {
    const payload = await sellerFinancialHistoryService.getSellerFinancialHistory({
      userId: req.user.userId,
      page: req.query.page,
      limit: req.query.limit,
      settlementMonth: req.query.settlementMonth,
    });

    res.status(200).json(payload);
  },
);

module.exports = router;
