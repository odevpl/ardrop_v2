const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const clientSpecialPricesService = require("../services/clientSpecialPricesService");

const router = express.Router();

router.get(
  "/clients/:clientId/special-prices",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const data = await clientSpecialPricesService.getByClient(req.params.clientId, {
      sellerId: req.query.sellerId,
    });

    res.status(200).json({ data });
  },
);

router.put(
  "/clients/:clientId/special-prices",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const result = await clientSpecialPricesService.upsertVariantPrices(
      req.params.clientId,
      req.body?.productId,
      req.body?.priceType,
      req.body?.variants,
    );

    res.status(200).json({
      success: true,
      ...result,
      data: {
        success: true,
        ...result,
      },
    });
  },
);

router.delete(
  "/clients/:clientId/special-prices/product/:productId",
  roleMiddleware("ADMIN"),
  async (req, res) => {
    const result = await clientSpecialPricesService.deleteByProduct(
      req.params.clientId,
      req.params.productId,
    );

    res.status(200).json({
      success: true,
      ...result,
      data: {
        success: true,
        ...result,
      },
    });
  },
);

module.exports = router;
