import { apiGet, apiPost } from './api'

export const login = (data) => {
  return apiPost({
    url: 'auth/login',
    data,
  })
}

export const register = (data) => {
  return apiPost({
    url: 'auth/register',
    data,
  })
}

export const activate = (data) => {
  return apiPost({
    url: 'auth/activate',
    data,
  })
}

export const forgotPassword = (data) => {
  return apiPost({
    url: 'auth/forgot-password',
    data,
  })
}

export const resetPassword = (data) => {
  return apiPost({
    url: 'auth/reset-password',
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
  register,
  activate,
  forgotPassword,
  resetPassword,
  me,
}
