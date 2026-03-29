import { apiDelete, apiGet, apiPost, apiPut } from './api'

export const getShippingMethods = () =>
  apiGet({
    url: 'seller/me/shipping-methods',
  })

export const getShippingMethodById = (id) =>
  apiGet({
    url: `seller/me/shipping-methods/${id}`,
  })

export const createShippingMethod = (data) =>
  apiPost({
    url: 'seller/me/shipping-methods',
    data,
  })

export const updateShippingMethod = ({ id, payload }) =>
  apiPut({
    url: `seller/me/shipping-methods/${id}`,
    data: payload,
  })

export const deleteShippingMethod = (id) =>
  apiDelete({
    url: `seller/me/shipping-methods/${id}`,
  })

export default {
  getShippingMethods,
  getShippingMethodById,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
}
