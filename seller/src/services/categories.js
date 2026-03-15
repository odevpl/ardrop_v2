import { apiGet } from './api'

export const getCategories = (params = {}) =>
  apiGet({
    url: 'categories',
    params,
  })

export const getCategoryById = (id) =>
  apiGet({
    url: `categories/${id}`,
  })

export default {
  getCategories,
  getCategoryById,
}
