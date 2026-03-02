import { apiGet, apiPost } from './api'

export const login = (data) => {
  return apiPost({
    url: 'auth/login',
    data,
  })
}

export const me = () => {
  return apiGet({
    url: 'auth/me',
  })
}

export default {
  login,
  me,
}
