import { apiGet } from "./api";

export const getForms = () => apiGet({ url: "admin/forms" });

export const getFormMessages = ({ formName, ...filters }) =>
  apiGet({ url: `admin/forms/${formName}`, params: filters });

export const getFormMessage = (formName, id) =>
  apiGet({ url: `admin/forms/${formName}/${id}` });
