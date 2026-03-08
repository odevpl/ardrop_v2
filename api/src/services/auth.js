const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { getEnv } = require("../config/env");
const validator = require("../helpers/validator");
const { activateAccountTemplate } = require("./mail/activate-account");
const { resetPasswordTemplate } = require("./mail/reset-password");

const ALLOWED_ROLES = ["ADMIN", "SELLER", "CLIENT"];
const TOKEN_TTL_MINUTES = 60;

const hashToken = (token) => crypto.createHash("sha256").update(String(token)).digest("hex");
const generateToken = () => crypto.randomBytes(32).toString("hex");
const nextExpiry = () => new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

async function register({ email, password, role, name }) {
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

  return db.transaction(async (trx) => {
    const inserted = await trx("users").insert({
      email,
      passwordHash,
      role: userRole,
      isActive: false,
    });
    const userId = Array.isArray(inserted) ? inserted[0] : inserted;

    if (userRole === "CLIENT") {
      await trx("clients").insert({
        userId,
        name: String(name || "").trim() || email.split("@")[0],
      });
    }

    const activationToken = generateToken();
    await trx("user_activation_tokens").insert({
      userId,
      tokenHash: hashToken(activationToken),
      expiresAt: nextExpiry(),
    });

    const created = await trx("users")
      .select("id", "email", "role", "isActive", "createdAt")
      .where({ id: userId })
      .first();

    await activateAccountTemplate({ email, token: activationToken });

    return created;
  });
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
    const error = new Error("Account is not active");
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

async function activate({ token }) {
  if (!token || typeof token !== "string") {
    const error = new Error("Token is required");
    error.status = 400;
    throw error;
  }

  const tokenHash = hashToken(token);
  return db.transaction(async (trx) => {
    const tokenRow = await trx("user_activation_tokens")
      .where({ tokenHash })
      .whereNull("usedAt")
      .andWhere("expiresAt", ">", trx.fn.now())
      .first();

    if (!tokenRow) {
      const error = new Error("Activation token is invalid or expired");
      error.status = 400;
      throw error;
    }

    await trx("users").where({ id: tokenRow.userId }).update({
      isActive: true,
      updatedAt: trx.fn.now(),
    });

    await trx("user_activation_tokens")
      .where({ id: tokenRow.id })
      .update({ usedAt: trx.fn.now() });

    await trx("user_activation_tokens")
      .where({ userId: tokenRow.userId })
      .whereNull("usedAt")
      .del();

    return { activated: true };
  });
}

async function forgotPassword({ email }) {
  if (!email || !validator.email(email)) {
    return { accepted: true };
  }

  const user = await db("users").where({ email: String(email).trim() }).first();
  if (!user) {
    return { accepted: true };
  }

  const resetToken = generateToken();
  await db("user_password_reset_tokens").insert({
    userId: user.id,
    tokenHash: hashToken(resetToken),
    expiresAt: nextExpiry(),
  });

  await resetPasswordTemplate({ email: user.email, token: resetToken });
  return { accepted: true };
}

async function resetPassword({ token, password }) {
  if (!token || typeof token !== "string" || !password) {
    const error = new Error("Token and password are required");
    error.status = 400;
    throw error;
  }

  if (String(password).length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.status = 400;
    throw error;
  }

  const tokenHash = hashToken(token);
  return db.transaction(async (trx) => {
    const tokenRow = await trx("user_password_reset_tokens")
      .where({ tokenHash })
      .whereNull("usedAt")
      .andWhere("expiresAt", ">", trx.fn.now())
      .first();

    if (!tokenRow) {
      const error = new Error("Reset token is invalid or expired");
      error.status = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await trx("users").where({ id: tokenRow.userId }).update({
      passwordHash,
      updatedAt: trx.fn.now(),
    });

    await trx("user_password_reset_tokens")
      .where({ id: tokenRow.id })
      .update({ usedAt: trx.fn.now() });

    await trx("user_password_reset_tokens")
      .where({ userId: tokenRow.userId })
      .whereNull("usedAt")
      .del();

    return { reset: true };
  });
}

module.exports = {
  register,
  activate,
  forgotPassword,
  resetPassword,
  login,
  me,
};
