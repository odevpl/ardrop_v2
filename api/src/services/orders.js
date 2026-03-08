const db = require("../config/db");

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

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

const mapOrder = (order) => ({
  id: Number(order.id),
  orderGroupId: Number(order.orderGroupId),
  sellerId: Number(order.sellerId),
  clientId: Number(order.clientId),
  totalNet: Number(order.totalNet),
  totalGross: Number(order.totalGross),
  totalShipping: Number(order.totalShipping),
  paymentStatus: order.paymentStatus,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const mapOrderItem = (item) => ({
  id: Number(item.id),
  orderId: Number(item.orderId),
  orderGroupId: Number(item.orderGroupId),
  sellerId: Number(item.sellerId),
  productId: Number(item.productId),
  quantity: Number(item.quantity),
  netPrice: Number(item.netPrice),
  grossPrice: Number(item.grossPrice),
  vatRate: Number(item.vatRate),
  productSnapshot: parseSnapshot(item.productSnapshotJson),
  createdAt: item.createdAt,
});

const summarizeSellerItems = (items) => {
  const totals = items.reduce(
    (acc, item) => {
      acc.totalNet += Number(item.netPrice) * Number(item.quantity);
      acc.totalGross += Number(item.grossPrice) * Number(item.quantity);
      acc.itemsCount += Number(item.quantity);
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

const createOrderFromCurrentCart = async ({ userId, role, clientId }, trxDb = db) => {
  return trxDb.transaction(async (trx) => {
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

    if (cartItems.length === 0) {
      const error = new Error("Cart is empty");
      error.status = 400;
      throw error;
    }

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

    const createdOrderIds = [];

    for (const [sellerIdKey, sellerItems] of Object.entries(groupedBySeller)) {
      const sellerId = Number(sellerIdKey);
      const totalNet = roundMoney(
        sellerItems.reduce((sum, item) => sum + Number(item.lineNet || 0), 0),
      );
      const totalGross = roundMoney(
        sellerItems.reduce((sum, item) => sum + Number(item.lineGross || 0), 0),
      );

      const insertedOrder = await trx("orders").insert({
        orderGroupId,
        sellerId,
        clientId: resolvedClientId,
        totalNet,
        totalGross,
        totalShipping: 0,
        paymentStatus: "pending",
        status: "new",
      });
      const orderId = Array.isArray(insertedOrder) ? insertedOrder[0] : insertedOrder;
      createdOrderIds.push(Number(orderId));

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
          images: imagesByProductId[Number(product.id)] || [],
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };

        await trx("order_items").insert({
          orderId: Number(orderId),
          orderGroupId,
          sellerId,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          netPrice: roundMoney(item.unitNet),
          grossPrice: roundMoney(item.unitGross),
          vatRate: roundMoney(item.vatRate),
          productSnapshotJson: JSON.stringify(productSnapshot),
        });
      }
    }

    await trx("cart_items").where({ cartId: Number(cart.id) }).del();
    await trx("carts")
      .where({ id: Number(cart.id) })
      .update({
        totalNet: 0,
        totalGross: 0,
        updatedAt: trx.fn.now(),
      });

    const orders = await trx("orders")
      .select(
        "id",
        "orderGroupId",
        "sellerId",
        "clientId",
        "totalNet",
        "totalGross",
        "totalShipping",
        "paymentStatus",
        "status",
        "createdAt",
        "updatedAt",
      )
      .whereIn("id", createdOrderIds)
      .orderBy("id", "asc");

    return {
      orderGroupId,
      primaryOrderId: Number(orders[0]?.id),
      orders: orders.map(mapOrder),
    };
  });
};

const getOrders = async ({ userId, role }) => {
  const query = db("orders")
    .select(
      "orders.id",
      "orders.orderGroupId",
      "orders.sellerId",
      "orders.clientId",
      "orders.totalNet",
      "orders.totalGross",
      "orders.totalShipping",
      "orders.paymentStatus",
      "orders.status",
      "orders.createdAt",
      "orders.updatedAt",
    )
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

  if (role === "SELLER") {
    const orderIds = orders.map((order) => Number(order.id));
    const items = await db("order_items")
      .select(
        "id",
        "orderId",
        "orderGroupId",
        "sellerId",
        "productId",
        "quantity",
        "netPrice",
        "grossPrice",
        "vatRate",
        "productSnapshotJson",
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

    return orders.map((order) => {
      const visibleItems = itemsByOrderId[Number(order.id)] || [];
      return {
        ...mapOrder(order),
        items: visibleItems,
        sellerScope: summarizeSellerItems(visibleItems),
      };
    });
  }

  return orders.map(mapOrder);
};

const getOrderById = async ({ userId, role, orderId }) => {
  const normalizedOrderId = Number(orderId);
  if (!normalizedOrderId) {
    const error = new Error("orderId is required");
    error.status = 400;
    throw error;
  }

  const query = db("orders")
    .select(
      "orders.id",
      "orders.orderGroupId",
      "orders.sellerId",
      "orders.clientId",
      "orders.totalNet",
      "orders.totalGross",
      "orders.totalShipping",
      "orders.paymentStatus",
      "orders.status",
      "orders.createdAt",
      "orders.updatedAt",
    )
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
      "quantity",
      "netPrice",
      "grossPrice",
      "vatRate",
      "productSnapshotJson",
      "createdAt",
    )
    .where("orderId", normalizedOrderId)
    .orderBy("id", "asc");

  if (role === "SELLER") {
    itemsQuery.andWhere("sellerId", sellerId);
  }

  const items = await itemsQuery;
  const mappedItems = items.map(mapOrderItem);

  const mappedOrder = mapOrder(order);
  if (role === "SELLER") {
    return {
      ...mappedOrder,
      items: mappedItems,
      sellerScope: summarizeSellerItems(mappedItems),
    };
  }

  return {
    ...mappedOrder,
    items: mappedItems,
  };
};

const updateOrderById = async ({ orderId, payload }) => {
  const normalizedOrderId = Number(orderId);
  if (!normalizedOrderId) {
    const error = new Error("orderId is required");
    error.status = 400;
    throw error;
  }

  const allowedStatuses = ["new", "processing", "shipped", "completed", "cancelled"];
  const allowedPaymentStatuses = ["pending", "paid", "failed"];

  const updates = {};
  if (payload.status !== undefined) {
    if (!allowedStatuses.includes(payload.status)) {
      const error = new Error("Invalid order status");
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

  return getOrderById({ role: "ADMIN", userId: 0, orderId: normalizedOrderId });
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

    await trx("order_items").where({ orderId: normalizedOrderId }).del();
    await trx("orders").where({ id: normalizedOrderId }).del();

    return { ok: true, id: normalizedOrderId };
  });
};

module.exports = {
  createOrderFromCurrentCart,
  getOrders,
  getOrderById,
  updateOrderById,
  deleteOrderById,
};
