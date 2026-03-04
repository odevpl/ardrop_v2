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
    const user = await trx("users")
      .select("id", "email", "role")
      .where({ id: userId })
      .first();

    const insertedSeller = await trx("sellers").insert({
      userId: user.id,
      companyName,
      nip,
      phone,
      address,
      city,
      postalCode,
    });
    const sellerId = Array.isArray(insertedSeller)
      ? insertedSeller[0]
      : insertedSeller;
    const seller = await trx("sellers")
      .select(
        "id",
        "userId",
        "companyName",
        "nip",
        "phone",
        "address",
        "city",
        "postalCode",
      )
      .where({ id: sellerId })
      .first();

    return {
      user,
      seller,
    };
  });
}

async function getSellers() {
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
      "users.isActive",
    )
    .orderBy("sellers.id", "asc");
}

const ALLOWED_SORT_FIELDS = [
  "id",
  "companyName",
  "nip",
  "city",
  "email",
  "isActive",
];

const SORT_FIELD_MAP = {
  id: "sellers.id",
  companyName: "sellers.companyName",
  nip: "sellers.nip",
  city: "sellers.city",
  email: "users.email",
  isActive: "users.isActive",
};

async function getSellersList({
  page = 1,
  limit = 20,
  search,
  isActive,
  sortBy = "id",
  sortOrder = "asc",
}) {
  const normalizedPage = Number(page) > 0 ? Number(page) : 1;
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 20;
  const normalizedSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "id";
  const normalizedSortOrder = String(sortOrder).toLowerCase() === "desc" ? "desc" : "asc";
  const sortColumn = SORT_FIELD_MAP[normalizedSortBy] || "sellers.id";

  const baseQuery = db("sellers").join("users", "sellers.userId", "users.id");

  if (isActive !== undefined) {
    baseQuery.andWhere("users.isActive", Number(isActive) ? 1 : 0);
  }

  if (search) {
    baseQuery.andWhere((qb) => {
      qb.where("sellers.companyName", "like", `%${search}%`)
        .orWhere("sellers.nip", "like", `%${search}%`)
        .orWhere("users.email", "like", `%${search}%`);
    });
  }

  const countRow = await baseQuery.clone().count({ total: "sellers.id" }).first();
  const total = Number(countRow?.total || 0);
  const offset = (normalizedPage - 1) * normalizedLimit;

  const sellers = await baseQuery
    .clone()
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
      "users.isActive",
    )
    .orderBy(sortColumn, normalizedSortOrder)
    .limit(normalizedLimit)
    .offset(offset);

  return {
    data: sellers.map((seller) => ({
      ...seller,
      isActive: Boolean(seller.isActive),
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / normalizedLimit),
      hasNext: normalizedPage * normalizedLimit < total,
      hasPrev: normalizedPage > 1,
    },
    sort: {
      by: normalizedSortBy,
      order: normalizedSortOrder,
    },
  };
}

module.exports = {
  createSeller,
  getSellers,
  getSellersList,
};
