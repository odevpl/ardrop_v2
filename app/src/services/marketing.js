import { apiGet } from "./api";

export const getHomeHeroCampaign = () => {
  return apiGet({
    url: "marketing/public/home-hero",
  });
};

export default {
  getHomeHeroCampaign,
};

