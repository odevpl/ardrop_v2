export const SIDEBAR_MENU_CONFIG = [
  {
    label: "Glowne",
    items: [
      { title: "Produkty", icon: "fa-box-open", path: "/products" },
      { title: "Zamowienia", icon: "fa-cart-shopping", path: "/orders" },
    ],
  },
  {
    label: "Konfiguracja",
    items: [
      // {
      //   title: "Firma i obsluga",
      //   icon: "fa-building",
      //   path: "/configuration/company-support",
      // },
      //     { title: 'Realizacja', icon: 'fa-boxes-packing', path: '/configuration/fulfillment' },
      { title: "Dostawa", icon: "fa-truck", path: "/configuration/shipping" },
      //     { title: 'Zwroty', icon: 'fa-rotate-left', path: '/configuration/returns' },
      // {
      //   title: "Ceny i rabaty",
      //   icon: "fa-tags",
      //   path: "/configuration/pricing",
      // },
      //     { title: 'Finanse', icon: 'fa-wallet', path: '/configuration/finance' },
      //     { title: 'Automatyzacje', icon: 'fa-bolt', path: '/configuration/automations' },
    ],
  },
];
