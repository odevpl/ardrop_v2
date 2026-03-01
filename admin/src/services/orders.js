import { apiGet } from './api'
export const getOrders = (params = {}) => {
  return apiGet({
    url: 'orders',
    params,
  })
}

export default {
  getOrders,
}
