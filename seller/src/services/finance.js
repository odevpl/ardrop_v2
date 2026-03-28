import { apiGet } from './api'

export const getFinancialHistory = (params = {}) =>
  apiGet({
    url: 'seller/me/financial-history',
    params,
  })

export default {
  getFinancialHistory,
}
