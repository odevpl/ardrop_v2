import dayjs from "dayjs";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import SidebarMenu from "components/SidebarMenu";
import { SIDEBAR_MENU_CONFIG } from "components/SidebarMenu/sidebar.config";
import ClientsPage from "pages/clients";
import ClientDetailsPage from "pages/clients/Details";
import OrdersPage from "pages/orders";
import OrderDetailsPage from "pages/orders/Details";
import ProductsPage from "pages/products";
import AddProductPage from "pages/products/AddProduct";
import ProductDetailsPage from "pages/products/Details";
import SellersPage from "pages/sellers";
import SellerDetailsPage from "pages/sellers/Details";
import "./App.scss";

const AppContent = () => {
  const nowLabel = dayjs().format("DD.MM.YYYY HH:mm");
  const { pathname } = useLocation();
  const currentItem =
    SIDEBAR_MENU_CONFIG.find(
      (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
    ) ?? SIDEBAR_MENU_CONFIG[0];

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
            <Route path="/clients/:id" element={<ClientDetailsPage />} />
            <Route path="/sellers" element={<SellersPage />} />
            <Route path="/sellers/:id" element={<SellerDetailsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/add" element={<AddProductPage />} />
            <Route path="/products/:id" element={<ProductDetailsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailsPage />} />
          </Routes>
        </section>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;

