import dayjs from "dayjs";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import SidebarMenu from "./components/SidebarMenu";
import { SIDEBAR_MENU_CONFIG } from "./components/SidebarMenu/sidebar.config";
import ProductsPage from "./pages/products";
import AddProductPage from "./pages/products/AddProduct";
import ProductDetailsPage from "./pages/products/Details";
import OrdersPage from "./pages/orders";
import OrderDetailsPage from "./pages/orders/Details";
import CompanySupportPage from "./pages/configuration/CompanySupportPage";
import FulfillmentPage from "./pages/configuration/FulfillmentPage";
import ShippingPage from "./pages/configuration/shipping";
import ShippingDetailsPage from "./pages/configuration/shipping/Details";
import ReturnsPage from "./pages/configuration/ReturnsPage";
import PricingPage from "./pages/configuration/PricingPage";
import FinancePage from "./pages/configuration/FinancePage";
import AutomationsPage from "./pages/configuration/AutomationsPage";
import { useAuth } from "./providers/authProvider";
import "./App.scss";

const FLAT_MENU_ITEMS = SIDEBAR_MENU_CONFIG.flatMap((section) => section.items);

const resolveCurrentItem = (pathname) =>
  FLAT_MENU_ITEMS.filter(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  ).sort((a, b) => b.path.length - a.path.length)[0] || FLAT_MENU_ITEMS[0];

function App() {
  const { role, logout } = useAuth();
  const { pathname } = useLocation();
  const nowLabel = dayjs().format("DD.MM.YYYY HH:mm");
  const currentItem = resolveCurrentItem(pathname);

  return (
    <div className="sellerLayout">
      <SidebarMenu config={SIDEBAR_MENU_CONFIG} />

      <main className="sellerMain">
        <header className="sellerHeader">
          <div>
            <p className="sellerKicker">Panel sprzedawcy</p>
            <h1 className="sellerTitle">{currentItem?.title || "Dashboard"}</h1>
            <p className="sellerMeta">Ostatnia synchronizacja: {nowLabel}</p>
          </div>
          <div className="sellerHeaderActions">
            <span className="sellerRoleBadge">{role || "SELLER"}</span>
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
          <Route
            path="/configuration/company-support"
            element={<CompanySupportPage />}
          />
          <Route
            path="/configuration/fulfillment"
            element={<FulfillmentPage />}
          />
          <Route path="/configuration/shipping" element={<ShippingPage />} />
          <Route path="/configuration/shipping/new" element={<ShippingDetailsPage />} />
          <Route
            path="/configuration/shipping/:id"
            element={<ShippingDetailsPage />}
          />
          <Route path="/configuration/returns" element={<ReturnsPage />} />
          <Route path="/configuration/pricing" element={<PricingPage />} />
          <Route path="/configuration/finance" element={<FinancePage />} />
          <Route
            path="/configuration/automations"
            element={<AutomationsPage />}
          />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
