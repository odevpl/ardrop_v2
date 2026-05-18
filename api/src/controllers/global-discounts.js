const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const globalDiscountsService = require("../services/campaign-pricing");

const router = express.Router();

router.get("/global-discounts", roleMiddleware("ADMIN"), async (req, res) => {
  const data = await globalDiscountsService.listGlobalDiscounts();
  res.status(200).json({ data });
});

router.post("/global-discounts", roleMiddleware("ADMIN"), async (req, res) => {
  const discount = await globalDiscountsService.createGlobalDiscount(req.body || {});
  res.status(201).json({ data: discount, discount });
});

router.patch("/global-discounts/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const discount = await globalDiscountsService.updateGlobalDiscount({
    discountId: Number(req.params.id),
    payload: req.body || {},
  });
  res.status(200).json({ data: discount, discount });
});

router.delete("/global-discounts/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await globalDiscountsService.deleteGlobalDiscount({
    discountId: Number(req.params.id),
  });
  res.status(200).json({ data: result, ...result, meta: { deleted: true } });
});

module.exports = router;
