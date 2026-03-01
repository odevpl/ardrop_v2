import { apiGet } from './api'

export const getProducts = (params = {}) => {
  return apiGet({
    url: 'products',
    params,
  })
}

export default {
  getProducts,
}
