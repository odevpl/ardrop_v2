const db = require("../config/db");
const discountRulesService = require("./discount-rules");

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

const normalizeQuantity = (quantity) => {
  const parsed = Number(quantity);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error("quantity must be a positive integer");
    error.status = 400;
    throw error;
  }
  return parsed;
};

let cartShipmentCapabilitiesCache = null;

const getCartShipmentCapabilities = async (trx = db) => {
  if (cartShipmentCapabilitiesCache) return cartShipmentCapabilitiesCache;

  const hasShippingMethodId = await trx.schema.hasColumn("cart_shipments", "shippingMethodId");
  cartShipmentCapabilitiesCache = { hasShippingMethodId };
  return cartShipmentCapabilitiesCache;
};

const getSellerSalesSettingsBySellerIds = async (sellerIds, trx = db) => {
  const normalizedSellerIds = [...new Set((sellerIds || []).map((value) => Number(value)).filter(Boolean))];
  if (normalizedSellerIds.length === 0) return {};

  const rows = await trx("seller_sales_settings")
    .select("sellerId", "minimumOrderValueGross")
    .whereIn("sellerId", normalizedSellerIds);

  return rows.reduce((acc, row) => {
    acc[Number(row.sellerId)] = {
      minimumOrderValueGross:
        row.minimumOrderValueGross === null || row.minimumOrderValueGross === undefined
          ? null
          : Number(row.minimumOrderValueGross),
    };
    return acc;
  }, {});
};

const getReadySellerIds = async (sellerIds, trx = db) => {
  const normalizedSellerIds = [...new Set((sellerIds || []).map((value) => Number(value)).filter(Boolean))];
  if (normalizedSellerIds.length === 0) return new Set();

  const rows = await trx("seller_settings as ss")
    .distinct("ss.sellerId")
    .whereIn("ss.sellerId", normalizedSellerIds)
    .whereNotNull("ss.payoutAccountHolder")
    .where("ss.payoutAccountHolder", "<>", "")
    .whereNotNull("ss.payoutBankAccount")
    .where("ss.payoutBankAccount", "<>", "")
    .whereNotNull("ss.payoutBankName")
    .where("ss.payoutBankName", "<>", "")
    .whereExists(function hasActiveShippingMethod() {
      this.select(trx.raw("1"))
        .from("seller_shipping_methods as ssm")
        .whereRaw("ssm.sellerId = ss.sellerId")
        .where("ssm.isActive", 1);
    });

  return new Set(rows.map((row) => Number(row.sellerId)));
};

const sanitizeCartItems = async ({ cartId }, trx = db) => {
  const normalizedCartId = Number(cartId);
  if (!normalizedCartId) return { removedItemIds: [] };

  const items = await trx("cart_items")
    .select("id", "productId", "variantId", "sellerId")
    .where({ cartId: normalizedCartId })
    .orderBy("id", "asc");

  if (items.length === 0) return { removedItemIds: [] };

  const productIds = [...new Set(items.map((item) => Number(item.productId)).filter(Boolean))];
  const variantIds = [...new Set(items.map((item) => Number(item.variantId)).filter(Boolean))];
  const sellerIds = [...new Set(items.map((item) => Number(item.sellerId)).filter(Boolean))];

  const [products, variants, readySellerIds] = await Promise.all([
    trx("products").select("id", "sellerId", "status").whereIn("id", productIds),
    variantIds.length > 0
      ? trx("product_variants").select("id", "productId", "status").whereIn("id", variantIds)
      : Promise.resolve([]),
    getReadySellerIds(sellerIds, trx),
  ]);

  const productsById = products.reduce((acc, product) => {
    acc[Number(product.id)] = product;
    return acc;
  }, {});
  const variantsById = variants.reduce((acc, variant) => {
    acc[Number(variant.id)] = variant;
    return acc;
  }, {});

  const invalidItemIds = items
    .filter((item) => {
      const product = productsById[Number(item.productId)];
      if (!product || product.status !== "active") return true;
      if (Number(product.sellerId) !== Number(item.sellerId)) return true;
      if (!readySellerIds.has(Number(item.sellerId))) return true;

      if (!item.variantId) return false;

      const variant = variantsById[Number(item.variantId)];
      if (!variant || variant.status !== "active") return true;
      if (Number(variant.productId) !== Number(item.productId)) return true;

      return false;
    })
    .map((item) => Number(item.id));

  if (invalidItemIds.length === 0) return { removedItemIds: [] };

  await trx("cart_items").where({ cartId: normalizedCartId }).whereIn("id", invalidItemIds).del();

  const remainingSellerRows = await trx("cart_items")
    .distinct("sellerId")
    .where({ cartId: normalizedCartId });
  const remainingSellerIds = new Set(
    remainingSellerRows.map((row) => Number(row.sellerId)).filter(Boolean),
  );

  await trx("cart_shipments")
    .where({ cartId: normalizedCartId })
    .modify((query) => {
      if (remainingSellerIds.size > 0) {
        query.whereNotIn("sellerId", [...remainingSellerIds]);
      }
    })
    .del();

  return { removedItemIds: invalidItemIds };
};

const resolveScope = async ({ userId, role, clientId }) => {
  if (role === "CLIENT") {
    const client = await db("clients").select("id").where({ userId }).first();
    if (!client) {
      const error = new Error("Client profile not found");
      error.status = 404;
      throw error;
    }

    return {
      clientId: Number(client.id),
      sessionToken: null,
    };
  }

  const normalizedClientId = clientId ? Number(clientId) : null;

  if (!normalizedClientId) {
    const error = new Error("clientId is required for ADMIN");
    error.status = 400;
    throw error;
  }

  return {
    clientId: normalizedClientId,
    sessionToken: null,
  };
};

const findActiveCart = async ({ clientId }, trx = db) => {
  return trx("carts")
    .where({
      status: "active",
      clientId,
    })
    .orderBy("id", "desc")
    .first();
};

const createCart = async ({ clientId, currency = "PLN" }, trx = db) => {
  const inserted = await trx("carts").insert({
    clientId: clientId || null,
    sessionToken: null,
    currency: currency || "PLN",
    status: "active",
  });
  const cartId = Array.isArray(inserted) ? inserted[0] : inserted;
  return trx("carts").where({ id: cartId }).first();
};

const mapShipment = (shipment) => ({
  id: Number(shipment.id),
  cartId: Number(shipment.cartId),
  sellerId: Number(shipment.sellerId),
  deliveryAddressId:
    shipment.deliveryAddressId !== null && shipment.deliveryAddressId !== undefined
      ? Number(shipment.deliveryAddressId)
      : null,
  shippingMethodId:
    shipment.shippingMethodId !== null && shipment.shippingMethodId !== undefined
      ? Number(shipment.shippingMethodId)
      : null,
  shippingMethodName: shipment.shippingMethodName || null,
  shippingNet: roundMoney(shipment.shippingNet),
  shippingGross: roundMoney(shipment.shippingGross),
  clientNote: shipment.clientNote || null,
  estimatedDeliveryFrom: shipment.estimatedDeliveryFrom || null,
  estimatedDeliveryTo: shipment.estimatedDeliveryTo || null,
  createdAt: shipment.createdAt,
  updatedAt: shipment.updatedAt,
});

const loadClientSpecialPrices = async ({ clientId, variantIds }, trx = db) => {
  const normalizedClientId = Number(clientId);
  const safeVariantIds = Array.isArray(variantIds)
    ? [...new Set(variantIds.map((variantId) => Number(variantId)).filter(Boolean))]
    : [];

  if (!normalizedClientId || safeVariantIds.length === 0) {
    return {};
  }

  const rows = await trx("client_special_prices as csp")
    .innerJoin("product_variants as pv", "pv.id", "csp.variantId")
    .select(
      "csp.variantId",
      "csp.priceType",
      "csp.specialNetPrice",
      "csp.specialGrossPrice",
      "csp.discountPercent",
      "pv.netPrice as originalNetPrice",
      "pv.grossPrice as originalGrossPrice",
      "pv.vatRate as originalVatRate",
    )
    .where("csp.clientId", normalizedClientId)
    .whereIn("csp.variantId", safeVariantIds);

  return rows.reduce((acc, row) => {
    acc[Number(row.variantId)] = row;
    return acc;
  }, {});
};

const resolveSpecialPricing = (pricingSource, specialPrice) => {
  if (!specialPrice) {
    return {
      unitNet: roundMoney(pricingSource.netPrice),
      unitGross: roundMoney(pricingSource.grossPrice),
      vatRate: roundMoney(pricingSource.vatRate),
    };
  }

  if (specialPrice.priceType === "amount") {
    return {
      unitNet: roundMoney(specialPrice.specialNetPrice),
      unitGross: roundMoney(specialPrice.specialGrossPrice),
      vatRate: roundMoney(pricingSource.vatRate),
    };
  }

  const multiplier = 1 - Number(specialPrice.discountPercent || 0) / 100;

  return {
    unitNet: roundMoney(
      Number(specialPrice.originalNetPrice ?? pricingSource.netPrice) * multiplier,
    ),
    unitGross: roundMoney(
      Number(specialPrice.originalGrossPrice ?? pricingSource.grossPrice) * multiplier,
    ),
    vatRate: roundMoney(specialPrice.originalVatRate ?? pricingSource.vatRate),
  };
};

const getCartShipments = async ({ cartId }, trx = db) => {
  const capabilities = await getCartShipmentCapabilities(trx);
  const selectColumns = [
    "cs.id",
    "cs.cartId",
    "cs.sellerId",
    "cs.deliveryAddressId",
    "cs.shippingMethodName",
    "cs.shippingNet",
    "cs.shippingGross",
    "cs.clientNote",
    "cs.estimatedDeliveryFrom",
    "cs.estimatedDeliveryTo",
    "cs.createdAt",
    "cs.updatedAt",
    "s.companyName as sellerCompanyName",
  ];

  if (capabilities.hasShippingMethodId) {
    selectColumns.push("cs.shippingMethodId");
  }

  const shipments = await trx("cart_shipments as cs")
    .leftJoin("sellers as s", "s.id", "cs.sellerId")
    .select(selectColumns)
    .where("cs.cartId", Number(cartId))
    .orderBy("cs.id", "asc");

  return shipments.map((shipment) => ({
    ...mapShipment(shipment),
    seller: {
      id: Number(shipment.sellerId),
      companyName: shipment.sellerCompanyName || null,
    },
  }));
};

const buildCartResponse = async ({ cart }, trx = db) => {
  if (!cart) return null;

  const [items, shipments] = await Promise.all([
    trx("cart_items").where({ cartId: Number(cart.id) }).orderBy("id", "asc"),
    getCartShipments({ cartId: cart.id }, trx),
  ]);

  const specialPricesByVariantId = await loadClientSpecialPrices(
    {
      clientId: cart.clientId,
      variantIds: items.map((item) => item.variantId),
    },
    trx,
  );

  const normalizedItems = items.map((item) => {
    const specialPrice = item.variantId
      ? specialPricesByVariantId[Number(item.variantId)]
      : null;

    if (!specialPrice) {
      return item;
    }

    const pricing = resolveSpecialPricing(
      {
        netPrice: item.unitNet,
        grossPrice: item.unitGross,
        vatRate: item.vatRate,
      },
      specialPrice,
    );

    return {
      ...item,
      unitNet: pricing.unitNet,
      unitGross: pricing.unitGross,
      vatRate: pricing.vatRate,
      lineNet: roundMoney(pricing.unitNet * Number(item.quantity || 0)),
      lineGross: roundMoney(pricing.unitGross * Number(item.quantity || 0)),
    };
  });

  const itemsBySellerId = {};
  normalizedItems.forEach((item) => {
    const sellerId = Number(item.sellerId);
    if (!itemsBySellerId[sellerId]) itemsBySellerId[sellerId] = [];
    itemsBySellerId[sellerId].push(item);
  });

  const groupedShipments = shipments.map((shipment) => {
    const shipmentItems = itemsBySellerId[shipment.sellerId] || [];
    const itemsNet = roundMoney(
      shipmentItems.reduce((sum, item) => sum + Number(item.lineNet || 0), 0),
    );
    const itemsGross = roundMoney(
      shipmentItems.reduce((sum, item) => sum + Number(item.lineGross || 0), 0),
    );

    return {
      ...shipment,
      items: shipmentItems,
      totals: {
        itemsNet,
        itemsGross,
        totalNet: roundMoney(itemsNet + Number(shipment.shippingNet || 0)),
        totalGross: roundMoney(itemsGross + Number(shipment.shippingGross || 0)),
      },
    };
  });

  const sellerSalesSettingsBySellerId = await getSellerSalesSettingsBySellerIds(
    groupedShipments.map((shipment) => shipment.sellerId),
    trx,
  );

  const discountEvaluation = await discountRulesService.evaluateShipmentDiscounts(
    {
      clientId: cart.clientId,
      shipments: groupedShipments,
      couponCode: cart.couponCode || null,
    },
    trx,
  );

  const groupedShipmentsWithDiscounts = groupedShipments.map((shipment) => {
    const shipmentDiscount = discountEvaluation.bySellerId[Number(shipment.sellerId)] || null;
    const discountNet = roundMoney(shipmentDiscount?.discountNet || 0);
    const discountGross = roundMoney(shipmentDiscount?.discountGross || 0);

    return {
      ...shipment,
      appliedDiscount: shipmentDiscount?.appliedRule || null,
      appliedDiscountSnapshot: shipmentDiscount?.snapshot || null,
      minimumOrderValueGross:
        sellerSalesSettingsBySellerId[Number(shipment.sellerId)]?.minimumOrderValueGross ?? null,
      totals: {
        ...shipment.totals,
        discountNet,
        discountGross,
        itemsGrossAfterDiscount: roundMoney(shipment.totals.itemsGross - discountGross),
        totalNetAfterDiscount: roundMoney(shipment.totals.totalNet - discountNet),
        totalGrossAfterDiscount: roundMoney(shipment.totals.totalGross - discountGross),
      },
    };
  });

  return {
    ...cart,
    couponCode: cart.couponCode || null,
    items: normalizedItems,
    discountNet: roundMoney(discountEvaluation.totals.discountNet),
    discountGross: roundMoney(discountEvaluation.totals.discountGross),
    shipments: groupedShipmentsWithDiscounts,
  };
};

const getCartByIdWithItems = async ({ cartId }, trx = db) => {
  const cart = await trx("carts").where({ id: cartId }).first();
  return buildCartResponse({ cart }, trx);
};

const ensureCartShipment = async ({ cartId, sellerId }, trx = db) => {
  const normalizedSellerId = Number(sellerId);
  if (!normalizedSellerId) return null;

  const existing = await trx("cart_shipments")
    .where({
      cartId: Number(cartId),
      sellerId: normalizedSellerId,
    })
    .first();

  if (existing) return existing;

  const inserted = await trx("cart_shipments").insert({
    cartId: Number(cartId),
    sellerId: normalizedSellerId,
  });
  const shipmentId = Array.isArray(inserted) ? inserted[0] : inserted;

  return trx("cart_shipments").where({ id: shipmentId }).first();
};

const removeEmptyCartShipment = async ({ cartId, sellerId }, trx = db) => {
  const remainingItem = await trx("cart_items")
    .where({
      cartId: Number(cartId),
      sellerId: Number(sellerId),
    })
    .first();

  if (remainingItem) return;

  await trx("cart_shipments")
    .where({
      cartId: Number(cartId),
      sellerId: Number(sellerId),
    })
    .del();
};

const loadActiveShippingMethod = async ({ sellerId, shippingMethodId }, trx = db) => {
  const method = await trx("seller_shipping_methods")
    .select(
      "id",
      "sellerId",
      "name",
      "isActive",
      "priceNet",
      "priceGross",
      "freeShippingAmountGross",
      "freeShippingQuantity",
      "freeShippingWeight",
      "etaMinDays",
      "etaMaxDays",
    )
    .where({
      sellerId: Number(sellerId),
      id: Number(shippingMethodId),
      isActive: 1,
    })
    .first();

  if (!method) {
    const error = new Error("Shipping method not found");
    error.status = 404;
    throw error;
  }

  return method;
};

const addDays = (baseDate, days) => {
  const next = new Date(baseDate);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + Number(days || 0));
  return next.toISOString().slice(0, 10);
};

const recalculateShipment = async ({ cartId, sellerId }, trx = db) => {
  const capabilities = await getCartShipmentCapabilities(trx);
  const shipment = await trx("cart_shipments")
    .where({
      cartId: Number(cartId),
      sellerId: Number(sellerId),
    })
    .first();

  if (!shipment) return null;

  const items = await trx("cart_items")
    .where({
      cartId: Number(cartId),
      sellerId: Number(sellerId),
    })
    .orderBy("id", "asc");

  const itemsGross = roundMoney(items.reduce((sum, item) => sum + Number(item.lineGross || 0), 0));
  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  if (!items.length) {
    const emptyShipmentUpdate = {
      shippingMethodName: null,
      shippingNet: 0,
      shippingGross: 0,
      estimatedDeliveryFrom: null,
      estimatedDeliveryTo: null,
      updatedAt: trx.fn.now(),
    };

    if (capabilities.hasShippingMethodId) {
      emptyShipmentUpdate.shippingMethodId = null;
    }

    await trx("cart_shipments").where({ id: shipment.id }).update(emptyShipmentUpdate);
    return null;
  }

  const currentShippingMethodId = capabilities.hasShippingMethodId
    ? Number(shipment.shippingMethodId || 0)
    : 0;

  if (!currentShippingMethodId) {
    await trx("cart_shipments")
      .where({ id: shipment.id })
      .update({
        shippingMethodName: null,
        shippingNet: 0,
        shippingGross: 0,
        estimatedDeliveryFrom: null,
        estimatedDeliveryTo: null,
        updatedAt: trx.fn.now(),
      });
    return null;
  }

  const method = await loadActiveShippingMethod(
    {
      sellerId: shipment.sellerId,
      shippingMethodId: currentShippingMethodId,
    },
    trx,
  );

  const meetsAmountThreshold =
    method.freeShippingAmountGross !== null &&
    method.freeShippingAmountGross !== undefined &&
    itemsGross >= Number(method.freeShippingAmountGross);
  const meetsQuantityThreshold =
    method.freeShippingQuantity !== null &&
    method.freeShippingQuantity !== undefined &&
    totalQuantity >= Number(method.freeShippingQuantity);
  const meetsWeightThreshold =
    method.freeShippingWeight !== null &&
    method.freeShippingWeight !== undefined &&
    false;
  const isFreeShippingApplied =
    meetsAmountThreshold || meetsQuantityThreshold || meetsWeightThreshold;

  const today = new Date();
  const estimatedDeliveryFrom =
    method.etaMinDays !== null && method.etaMinDays !== undefined
      ? addDays(today, method.etaMinDays)
      : null;
  const estimatedDeliveryTo =
    method.etaMaxDays !== null && method.etaMaxDays !== undefined
      ? addDays(today, method.etaMaxDays)
      : estimatedDeliveryFrom;

  const updates = {
    shippingMethodName: method.name,
    shippingNet: isFreeShippingApplied ? 0 : roundMoney(method.priceNet || 0),
    shippingGross: isFreeShippingApplied ? 0 : roundMoney(method.priceGross || 0),
    estimatedDeliveryFrom,
    estimatedDeliveryTo,
    updatedAt: trx.fn.now(),
  };

  if (capabilities.hasShippingMethodId) {
    updates.shippingMethodId = Number(method.id);
  }

  await trx("cart_shipments").where({ id: shipment.id }).update(updates);
  return updates;
};

const recalculateShipmentsForCart = async ({ cartId }, trx = db) => {
  const shipments = await trx("cart_shipments")
    .select("sellerId")
    .where({ cartId: Number(cartId) })
    .orderBy("id", "asc");

  for (const shipment of shipments) {
    await recalculateShipment({ cartId, sellerId: shipment.sellerId }, trx);
  }
};

const recalculateTotals = async ({ cartId }, trx = db) => {
  await sanitizeCartItems({ cartId }, trx);
  await recalculateShipmentsForCart({ cartId }, trx);

  const totalsRow = await trx("cart_items")
    .where({ cartId })
    .sum({ itemsNet: "lineNet", itemsGross: "lineGross" })
    .first();

  const cart = await trx("carts").where({ id: cartId }).first();
  if (!cart) return null;

  const shipmentTotalsRow = await trx("cart_shipments")
    .where({ cartId })
    .sum({ shippingNet: "shippingNet", shippingGross: "shippingGross" })
    .first();

  const [shipments, items] = await Promise.all([
    trx("cart_shipments").select("sellerId").where({ cartId }).orderBy("id", "asc"),
    trx("cart_items")
      .select("sellerId", "variantId", "quantity", "lineNet", "lineGross")
      .where({ cartId })
      .orderBy("id", "asc"),
  ]);

  const itemsBySellerId = items.reduce((acc, item) => {
    const sellerId = Number(item.sellerId);
    if (!acc[sellerId]) acc[sellerId] = [];
    acc[sellerId].push(item);
    return acc;
  }, {});

  const discountEvaluation = await discountRulesService.evaluateShipmentDiscounts(
    {
      clientId: cart.clientId,
      shipments: shipments.map((shipment) => ({
        sellerId: Number(shipment.sellerId),
        items: itemsBySellerId[Number(shipment.sellerId)] || [],
      })),
      couponCode: cart.couponCode || null,
    },
    trx,
  );

  const itemsNet = roundMoney(totalsRow?.itemsNet || 0);
  const itemsGross = roundMoney(totalsRow?.itemsGross || 0);
  const shippingNet = roundMoney(shipmentTotalsRow?.shippingNet || 0);
  const shippingGross = roundMoney(shipmentTotalsRow?.shippingGross || 0);
  const discountNet = roundMoney(discountEvaluation.totals.discountNet || 0);
  const discountGross = roundMoney(discountEvaluation.totals.discountGross || 0);

  const totalNet = roundMoney(Math.max(0, itemsNet + shippingNet - discountNet));
  const totalGross = roundMoney(Math.max(0, itemsGross + shippingGross - discountGross));

  await trx("carts")
    .where({ id: cartId })
    .update({
      shippingNet,
      shippingGross,
      discountNet,
      discountGross,
      totalNet,
      totalGross,
      updatedAt: trx.fn.now(),
    });

  return getCartByIdWithItems({ cartId }, trx);
};

const getOrCreateCurrentCart = async ({ userId, role, clientId, currency }) => {
  const scope = await resolveScope({ userId, role, clientId });
  let cart = await findActiveCart(scope);
  if (!cart) {
    cart = await createCart({ ...scope, currency: currency || "PLN" });
  }

  await recalculateTotals({ cartId: cart.id });
  return getCartByIdWithItems({ cartId: cart.id });
};

const getAvailableShippingMethodsForSeller = async ({ sellerId }) => {
  const normalizedSellerId = Number(sellerId);
  if (!normalizedSellerId) {
    const error = new Error("sellerId is required");
    error.status = 400;
    throw error;
  }

  const rows = await db("seller_shipping_methods")
    .select(
      "id",
      "sellerId",
      "name",
      "vatRate",
      "priceNet",
      "priceGross",
      "freeShippingAmountGross",
      "etaMinDays",
      "etaMaxDays",
    )
    .where({
      sellerId: normalizedSellerId,
      isActive: 1,
    })
    .orderBy("id", "asc");

  return rows.map((row) => ({
    id: Number(row.id),
    sellerId: Number(row.sellerId),
    name: row.name || "",
    vatRate: row.vatRate === null || row.vatRate === undefined ? 23 : Number(row.vatRate),
    priceNet: row.priceNet === null || row.priceNet === undefined ? null : Number(row.priceNet),
    priceGross:
      row.priceGross === null || row.priceGross === undefined ? null : Number(row.priceGross),
    freeShippingAmountGross:
      row.freeShippingAmountGross === null || row.freeShippingAmountGross === undefined
        ? null
        : Number(row.freeShippingAmountGross),
    etaMinDays: row.etaMinDays === null || row.etaMinDays === undefined ? null : Number(row.etaMinDays),
    etaMaxDays: row.etaMaxDays === null || row.etaMaxDays === undefined ? null : Number(row.etaMaxDays),
  }));
};

const addItemToCurrentCart = async ({
  userId,
  role,
  clientId,
  currency,
  productId,
  variantId,
  quantity = 1,
}) => {
  const targetProductId = Number(productId);
  if (!targetProductId) {
    const error = new Error("productId is required");
    error.status = 400;
    throw error;
  }

  const normalizedQuantity = normalizeQuantity(quantity);
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    let cart = await findActiveCart(scope, trx);
    if (!cart) {
      cart = await createCart({ ...scope, currency: currency || "PLN" }, trx);
    }

    const product = await trx("products")
      .select("id", "sellerId", "name", "netPrice", "grossPrice", "vatRate", "status")
      .where({ id: targetProductId })
      .first();

    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    if (product.status !== "active") {
      const error = new Error("Only active products can be added to cart");
      error.status = 400;
      throw error;
    }

    const normalizedVariantId = variantId ? Number(variantId) : null;
    let selectedVariant = null;

    if (normalizedVariantId) {
      selectedVariant = await trx("product_variants")
        .select(
          "id",
          "productId",
          "name",
          "netPrice",
          "grossPrice",
          "vatRate",
          "stockQuantity",
          "status",
          "unit",
          "unitAmount",
        )
        .where({ id: normalizedVariantId, productId: targetProductId })
        .first();
      if (!selectedVariant) {
        const error = new Error("Selected variant not found");
        error.status = 404;
        throw error;
      }
    } else {
      selectedVariant = await trx("product_variants")
        .select(
          "id",
          "productId",
          "name",
          "netPrice",
          "grossPrice",
          "vatRate",
          "stockQuantity",
          "status",
          "unit",
          "unitAmount",
        )
        .where({ productId: targetProductId, isDefault: 1 })
        .first();
    }

    if (selectedVariant && selectedVariant.status !== "active") {
      const error = new Error("Selected variant is not active");
      error.status = 400;
      throw error;
    }

    const pricingSource = selectedVariant || product;
    const targetVariantId = selectedVariant ? Number(selectedVariant.id) : null;
    const specialPricesByVariantId = await loadClientSpecialPrices(
      {
        clientId: scope.clientId,
        variantIds: targetVariantId ? [targetVariantId] : [],
      },
      trx,
    );
    const pricing = resolveSpecialPricing(
      pricingSource,
      targetVariantId ? specialPricesByVariantId[targetVariantId] : null,
    );

    await ensureCartShipment({ cartId: cart.id, sellerId: product.sellerId }, trx);

    const existingItem = await trx("cart_items")
      .where({
        cartId: cart.id,
        productId: targetProductId,
      })
      .modify((query) => {
        if (targetVariantId) {
          query.andWhere("variantId", targetVariantId);
        } else {
          query.whereNull("variantId");
        }
      })
      .first();

    if (existingItem) {
      const newQuantity = Number(existingItem.quantity) + normalizedQuantity;
      const unitNet = pricing.unitNet;
      const unitGross = pricing.unitGross;
      const lineNet = roundMoney(unitNet * newQuantity);
      const lineGross = roundMoney(unitGross * newQuantity);

      await trx("cart_items")
        .where({ id: existingItem.id })
        .update({
          quantity: newQuantity,
          sellerId: Number(product.sellerId),
          unitNet,
          unitGross,
          vatRate: pricing.vatRate,
          lineNet,
          lineGross,
          productNameSnapshot: product.name,
          variantId: targetVariantId,
          variantNameSnapshot: selectedVariant?.name || null,
          variantAmountSnapshot: selectedVariant?.unitAmount || null,
          updatedAt: trx.fn.now(),
        });
    } else {
      const unitNet = pricing.unitNet;
      const unitGross = pricing.unitGross;

      await trx("cart_items").insert({
        cartId: Number(cart.id),
        productId: targetProductId,
        variantId: targetVariantId,
        sellerId: Number(product.sellerId),
        quantity: normalizedQuantity,
        unitNet,
        unitGross,
        vatRate: pricing.vatRate,
        lineNet: roundMoney(unitNet * normalizedQuantity),
        lineGross: roundMoney(unitGross * normalizedQuantity),
        productNameSnapshot: product.name,
        variantNameSnapshot: selectedVariant?.name || null,
        variantAmountSnapshot: selectedVariant?.unitAmount || null,
      });
    }

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const updateCurrentCartItem = async ({ userId, role, clientId, itemId, quantity }) => {
  const targetItemId = Number(itemId);
  if (!targetItemId) {
    const error = new Error("itemId is required");
    error.status = 400;
    throw error;
  }

  const normalizedQuantity = normalizeQuantity(quantity);
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const item = await trx("cart_items")
      .where({ id: targetItemId, cartId: cart.id })
      .first();

    if (!item) {
      const error = new Error("Cart item not found");
      error.status = 404;
      throw error;
    }

    const lineNet = roundMoney(Number(item.unitNet) * normalizedQuantity);
    const lineGross = roundMoney(Number(item.unitGross) * normalizedQuantity);

    await trx("cart_items")
      .where({ id: targetItemId })
      .update({
        quantity: normalizedQuantity,
        lineNet,
        lineGross,
        updatedAt: trx.fn.now(),
      });

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const removeItemFromCurrentCart = async ({ userId, role, clientId, itemId }) => {
  const targetItemId = Number(itemId);
  if (!targetItemId) {
    const error = new Error("itemId is required");
    error.status = 400;
    throw error;
  }

  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const item = await trx("cart_items")
      .where({ id: targetItemId, cartId: cart.id })
      .first();

    if (!item) {
      const error = new Error("Cart item not found");
      error.status = 404;
      throw error;
    }

    await trx("cart_items")
      .where({ id: targetItemId, cartId: cart.id })
      .del();

    await removeEmptyCartShipment({ cartId: cart.id, sellerId: item.sellerId }, trx);

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const clearCurrentCart = async ({ userId, role, clientId }) => {
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    await trx("cart_items").where({ cartId: cart.id }).del();
    await trx("cart_shipments").where({ cartId: cart.id }).del();
    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const updateCurrentCartShipment = async ({
  userId,
  role,
  clientId,
  sellerId,
  deliveryAddressId,
  shippingMethodId,
  clientNote,
}) => {
  const normalizedSellerId = Number(sellerId);
  if (!normalizedSellerId) {
    const error = new Error("sellerId is required");
    error.status = 400;
    throw error;
  }

  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const capabilities = await getCartShipmentCapabilities(trx);
    if (shippingMethodId !== undefined && !capabilities.hasShippingMethodId) {
      const error = new Error("Database schema requires cart_shipments.shippingMethodId");
      error.status = 500;
      throw error;
    }

    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const shipment = await ensureCartShipment({ cartId: cart.id, sellerId: normalizedSellerId }, trx);
    const updates = {};

    if (deliveryAddressId !== undefined) {
      updates.deliveryAddressId = deliveryAddressId ? Number(deliveryAddressId) : null;
    }
    if (shippingMethodId !== undefined) {
      updates.shippingMethodId = shippingMethodId ? Number(shippingMethodId) : null;
      if (updates.shippingMethodId) {
        await loadActiveShippingMethod(
          {
            sellerId: normalizedSellerId,
            shippingMethodId: updates.shippingMethodId,
          },
          trx,
        );
      }
    }
    if (clientNote !== undefined) {
      updates.clientNote = clientNote ? String(clientNote).trim() : null;
    }

    if (Object.keys(updates).length) {
      updates.updatedAt = trx.fn.now();
      await trx("cart_shipments").where({ id: shipment.id }).update(updates);
    }

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

const updateCurrentCartMeta = async ({
  userId,
  role,
  clientId,
  couponCode,
  discountNet,
  discountGross,
  expiresAt,
}) => {
  const scope = await resolveScope({ userId, role, clientId });

  return db.transaction(async (trx) => {
    const cart = await findActiveCart(scope, trx);
    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const updates = {};
    if (couponCode !== undefined) updates.couponCode = couponCode || null;
    if (discountNet !== undefined) updates.discountNet = roundMoney(discountNet);
    if (discountGross !== undefined) updates.discountGross = roundMoney(discountGross);
    if (expiresAt !== undefined) updates.expiresAt = expiresAt || null;

    if (Object.keys(updates).length) {
      updates.updatedAt = trx.fn.now();
      await trx("carts").where({ id: cart.id }).update(updates);
    }

    return recalculateTotals({ cartId: cart.id }, trx);
  });
};

module.exports = {
  getOrCreateCurrentCart,
  getAvailableShippingMethodsForSeller,
  addItemToCurrentCart,
  updateCurrentCartItem,
  removeItemFromCurrentCart,
  clearCurrentCart,
  updateCurrentCartShipment,
  updateCurrentCartMeta,
  sanitizeCartItems,
};
