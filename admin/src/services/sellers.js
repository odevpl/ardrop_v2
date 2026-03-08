import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export const getSellers = (params = {}) => {
  return apiGet({
    url: 'sellers',
    params,
  })
}

export const createSeller = (seller) => {
  return apiPost({
    url: 'sellers',
    data: seller,
  })
}

export const getSellerById = (id) => {
  return apiGet({
    url: `sellers/${id}`,
  })
}

export const updateSeller = (id, seller) => {
  return apiPatch({
    url: `sellers/${id}`,
    data: seller,
  })
}

export const deleteSeller = (id) => {
  return apiDelete({
    url: `sellers/${id}`,
  })
}

export default {
  getSellers,
  createSeller,
  getSellerById,
  updateSeller,
  deleteSeller,
}
