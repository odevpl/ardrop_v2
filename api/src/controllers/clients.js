const express = require("express");
const roleMiddleware = require("../middlewares/role.middleware");
const clientsService = require("../services/clients");

const router = express.Router();

router.get("/clients", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await clientsService.getClientsList({
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

router.get("/clients/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const client = await clientsService.getClientById(req.params.id);
  res.status(200).json({ data: client, client });
});

router.post("/clients", roleMiddleware("ADMIN"), async (req, res) => {
  const client = await clientsService.createClient(req.body || {});
  res.status(201).json({ data: client, client });
});

router.patch("/clients/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const client = await clientsService.updateClient(req.params.id, req.body || {});
  res.status(200).json({ data: client, client });
});

router.delete("/clients/:id", roleMiddleware("ADMIN"), async (req, res) => {
  const result = await clientsService.deleteClient(req.params.id);
  res.status(200).json({ data: result, ...result });
});

module.exports = router;
