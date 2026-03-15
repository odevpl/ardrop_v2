import { apiDelete, apiGet, apiPost, apiPut } from './api'
import http from './http'

export const getCategories = (params = {}) =>
  apiGet({
    url: 'categories',
    params,
  })

export const getCategoryById = (id) =>
  apiGet({
    url: `categories/${id}`,
  })

export const createCategory = (data) =>
  apiPost({
    url: 'categories',
    data,
  })

export const updateCategory = ({ id, payload }) =>
  apiPut({
    url: `categories/${id}`,
    data: payload,
  })

export const deleteCategory = (id) =>
  apiDelete({
    url: `categories/${id}`,
  })

export const uploadCategoryImage = async ({ categoryId, file }) => {
  const formData = new FormData()
  formData.append('image', file)

  try {
    const response = await http.post(`/categories/${categoryId}/images`, formData)
    return response.data
  } catch (error) {
    return error?.response
  }
}

export const deleteCategoryImage = async ({ categoryId, fileName }) => {
  try {
    const response = await http.delete(`/categories/${categoryId}/images/${encodeURIComponent(fileName)}`)
    return response.data
  } catch (error) {
    return error?.response
  }
}

export const setMainCategoryImage = async ({ categoryId, imageId }) => {
  try {
    const response = await http.post(`/categories/${categoryId}/images/main`, { imageId })
    return response.data
  } catch (error) {
    return error?.response
  }
}

export default {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  deleteCategoryImage,
  setMainCategoryImage,
}
