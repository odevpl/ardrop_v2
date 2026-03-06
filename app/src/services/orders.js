import { apiGet } from "./api";

export const getOrders = () =>
  apiGet({
    url: "orders",
  });

export const getOrderById = (id) =>
  apiGet({
    url: `orders/${id}`,
  });

export default {
  getOrders,
  getOrderById,
};
