import { apiGet, apiPut } from './api'

export const getOrders = (params = {}) => {
  return apiGet({
    url: 'orders',
    params,
  })
}

export const getOrderById = (id) =>
  apiGet({
    url: `orders/${id}`,
  })

export const updateOrder = ({ id, payload }) =>
  apiPut({
    url: `orders/${id}`,
    data: payload,
  })

export default {
  getOrders,
  getOrderById,
  updateOrder,
}
