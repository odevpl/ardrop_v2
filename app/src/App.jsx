import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./providers/authProvider";
import SidebarMenu from "./components/SidebarMenu";
import TopMenu from "./components/TopMenu";
import Footer from "./components/Footer";
import { SIDEBAR_MENU_CONFIG } from "./components/SidebarMenu/sidebar.config";
import HomePage from "pages/home";
import CartPage from "pages/cart";
import AccountPage from "pages/account";
import DeliveryAdressessPage from "pages/deliveryAdressess";
import DeliveriesListPage from "pages/deliveriesList";
import CartsService from "services/carts";
import "./App.scss";

const renderTopMenuItem = ({ item, key, className, content }) =>
  typeof item.onClick === "function" ? (
    <button
      key={key}
      type="button"
      className={className}
      onClick={item.onClick}
      aria-label={item.ariaLabel}
    >
      {content}
    </button>
  ) : (
    <NavLink
      key={key}
      to={item.path}
      aria-label={item.ariaLabel}
      className={({ isActive }) =>
        `${className}${isActive ? " topMenuItemActive" : ""}`
      }
    >
      {content}
    </NavLink>
  );

function App() {
  const { logout } = useAuth();
  const [cartItemsCount, setCartItemsCount] = useState(0);

  const refreshCartCount = async () => {
    const response = await CartsService.getCurrentCart();
    if (response?.status && response.status >= 400) {
      setCartItemsCount(0);
      return;
    }

    const items = response?.data?.items || response?.cart?.items || [];
    const count = items.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0),
      0,
    );
    setCartItemsCount(count);
  };

  useEffect(() => {
    refreshCartCount();
    const onCartUpdated = () => refreshCartCount();
    window.addEventListener("cart:updated", onCartUpdated);
    return () => window.removeEventListener("cart:updated", onCartUpdated);
  }, []);

  const cartBadge = cartItemsCount > 9 ? "9+" : String(cartItemsCount);

  const topMenuConfig = [
    { key: "promo", label: "Promocje", path: "/promocje" },
    { key: "news", label: "Nowosci", path: "/nowosci" },
    { key: "bestsellers", label: "Bestsellery", path: "/bestsellery" },
    {
      key: "deliveryAdressess",
      path: "/dostawy",
      align: "right",
      ariaLabel: "Dostawy",
      icon: <i className="fa-solid fa-truck" aria-hidden="true" />,
    },
    {
      key: "account",
      path: "/klient",
      align: "right",
      ariaLabel: "Konto",
      icon: <i className="fa-solid fa-user" aria-hidden="true" />,
    },
    {
      key: "cart",
      path: "/koszyk",
      align: "right",
      ariaLabel: "Koszyk",
      icon: (
        <span className="topMenuCartIconWrap">
          <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
          {cartItemsCount > 0 ? (
            <span className="topMenuCartBadge">{cartBadge}</span>
          ) : null}
        </span>
      ),
      // label: "Koszyk",
    },
    {
      key: "logout",
      align: "right",
      ariaLabel: "Wyloguj",
      icon: <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />,
      // label: "Wyloguj",
      onClick: logout,
    },
  ];

  return (
    <div className="clientLayout">
      <div className="clientContent">
        <aside className="clientSidebarColumn">
          <div className="clientLogoWrap" aria-label="Logo aplikacji">
            <NavLink to="/" aria-label="Przejdz do strony glownej">
              <img className="clientLogoImage" src="/logo.png" alt="Airdrop" />
            </NavLink>
          </div>
          <SidebarMenu config={SIDEBAR_MENU_CONFIG} />
        </aside>

        <main className="clientMain">
          <TopMenu config={topMenuConfig} renderItem={renderTopMenuItem} />
          <div className="clientMainContent">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/koszyk" element={<CartPage />} />
              <Route path="/konto" element={<AccountPage />} />
              <Route path="/klient" element={<AccountPage />} />
              <Route path="/dostawy" element={<DeliveriesListPage />} />
              <Route path="/adresy-dostawy" element={<DeliveryAdressessPage />} />
              <Route path="/promocje" element={<HomePage />} />
              <Route path="/nowosci" element={<HomePage />} />
              <Route path="/bestsellery" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
