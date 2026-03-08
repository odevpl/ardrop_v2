import { Navigate, Route, Routes } from 'react-router-dom'
import ActivatePage from 'pages/activate'
import ForgotPasswordPage from 'pages/forgot-password'
import LoginPage from 'pages/login'
import RegisterPage from 'pages/register'
import ResetPasswordPage from 'pages/reset-password'

const AuthPages = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AuthPages
