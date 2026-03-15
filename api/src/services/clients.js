const bcrypt = require("bcryptjs");
const db = require("../config/db");
const validator = require("../helpers/validator");

const ALLOWED_SORT_FIELDS = ["id", "name", "email", "city", "createdAt", "isActive"];
const SORT_FIELD_MAP = {
  id: "clients.id",
  name: "clients.name",
  email: "users.email",
  city: "clients.city",
  createdAt: "clients.createdAt",
  isActive: "users.isActive",
};

const CLIENT_FIELDS = [
  "name",
  "phone",
  "companyName",
  "nip",
  "address",
  "city",
  "postalCode",
];

const mapClientRow = (row) => ({
  id: Number(row.id),
  userId: Number(row.userId),
  name: row.name,
  email: row.email,
  phone: row.phone,
  companyName: row.companyName,
  nip: row.nip,
  address: row.address,
  city: row.city,
  postalCode: row.postalCode,
  isActive: Boolean(row.isActive),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const clientsBaseQuery = () => db("clients").innerJoin("users", "clients.userId", "users.id");

const applyFilters = (query, { search, isActive }) => {
  if (isActive !== undefined) {
    query.andWhere("users.isActive", Number(isActive) ? 1 : 0);
  }

  if (search) {
    query.andWhere((qb) => {
      qb.where("clients.name", "like", `%${search}%`)
        .orWhere("clients.companyName", "like", `%${search}%`)
        .orWhere("clients.nip", "like", `%${search}%`)
        .orWhere("users.email", "like", `%${search}%`);
    });
  }
};

const selectClientColumns = (query) =>
  query.select(
    "clients.id",
    "clients.userId",
    "clients.name",
    "clients.phone",
    "clients.companyName",
    "clients.nip",
    "clients.address",
    "clients.city",
    "clients.postalCode",
    "clients.createdAt",
    "clients.updatedAt",
    "users.email",
    "users.isActive",
  );

async function getClientsList({
  page = 1,
  limit = 20,
  search,
  isActive,
  sortBy = "id",
  sortOrder = "asc",
} = {}) {
  const normalizedPage = Number(page) > 0 ? Number(page) : 1;
  const normalizedLimit = Number(limit) > 0 ? Math.min(Number(limit), 100) : 20;
  const normalizedSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : "id";
  const normalizedSortOrder = String(sortOrder).toLowerCase() === "desc" ? "desc" : "asc";
  const sortColumn = SORT_FIELD_MAP[normalizedSortBy] || "clients.id";

  const baseQuery = clientsBaseQuery();
  applyFilters(baseQuery, { search, isActive });

  const countRow = await baseQuery.clone().count({ total: "clients.id" }).first();
  const total = Number(countRow?.total || 0);
  const offset = (normalizedPage - 1) * normalizedLimit;

  const rows = await selectClientColumns(baseQuery.clone())
    .orderBy(sortColumn, normalizedSortOrder)
    .limit(normalizedLimit)
    .offset(offset);

  return {
    data: rows.map(mapClientRow),
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

async function getClientById(id) {
  const normalizedId = Number(id);
  if (!normalizedId) {
    const error = new Error("Invalid client id");
    error.status = 400;
    throw error;
  }

  const row = await selectClientColumns(clientsBaseQuery())
    .where("clients.id", normalizedId)
    .first();

  if (!row) {
    const error = new Error("Client not found");
    error.status = 404;
    throw error;
  }

  return mapClientRow(row);
}

async function createClient({
  email,
  password,
  name,
  phone = null,
  companyName = null,
  nip = null,
  address = null,
  city = null,
  postalCode = null,
  isActive = true,
}) {
  const normalizedEmail = String(email || "").trim();
  const normalizedName = String(name || "").trim();

  if (!normalizedEmail || !password || !normalizedName) {
    const error = new Error("Email, password and name are required");
    error.status = 400;
    throw error;
  }

  if (!validator.email(normalizedEmail)) {
    const error = new Error("Invalid email format");
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

    const passwordHash = await bcrypt.hash(password, 10);
    const insertedUser = await trx("users").insert({
      email: normalizedEmail,
      passwordHash,
      role: "CLIENT",
      isActive: Boolean(isActive),
    });
    const userId = Array.isArray(insertedUser) ? insertedUser[0] : insertedUser;

    const insertedClient = await trx("clients").insert({
      userId,
      name: normalizedName,
      phone,
      companyName,
      nip,
      address,
      city,
      postalCode,
    });
    const clientId = Array.isArray(insertedClient) ? insertedClient[0] : insertedClient;

    const row = await selectClientColumns(
      trx("clients").innerJoin("users", "clients.userId", "users.id"),
    )
      .where("clients.id", clientId)
      .first();

    return mapClientRow(row);
  });
}

async function updateClient(id, payload = {}) {
  const normalizedId = Number(id);
  if (!normalizedId) {
    const error = new Error("Invalid client id");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const existing = await selectClientColumns(
      trx("clients").innerJoin("users", "clients.userId", "users.id"),
    )
      .where("clients.id", normalizedId)
      .first();

    if (!existing) {
      const error = new Error("Client not found");
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

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updatedAt = trx.fn.now();
      await trx("users").where({ id: Number(existing.userId) }).update(userUpdates);
    }

    const clientUpdates = {};
    CLIENT_FIELDS.forEach((field) => {
      if (payload[field] !== undefined) {
        clientUpdates[field] =
          payload[field] === null ? null : String(payload[field]).trim();
      }
    });

    if (Object.keys(clientUpdates).length > 0) {
      clientUpdates.updatedAt = trx.fn.now();
      await trx("clients").where({ id: normalizedId }).update(clientUpdates);
    }

    const updated = await selectClientColumns(
      trx("clients").innerJoin("users", "clients.userId", "users.id"),
    )
      .where("clients.id", normalizedId)
      .first();

    return mapClientRow(updated);
  });
}

async function deleteClient(id) {
  const normalizedId = Number(id);
  if (!normalizedId) {
    const error = new Error("Invalid client id");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const client = await trx("clients").select("id", "userId").where({ id: normalizedId }).first();
    if (!client) {
      const error = new Error("Client not found");
      error.status = 404;
      throw error;
    }

    const [order, activeCart] = await Promise.all([
      trx("orders").select("id").where({ clientId: normalizedId }).first(),
      trx("carts").select("id").where({ clientId: normalizedId }).first(),
    ]);

    if (order) {
      const error = new Error("Nie mozna usunac klienta, bo posiada zamowienia");
      error.status = 409;
      throw error;
    }

    if (activeCart) {
      await trx("cart_items").where({ cartId: Number(activeCart.id) }).del();
      await trx("carts").where({ clientId: normalizedId }).del();
    }

    await trx("clients").where({ id: normalizedId }).del();
    await trx("users").where({ id: Number(client.userId) }).del();

    return { deleted: true, id: normalizedId };
  });
}

module.exports = {
  getClientsList,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
