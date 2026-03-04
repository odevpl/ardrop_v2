import { apiGet } from './api'

export const getSuggestedProducts = () => {
  return apiGet({
    url: 'products/suggested',
  })
}

export default {
  getSuggestedProducts,
}
