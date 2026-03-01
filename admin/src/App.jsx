import dayjs from 'dayjs'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SidebarMenu from 'components/SidebarMenu'
import { SIDEBAR_MENU_CONFIG } from 'components/SidebarMenu/sidebar.config'
import ClientsPage from 'pages/clients'
import OrdersPage from 'pages/orders'
import ProductsPage from 'pages/products'
import UsersPage from 'pages/users'
import './App.css'

const AppContent = () => {
  const nowLabel = dayjs().format('DD.MM.YYYY HH:mm')
  const { pathname } = useLocation()
  const currentItem =
    SIDEBAR_MENU_CONFIG.find((item) => item.path === pathname) ?? SIDEBAR_MENU_CONFIG[0]

  return (
    <div className="appLayout">
      <SidebarMenu config={SIDEBAR_MENU_CONFIG} />

      <main className="app">
        <header className="appHeader">
          <p className="appKicker">Airdrop Super Admin</p>
          <h1 className="appTitle">{currentItem.title}</h1>
          <p className="appMeta">Ostatnia synchronizacja: {nowLabel}</p>
        </header>

        <section className="appTableWrap">
          <Routes>
            <Route path="/" element={<Navigate to="/clients" replace />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Routes>
        </section>
      </main>
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
