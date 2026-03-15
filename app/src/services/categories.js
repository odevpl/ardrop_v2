import { apiGet } from './api'

export const getCategories = (params = {}) =>
  apiGet({
    url: 'categories',
    params,
  })

export default {
  getCategories,
}
