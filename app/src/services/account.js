import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export const getMyAccount = () =>
  apiGet({
    url: "account/me",
  });

export const updateMyAccount = (data) =>
  apiPatch({
    url: "account/me",
    data,
  });

export const getMyDeliveryAddresses = () =>
  apiGet({
    url: "account/delivery-addresses",
  });

export const createMyDeliveryAddress = (data) =>
  apiPost({
    url: "account/delivery-addresses",
    data,
  });

export const updateMyDeliveryAddress = (id, data) =>
  apiPatch({
    url: `account/delivery-addresses/${id}`,
    data,
  });

export const deleteMyDeliveryAddress = (id) =>
  apiDelete({
    url: `account/delivery-addresses/${id}`,
  });

export default {
  getMyAccount,
  updateMyAccount,
  getMyDeliveryAddresses,
  createMyDeliveryAddress,
  updateMyDeliveryAddress,
  deleteMyDeliveryAddress,
};
