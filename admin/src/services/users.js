import { apiGet } from './api'

export const getUsers = (params = {}) => {
  return apiGet({
    url: 'users',
    params,
  })
}

export default {
  getUsers,
}
