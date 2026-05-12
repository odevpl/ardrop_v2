import { apiPost } from "./api";

const DDDService = {
  sendInquiry: (data) => apiPost({ url: "contact/ddd", data }),
};

export default DDDService;
