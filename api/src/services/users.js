const bcrypt = require("bcryptjs");
const db = require("../config/db");
const validator = require("../helpers/validator");

const ALLOWED_ROLES = ["ADMIN", "SELLER", "CLIENT"];

async function getUsers({ role, isActive, search } = {}) {
  const query = db("users")
    .select("id", "email", "role", "isActive", "createdAt", "updatedAt")
    .orderBy("id", "asc");

  if (role) {
    query.where({ role });
  }

  if (isActive !== undefined) {
    query.where({ isActive: Number(isActive) ? 1 : 0 });
  }

  if (search) {
    query.where("email", "like", `%${search}%`);
  }

  const users = await query;
  return users.map((user) => ({ ...user, isActive: Boolean(user.isActive) }));
}

async function getUserById(id) {
  const user = await db("users")
    .select("id", "email", "role", "isActive", "createdAt", "updatedAt")
    .where({ id })
    .first();

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return { ...user, isActive: Boolean(user.isActive) };
}

async function createUser({ email, password, role = "CLIENT", isActive = true }) {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  if (!validator.email(email)) {
    const error = new Error("Invalid email format");
    error.status = 400;
    throw error;
  }

  if (!ALLOWED_ROLES.includes(role)) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }

  const existing = await db("users").where({ email }).first();
  if (existing) {
    const error = new Error("Email already in use");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db("users").insert({
    email,
    passwordHash,
    role,
    isActive: Boolean(isActive),
  });
  const userId = Array.isArray(inserted) ? inserted[0] : inserted;

  return getUserById(userId);
}

async function setUserActive(id, isActive) {
  const updated = await db("users").where({ id }).update({
    isActive: Boolean(isActive),
    updatedAt: db.fn.now(),
  });

  if (!updated) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return getUserById(id);
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  setUserActive,
};
