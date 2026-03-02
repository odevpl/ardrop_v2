import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/login'
import AuthProvider from './providers/authProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider loggedChildren={<App />} noLoggedChildren={<LoginPage />} />
    </BrowserRouter>
  </StrictMode>,
)
