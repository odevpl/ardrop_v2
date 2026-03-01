const express = require("express");
const sellerAdminService = require("../services/seller-admin");

const router = express.Router();

router.post("/sellers", async (req, res) => {
  const seller = await sellerAdminService.createSeller(req.body);
  res.status(201).json(seller);
});

router.get("/sellers", async (req, res) => {
  const sellers = await sellerAdminService.listSellers();
  res.status(200).json({ sellers });
});

module.exports = router;
