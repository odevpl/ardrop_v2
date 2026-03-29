const {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  ROLE_ORDER_PERMISSIONS,
} = require("../config/global-config");

const mapOptionsToDict = (items) =>
  items.map((item) => ({
    key: item.value,
    value: item.value,
    label: item.label,
    dict: item.label,
  }));

const getConfig = ({ role }) => {
  const normalizedRole = String(role || "").toUpperCase();
  const orderPermissions =
    ROLE_ORDER_PERMISSIONS[normalizedRole] || ROLE_ORDER_PERMISSIONS.CLIENT;

  return {
    app: {
      role: normalizedRole || null,
    },
    orders: {
      statuses: ORDER_STATUSES,
      paymentStatuses: PAYMENT_STATUSES,
      statusTransitions: ORDER_STATUS_TRANSITIONS,
      paymentStatusTransitions: PAYMENT_STATUS_TRANSITIONS,
      permissions: orderPermissions,
    },
    ORDER_STATUS_DICT: mapOptionsToDict(ORDER_STATUSES),
    PAYMENT_STATUS_DICT: mapOptionsToDict(PAYMENT_STATUSES),
  };
};

module.exports = {
  getConfig,
};
