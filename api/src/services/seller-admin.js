const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function createSeller({ email, password, companyName, commissionRate }) {
  if (!email || !password || !companyName) {
    const error = new Error("Email, password and companyName are required");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const existing = await trx("users").where({ email }).first();

    if (existing) {
      const error = new Error("Email already in use");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertedUser = await trx("users").insert({
      email,
      password_hash: passwordHash,
      role: "SELLER",
      is_active: true,
    });
    const userId = Array.isArray(insertedUser) ? insertedUser[0] : insertedUser;
    const user = await trx("users").select("id", "email", "role").where({ id: userId }).first();

    const insertedSeller = await trx("sellers").insert({
      user_id: user.id,
      company_name: companyName,
      commission_rate: commissionRate ?? 0.1,
      is_active: true,
    });
    const sellerId = Array.isArray(insertedSeller) ? insertedSeller[0] : insertedSeller;
    const seller = await trx("sellers")
      .select("id", "user_id", "company_name", "commission_rate", "is_active")
      .where({ id: sellerId })
      .first();

    return {
      user,
      seller,
    };
  });
}

async function listSellers() {
  return db("sellers")
    .join("users", "sellers.user_id", "users.id")
    .select(
      "sellers.id",
      "sellers.company_name as companyName",
      "sellers.commission_rate as commissionRate",
      "sellers.is_active as isActive",
      "users.id as userId",
      "users.email",
      "users.role"
    )
    .orderBy("sellers.id", "asc");
}

module.exports = {
  createSeller,
  listSellers,
};
