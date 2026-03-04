import { NavLink } from "react-router-dom";
import { useAuth } from "./providers/authProvider";
import SidebarMenu from "./components/SidebarMenu";
import TopMenu from "./components/TopMenu";
import { SIDEBAR_MENU_CONFIG } from "./components/SidebarMenu/sidebar.config";
import HomePage from "pages/home";
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

  const topMenuConfig = [
    { key: "promo", label: "Promocje", path: "/promocje" },
    { key: "news", label: "Nowosci", path: "/nowosci" },
    { key: "bestsellers", label: "Bestsellery", path: "/bestsellery" },
    {
      key: "cart",
      path: "/koszyk",
      align: "right",
      ariaLabel: "Koszyk",
      icon: <i className="fa-solid fa-cart-shopping" aria-hidden="true" />,
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
      <aside className="clientSidebarColumn">
        <div className="clientLogoWrap" aria-label="Logo aplikacji">
          <img className="clientLogoImage" src="/logo.png" alt="Airdrop" />
        </div>
        <SidebarMenu config={SIDEBAR_MENU_CONFIG} />
      </aside>

      <main className="clientMain">
        <TopMenu config={topMenuConfig} renderItem={renderTopMenuItem} />
        <HomePage />
      </main>
    </div>
  );
}

export default App;
