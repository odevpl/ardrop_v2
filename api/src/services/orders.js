const db = require("../config/db");

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

module.exports = {
  getOrders,
  getOrderById,
};
