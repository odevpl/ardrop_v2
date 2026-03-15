const db = require("../config/db");
const validator = require("../helpers/validator");

const PROFILE_SELECT = [
  "users.id as userId",
  "users.email",
  "users.role",
  "users.isActive",
  "clients.id as clientId",
  "clients.name",
  "clients.phone",
  "clients.companyName",
  "clients.nip",
  "clients.address",
  "clients.city",
  "clients.postalCode",
  "clients.createdAt as clientCreatedAt",
  "clients.updatedAt as clientUpdatedAt",
];

const mapProfile = (row) => ({
  user: {
    id: Number(row.userId),
    email: row.email,
    role: row.role,
    isActive: Boolean(row.isActive),
  },
  client: {
    id: Number(row.clientId),
    name: row.name || "",
    phone: row.phone || "",
    companyName: row.companyName || "",
    nip: row.nip || "",
    address: row.address || "",
    city: row.city || "",
    postalCode: row.postalCode || "",
    createdAt: row.clientCreatedAt,
    updatedAt: row.clientUpdatedAt,
  },
});

const REQUIRED_PROFILE_FIELDS = [
  { key: "name", label: "name" },
  { key: "phone", label: "phone" },
  { key: "nip", label: "nip" },
  { key: "address", label: "address" },
  { key: "city", label: "city" },
  { key: "postalCode", label: "postalCode" },
];

const isBlank = (value) => String(value || "").trim() === "";

const getCurrentClientProfile = async ({ userId }) => {
  const profile = await db("users")
    .innerJoin("clients", "clients.userId", "users.id")
    .select(PROFILE_SELECT)
    .where("users.id", Number(userId))
    .first();

  if (!profile) {
    const error = new Error("Client profile not found");
    error.status = 404;
    throw error;
  }

  return mapProfile(profile);
};

const updateCurrentClientProfile = async ({ userId, payload = {} }) => {
  const normalizedUserId = Number(userId);
  if (!normalizedUserId) {
    const error = new Error("Invalid user");
    error.status = 400;
    throw error;
  }

  const nextEmail = payload.email !== undefined ? String(payload.email).trim() : undefined;
  if (nextEmail !== undefined && !validator.email(nextEmail)) {
    const error = new Error("Invalid email format");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const existing = await trx("users")
      .innerJoin("clients", "clients.userId", "users.id")
      .select(PROFILE_SELECT)
      .where("users.id", normalizedUserId)
      .first();

    if (!existing) {
      const error = new Error("Client profile not found");
      error.status = 404;
      throw error;
    }

    const userUpdates = {};
    if (nextEmail !== undefined && nextEmail !== existing.email) {
      const occupied = await trx("users")
        .where("email", nextEmail)
        .andWhereNot("id", normalizedUserId)
        .first();
      if (occupied) {
        const error = new Error("Email already in use");
        error.status = 409;
        throw error;
      }
      userUpdates.email = nextEmail;
      userUpdates.updatedAt = trx.fn.now();
    }

    const clientUpdates = {};
    const allowedClientFields = [
      "name",
      "phone",
      "companyName",
      "nip",
      "address",
      "city",
      "postalCode",
    ];

    allowedClientFields.forEach((field) => {
      if (payload[field] !== undefined) {
        clientUpdates[field] = payload[field] === null ? null : String(payload[field]).trim();
      }
    });

    if (clientUpdates.nip !== undefined) {
      const normalizedNip = validator.normalizeNip(clientUpdates.nip);
      if (!validator.nip(normalizedNip)) {
        const error = new Error("Invalid NIP format");
        error.status = 400;
        throw error;
      }

      const occupiedNip = await trx("clients")
        .where({ nip: normalizedNip })
        .andWhereNot("userId", normalizedUserId)
        .first();

      if (occupiedNip) {
        const error = new Error("NIP already in use");
        error.status = 409;
        throw error;
      }

      clientUpdates.nip = normalizedNip;
    }

    const mergedProfile = {
      name: clientUpdates.name !== undefined ? clientUpdates.name : existing.name,
      phone: clientUpdates.phone !== undefined ? clientUpdates.phone : existing.phone,
      nip: clientUpdates.nip !== undefined ? clientUpdates.nip : existing.nip,
      address: clientUpdates.address !== undefined ? clientUpdates.address : existing.address,
      city: clientUpdates.city !== undefined ? clientUpdates.city : existing.city,
      postalCode:
        clientUpdates.postalCode !== undefined
          ? clientUpdates.postalCode
          : existing.postalCode,
    };

    const missingFields = REQUIRED_PROFILE_FIELDS.filter(({ key }) =>
      isBlank(mergedProfile[key]),
    ).map(({ label }) => label);

    if (missingFields.length > 0) {
      const error = new Error(
        `Profile is incomplete. Missing required fields: ${missingFields.join(", ")}`,
      );
      error.status = 400;
      throw error;
    }

    if (Object.keys(userUpdates).length > 0) {
      await trx("users").where({ id: normalizedUserId }).update(userUpdates);
    }

    if (Object.keys(clientUpdates).length > 0) {
      clientUpdates.updatedAt = trx.fn.now();
      await trx("clients").where({ userId: normalizedUserId }).update(clientUpdates);
    }

    const updated = await trx("users")
      .innerJoin("clients", "clients.userId", "users.id")
      .select(PROFILE_SELECT)
      .where("users.id", normalizedUserId)
      .first();

    return mapProfile(updated);
  });
};

module.exports = {
  getCurrentClientProfile,
  updateCurrentClientProfile,
};
