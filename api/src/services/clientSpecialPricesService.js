const db = require("../config/db");

const PRICE_TYPES = ["amount", "percent"];

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const parseRequiredId = (value, fieldName) => {
  const normalizedId = Number(value);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    const error = new Error(`Invalid ${fieldName}`);
    error.status = 400;
    throw error;
  }

  return normalizedId;
};

const normalizePriceType = (value) => {
  const priceType = String(value || "").trim();

  if (!PRICE_TYPES.includes(priceType)) {
    const error = new Error(`Invalid priceType. Allowed: ${PRICE_TYPES.join(", ")}`);
    error.status = 400;
    throw error;
  }

  return priceType;
};

const ensureClientExists = async (clientId, trx = db) => {
  const normalizedClientId = parseRequiredId(clientId, "clientId");
  const client = await trx("clients").select("id").where({ id: normalizedClientId }).first();

  if (!client) {
    const error = new Error("Client not found");
    error.status = 404;
    throw error;
  }

  return normalizedClientId;
};

const validateAmountValue = (value, fieldName) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    const error = new Error(`${fieldName} must be a number > 0`);
    error.status = 400;
    throw error;
  }

  return roundMoney(numeric);
};

const validatePercentValue = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric === 0) {
    const error = new Error("discountPercent must be a non-zero number");
    error.status = 400;
    throw error;
  }

  return roundMoney(numeric);
};

const calculatePercentPrices = ({ netPrice, grossPrice, discountPercent }) => {
  const multiplier = 1 - Number(discountPercent) / 100;

  return {
    specialNetPrice: roundMoney(Number(netPrice) * multiplier),
    specialGrossPrice: roundMoney(Number(grossPrice) * multiplier),
  };
};

const groupSpecialPriceRows = (rows) =>
  rows.reduce((acc, row) => {
    const productId = Number(row.productId);
    let group = acc.find((item) => Number(item.productId) === productId);

    if (!group) {
      group = {
        productId,
        productName: row.productName,
        sellerId: Number(row.sellerId),
        sellerName: row.sellerName,
        priceType: row.priceType,
        variants: [],
      };
      acc.push(group);
    }

    group.variants.push({
      id: Number(row.id),
      variantId: Number(row.variantId),
      name: row.variantName,
      specialNetPrice: row.specialNetPrice,
      specialGrossPrice: row.specialGrossPrice,
      discountPercent: row.discountPercent,
      vatRate: row.vatRate,
      originalNetPrice: row.originalNetPrice,
      originalGrossPrice: row.originalGrossPrice,
    });

    return acc;
  }, []);

const getByClient = async (clientId, filters = {}) => {
  const normalizedClientId = await ensureClientExists(clientId);
  const normalizedSellerId = filters.sellerId ? parseRequiredId(filters.sellerId, "sellerId") : null;

  const query = db("client_special_prices as csp")
    .innerJoin("product_variants as pv", "pv.id", "csp.variantId")
    .innerJoin("products as p", "p.id", "csp.productId")
    .leftJoin("sellers as s", "s.id", "p.sellerId")
    .select(
      "csp.id",
      "csp.variantId",
      "csp.productId",
      "csp.priceType",
      "csp.specialNetPrice",
      "csp.specialGrossPrice",
      "csp.discountPercent",
      "pv.name as variantName",
      "pv.vatRate",
      "pv.netPrice as originalNetPrice",
      "pv.grossPrice as originalGrossPrice",
      "p.name as productName",
      "p.sellerId",
      "s.companyName as sellerName",
    )
    .where("csp.clientId", normalizedClientId)
    .orderBy("p.name", "asc")
    .orderBy("pv.position", "asc")
    .orderBy("pv.id", "asc");

  if (normalizedSellerId) {
    query.andWhere("p.sellerId", normalizedSellerId);
  }

  const rows = await query;
  return groupSpecialPriceRows(rows);
};

const upsertVariantPrices = async (clientId, productId, priceType, variants) => {
  const normalizedClientId = parseRequiredId(clientId, "clientId");
  const normalizedProductId = parseRequiredId(productId, "productId");
  const normalizedPriceType = normalizePriceType(priceType);

  if (!Array.isArray(variants) || variants.length === 0) {
    const error = new Error("variants must be a non-empty array");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    await ensureClientExists(normalizedClientId, trx);

    const requestedVariantIds = variants.map((variant) =>
      parseRequiredId(variant?.variantId, "variantId"),
    );

    const variantRows = await trx("product_variants")
      .select("id", "productId", "netPrice", "grossPrice", "vatRate")
      .where({ productId: normalizedProductId })
      .whereIn("id", requestedVariantIds);

    const variantById = variantRows.reduce((acc, row) => {
      acc[Number(row.id)] = row;
      return acc;
    }, {});

    if (variantRows.length !== requestedVariantIds.length) {
      const error = new Error("One or more variants do not belong to selected product");
      error.status = 400;
      throw error;
    }

    let upserted = 0;
    let removed = 0;
    let skipped = 0;

    for (const variantPayload of variants) {
      const variantId = parseRequiredId(variantPayload?.variantId, "variantId");
      const variantRow = variantById[variantId];

      if (variantPayload?.remove) {
        const deleted = await trx("client_special_prices")
          .where({
            clientId: normalizedClientId,
            variantId,
          })
          .del();
        removed += Number(deleted || 0);
        continue;
      }

      if (normalizedPriceType === "amount") {
        const specialNetPrice = validateAmountValue(
          variantPayload?.specialNetPrice,
          "specialNetPrice",
        );
        const specialGrossPrice = validateAmountValue(
          variantPayload?.specialGrossPrice,
          "specialGrossPrice",
        );

        const matchesOriginalPrice =
          specialNetPrice === roundMoney(variantRow.netPrice) &&
          specialGrossPrice === roundMoney(variantRow.grossPrice);

        if (matchesOriginalPrice) {
          const deleted = await trx("client_special_prices")
            .where({
              clientId: normalizedClientId,
              variantId,
            })
            .del();
          removed += Number(deleted || 0);
          skipped += 1;
          continue;
        }

        await trx("client_special_prices")
          .insert({
            clientId: normalizedClientId,
            variantId,
            productId: normalizedProductId,
            priceType: normalizedPriceType,
            specialNetPrice,
            specialGrossPrice,
            discountPercent: null,
            updatedAt: trx.fn.now(),
          })
          .onConflict(["clientId", "variantId"])
          .merge({
            productId: normalizedProductId,
            priceType: normalizedPriceType,
            specialNetPrice,
            specialGrossPrice,
            discountPercent: null,
            updatedAt: trx.fn.now(),
          });
        upserted += 1;
        continue;
      }

      const discountPercent = validatePercentValue(variantPayload?.discountPercent);
      const { specialNetPrice, specialGrossPrice } = calculatePercentPrices({
        netPrice: variantRow.netPrice,
        grossPrice: variantRow.grossPrice,
        discountPercent,
      });

      const matchesOriginalPrice =
        specialNetPrice === roundMoney(variantRow.netPrice) &&
        specialGrossPrice === roundMoney(variantRow.grossPrice);

      if (matchesOriginalPrice) {
        const deleted = await trx("client_special_prices")
          .where({
            clientId: normalizedClientId,
            variantId,
          })
          .del();
        removed += Number(deleted || 0);
        skipped += 1;
        continue;
      }

      await trx("client_special_prices")
        .insert({
          clientId: normalizedClientId,
          variantId,
          productId: normalizedProductId,
          priceType: normalizedPriceType,
          specialNetPrice: null,
          specialGrossPrice: null,
          discountPercent,
          updatedAt: trx.fn.now(),
        })
        .onConflict(["clientId", "variantId"])
        .merge({
          productId: normalizedProductId,
          priceType: normalizedPriceType,
          specialNetPrice: null,
          specialGrossPrice: null,
          discountPercent,
          updatedAt: trx.fn.now(),
        });
      upserted += 1;
    }

    return {
      upserted,
      removed,
      skipped,
    };
  });
};

const deleteByProduct = async (clientId, productId) => {
  const normalizedClientId = await ensureClientExists(clientId);
  const normalizedProductId = parseRequiredId(productId, "productId");

  const deleted = await db("client_special_prices")
    .where({
      clientId: normalizedClientId,
      productId: normalizedProductId,
    })
    .del();

  return { deleted: Number(deleted || 0) };
};

module.exports = {
  getByClient,
  upsertVariantPrices,
  deleteByProduct,
};
