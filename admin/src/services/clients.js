import { apiDelete, apiGet, apiPatch, apiPost } from './api'

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

export const getClientById = (id) => {
  return apiGet({
    url: `clients/${id}`,
  })
}

export const updateClient = (id, client) => {
  return apiPatch({
    url: `clients/${id}`,
    data: client,
  })
}

export const deleteClient = (id) => {
  return apiDelete({
    url: `clients/${id}`,
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
  getClientById,
  updateClient,
  deleteClient,
  setDeliveryAddress,
}
