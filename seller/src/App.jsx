import dayjs from 'dayjs'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SidebarMenu from './components/SidebarMenu'
import { SIDEBAR_MENU_CONFIG } from './components/SidebarMenu/sidebar.config'
import ProductsPage from './pages/products'
import AddProductPage from './pages/products/AddProduct'
import ProductDetailsPage from './pages/products/Details'
import OrdersPage from './pages/orders'
import OrderDetailsPage from './pages/orders/Details'
import { useAuth } from './providers/authProvider'
import './App.scss'

function App() {
  const { role, logout } = useAuth()
  const { pathname } = useLocation()
  const nowLabel = dayjs().format('DD.MM.YYYY HH:mm')
  const currentItem =
    SIDEBAR_MENU_CONFIG.find((item) => item.path === pathname) ?? SIDEBAR_MENU_CONFIG[0]

  return (
    <div className="sellerLayout">
      <SidebarMenu config={SIDEBAR_MENU_CONFIG} />

      <main className="sellerMain">
        <header className="sellerHeader">
          <div>
            <p className="sellerKicker">Panel sprzedawcy</p>
            <h1 className="sellerTitle">{currentItem?.title || 'Dashboard'}</h1>
            <p className="sellerMeta">Ostatnia synchronizacja: {nowLabel}</p>
          </div>
          <div className="sellerHeaderActions">
            <span className="sellerRoleBadge">{role || 'SELLER'}</span>
            <button type="button" onClick={logout}>
              Wyloguj
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/add" element={<AddProductPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

