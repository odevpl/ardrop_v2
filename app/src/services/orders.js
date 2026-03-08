import { apiGet } from "./api";
import { apiPost } from "./api";

export const getOrders = () =>
  apiGet({
    url: "orders",
  });

export const getOrderById = (id) =>
  apiGet({
    url: `orders/${id}`,
  });

export const createOrder = (payload = {}) =>
  apiPost({
    url: "orders",
    data: payload,
  });

export default {
  getOrders,
  getOrderById,
  createOrder,
};
