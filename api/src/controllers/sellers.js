const express = require("express");
const sellerAdminService = require("../services/sellers");
const roleMiddleware = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/sellers", roleMiddleware("ADMIN"), async (req, res) => {
  const seller = await sellerAdminService.createSeller(req.body);
  res.status(201).json(seller);
});

router.get("/sellers", roleMiddleware("ADMIN"), async (req, res) => {
  const sellers = await sellerAdminService.listSellers();
  res.status(200).json({ sellers });
});

module.exports = router;
