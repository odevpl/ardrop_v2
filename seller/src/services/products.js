import { apiGet, apiPost } from './api'
import http from './http'

export const getProducts = (params = {}) => {
  return apiGet({
    url: 'products',
    params,
  })
}

export const createProduct = (data) => {
  return apiPost({
    url: 'products',
    data,
  })
}

export const uploadProductImage = async ({ productId, file }) => {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await http.post(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    return error?.response
  }
}

export default {
  getProducts,
  createProduct,
  uploadProductImage,
}
