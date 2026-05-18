const db = require("../config/db");

const DEFAULT_OPENING_DISCOUNT_PERCENT = 20;
let schemaReady = false;
let activeDiscountCache = null;
let activeDiscountCacheUntil = 0;

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const ensureSchema = async (trx = db) => {
  if (schemaReady) return;

  const hasTable = await trx.schema.hasTable("global_discount_rules");
  if (!hasTable) {
    await trx.schema.createTable("global_discount_rules", (table) => {
      table.increments("id").primary();
      table.string("name", 120).notNullable();
      table.decimal("discountPercent", 8, 2).notNullable().defaultTo(0);
      table.boolean("isActive").notNullable().defaultTo(false);
      table.timestamp("startsAt").nullable();
      table.timestamp("endsAt").nullable();
      table.timestamp("createdAt").notNullable().defaultTo(trx.fn.now());
      table.timestamp("updatedAt").notNullable().defaultTo(trx.fn.now());
    });
  }

  schemaReady = true;
};

const normalizeDiscountPercent = (value) => {
  const discountPercent = Number(value);

  if (!Number.isFinite(discountPercent) || discountPercent <= 0) return 0;
  if (discountPercent >= 100) return 100;

  return discountPercent;
};

const mapDiscountRule = (row) => {
  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name || "",
    discountPercent: normalizeDiscountPercent(row.discountPercent),
    isActive: Boolean(row.isActive),
    startsAt: row.startsAt || null,
    endsAt: row.endsAt || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
};

const getActiveGlobalDiscount = async (trx = db) => {
  await ensureSchema(trx);

  const now = Date.now();
  if (activeDiscountCacheUntil > now) return activeDiscountCache;

  const row = await trx("global_discount_rules")
    .select("*")
    .where({ isActive: 1 })
    .andWhere((qb) => {
      qb.whereNull("startsAt").orWhere("startsAt", "<=", trx.fn.now());
    })
    .andWhere((qb) => {
      qb.whereNull("endsAt").orWhere("endsAt", ">=", trx.fn.now());
    })
    .orderBy("updatedAt", "desc")
    .orderBy("id", "desc")
    .first();

  activeDiscountCache = mapDiscountRule(row);
  activeDiscountCacheUntil = now + 30 * 1000;
  return activeDiscountCache;
};

const getOpeningDiscountPercent = async (trx = db) => {
  const rule = await getActiveGlobalDiscount(trx);
  return normalizeDiscountPercent(rule?.discountPercent);
};

const applyOpeningDiscount = async ({ netPrice, grossPrice }, trx = db) => {
  const activeDiscount = await getActiveGlobalDiscount(trx);
  const discountPercent = normalizeDiscountPercent(activeDiscount?.discountPercent);
  const originalNetPrice = roundMoney(netPrice);
  const originalGrossPrice = roundMoney(grossPrice);

  if (discountPercent <= 0) {
    return {
      netPrice: originalNetPrice,
      grossPrice: originalGrossPrice,
    };
  }

  const multiplier = 1 - discountPercent / 100;

  return {
    netPrice: roundMoney(originalNetPrice * multiplier),
    grossPrice: roundMoney(originalGrossPrice * multiplier),
    originalNetPrice,
    originalGrossPrice,
    campaignDiscountPercent: roundMoney(discountPercent),
    campaignDiscountType: "global",
    campaignDiscountName: activeDiscount?.name || null,
  };
};

const getGrossBeforeOpeningDiscount = async (discountedGrossPrice, trx = db) => {
  const discountPercent = await getOpeningDiscountPercent(trx);
  const discountedGross = roundMoney(discountedGrossPrice);

  if (discountPercent <= 0 || discountPercent >= 100) return discountedGross;

  return roundMoney(discountedGross / (1 - discountPercent / 100));
};

const listGlobalDiscounts = async () => {
  await ensureSchema();
  const rows = await db("global_discount_rules")
    .select("*")
    .orderBy("isActive", "desc")
    .orderBy("updatedAt", "desc")
    .orderBy("id", "desc");

  return rows.map(mapDiscountRule);
};

const createGlobalDiscount = async (payload = {}) => {
  await ensureSchema();
  const name = String(payload.name || "").trim();
  const discountPercent = normalizeDiscountPercent(payload.discountPercent);

  if (!name) {
    const error = new Error("name is required");
    error.status = 400;
    throw error;
  }

  if (discountPercent <= 0 || discountPercent >= 100) {
    const error = new Error("discountPercent must be greater than 0 and lower than 100");
    error.status = 400;
    throw error;
  }

  const insertedId = await db.transaction(async (trx) => {
    const result = await trx("global_discount_rules").insert({
      name,
      discountPercent,
      isActive: Boolean(payload.isActive),
      startsAt: payload.startsAt || null,
      endsAt: payload.endsAt || null,
    });
    const id = Array.isArray(result) ? result[0] : result;

    if (payload.isActive) {
      await trx("global_discount_rules")
        .whereNot({ id: Number(id) })
        .update({ isActive: 0, updatedAt: trx.fn.now() });
    }

    return id;
  });

  activeDiscountCacheUntil = 0;
  const row = await db("global_discount_rules").select("*").where({ id: Number(insertedId) }).first();
  return mapDiscountRule(row);
};

const updateGlobalDiscount = async ({ discountId, payload = {} }) => {
  await ensureSchema();
  const existing = await db("global_discount_rules").where({ id: Number(discountId) }).first();
  if (!existing) {
    const error = new Error("Discount not found");
    error.status = 404;
    throw error;
  }

  const updates = { updatedAt: db.fn.now() };
  if (payload.name !== undefined) {
    const name = String(payload.name || "").trim();
    if (!name) {
      const error = new Error("name is required");
      error.status = 400;
      throw error;
    }
    updates.name = name;
  }
  if (payload.discountPercent !== undefined) {
    const discountPercent = normalizeDiscountPercent(payload.discountPercent);
    if (discountPercent <= 0 || discountPercent >= 100) {
      const error = new Error("discountPercent must be greater than 0 and lower than 100");
      error.status = 400;
      throw error;
    }
    updates.discountPercent = discountPercent;
  }
  if (payload.isActive !== undefined) updates.isActive = Boolean(payload.isActive);
  if (payload.startsAt !== undefined) updates.startsAt = payload.startsAt || null;
  if (payload.endsAt !== undefined) updates.endsAt = payload.endsAt || null;

  await db.transaction(async (trx) => {
    await trx("global_discount_rules").where({ id: Number(discountId) }).update(updates);

    if (updates.isActive) {
      await trx("global_discount_rules")
        .whereNot({ id: Number(discountId) })
        .update({ isActive: 0, updatedAt: trx.fn.now() });
    }
  });

  activeDiscountCacheUntil = 0;
  const row = await db("global_discount_rules").select("*").where({ id: Number(discountId) }).first();
  return mapDiscountRule(row);
};

const deleteGlobalDiscount = async ({ discountId }) => {
  await ensureSchema();
  const deleted = await db("global_discount_rules").where({ id: Number(discountId) }).del();
  if (!deleted) {
    const error = new Error("Discount not found");
    error.status = 404;
    throw error;
  }
  activeDiscountCacheUntil = 0;
  return { ok: true, id: Number(discountId) };
};

module.exports = {
  applyOpeningDiscount,
  createGlobalDiscount,
  deleteGlobalDiscount,
  getActiveGlobalDiscount,
  getGrossBeforeOpeningDiscount,
  getOpeningDiscountPercent,
  listGlobalDiscounts,
  updateGlobalDiscount,
};
