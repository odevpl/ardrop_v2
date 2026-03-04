import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.scss'
import App from './App.jsx'
import LoginPage from './pages/login'
import AuthProvider from './providers/authProvider'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider loggedChildren={<App />} noLoggedChildren={<LoginPage />} />
  </BrowserRouter>,
)

