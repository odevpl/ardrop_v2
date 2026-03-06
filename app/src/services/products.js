import { apiGet } from './api'

export const getProducts = (params = {}) => {
  return apiGet({
    url: 'products',
    params,
  })
}

export const getSuggestedProducts = () => {
  return apiGet({
    url: 'products/suggested',
  })
}

export const getProductById = (id) => {
  return apiGet({
    url: `products/${id}`,
  })
}

export default {
  getProducts,
  getSuggestedProducts,
  getProductById,
}
