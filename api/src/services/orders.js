const db = require("../config/db");
const sellerFinancialHistoryService = require("./seller-financial-history");
const discountRulesService = require("./discount-rules");
const {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  ROLE_ORDER_PERMISSIONS,
} = require("../config/global-config");

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

let orderColumnsCache = null;

const resolveClientIdByUserId = async (userId, trx = db) => {
  const client = await trx("clients").select("id").where({ userId: Number(userId) }).first();
  if (!client) {
    const error = new Error("Client profile not found");
    error.status = 404;
    throw error;
  }
  return Number(client.id);
};

const resolveSellerIdByUserId = async (userId, trx = db) => {
  const seller = await trx("sellers").select("id").where({ userId: Number(userId) }).first();
  if (!seller) {
    const error = new Error("Seller profile not found");
    error.status = 404;
    throw error;
  }
  return Number(seller.id);
};

const parseSnapshot = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const formatDateOnly = (rawDate) => {
  if (!rawDate) return null;
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const addDays = (rawDate, days) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + Number(days || 0));
  return date;
};

const getOrderColumnCapabilities = async (trx = db) => {
  if (orderColumnsCache) return orderColumnsCache;

  const [
    hasOrderGroupNumber,
    hasDeliveryAddressSnapshotJson,
    hasShippingMethodId,
  hasShippingMethodName,
  hasClientNote,
  hasEstimatedDeliveryFrom,
  hasEstimatedDeliveryTo,
  hasAppliedDiscountSnapshotJson,
    hasClientSnapshotJson,
  ] = await Promise.all([
    trx.schema.hasColumn("orders", "orderGroupNumber"),
    trx.schema.hasColumn("orders", "deliveryAddressSnapshotJson"),
    trx.schema.hasColumn("orders", "shippingMethodId"),
    trx.schema.hasColumn("orders", "shippingMethodName"),
    trx.schema.hasColumn("orders", "clientNote"),
    trx.schema.hasColumn("orders", "estimatedDeliveryFrom"),
    trx.schema.hasColumn("orders", "estimatedDeliveryTo"),
    trx.schema.hasColumn("orders", "appliedDiscountSnapshotJson"),
    trx.schema.hasColumn("orders", "clientSnapshotJson"),
  ]);

  orderColumnsCache = {
    hasOrderGroupNumber,
    hasDeliveryAddressSnapshotJson,
    hasShippingMethodId,
    hasShippingMethodName,
    hasClientNote,
    hasEstimatedDeliveryFrom,
    hasEstimatedDeliveryTo,
    hasAppliedDiscountSnapshotJson,
    hasClientSnapshotJson,
  };

  return orderColumnsCache;
};

const getOrderSelectColumns = async (trx = db) => {
  const capabilities = await getOrderColumnCapabilities(trx);
  const columns = [
    "orders.id",
    "orders.orderGroupId",
    "orders.orderGroupNumber",
    "orders.sellerId",
    "orders.clientId",
    "orders.totalNet",
    "orders.totalGross",
    "orders.totalShipping",
    "orders.paymentStatus",
    "orders.status",
    "orders.createdAt",
    "orders.updatedAt",
  ];

  if (!capabilities.hasOrderGroupNumber) {
    columns.splice(2, 1);
  }
  if (capabilities.hasDeliveryAddressSnapshotJson) {
    columns.push("orders.deliveryAddressSnapshotJson");
  }
  if (capabilities.hasShippingMethodId) {
    columns.push("orders.shippingMethodId");
  }
  if (capabilities.hasShippingMethodName) {
    columns.push("orders.shippingMethodName");
  }
  if (capabilities.hasClientNote) {
    columns.push("orders.clientNote");
  }
  if (capabilities.hasEstimatedDeliveryFrom) {
    columns.push("orders.estimatedDeliveryFrom");
  }
  if (capabilities.hasEstimatedDeliveryTo) {
    columns.push("orders.estimatedDeliveryTo");
  }
  if (capabilities.hasAppliedDiscountSnapshotJson) {
    columns.push("orders.appliedDiscountSnapshotJson");
  }
  if (capabilities.hasClientSnapshotJson) {
    columns.push("orders.clientSnapshotJson");
  }

  return columns;
};

const mapDeliveryAddressSnapshot = (address) => {
  if (!address) return null;

  return {
    id: Number(address.id),
    clientId: Number(address.clientId),
    label: address.label || "",
    recipientName: address.recipientName || "",
    phone: address.phone || "",
    addressLine1: address.addressLine1 || "",
    addressLine2: address.addressLine2 || "",
    city: address.city || "",
    postalCode: address.postalCode || "",
    countryCode: address.countryCode || "PL",
  };
};

const mapOrder = (order) => ({
  id: Number(order.id),
  orderGroupId: Number(order.orderGroupId),
  orderGroupNumber: order.orderGroupNumber || null,
  orderNumber: order.orderNumber || null,
  sellerId: Number(order.sellerId),
  clientId: Number(order.clientId),
  totalNet: Number(order.totalNet),
  totalGross: Number(order.totalGross),
  totalShipping: Number(order.totalShipping),
  shippingMethodId:
    order.shippingMethodId === null || order.shippingMethodId === undefined
      ? null
      : Number(order.shippingMethodId),
  paymentStatus: order.paymentStatus,
  status: order.status,
  deliveryAddressSnapshot: parseSnapshot(order.deliveryAddressSnapshotJson),
  shippingMethodName: order.shippingMethodName || null,
  clientNote: order.clientNote || null,
  estimatedDeliveryFrom: order.estimatedDeliveryFrom || null,
  estimatedDeliveryTo: order.estimatedDeliveryTo || null,
  appliedDiscountSnapshot: parseSnapshot(order.appliedDiscountSnapshotJson),
  clientSnapshot: parseSnapshot(order.clientSnapshotJson),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const mapOrderItem = (item) => ({
  id: Number(item.id),
  orderId: Number(item.orderId),
  orderGroupId: Number(item.orderGroupId),
  sellerId: Number(item.sellerId),
  productId: Number(item.productId),
  variantId: item.variantId ? Number(item.variantId) : null,
  variantNameSnapshot: item.variantNameSnapshot || null,
  variantAmountSnapshot:
    item.variantAmountSnapshot !== null && item.variantAmountSnapshot !== undefined
      ? Number(item.variantAmountSnapshot)
      : null,
  quantity: Number(item.quantity),
  netPrice: Number(item.netPrice),
  grossPrice: Number(item.grossPrice),
  vatRate: Number(item.vatRate),
  productSnapshot: parseSnapshot(item.productSnapshotJson),
  createdAt: item.createdAt,
});

const mapSellerSummary = (seller, settings) => ({
  id: Number(seller.id),
  companyName: seller.companyName || "",
  nip: seller.nip || "",
  phone: seller.phone || "",
  address: seller.address || "",
  city: seller.city || "",
  postalCode: seller.postalCode || "",
  payoutAccountHolder: settings?.payoutAccountHolder || "",
  payoutBankAccount: settings?.payoutBankAccount || "",
  payoutBankName: settings?.payoutBankName || "",
  paymentDueDays:
    settings?.paymentDueDays === null || settings?.paymentDueDays === undefined
      ? null
      : Number(settings.paymentDueDays),
});

const mapClientSummary = (client) => ({
  id: Number(client.id),
  name: client.name || "",
  companyName: client.companyName || "",
  nip: client.nip || "",
  phone: client.phone || "",
  address: client.address || "",
  city: client.city || "",
  postalCode: client.postalCode || "",
});

const resolveOrderClient = (mappedOrder, client) =>
  mappedOrder?.clientSnapshot || (client ? mapClientSummary(client) : null);

const summarizeSellerItems = (items) => {
  const totals = items.reduce(
    (acc, item) => {
      acc.totalNet += Number(item.netPrice) * Number(item.quantity);
      acc.totalGross += Number(item.grossPrice) * Number(item.quantity);
      acc.itemsCount += 1;
      return acc;
    },
    { totalNet: 0, totalGross: 0, itemsCount: 0 },
  );

  return {
    totalNet: Number(totals.totalNet.toFixed(2)),
    totalGross: Number(totals.totalGross.toFixed(2)),
    itemsCount: totals.itemsCount,
  };
};

const summarizeOrderItemsRows = (rows) => {
  return rows.reduce(
    (acc, item) => {
      acc.totalNet += Number(item.netPrice || 0) * Number(item.quantity || 0);
      acc.totalGross += Number(item.grossPrice || 0) * Number(item.quantity || 0);
      acc.itemsCount += 1;
      return acc;
    },
    { totalNet: 0, totalGross: 0, itemsCount: 0 },
  );
};

const getLockValue = (result) => {
  const rows = Array.isArray(result) ? result[0] : result?.rows || [];
  const firstRow = Array.isArray(rows) ? rows[0] : rows;
  const value = firstRow?.lockStatus ?? firstRow?.releaseStatus ?? Object.values(firstRow || {})[0];
  return Number(value || 0);
};

const buildOrderGroupNumber = ({ dateKey, sequence }) => `${dateKey}${String(sequence).padStart(3, "0")}`;

const attachOrderNumbers = async (orders, trx = db) => {
  const mappedOrders = Array.isArray(orders) ? orders : [];
  if (mappedOrders.length === 0) return mappedOrders;

  const groupIds = [...new Set(mappedOrders.map((order) => Number(order.orderGroupId)).filter(Boolean))];
  const rows = await trx("orders")
    .select("id", "orderGroupId", "orderGroupNumber")
    .whereIn("orderGroupId", groupIds)
    .orderBy("orderGroupId", "asc")
    .orderBy("id", "asc");

  const suffixByOrderId = {};
  const counters = new Map();
  rows.forEach((row) => {
    const groupId = Number(row.orderGroupId);
    const nextIndex = (counters.get(groupId) || 0) + 1;
    counters.set(groupId, nextIndex);
    const baseNumber = row.orderGroupNumber || String(groupId);
    suffixByOrderId[Number(row.id)] = `${baseNumber}-${nextIndex}`;
  });

  return mappedOrders.map((order) => ({
    ...order,
    orderNumber: suffixByOrderId[Number(order.id)] || order.orderNumber || null,
  }));
};

const generateOrderGroupNumber = async (trx) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateKey = `${year}${month}${day}`;
  const lockName = `orders_group_number_${dateKey}`;

  const lockResult = await trx.raw("SELECT GET_LOCK(?, 10) AS lockStatus", [lockName]);
  const lockStatus = getLockValue(lockResult);
  if (lockStatus !== 1) {
    const error = new Error("Could not acquire order number lock");
    error.status = 503;
    throw error;
  }

  try {
    const latestRow = await trx("orders")
      .select("orderGroupNumber")
      .where("orderGroupNumber", "like", `${dateKey}%`)
      .orderBy("orderGroupNumber", "desc")
      .first();

    const latestNumber = String(latestRow?.orderGroupNumber || "");
    const latestSequence = /^\d{11}$/.test(latestNumber) ? Number(latestNumber.slice(-3)) : 0;
    return buildOrderGroupNumber({ dateKey, sequence: latestSequence + 1 });
  } finally {
    await trx.raw("SELECT RELEASE_LOCK(?) AS releaseStatus", [lockName]);
  }
};

const resolveCheckoutClientId = async ({ userId, role, clientId }, trx = db) => {
  if (role === "CLIENT") {
    return resolveClientIdByUserId(userId, trx);
  }

  if (role === "ADMIN") {
    const normalizedClientId = Number(clientId);
    if (!normalizedClientId) {
      const error = new Error("clientId is required for ADMIN");
      error.status = 400;
      throw error;
    }
    return normalizedClientId;
  }

  const error = new Error("Forbidden");
  error.status = 403;
  throw error;
};

const getClientDeliveryAddresses = async ({ clientId }, trx = db) => {
  return trx("clients_delivery_address")
    .where({ clientId: Number(clientId) })
    .orderBy([{ column: "isDefault", order: "desc" }, { column: "id", order: "desc" }]);
};

const resolveDeliveryAddressForShipment = ({
  shipment,
  fallbackDeliveryAddressId,
  availableAddresses,
}) => {
  const addressId = Number(shipment?.deliveryAddressId || fallbackDeliveryAddressId || 0);
  if (!addressId) return null;

  return availableAddresses.find((address) => Number(address.id) === addressId) || null;
};

const createOrderFromCurrentCart = async (
  { userId, role, clientId, deliveryAddressId, clientNote },
  trxDb = db,
) => {
  return trxDb.transaction(async (trx) => {
    const orderColumns = await getOrderColumnCapabilities(trx);
    const resolvedClientId = await resolveCheckoutClientId({ userId, role, clientId }, trx);
    const cart = await trx("carts")
      .where({ status: "active", clientId: resolvedClientId })
      .orderBy("id", "desc")
      .first();

    if (!cart) {
      const error = new Error("Active cart not found");
      error.status = 404;
      throw error;
    }

    const cartItems = await trx("cart_items")
      .where({ cartId: Number(cart.id) })
      .orderBy("id", "asc");

    const cartShipments = await trx("cart_shipments")
      .where({ cartId: Number(cart.id) })
      .orderBy("id", "asc");

    if (cartItems.length === 0) {
      const error = new Error("Cart is empty");
      error.status = 400;
      throw error;
    }

    const availableAddresses = await getClientDeliveryAddresses({ clientId: resolvedClientId }, trx);
    const checkoutClient = await trx("clients")
      .select("id", "name", "companyName", "nip", "phone", "address", "city", "postalCode")
      .where({ id: resolvedClientId })
      .first();

    const productIds = [...new Set(cartItems.map((item) => Number(item.productId)).filter(Boolean))];
    const products = await trx("products")
      .select(
        "id",
        "sellerId",
        "name",
        "description",
        "status",
        "netPrice",
        "grossPrice",
        "vatRate",
        "unit",
        "stockQuantity",
        "createdAt",
        "updatedAt",
      )
      .whereIn("id", productIds);

    const productsById = {};
    products.forEach((product) => {
      productsById[Number(product.id)] = product;
    });

    const images = await trx("products_image")
      .select("id", "productId", "fileName", "alt", "isMain", "position", "createdAt")
      .whereIn("productId", productIds)
      .orderBy("position", "asc")
      .orderBy("id", "asc");

    const imagesByProductId = {};
    images.forEach((image) => {
      const key = Number(image.productId);
      if (!imagesByProductId[key]) imagesByProductId[key] = [];
      imagesByProductId[key].push({
        id: Number(image.id),
        fileName: image.fileName,
        alt: image.alt,
        isMain: Number(image.isMain),
        position: Number(image.position),
        createdAt: image.createdAt,
      });
    });

    const invalidItem = cartItems.find((item) => !productsById[Number(item.productId)]);
    if (invalidItem) {
      const error = new Error(`Product ${invalidItem.productId} not found`);
      error.status = 400;
      throw error;
    }

    const groupedBySeller = {};
    cartItems.forEach((item) => {
      const sellerId = Number(item.sellerId);
      if (!groupedBySeller[sellerId]) groupedBySeller[sellerId] = [];
      groupedBySeller[sellerId].push(item);
    });

    const maxOrderGroupRow = await trx("orders").max({ maxOrderGroupId: "orderGroupId" }).first();
    const orderGroupId = Number(maxOrderGroupRow?.maxOrderGroupId || 0) + 1;
    const orderGroupNumber = orderColumns.hasOrderGroupNumber
      ? await generateOrderGroupNumber(trx)
      : null;

    const createdOrderIds = [];
    const discountEvaluation = await discountRulesService.evaluateShipmentDiscounts(
      {
        clientId: resolvedClientId,
        shipments: Object.entries(groupedBySeller).map(([sellerId, sellerItems]) => ({
          sellerId: Number(sellerId),
          items: sellerItems,
        })),
      },
      trx,
    );

    for (const [sellerIdKey, sellerItems] of Object.entries(groupedBySeller)) {
      const sellerId = Number(sellerIdKey);
      const shipment = cartShipments.find((item) => Number(item.sellerId) === sellerId) || null;
      if (!shipment?.shippingMethodId || !shipment?.shippingMethodName) {
        const error = new Error(
          `Shipment for seller ${sellerId} does not have an available shipping method`,
        );
        error.status = 400;
        throw error;
      }
      const resolvedAddress = resolveDeliveryAddressForShipment({
        shipment,
        fallbackDeliveryAddressId: deliveryAddressId,
        availableAddresses,
      });
      const shipmentNet = roundMoney(shipment?.shippingNet || 0);
      const shipmentGross = roundMoney(shipment?.shippingGross || 0);
      const itemsNet = roundMoney(
        sellerItems.reduce((sum, item) => sum + Number(item.lineNet || 0), 0),
      );
      const itemsGross = roundMoney(
        sellerItems.reduce((sum, item) => sum + Number(item.lineGross || 0), 0),
      );
      const shipmentDiscount = discountEvaluation.bySellerId[sellerId] || null;
      const discountNet = roundMoney(shipmentDiscount?.discountNet || 0);
      const discountGross = roundMoney(shipmentDiscount?.discountGross || 0);
      const totalNet = roundMoney(Math.max(0, itemsNet + shipmentNet - discountNet));
      const totalGross = roundMoney(Math.max(0, itemsGross + shipmentGross - discountGross));

      const orderPayload = {
        orderGroupId,
        sellerId,
        clientId: resolvedClientId,
        totalNet,
        totalGross,
        totalShipping: shipmentGross,
        paymentStatus: "pending",
        status: "new",
      };

      if (orderColumns.hasOrderGroupNumber) {
        orderPayload.orderGroupNumber = orderGroupNumber;
      }

      if (orderColumns.hasDeliveryAddressSnapshotJson) {
        orderPayload.deliveryAddressSnapshotJson = JSON.stringify(
          mapDeliveryAddressSnapshot(resolvedAddress),
        );
      }
      if (orderColumns.hasShippingMethodId) {
        orderPayload.shippingMethodId = shipment?.shippingMethodId
          ? Number(shipment.shippingMethodId)
          : null;
      }
      if (orderColumns.hasShippingMethodName) {
        orderPayload.shippingMethodName = shipment?.shippingMethodName || null;
      }
      if (orderColumns.hasClientNote) {
        orderPayload.clientNote = shipment?.clientNote || clientNote || null;
      }
      if (orderColumns.hasEstimatedDeliveryFrom) {
        orderPayload.estimatedDeliveryFrom = shipment?.estimatedDeliveryFrom || null;
      }
      if (orderColumns.hasEstimatedDeliveryTo) {
        orderPayload.estimatedDeliveryTo = shipment?.estimatedDeliveryTo || null;
      }
      if (orderColumns.hasAppliedDiscountSnapshotJson) {
        orderPayload.appliedDiscountSnapshotJson = shipmentDiscount?.snapshot
          ? JSON.stringify(shipmentDiscount.snapshot)
          : null;
      }
      if (orderColumns.hasClientSnapshotJson) {
        orderPayload.clientSnapshotJson = JSON.stringify(
          checkoutClient ? mapClientSummary(checkoutClient) : null,
        );
      }

      const insertedOrder = await trx("orders").insert(orderPayload);
      const orderId = Array.isArray(insertedOrder) ? insertedOrder[0] : insertedOrder;
      createdOrderIds.push(Number(orderId));

      await sellerFinancialHistoryService.createOrderIncomeEntry(
        {
          sellerId,
          orderId: Number(orderId),
          orderGroupId,
          grossAmount: totalGross,
          currency: String(cart.currency || "PLN").trim() || "PLN",
        },
        trx,
      );

      for (const item of sellerItems) {
        const product = productsById[Number(item.productId)];
        const productSnapshot = {
          id: Number(product.id),
          sellerId: Number(product.sellerId),
          name: product.name,
          description: product.description,
          status: product.status,
          netPrice: Number(product.netPrice),
          grossPrice: Number(product.grossPrice),
          vatRate: Number(product.vatRate),
          unit: product.unit || "pcs",
          stockQuantity: Number(product.stockQuantity || 0),
          images: imagesByProductId[Number(product.id)] || [],
          variant: item.variantId
            ? {
                id: Number(item.variantId),
                name: item.variantNameSnapshot || null,
                unitAmount:
                  item.variantAmountSnapshot !== undefined && item.variantAmountSnapshot !== null
                    ? Number(item.variantAmountSnapshot)
                    : null,
              }
            : null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };

        await trx("order_items").insert({
          orderId: Number(orderId),
          orderGroupId,
          sellerId,
          productId: Number(item.productId),
          variantId: item.variantId ? Number(item.variantId) : null,
          quantity: Number(item.quantity),
          netPrice: roundMoney(item.unitNet),
          grossPrice: roundMoney(item.unitGross),
          vatRate: roundMoney(item.vatRate),
          productSnapshotJson: JSON.stringify(productSnapshot),
          variantNameSnapshot: item.variantNameSnapshot || null,
          variantAmountSnapshot:
            item.variantAmountSnapshot !== undefined && item.variantAmountSnapshot !== null
              ? Number(item.variantAmountSnapshot)
              : null,
        });
      }
    }

    await trx("cart_items").where({ cartId: Number(cart.id) }).del();
    await trx("cart_shipments").where({ cartId: Number(cart.id) }).del();
    await trx("carts")
      .where({ id: Number(cart.id) })
      .update({
        couponCode: null,
        shippingNet: 0,
        shippingGross: 0,
        discountNet: 0,
        discountGross: 0,
        totalNet: 0,
        totalGross: 0,
        updatedAt: trx.fn.now(),
      });

    const orderSelectColumns = await getOrderSelectColumns(trx);
    const orders = await trx("orders")
      .select(...orderSelectColumns)
      .whereIn("id", createdOrderIds)
      .orderBy("id", "asc");
    const ordersWithNumbers = await attachOrderNumbers(orders.map(mapOrder), trx);

    return {
      orderGroupId,
      orderGroupNumber,
      primaryOrderId: Number(orders[0]?.id),
      orders: ordersWithNumbers,
    };
  });
};

const getOrders = async ({ userId, role }) => {
  const orderSelectColumns = await getOrderSelectColumns(db);
  const query = db("orders")
    .select(...orderSelectColumns)
    .orderBy("orders.createdAt", "desc")
    .orderBy("orders.id", "desc");

  let sellerId = null;
  if (role === "CLIENT") {
    const clientId = await resolveClientIdByUserId(userId);
    query.where("orders.clientId", clientId);
  } else if (role === "SELLER") {
    sellerId = await resolveSellerIdByUserId(userId);
    query.whereExists(function whereSellerOrders() {
      this.select(1)
        .from("order_items")
        .whereRaw("order_items.orderId = orders.id")
        .andWhere("order_items.sellerId", sellerId);
    });
  }

  const orders = await query;
  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => Number(order.id));
  const sellerIds = [...new Set(orders.map((order) => Number(order.sellerId)).filter(Boolean))];
  const clientIds = [...new Set(orders.map((order) => Number(order.clientId)).filter(Boolean))];
  const orderItemsRows = await db("order_items")
    .select("orderId", "sellerId", "quantity", "netPrice", "grossPrice")
    .whereIn("orderId", orderIds);
  const sellersRows = await db("sellers")
    .select("id", "companyName", "nip", "phone", "address", "city", "postalCode")
    .whereIn("id", sellerIds);
  const clientsRows = await db("clients")
    .select("id", "name", "companyName", "nip", "phone", "address", "city", "postalCode")
    .whereIn("id", clientIds);

  const orderItemsSummaryByOrderId = {};
  orderItemsRows.forEach((item) => {
    const key = Number(item.orderId);
    if (!orderItemsSummaryByOrderId[key]) {
      orderItemsSummaryByOrderId[key] = [];
    }
    orderItemsSummaryByOrderId[key].push(item);
  });

  const sellersById = {};
  sellersRows.forEach((seller) => {
    sellersById[Number(seller.id)] = seller;
  });

  const clientsById = {};
  clientsRows.forEach((client) => {
    clientsById[Number(client.id)] = client;
  });

  if (role === "SELLER") {
    const items = await db("order_items")
      .select(
        "id",
        "orderId",
        "orderGroupId",
        "sellerId",
        "productId",
        "variantId",
        "quantity",
        "netPrice",
        "grossPrice",
        "vatRate",
        "productSnapshotJson",
        "variantNameSnapshot",
        "variantAmountSnapshot",
        "createdAt",
      )
      .whereIn("orderId", orderIds)
      .andWhere("sellerId", sellerId);

    const itemsByOrderId = {};
    items.forEach((item) => {
      const key = Number(item.orderId);
      if (!itemsByOrderId[key]) itemsByOrderId[key] = [];
      itemsByOrderId[key].push(mapOrderItem(item));
    });

    const result = orders.map((order) => {
      const visibleItems = itemsByOrderId[Number(order.id)] || [];
      return {
        ...mapOrder(order),
        items: visibleItems,
        client: resolveOrderClient(
          mapOrder(order),
          clientsById[Number(order.clientId)],
        ),
        sellerScope: summarizeSellerItems(visibleItems),
      };
    });
    return attachOrderNumbers(result);
  }

  const result = orders.map((order) => {
    const mappedOrder = mapOrder(order);
    const summary = summarizeOrderItemsRows(orderItemsSummaryByOrderId[mappedOrder.id] || []);
    const seller = sellersById[mappedOrder.sellerId];

    return {
      ...mappedOrder,
      seller: seller ? mapSellerSummary(seller, null) : null,
      client: resolveOrderClient(mappedOrder, clientsById[mappedOrder.clientId]),
      sellerScope: {
        totalNet: Number(summary.totalNet.toFixed(2)),
        totalGross: Number(summary.totalGross.toFixed(2)),
        itemsCount: summary.itemsCount,
      },
    };
  });
  return attachOrderNumbers(result);
};

const getOrderById = async ({ userId, role, orderId }) => {
  const normalizedOrderId = Number(orderId);
  if (!normalizedOrderId) {
    const error = new Error("orderId is required");
    error.status = 400;
    throw error;
  }

  const orderSelectColumns = await getOrderSelectColumns(db);
  const query = db("orders")
    .select(...orderSelectColumns)
    .where("orders.id", normalizedOrderId)
    .first();

  let sellerId = null;
  if (role === "CLIENT") {
    const clientId = await resolveClientIdByUserId(userId);
    query.andWhere("orders.clientId", clientId);
  } else if (role === "SELLER") {
    sellerId = await resolveSellerIdByUserId(userId);
    query.whereExists(function whereSellerOrder() {
      this.select(1)
        .from("order_items")
        .whereRaw("order_items.orderId = orders.id")
        .andWhere("order_items.sellerId", sellerId);
    });
  }

  const order = await query;
  if (!order) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  const itemsQuery = db("order_items")
    .select(
      "id",
      "orderId",
      "orderGroupId",
      "sellerId",
      "productId",
      "variantId",
      "quantity",
      "netPrice",
      "grossPrice",
      "vatRate",
      "productSnapshotJson",
      "variantNameSnapshot",
      "variantAmountSnapshot",
      "createdAt",
    )
    .where("orderId", normalizedOrderId)
    .orderBy("id", "asc");

  if (role === "SELLER") {
    itemsQuery.andWhere("sellerId", sellerId);
  }

  const items = await itemsQuery;
  const mappedItems = items.map(mapOrderItem);

  const mappedOrder = (await attachOrderNumbers([mapOrder(order)]))[0];
  const client = await db("clients")
    .select("id", "name", "companyName", "nip", "phone", "address", "city", "postalCode")
    .where({ id: Number(mappedOrder.clientId) })
    .first();

  if (role === "SELLER") {
    return {
      ...mappedOrder,
      items: mappedItems,
      client: resolveOrderClient(mappedOrder, client),
      sellerScope: summarizeSellerItems(mappedItems),
    };
  }

  return {
    ...mappedOrder,
    items: mappedItems,
    client: resolveOrderClient(mappedOrder, client),
  };
};

const getOrderGroupById = async ({ userId, role, orderGroupId }) => {
  const normalizedOrderGroupId = Number(orderGroupId);
  if (!normalizedOrderGroupId) {
    const error = new Error("orderGroupId is required");
    error.status = 400;
    throw error;
  }

  const orderSelectColumns = await getOrderSelectColumns(db);
  const query = db("orders")
    .select(...orderSelectColumns)
    .where("orders.orderGroupId", normalizedOrderGroupId)
    .orderBy("orders.id", "asc");

  let sellerId = null;
  if (role === "CLIENT") {
    const clientId = await resolveClientIdByUserId(userId);
    query.andWhere("orders.clientId", clientId);
  } else if (role === "SELLER") {
    sellerId = await resolveSellerIdByUserId(userId);
    query.andWhere("orders.sellerId", sellerId);
  }

  const orders = await query;
  if (orders.length === 0) {
    const error = new Error("Order group not found");
    error.status = 404;
    throw error;
  }

  const orderIds = orders.map((order) => Number(order.id));
  const sellerIds = [...new Set(orders.map((order) => Number(order.sellerId)).filter(Boolean))];
  const clientIds = [...new Set(orders.map((order) => Number(order.clientId)).filter(Boolean))];

  const [itemsRows, sellersRows, clientsRows, sellerSettingsRows] = await Promise.all([
    db("order_items")
      .select(
        "id",
        "orderId",
        "orderGroupId",
        "sellerId",
        "productId",
        "variantId",
        "quantity",
        "netPrice",
        "grossPrice",
        "vatRate",
        "productSnapshotJson",
        "variantNameSnapshot",
        "variantAmountSnapshot",
        "createdAt",
      )
      .whereIn("orderId", orderIds)
      .orderBy("id", "asc"),
    db("sellers")
      .select("id", "companyName", "nip", "phone", "address", "city", "postalCode")
      .whereIn("id", sellerIds),
    db("clients")
      .select("id", "name", "companyName", "nip", "phone", "address", "city", "postalCode")
      .whereIn("id", clientIds),
    db("seller_settings")
      .select(
        "sellerId",
        "payoutAccountHolder",
        "payoutBankAccount",
        "payoutBankName",
        "paymentDueDays",
      )
      .whereIn("sellerId", sellerIds),
  ]);

  const mappedItems = itemsRows.map(mapOrderItem);
  const itemsByOrderId = {};
  mappedItems.forEach((item) => {
    const key = Number(item.orderId);
    if (!itemsByOrderId[key]) itemsByOrderId[key] = [];
    itemsByOrderId[key].push(item);
  });

  const sellersById = {};
  sellersRows.forEach((seller) => {
    sellersById[Number(seller.id)] = seller;
  });

  const clientsById = {};
  clientsRows.forEach((client) => {
    clientsById[Number(client.id)] = client;
  });

  const sellerSettingsBySellerId = {};
  sellerSettingsRows.forEach((settings) => {
    sellerSettingsBySellerId[Number(settings.sellerId)] = settings;
  });

  const mappedOrders = await attachOrderNumbers(orders.map((order) => {
    const mappedOrder = mapOrder(order);
    const orderItems = itemsByOrderId[mappedOrder.id] || [];
    const seller = sellersById[mappedOrder.sellerId];
    const sellerSettings = sellerSettingsBySellerId[mappedOrder.sellerId];
    const client = resolveOrderClient(mappedOrder, clientsById[mappedOrder.clientId]);
    const dueDate = addDays(mappedOrder.createdAt, sellerSettings?.paymentDueDays || 7);

    return {
      ...mappedOrder,
      items: orderItems,
      seller: seller ? mapSellerSummary(seller, sellerSettings) : null,
      client,
      sellerScope: summarizeSellerItems(orderItems),
      proforma: {
        documentNumber: `PF/${mappedOrder.orderGroupId}/${mappedOrder.id}`,
        issuedAt: formatDateOnly(mappedOrder.createdAt),
        dueDate: formatDateOnly(dueDate),
        paymentMethodLabel: "Przelew tradycyjny",
        paymentTitle: `Proforma ${mappedOrder.orderGroupId}/${mappedOrder.id}`,
        paymentStatus: mappedOrder.paymentStatus,
        amountGross: Number(mappedOrder.totalGross || 0),
        seller: seller ? mapSellerSummary(seller, sellerSettings) : null,
        client,
      },
    };
  }));

  const baseOrder = mappedOrders[0];
  const totalNet = mappedOrders.reduce((sum, order) => sum + Number(order.totalNet || 0), 0);
  const totalGross = mappedOrders.reduce((sum, order) => sum + Number(order.totalGross || 0), 0);
  const totalShipping = mappedOrders.reduce(
    (sum, order) => sum + Number(order.totalShipping || 0),
    0,
  );
  const totalItemsCount = mappedOrders.reduce(
    (sum, order) => sum + Number(order.sellerScope?.itemsCount || 0),
    0,
  );
  const allItems = mappedOrders.flatMap((order) => order.items || []);
  const isPaid = mappedOrders.every((order) => order.paymentStatus === "paid");
  const hasFailedPayment = mappedOrders.some((order) => order.paymentStatus === "failed");

  return {
    orderGroupId: normalizedOrderGroupId,
    orderGroupNumber: baseOrder.orderGroupNumber || null,
    clientId: Number(baseOrder.clientId),
    createdAt: baseOrder.createdAt,
    updatedAt: baseOrder.updatedAt,
    status: isPaid ? "completed" : hasFailedPayment ? "payment_failed" : "awaiting_payment",
    paymentStatus: isPaid ? "paid" : hasFailedPayment ? "failed" : "pending",
    deliveryAddressSnapshot: baseOrder.deliveryAddressSnapshot || null,
    summary: {
      sellersCount: mappedOrders.length,
      itemsCount: totalItemsCount,
      totalNet: Number(totalNet.toFixed(2)),
      totalGross: Number(totalGross.toFixed(2)),
      totalShipping: Number(totalShipping.toFixed(2)),
    },
    client: baseOrder.client || null,
    orders: mappedOrders,
    items: allItems,
  };
};

const updateOrderById = async ({ userId, role, orderId, payload }) => {
  const normalizedOrderId = Number(orderId);
  if (!normalizedOrderId) {
    const error = new Error("orderId is required");
    error.status = 400;
    throw error;
  }

  const normalizedRole = String(role || "").toUpperCase();
  const rolePermissions =
    ROLE_ORDER_PERMISSIONS[normalizedRole] || ROLE_ORDER_PERMISSIONS.CLIENT;
  const allowedStatuses = ORDER_STATUSES.map((item) => item.value);
  const allowedPaymentStatuses = PAYMENT_STATUSES.map((item) => item.value);
  const currentOrder = await getOrderById({
    userId,
    role: normalizedRole,
    orderId: normalizedOrderId,
  });

  const updates = {};
  if (payload.status !== undefined) {
    if (!allowedStatuses.includes(payload.status)) {
      const error = new Error("Invalid order status");
      error.status = 400;
      throw error;
    }
    if (!rolePermissions.status.includes(payload.status)) {
      const error = new Error("Forbidden order status");
      error.status = 403;
      throw error;
    }
    const allowedTransitions = Array.isArray(ORDER_STATUS_TRANSITIONS[currentOrder.status])
      ? ORDER_STATUS_TRANSITIONS[currentOrder.status]
      : [];
    if (payload.status !== currentOrder.status && !allowedTransitions.includes(payload.status)) {
      const error = new Error("Order status transition is not allowed");
      error.status = 400;
      throw error;
    }
    updates.status = payload.status;
  }

  if (payload.paymentStatus !== undefined) {
    if (!allowedPaymentStatuses.includes(payload.paymentStatus)) {
      const error = new Error("Invalid payment status");
      error.status = 400;
      throw error;
    }
    if (!rolePermissions.paymentStatus.includes(payload.paymentStatus)) {
      const error = new Error("Forbidden payment status");
      error.status = 403;
      throw error;
    }
    const allowedTransitions = Array.isArray(PAYMENT_STATUS_TRANSITIONS[currentOrder.paymentStatus])
      ? PAYMENT_STATUS_TRANSITIONS[currentOrder.paymentStatus]
      : [];
    if (
      payload.paymentStatus !== currentOrder.paymentStatus &&
      !allowedTransitions.includes(payload.paymentStatus)
    ) {
      const error = new Error("Payment status transition is not allowed");
      error.status = 400;
      throw error;
    }
    updates.paymentStatus = payload.paymentStatus;
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error("Nothing to update");
    error.status = 400;
    throw error;
  }

  const updated = await db("orders")
    .where({ id: normalizedOrderId })
    .update({
      ...updates,
      updatedAt: db.fn.now(),
    });

  if (!updated) {
    const error = new Error("Order not found");
    error.status = 404;
    throw error;
  }

  return getOrderById({
    role: normalizedRole === "SELLER" ? "SELLER" : "ADMIN",
    userId,
    orderId: normalizedOrderId,
  });
};

const deleteOrderById = async ({ orderId }) => {
  const normalizedOrderId = Number(orderId);
  if (!normalizedOrderId) {
    const error = new Error("orderId is required");
    error.status = 400;
    throw error;
  }

  return db.transaction(async (trx) => {
    const order = await trx("orders").where({ id: normalizedOrderId }).first();
    if (!order) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    await trx("seller_financial_entries").where({ orderId: normalizedOrderId }).del();
    await trx("order_items").where({ orderId: normalizedOrderId }).del();
    await trx("orders").where({ id: normalizedOrderId }).del();

    return { ok: true, id: normalizedOrderId };
  });
};

module.exports = {
  createOrderFromCurrentCart,
  getOrders,
  getOrderById,
  getOrderGroupById,
  updateOrderById,
  deleteOrderById,
};
