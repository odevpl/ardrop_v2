const db = require("../config/db");

const sanitizeNullableString = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return String(value).trim();
};

const resolveClientIdByUserId = async (userId, trx = db) => {
  const client = await trx("clients")
    .select("id")
    .where({ userId: Number(userId) })
    .first();

  if (!client) {
    const error = new Error("Client profile not found");
    error.status = 404;
    throw error;
  }

  return Number(client.id);
};

const mapAddress = (row) => ({
  id: row.id,
  clientId: Number(row.clientId),
  label: row.label || "",
  recipientName: row.recipientName || "",
  phone: row.phone || "",
  addressLine1: row.addressLine1 || "",
  addressLine2: row.addressLine2 || "",
  city: row.city || "",
  postalCode: row.postalCode || "",
  countryCode: row.countryCode || "PL",
  isDefault: Boolean(row.isDefault),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const getMyDeliveryAddresses = async ({ userId }) => {
  const clientId = await resolveClientIdByUserId(userId);
  const rows = await db("clients_delivery_address")
    .where({ clientId })
    .orderBy([{ column: "isDefault", order: "desc" }, { column: "id", order: "desc" }]);

  return rows.map(mapAddress);
};

const createMyDeliveryAddress = async ({ userId, payload = {} }) => {
  const clientId = await resolveClientIdByUserId(userId);

  const requiredFields = ["recipientName", "addressLine1", "city", "postalCode"];
  requiredFields.forEach((field) => {
    if (!payload[field] || !String(payload[field]).trim()) {
      const error = new Error(`${field} is required`);
      error.status = 400;
      throw error;
    }
  });

  return db.transaction(async (trx) => {
    const isDefault = Boolean(payload.isDefault);

    if (isDefault) {
      await trx("clients_delivery_address").where({ clientId }).update({
        isDefault: 0,
        updatedAt: trx.fn.now(),
      });
    }

    const inserted = await trx("clients_delivery_address").insert({
      clientId,
      label: sanitizeNullableString(payload.label) || null,
      recipientName: String(payload.recipientName).trim(),
      phone: sanitizeNullableString(payload.phone) || null,
      addressLine1: String(payload.addressLine1).trim(),
      addressLine2: sanitizeNullableString(payload.addressLine2) || null,
      city: String(payload.city).trim(),
      postalCode: String(payload.postalCode).trim(),
      countryCode: sanitizeNullableString(payload.countryCode) || "PL",
      isDefault: isDefault ? 1 : 0,
    });

    const id = Array.isArray(inserted) ? inserted[0] : inserted;
    const row = await trx("clients_delivery_address").where({ id }).first();
    return mapAddress(row);
  });
};

const updateMyDeliveryAddress = async ({ userId, addressId, payload = {} }) => {
  const clientId = await resolveClientIdByUserId(userId);
  const normalizedAddressId = addressId !== undefined && addressId !== null
    ? String(addressId).trim()
    : "";
  if (!normalizedAddressId) {
    const error = new Error("addressId is required");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const existing = await trx("clients_delivery_address")
      .where({ id: normalizedAddressId, clientId })
      .first();

    if (!existing) {
      const error = new Error("Delivery address not found");
      error.status = 404;
      throw error;
    }

    const updates = {};
    [
      "label",
      "recipientName",
      "phone",
      "addressLine1",
      "addressLine2",
      "city",
      "postalCode",
      "countryCode",
    ].forEach((field) => {
      const next = sanitizeNullableString(payload[field]);
      if (next !== undefined) {
        updates[field] = next;
      }
    });

    if (payload.isDefault !== undefined) {
      updates.isDefault = payload.isDefault ? 1 : 0;
    }

    if (Object.keys(updates).length === 0) {
      return mapAddress(existing);
    }

    if (updates.isDefault === 1) {
      await trx("clients_delivery_address")
        .where({ clientId })
        .andWhereNot({ id: normalizedAddressId })
        .update({
          isDefault: 0,
          updatedAt: trx.fn.now(),
        });
    }

    updates.updatedAt = trx.fn.now();
    await trx("clients_delivery_address")
      .where({ id: normalizedAddressId, clientId })
      .update(updates);

    const updated = await trx("clients_delivery_address")
      .where({ id: normalizedAddressId, clientId })
      .first();

    return mapAddress(updated);
  });
};

const deleteMyDeliveryAddress = async ({ userId, addressId }) => {
  const clientId = await resolveClientIdByUserId(userId);
  const normalizedAddressId = addressId !== undefined && addressId !== null
    ? String(addressId).trim()
    : "";
  if (!normalizedAddressId) {
    const error = new Error("addressId is required");
    error.status = 400;
    throw error;
  }

  const deleted = await db("clients_delivery_address")
    .where({ id: normalizedAddressId, clientId })
    .del();

  if (!deleted) {
    const error = new Error("Delivery address not found");
    error.status = 404;
    throw error;
  }

  return { ok: true };
};

module.exports = {
  getMyDeliveryAddresses,
  createMyDeliveryAddress,
  updateMyDeliveryAddress,
  deleteMyDeliveryAddress,
};
