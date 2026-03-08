import { apiDelete, apiGet, apiPost, apiPut } from './api'
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

export const getProductById = (id) => {
  return apiGet({
    url: `products/${id}`,
  })
}

export const updateProduct = ({ id, payload }) => {
  return apiPut({
    url: `products/${id}`,
    data: payload,
  })
}

export const uploadProductImage = async ({ productId, file }) => {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await http.post(`/products/${productId}/images`, formData)
    return response.data
  } catch (error) {
    return error?.response
  }
}

export const deleteProductImage = async ({ productId, fileName }) => {
  try {
    const response = await http.delete(
      `/products/${productId}/images/${encodeURIComponent(fileName)}`,
    )
    return response.data
  } catch (error) {
    return error?.response
  }
}

export const setMainProductImage = async ({ productId, imageId }) => {
  try {
    const response = await http.post(`/products/${productId}/images/main`, { imageId })
    return response.data
  } catch (error) {
    return error?.response
  }
}

export const deleteProduct = (id) => {
  return apiDelete({
    url: `products/${id}`,
  })
}

export default {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  setMainProductImage,
}

