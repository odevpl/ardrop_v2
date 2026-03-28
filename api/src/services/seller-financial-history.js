const db = require("../config/db");

const resolveSellerIdByUserId = async (userId, trx = db) => {
  const seller = await trx("sellers").select("id").where({ userId: Number(userId) }).first();
  if (!seller) {
    const error = new Error("Seller profile not found");
    error.status = 404;
    throw error;
  }

  return Number(seller.id);
};

const normalizePage = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const normalizeLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.min(parsed, 100);
};

const normalizeSettlementMonth = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const normalized = String(value).trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    const error = new Error("settlementMonth must match YYYY-MM");
    error.status = 400;
    throw error;
  }

  return normalized;
};

const buildSettlementMonth = (value) => {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const mapEntry = (row) => ({
  id: Number(row.id),
  sellerId: Number(row.sellerId),
  orderId: row.orderId === null || row.orderId === undefined ? null : Number(row.orderId),
  orderGroupId:
    row.orderGroupId === null || row.orderGroupId === undefined ? null : Number(row.orderGroupId),
  type: row.type,
  eventDate: row.eventDate,
  settlementMonth: row.settlementMonth,
  currency: row.currency || "PLN",
  grossAmount: Number(row.grossAmount || 0),
  notes: row.notes || "",
  createdAt: row.createdAt || null,
  updatedAt: row.updatedAt || null,
});

const createOrderIncomeEntry = async (
  {
    sellerId,
    orderId,
    orderGroupId = null,
    grossAmount,
    currency = "PLN",
    eventDate = null,
    notes = null,
  },
  trx = db,
) => {
  const normalizedSellerId = Number(sellerId);
  const normalizedOrderId = Number(orderId);
  const normalizedGrossAmount = Number(grossAmount);

  if (!normalizedSellerId || !normalizedOrderId) {
    const error = new Error("sellerId and orderId are required");
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(normalizedGrossAmount)) {
    const error = new Error("grossAmount must be a number");
    error.status = 400;
    throw error;
  }

  const normalizedEventDate = eventDate || trx.fn.now();
  const settlementMonth = buildSettlementMonth(eventDate || new Date());

  await trx("seller_financial_entries")
    .insert({
      sellerId: normalizedSellerId,
      orderId: normalizedOrderId,
      orderGroupId: orderGroupId ? Number(orderGroupId) : null,
      type: "order_income",
      eventDate: normalizedEventDate,
      settlementMonth,
      currency: String(currency || "PLN").trim() || "PLN",
      grossAmount: Number(normalizedGrossAmount.toFixed(2)),
      notes: notes ? String(notes).trim() : null,
    })
    .onConflict(["orderId", "type"])
    .ignore();
};

const getSellerFinancialHistory = async ({
  userId,
  page = 1,
  limit = 20,
  settlementMonth,
}) => {
  const sellerId = await resolveSellerIdByUserId(userId);
  const normalizedPage = normalizePage(page);
  const normalizedLimit = normalizeLimit(limit);
  const normalizedSettlementMonth = normalizeSettlementMonth(settlementMonth);
  const offset = (normalizedPage - 1) * normalizedLimit;

  const baseQuery = db("seller_financial_entries").where({ sellerId });
  if (normalizedSettlementMonth) {
    baseQuery.andWhere("settlementMonth", normalizedSettlementMonth);
  }

  const [countRow, entriesRows, totalsRows] = await Promise.all([
    baseQuery.clone().count({ total: "id" }).first(),
    baseQuery
      .clone()
      .select(
        "id",
        "sellerId",
        "orderId",
        "orderGroupId",
        "type",
        "eventDate",
        "settlementMonth",
        "currency",
        "grossAmount",
        "notes",
        "createdAt",
        "updatedAt",
      )
      .orderBy("eventDate", "desc")
      .orderBy("id", "desc")
      .limit(normalizedLimit)
      .offset(offset),
    db("seller_financial_entries")
      .where({ sellerId })
      .select("settlementMonth", "currency")
      .sum({ totalGrossAmount: "grossAmount" })
      .count({ entriesCount: "id" })
      .groupBy("settlementMonth", "currency")
      .orderBy("settlementMonth", "desc"),
  ]);

  return {
    data: entriesRows.map(mapEntry),
    meta: {
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total: Number(countRow?.total || 0),
        totalPages: Number(countRow?.total || 0) === 0 ? 0 : Math.ceil(Number(countRow.total) / normalizedLimit),
        hasNext: normalizedPage * normalizedLimit < Number(countRow?.total || 0),
        hasPrev: normalizedPage > 1,
      },
      filter: {
        settlementMonth: normalizedSettlementMonth,
      },
    },
    summary: {
      monthly: (totalsRows || []).map((row) => ({
        settlementMonth: row.settlementMonth,
        currency: row.currency || "PLN",
        entriesCount: Number(row.entriesCount || 0),
        totalGrossAmount: Number(row.totalGrossAmount || 0),
      })),
    },
  };
};

module.exports = {
  createOrderIncomeEntry,
  getSellerFinancialHistory,
};
