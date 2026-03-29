const ORDER_STATUSES = [
  { value: "new", label: "Nowe" },
  { value: "processing", label: "W realizacji" },
  { value: "shipped", label: "Wyslane" },
  { value: "completed", label: "Zrealizowane" },
  { value: "cancelled", label: "Anulowane" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Oczekuje" },
  { value: "paid", label: "Oplacone" },
  { value: "failed", label: "Nieudane" },
];

const ORDER_STATUS_TRANSITIONS = {
  new: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

const PAYMENT_STATUS_TRANSITIONS = {
  pending: ["paid", "failed"],
  paid: [],
  failed: ["pending", "paid"],
};

const ROLE_ORDER_PERMISSIONS = {
  ADMIN: {
    status: ORDER_STATUSES.map((item) => item.value),
    paymentStatus: PAYMENT_STATUSES.map((item) => item.value),
  },
  SELLER: {
    status: ["processing", "shipped", "completed", "cancelled"],
    paymentStatus: ["pending", "paid", "failed"],
  },
  CLIENT: {
    status: [],
    paymentStatus: [],
  },
};

module.exports = {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  ROLE_ORDER_PERMISSIONS,
};
