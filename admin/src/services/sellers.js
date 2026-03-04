import { apiGet } from './api'

export const getSellers = (params = {}) => {
  return apiGet({
    url: 'sellers',
    params,
  })
}

export default {
  getSellers,
}
