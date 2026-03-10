import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import http from "./http";

export const getCampaigns = (params = {}) => {
  return apiGet({
    url: "marketing/campaigns",
    params,
  });
};

export const createCampaign = (data) => {
  return apiPost({
    url: "marketing/campaigns",
    data,
  });
};

export const updateCampaign = ({ id, payload }) => {
  return apiPatch({
    url: `marketing/campaigns/${id}`,
    data: payload,
  });
};

export const deleteCampaign = (id) => {
  return apiDelete({
    url: `marketing/campaigns/${id}`,
  });
};

export const getCampaignItems = (campaignId) => {
  return apiGet({
    url: `marketing/campaigns/${campaignId}/items`,
  });
};

export const createCampaignItem = async ({ campaignId, payload, file }) => {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
  formData.append("image", file);

  try {
    const response = await http.post(`/marketing/campaigns/${campaignId}/items`, formData);
    return response.data;
  } catch (error) {
    return error?.response;
  }
};

export const updateCampaignItem = ({ id, payload }) => {
  return apiPatch({
    url: `marketing/campaign-items/${id}`,
    data: payload,
  });
};

export const deleteCampaignItem = (id) => {
  return apiDelete({
    url: `marketing/campaign-items/${id}`,
  });
};

export default {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignItems,
  createCampaignItem,
  updateCampaignItem,
  deleteCampaignItem,
};
