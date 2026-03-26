import { apiGet, apiRequest } from './api'

export const getSellerSettings = () =>
  apiGet({
    url: 'seller/me/settings',
  })

export const updateSellerSettings = (data) =>
  apiRequest({
    method: 'PATCH',
    url: 'seller/me/settings',
    data,
  })

export default {
  getSellerSettings,
  updateSellerSettings,
}
