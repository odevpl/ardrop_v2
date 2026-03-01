import { apiGet, apiPost } from './api'

export const getClients = (params = {}) => {
  return apiGet({
    url: 'clients',
    params,
  })
}

export const setClient = (client) => {
  return apiPost({
    url: 'clients',
    data: client,
  })
}

export const setDeliveryAddress = (deliveryAddress) => {
  return apiPost({
    url: 'clients/delivery-address',
    data: deliveryAddress,
  })
}

export default {
  getClients,
  setClient,
  setDeliveryAddress,
}
