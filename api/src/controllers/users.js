const express = require("express");
const usersService = require("../services/users");

const router = express.Router();

router.get("/users", async (req, res) => {
  const users = await usersService.getUsers(req.query);
  res.status(200).json({ users });
});

router.get("/users/:id", async (req, res) => {
  const user = await usersService.getUserById(Number(req.params.id));
  res.status(200).json({ user });
});

router.post("/users", async (req, res) => {
  const user = await usersService.createUser(req.body);
  res.status(201).json({ user });
});

router.patch("/users/:id/active", async (req, res) => {
  const { isActive } = req.body;
  const user = await usersService.setUserActive(Number(req.params.id), isActive);
  res.status(200).json({ user });
});

module.exports = router;
