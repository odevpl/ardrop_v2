import dayjs from "dayjs";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import SidebarMenu from "./components/SidebarMenu";
import { SIDEBAR_MENU_CONFIG } from "./components/SidebarMenu/sidebar.config";
import ProductsPage from "./pages/products";
import AddProductPage from "./pages/products/AddProduct";
import ProductDetailsPage from "./pages/products/Details";
import OrdersPage from "./pages/orders";
import OrderDetailsPage from "./pages/orders/Details";
import CompanySupportPage from "./pages/company-support";
import FulfillmentPage from "./pages/fulfillment";
import ShippingPage from "./pages/shipping";
import ShippingDetailsPage from "./pages/shipping/Details";
import ReturnsPage from "./pages/returns";
import DiscountsPage from "./pages/discounts";
import PricingRulesPage from "./pages/pricing-rules";
import DiscountDetailsPage from "./pages/discounts/Details";
import FinancePage from "./pages/finance";
import AutomationsPage from "./pages/automations";
import PayoutSettingsPage from "./pages/payout-settings";
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
          <Route path="/company-support" element={<CompanySupportPage />} />
          <Route path="/fulfillment" element={<FulfillmentPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/shipping/new" element={<ShippingDetailsPage />} />
          <Route path="/shipping/:id" element={<ShippingDetailsPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/discounts/new" element={<DiscountDetailsPage />} />
          <Route path="/discounts/:id" element={<DiscountDetailsPage />} />
          <Route path="/pricing-rules" element={<PricingRulesPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/payout-settings" element={<PayoutSettingsPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route
            path="/configuration/company-support"
            element={<Navigate to="/company-support" replace />}
          />
          <Route
            path="/configuration/fulfillment"
            element={<Navigate to="/fulfillment" replace />}
          />
          <Route
            path="/configuration/shipping"
            element={<Navigate to="/shipping" replace />}
          />
          <Route
            path="/configuration/shipping/new"
            element={<Navigate to="/shipping/new" replace />}
          />
          <Route
            path="/configuration/shipping/:id"
            element={<ShippingDetailsPage />}
          />
          <Route
            path="/configuration/returns"
            element={<Navigate to="/returns" replace />}
          />
          <Route
            path="/configuration/pricing"
            element={<Navigate to="/pricing-rules" replace />}
          />
          <Route
            path="/pricing"
            element={<Navigate to="/pricing-rules" replace />}
          />
          <Route
            path="/configuration/finance"
            element={<Navigate to="/finance" replace />}
          />
          <Route
            path="/configuration/payout-settings"
            element={<Navigate to="/payout-settings" replace />}
          />
          <Route
            path="/configuration/automations"
            element={<Navigate to="/automations" replace />}
          />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
