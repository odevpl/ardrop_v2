import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export const getCurrentCart = () =>
  apiGet({
    url: 'carts/current',
  })

export const addItemToCart = ({ productId, variantId = null, quantity = 1 }) =>
  apiPost({
    url: 'carts/items',
    data: {
      productId,
      variantId,
      quantity,
    },
  })

export const updateCartItem = ({ itemId, quantity }) =>
  apiPatch({
    url: `carts/items/${itemId}`,
    data: { quantity },
  })

export const removeCartItem = ({ itemId }) =>
  apiDelete({
    url: `carts/items/${itemId}`,
  })

export const clearCart = () =>
  apiDelete({
    url: 'carts/current/items',
  })

export default {
  getCurrentCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
}
