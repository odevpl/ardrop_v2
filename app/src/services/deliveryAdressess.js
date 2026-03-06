import { apiDelete, apiGet, apiPatch, apiPost, apiRequest } from "./api";

export const getCurrentDeliveryAdressess = () =>
  apiGet({
    url: "deliveries/current",
  });

export const getDeliveryAdressess = () =>
  apiGet({
    url: "account/delivery-addresses",
  });

export const createDeliveryAdressess = (data) =>
  apiPost({
    url: "account/delivery-addresses",
    data,
  });

export const updateDeliveryAdressess = (id, data) =>
  apiPatch({
    url: `account/delivery-addresses/${id}`,
    data,
  });

export const deleteDeliveryAdressess = (id) =>
  apiDelete({
    url: `account/delivery-addresses/${id}`,
  });

export const saveCurrentDeliveryAdressess = (data) =>
  apiRequest({
    method: "PUT",
    url: "deliveries/current",
    data,
  });

export default {
  getCurrentDeliveryAdressess,
  getDeliveryAdressess,
  createDeliveryAdressess,
  updateDeliveryAdressess,
  deleteDeliveryAdressess,
  saveCurrentDeliveryAdressess,
};
