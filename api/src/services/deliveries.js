const deliveryAddressesService = require("./client-delivery-addresses");

const getCurrentDelivery = async ({ userId }) => {
  const addresses = await deliveryAddressesService.getMyDeliveryAddresses({ userId });
  return addresses.find((item) => item.isDefault) || addresses[0] || null;
};

const upsertCurrentDelivery = async ({ userId, payload = {} }) => {
  const current = await getCurrentDelivery({ userId });
  const nextPayload = { ...payload, isDefault: true };

  if (current?.id) {
    return deliveryAddressesService.updateMyDeliveryAddress({
      userId,
      addressId: current.id,
      payload: nextPayload,
    });
  }

  return deliveryAddressesService.createMyDeliveryAddress({
    userId,
    payload: nextPayload,
  });
};

module.exports = {
  getCurrentDelivery,
  upsertCurrentDelivery,
};
