import { apiPost, apiGet } from './api'

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

export const refresh = () => {
  return apiPost({
    url: 'auth/refresh',
    data: { refreshToken: localStorage.getItem('refreshToken') },
  })
}

export const sendResetPasswordMail = ({ email }) => {
  return apiPost({
    url: 'send-reset-password-mail',
    data: { email },
  })
}

export const resetPassword = ({ token, email, newPassword }) => {
  return apiPost({
    url: 'reset-password',
    data: { token, email, newPassword },
  })
}

export const registerUser = ({ userData }) => {
  return apiPost({
    url: 'register-user',
    data: userData,
  })
}

export const activateUser = ({ token }) => {
  return apiPost({
    url: 'activate-user',
    data: { token },
  })
}

export default {
  login,
  me,
  refresh,
  sendResetPasswordMail,
  resetPassword,
  registerUser,
  activateUser,
}
