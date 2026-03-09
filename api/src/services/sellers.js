const bcrypt = require("bcryptjs");
const db = require("../config/db");
const validator = require("../helpers/validator");

async function createSeller({
  email,
  password,
  companyName,
  isActive = true,
  nip = null,
  phone = null,
  address = null,
  city = null,
  postalCode = null,
}) {
  const normalizedEmail = String(email || "").trim();
  const normalizedPassword = String(password || "");
  const normalizedCompanyName = String(companyName || "").trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedCompanyName) {
    const error = new Error("Email, password and companyName are required");
    error.status = 400;
    throw error;
  }

  if (!validator.email(normalizedEmail)) {
    const error = new Error("Invalid email format");
    error.status = 400;
    throw error;
  }

  if (normalizedPassword.length < 8) {
    const error = new Error("Password must be at least 8 characters long");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const existing = await trx("users").where({ email: normalizedEmail }).first();

    if (existing) {
      const error = new Error("Email already in use");
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    const insertedUser = await trx("users").insert({
      email: normalizedEmail,
      passwordHash,
      role: "SELLER",
      isActive: Boolean(isActive),
    });
    const userId = Array.isArray(insertedUser) ? insertedUser[0] : insertedUser;
    const user = await trx("users")
      .select("id", "email", "role")
      .where({ id: userId })
      .first();

    const insertedSeller = await trx("sellers").insert({
      userId: user.id,
      companyName: normalizedCompanyName,
      nip: nip === null ? null : String(nip).trim(),
      phone: phone === null ? null : String(phone).trim(),
      address: address === null ? null : String(address).trim(),
      city: city === null ? null : String(city).trim(),
      postalCode: postalCode === null ? null : String(postalCode).trim(),
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

const SELLER_FIELDS = [
  "companyName",
  "nip",
  "phone",
  "address",
  "city",
  "postalCode",
];

const selectSellerColumns = (query) =>
  query.select(
    "sellers.id",
    "sellers.userId",
    "sellers.companyName",
    "sellers.nip",
    "sellers.phone",
    "sellers.address",
    "sellers.city",
    "sellers.postalCode",
    "sellers.createdAt",
    "sellers.updatedAt",
    "users.email",
    "users.role",
    "users.isActive",
  );

const mapSellerRow = (row) => ({
  id: Number(row.id),
  userId: Number(row.userId),
  companyName: row.companyName,
  nip: row.nip,
  phone: row.phone,
  address: row.address,
  city: row.city,
  postalCode: row.postalCode,
  email: row.email,
  role: row.role,
  isActive: Boolean(row.isActive),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

async function getSellerById(id) {
  const normalizedId = Number(id);
  if (!normalizedId) {
    const error = new Error("Invalid seller id");
    error.status = 400;
    throw error;
  }

  const row = await selectSellerColumns(
    db("sellers").innerJoin("users", "sellers.userId", "users.id"),
  )
    .where("sellers.id", normalizedId)
    .first();

  if (!row) {
    const error = new Error("Seller not found");
    error.status = 404;
    throw error;
  }

  return mapSellerRow(row);
}

async function updateSeller(id, payload = {}) {
  const normalizedId = Number(id);
  if (!normalizedId) {
    const error = new Error("Invalid seller id");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const existing = await selectSellerColumns(
      trx("sellers").innerJoin("users", "sellers.userId", "users.id"),
    )
      .where("sellers.id", normalizedId)
      .first();

    if (!existing) {
      const error = new Error("Seller not found");
      error.status = 404;
      throw error;
    }

    const userUpdates = {};
    if (payload.email !== undefined) {
      const nextEmail = String(payload.email || "").trim();
      if (!validator.email(nextEmail)) {
        const error = new Error("Invalid email format");
        error.status = 400;
        throw error;
      }

      if (nextEmail !== existing.email) {
        const occupied = await trx("users")
          .where("email", nextEmail)
          .andWhereNot("id", Number(existing.userId))
          .first();
        if (occupied) {
          const error = new Error("Email already in use");
          error.status = 409;
          throw error;
        }
      }

      userUpdates.email = nextEmail;
    }

    if (payload.isActive !== undefined) {
      userUpdates.isActive = Boolean(payload.isActive);
    }

    if (payload.password !== undefined) {
      const nextPassword = String(payload.password || "");
      if (nextPassword.length > 0 && nextPassword.length < 8) {
        const error = new Error("Password must be at least 8 characters long");
        error.status = 400;
        throw error;
      }

      if (nextPassword.length > 0) {
        userUpdates.passwordHash = await bcrypt.hash(nextPassword, 10);
      }
    }

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = trx.fn.now();
      await trx("users").where({ id: Number(existing.userId) }).update(userUpdates);
    }

    const sellerUpdates = {};
    SELLER_FIELDS.forEach((field) => {
      if (payload[field] !== undefined) {
        sellerUpdates[field] = payload[field] === null ? null : String(payload[field]).trim();
      }
    });

    if (Object.keys(sellerUpdates).length > 0) {
      sellerUpdates.updatedAt = trx.fn.now();
      await trx("sellers").where({ id: normalizedId }).update(sellerUpdates);
    }

    const updated = await selectSellerColumns(
      trx("sellers").innerJoin("users", "sellers.userId", "users.id"),
    )
      .where("sellers.id", normalizedId)
      .first();

    return mapSellerRow(updated);
  });
}

async function deleteSeller(id) {
  const normalizedId = Number(id);
  if (!normalizedId) {
    const error = new Error("Invalid seller id");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const seller = await trx("sellers").select("id", "userId").where({ id: normalizedId }).first();
    if (!seller) {
      const error = new Error("Seller not found");
      error.status = 404;
      throw error;
    }

    await trx("sellers").where({ id: normalizedId }).del();
    await trx("users").where({ id: Number(seller.userId) }).del();

    return { deleted: true, id: normalizedId };
  });
}

module.exports = {
  createSeller,
  getSellers,
  getSellersList,
  getSellerById,
  updateSeller,
  deleteSeller,
};
