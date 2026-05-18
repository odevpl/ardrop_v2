import { apiDelete, apiGet, apiPatch, apiPost } from "./api";

export const getGlobalDiscounts = () => {
  return apiGet({
    url: "global-discounts",
  });
};

export const createGlobalDiscount = (data) => {
  return apiPost({
    url: "global-discounts",
    data,
  });
};

export const updateGlobalDiscount = ({ id, payload }) => {
  return apiPatch({
    url: `global-discounts/${id}`,
    data: payload,
  });
};

export const deleteGlobalDiscount = (id) => {
  return apiDelete({
    url: `global-discounts/${id}`,
  });
};

export default {
  getGlobalDiscounts,
  createGlobalDiscount,
  updateGlobalDiscount,
  deleteGlobalDiscount,
};
