import { createRoot } from 'react-dom/client'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './index.scss'
import App from './App.jsx'
import LoginPage from './pages/login'
import AuthProvider from './providers/authProvider'
import { ConfigProvider } from './providers/configProvider'
import { NotificationProvider } from './components/GlobalNotification/index.js'

createRoot(document.getElementById('root')).render(
  <NotificationProvider>
    <AuthProvider
      loggedChildren={
        <ConfigProvider>
          <App />
        </ConfigProvider>
      }
      noLoggedChildren={<LoginPage />}
    />
  </NotificationProvider>,
)



