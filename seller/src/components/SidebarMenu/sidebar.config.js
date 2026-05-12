export const SIDEBAR_MENU_CONFIG = [
  {
    label: "Sprzedaz",
    items: [
      { title: "Start", icon: "fa-house", path: "/dashboard" },
      { title: "Produkty", icon: "fa-box-open", path: "/products" },
      { title: "Zamowienia", icon: "fa-cart-shopping", path: "/orders" },
    ],
  },
  {
    label: "Ustawienia i operacje",
    items: [
      // {
      //   title: "Firma i obsluga",
      //   icon: "fa-building",
      //   path: "/company-support",
      // },
      //     { title: 'Realizacja', icon: 'fa-boxes-packing', path: '/fulfillment' },
      { title: "Dostawa", icon: "fa-truck", path: "/shipping" },
      { title: "Rabaty", icon: "fa-ticket", path: "/discounts" },
      {
        title: "Dane do przelewow",
        icon: "fa-landmark",
        path: "/payout-settings",
      },
      //     { title: 'Zwroty', icon: 'fa-rotate-left', path: '/returns' },
      //     { title: 'Finanse', icon: 'fa-wallet', path: '/finance' },
      //     { title: 'Automatyzacje', icon: 'fa-bolt', path: '/automations' },
    ],
  },
];
