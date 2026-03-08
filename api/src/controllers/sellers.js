const express = require("express");
const sellerAdminService = require("../services/sellers");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/sellers", roleMiddleware("ADMIN"), async (req, res) => {
  const seller = await sellerAdminService.createSeller(req.body);
  res.status(201).json(seller);
});

router.get("/sellers", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await sellerAdminService.getSellersList({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    isActive: req.query.isActive,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  });

  res.status(200).json({
    data: result.data,
    meta: {
      pagination: result.pagination,
      sort: result.sort,
      filters: {
        search: req.query.search || null,
        isActive: req.query.isActive !== undefined ? Number(req.query.isActive) : null,
      },
    },
  });
});

router.get("/sellers/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const seller = await sellerAdminService.getSellerById(req.params.id);
  res.status(200).json({ data: seller, seller });
});

router.patch("/sellers/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const seller = await sellerAdminService.updateSeller(req.params.id, req.body || {});
  res.status(200).json({ data: seller, seller });
});

router.delete("/sellers/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await sellerAdminService.deleteSeller(req.params.id);
  res.status(200).json({ data: result, ...result });
});

module.exports = router;
