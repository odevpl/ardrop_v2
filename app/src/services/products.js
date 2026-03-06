import { apiGet } from './api'

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
  getSuggestedProducts,
  getProductById,
}
