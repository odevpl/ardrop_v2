const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const clientDeliveryAddressesService = require("../services/client-delivery-addresses");

const router = express.Router();

router.get(
  "/account/delivery-addresses",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const addresses = await clientDeliveryAddressesService.getMyDeliveryAddresses({
      userId: req.user.userId,
    });

    res.status(200).json({ data: addresses, addresses });
  },
);

router.post(
  "/account/delivery-addresses",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const address = await clientDeliveryAddressesService.createMyDeliveryAddress({
      userId: req.user.userId,
      payload: req.body || {},
    });

    res.status(201).json({ data: address, address });
  },
);

router.patch(
  "/account/delivery-addresses/:id",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const address = await clientDeliveryAddressesService.updateMyDeliveryAddress({
      userId: req.user.userId,
      addressId: req.params.id,
      payload: req.body || {},
    });

    res.status(200).json({ data: address, address });
  },
);

router.delete(
  "/account/delivery-addresses/:id",
  roleMiddleware("CLIENT"),
  async (req, res) => {
    const result = await clientDeliveryAddressesService.deleteMyDeliveryAddress({
      userId: req.user.userId,
      addressId: req.params.id,
    });

    res.status(200).json({ data: result, ...result, meta: { deleted: true } });
  },
);

module.exports = router;
