import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.scss'
import App from './App.jsx'
import AuthPages from './pages/auth'
import AuthProvider from './providers/authProvider'
import { NotificationProvider } from './components/GlobalNotification/index.js'

createRoot(document.getElementById('root')).render(
  <NotificationProvider>
    <BrowserRouter>
      <AuthProvider loggedChildren={<App />} noLoggedChildren={<AuthPages />} />
    </BrowserRouter>
  </NotificationProvider>,
)



