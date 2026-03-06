import { apiDelete, apiGet, apiPatch, apiPost, apiRequest } from "./api";

export const getCurrentDelivery = () =>
  apiGet({
    url: "deliveries/current",
  });

export const getDeliveryAddresses = () =>
  apiGet({
    url: "account/delivery-addresses",
  });

export const createDeliveryAddress = (data) =>
  apiPost({
    url: "account/delivery-addresses",
    data,
  });

export const updateDeliveryAddress = (id, data) =>
  apiPatch({
    url: `account/delivery-addresses/${id}`,
    data,
  });

export const deleteDeliveryAddress = (id) =>
  apiDelete({
    url: `account/delivery-addresses/${id}`,
  });

export const saveCurrentDelivery = (data) =>
  apiRequest({
    method: "PUT",
    url: "deliveries/current",
    data,
  });

export default {
  getCurrentDelivery,
  getDeliveryAddresses,
  createDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
  saveCurrentDelivery,
};
