const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { getEnv } = require("../config/env");
const validator = require("../helpers/validator");

const ALLOWED_ROLES = ["ADMIN", "SELLER", "CLIENT"];

async function register({ email, password, role }) {
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

  const existing = await db("users").where({ email }).first();

  if (existing) {
    const error = new Error("Email already in use");
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userRole = role || "CLIENT";

  if (!ALLOWED_ROLES.includes(userRole)) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }

  const inserted = await db("users").insert({
    email,
    passwordHash,
    role: userRole,
    isActive: true,
  });
  const userId = Array.isArray(inserted) ? inserted[0] : inserted;
  const created = await db("users")
    .select("id", "email", "role", "isActive", "createdAt")
    .where({ id: userId })
    .first();

  return created;
}

async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  const user = await db("users").where({ email }).first();

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  if (!user.passwordHash || typeof user.passwordHash !== "string") {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  let passwordValid = false;
  try {
    passwordValid = await bcrypt.compare(password, user.passwordHash);
  } catch (compareError) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  if (!passwordValid) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("User is inactive");
    error.status = 403;
    throw error;
  }

  const env = getEnv();
  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: Boolean(user.isActive),
    },
  };
}

async function me(userId) {
  const user = await db("users")
    .select("id", "email", "role", "isActive", "createdAt", "updatedAt")
    .where({ id: userId })
    .first();

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return {
    ...user,
    isActive: Boolean(user.isActive),
  };
}

module.exports = {
  register,
  login,
  me,
};
