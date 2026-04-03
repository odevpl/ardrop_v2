const db = require("../config/db");

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const parseConfig = (rawConfig) => {
  if (!rawConfig) return {};
  if (typeof rawConfig === "object" && !Array.isArray(rawConfig)) return rawConfig;

  try {
    const parsed = JSON.parse(rawConfig);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
};

const mapDiscountRule = (row) => ({
  id: Number(row.id),
  sellerId: Number(row.sellerId),
  ruleType: String(row.ruleType || "").trim(),
  name: row.name || "",
  isActive: Boolean(row.isActive),
  config: parseConfig(row.configJson),
  createdAt: row.createdAt || null,
  updatedAt: row.updatedAt || null,
});

const getDiscountRulesBySellerId = async ({ sellerIds }, trx = db) => {
  const normalizedSellerIds = [...new Set((sellerIds || []).map((value) => Number(value)).filter(Boolean))];
  if (normalizedSellerIds.length === 0) return {};

  const rows = await trx("seller_discount_rules")
    .select("id", "sellerId", "ruleType", "name", "isActive", "configJson", "createdAt", "updatedAt")
    .whereIn("sellerId", normalizedSellerIds)
    .orderBy("sellerId", "asc")
    .orderBy("id", "asc");

  return rows.reduce((acc, row) => {
    const sellerId = Number(row.sellerId);
    if (!acc[sellerId]) acc[sellerId] = [];
    acc[sellerId].push(mapDiscountRule(row));
    return acc;
  }, {});
};

const getClientOrderCountsBySellerId = async ({ clientId, sellerIds }, trx = db) => {
  const normalizedClientId = Number(clientId);
  const normalizedSellerIds = [...new Set((sellerIds || []).map((value) => Number(value)).filter(Boolean))];

  if (!normalizedClientId || normalizedSellerIds.length === 0) return {};

  const rows = await trx("orders")
    .select("sellerId")
    .count({ ordersCount: "*" })
    .where({
      clientId: normalizedClientId,
    })
    .whereNot("status", "cancelled")
    .whereIn("sellerId", normalizedSellerIds)
    .groupBy("sellerId");

  return rows.reduce((acc, row) => {
    acc[Number(row.sellerId)] = Number(row.ordersCount || 0);
    return acc;
  }, {});
};

const buildRuleCandidate = ({ rule, shipmentItems, clientOrdersCount }) => {
  const config = rule?.config || {};
  const thresholdValue =
    config.thresholdValue === null || config.thresholdValue === undefined
      ? null
      : Number(config.thresholdValue);
  const discountPercent =
    config.discountPercent === null || config.discountPercent === undefined
      ? null
      : Number(config.discountPercent);
  const bonusLabel = String(config.bonusLabel || "").trim() || null;
  const selectedVariantIds = Array.isArray(config.selectedVariantIds)
    ? [...new Set(config.selectedVariantIds.map((value) => Number(value)).filter(Boolean))]
    : [];
  const safeShipmentItems = Array.isArray(shipmentItems) ? shipmentItems : [];
  const shipmentItemsGross = roundMoney(
    safeShipmentItems.reduce((sum, item) => sum + Number(item.lineGross || 0), 0),
  );

  let eligibleItems = [];
  let matchedQuantity = 0;
  let isApplicable = false;

  switch (rule.ruleType) {
    case "cart_threshold":
      eligibleItems = safeShipmentItems;
      isApplicable =
        discountPercent > 0 && shipmentItemsGross >= Number(thresholdValue || 0);
      break;
    case "quantity_threshold":
      eligibleItems =
        selectedVariantIds.length > 0
          ? safeShipmentItems.filter((item) => selectedVariantIds.includes(Number(item.variantId)))
          : safeShipmentItems;
      matchedQuantity = eligibleItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      isApplicable = discountPercent > 0 && matchedQuantity >= Number(thresholdValue || 0);
      break;
    case "first_purchase":
      eligibleItems = safeShipmentItems;
      isApplicable = discountPercent > 0 && Number(clientOrdersCount || 0) === 0;
      break;
    case "loyal_customer":
      eligibleItems = safeShipmentItems;
      isApplicable = discountPercent > 0 && Number(clientOrdersCount || 0) > 0;
      break;
    case "free_bonus":
      eligibleItems = safeShipmentItems;
      isApplicable = Boolean(bonusLabel) && shipmentItemsGross >= Number(thresholdValue || 0);
      break;
    default:
      eligibleItems = [];
      isApplicable = false;
      break;
  }

  if (!isApplicable) return null;

  const eligibleNet = roundMoney(
    eligibleItems.reduce((sum, item) => sum + Number(item.lineNet || 0), 0),
  );
  const eligibleGross = roundMoney(
    eligibleItems.reduce((sum, item) => sum + Number(item.lineGross || 0), 0),
  );
  const discountNet = discountPercent > 0 ? roundMoney(eligibleNet * (discountPercent / 100)) : 0;
  const discountGross =
    discountPercent > 0 ? roundMoney(eligibleGross * (discountPercent / 100)) : 0;

  return {
    ruleId: Number(rule.id),
    sellerId: Number(rule.sellerId),
    ruleType: rule.ruleType,
    name: rule.name || "",
    thresholdValue,
    discountPercent,
    bonusLabel,
    selectedVariantIds,
    matchedQuantity,
    eligibleItemsCount: eligibleItems.length,
    eligibleNet,
    eligibleGross,
    discountNet,
    discountGross,
    kind: rule.ruleType === "free_bonus" ? "bonus" : "discount",
  };
};

const chooseBestCandidate = (candidates) => {
  const safeCandidates = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
  if (safeCandidates.length === 0) return null;

  const discountCandidates = safeCandidates.filter((candidate) => candidate.kind === "discount");
  if (discountCandidates.length > 0) {
    return discountCandidates.sort((left, right) => {
      if (right.discountGross !== left.discountGross) {
        return right.discountGross - left.discountGross;
      }
      if (right.discountPercent !== left.discountPercent) {
        return Number(right.discountPercent || 0) - Number(left.discountPercent || 0);
      }
      return Number(left.ruleId || 0) - Number(right.ruleId || 0);
    })[0];
  }

  return safeCandidates.sort((left, right) => Number(left.ruleId || 0) - Number(right.ruleId || 0))[0];
};

const summarizeShipmentDiscount = ({ sellerId, shipmentItems, rules, clientOrdersCount }) => {
  const candidates = (Array.isArray(rules) ? rules : [])
    .filter((rule) => rule?.isActive)
    .map((rule) =>
      buildRuleCandidate({
        rule,
        shipmentItems,
        clientOrdersCount,
      }),
    )
    .filter(Boolean);

  const bestCandidate = chooseBestCandidate(candidates);

  return {
    sellerId: Number(sellerId),
    clientOrdersCount: Number(clientOrdersCount || 0),
    availableRulesCount: Array.isArray(rules) ? rules.length : 0,
    appliedRule: bestCandidate,
    discountNet: roundMoney(bestCandidate?.discountNet || 0),
    discountGross: roundMoney(bestCandidate?.discountGross || 0),
    bonusLabel: bestCandidate?.bonusLabel || null,
  };
};

const evaluateShipmentDiscounts = async ({ clientId, shipments }, trx = db) => {
  const safeShipments = Array.isArray(shipments) ? shipments : [];
  const sellerIds = [...new Set(safeShipments.map((shipment) => Number(shipment.sellerId)).filter(Boolean))];

  if (sellerIds.length === 0) {
    return {
      bySellerId: {},
      totals: {
        discountNet: 0,
        discountGross: 0,
      },
    };
  }

  const [rulesBySellerId, clientOrderCountsBySellerId] = await Promise.all([
    getDiscountRulesBySellerId({ sellerIds }, trx),
    getClientOrderCountsBySellerId({ clientId, sellerIds }, trx),
  ]);

  const bySellerId = {};
  safeShipments.forEach((shipment) => {
    const sellerId = Number(shipment.sellerId);
    const summary = summarizeShipmentDiscount({
      sellerId,
      shipmentItems: shipment.items || [],
      rules: rulesBySellerId[sellerId] || [],
      clientOrdersCount: clientOrderCountsBySellerId[sellerId] || 0,
    });

    bySellerId[sellerId] = {
      ...summary,
      snapshot:
        summary.appliedRule || summary.bonusLabel
          ? {
              sellerId,
              clientOrdersCount: summary.clientOrdersCount,
              appliedAt: new Date().toISOString(),
              appliedRule: summary.appliedRule,
            }
          : null,
    };
  });

  const totals = Object.values(bySellerId).reduce(
    (acc, summary) => {
      acc.discountNet += Number(summary.discountNet || 0);
      acc.discountGross += Number(summary.discountGross || 0);
      return acc;
    },
    { discountNet: 0, discountGross: 0 },
  );

  return {
    bySellerId,
    totals: {
      discountNet: roundMoney(totals.discountNet),
      discountGross: roundMoney(totals.discountGross),
    },
  };
};

module.exports = {
  evaluateShipmentDiscounts,
};
