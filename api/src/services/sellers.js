const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function createSeller({
  email,
  password,
  companyName,
  nip = null,
  phone = null,
  address = null,
  city = null,
  postalCode = null,
}) {
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
      passwordHash,
      role: "SELLER",
      isActive: true,
    });
    const userId = Array.isArray(insertedUser) ? insertedUser[0] : insertedUser;
    const user = await trx("users").select("id", "email", "role").where({ id: userId }).first();

    const insertedSeller = await trx("sellers").insert({
      userId: user.id,
      companyName,
      nip,
      phone,
      address,
      city,
      postalCode,
    });
    const sellerId = Array.isArray(insertedSeller) ? insertedSeller[0] : insertedSeller;
    const seller = await trx("sellers")
      .select("id", "userId", "companyName", "nip", "phone", "address", "city", "postalCode")
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
    .join("users", "sellers.userId", "users.id")
    .select(
      "sellers.id",
      "sellers.companyName",
      "sellers.nip",
      "sellers.phone",
      "sellers.address",
      "sellers.city",
      "sellers.postalCode",
      "users.id as userId",
      "users.email",
      "users.role",
      "users.isActive"
    )
    .orderBy("sellers.id", "asc");
}

module.exports = {
  createSeller,
  listSellers,
};
