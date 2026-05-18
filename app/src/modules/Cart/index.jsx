import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNotification } from "components/GlobalNotification/index.js";
import { NavLink, useNavigate } from "react-router-dom";
import AccountService from "services/account";
import CartsService from "services/carts";
import OrdersService from "services/orders";
import ProductsService from "services/products";
import "./Cart.scss";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)}`;
};

const formatDate = (date) => {
  return dayjs(date).format("DD.MM.YYYY");
};

const formatEta = (from, to) => {
  if (from && to) return `${dayjs(from).format("DD.MM.YYYY")} - ${dayjs(to).format("DD.MM.YYYY")}`;
  if (from) return dayjs(from).format("DD.MM.YYYY");
  if (to) return dayjs(to).format("DD.MM.YYYY");
  return "Do ustalenia";
};

const formatEtaDays = (etaMinDays, etaMaxDays) => {
  const hasMin = etaMinDays !== null && etaMinDays !== undefined;
  const hasMax = etaMaxDays !== null && etaMaxDays !== undefined;
  if (hasMin && hasMax) return `${etaMinDays}-${etaMaxDays} dni`;
  if (hasMin) return `${etaMinDays} dni`;
  if (hasMax) return `do ${etaMaxDays} dni`;
  return "Termin do ustalenia";
};

const formatAppliedDiscountLabel = (discount) => {
  if (!discount) return null;

  if (discount.ruleType === "free_bonus") {
    return discount.bonusLabel
      ? `${discount.name || "Gratis"}: ${discount.bonusLabel}`
      : discount.name || "Gratis";
  }

  if (discount.discountPercent) {
    return `${discount.name || "Rabat"} (-${Number(discount.discountPercent).toFixed(2)}%)`;
  }

  return discount.name || "Rabat";
};

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingItemId, setPendingItemId] = useState(null);
  const [pendingShipmentSellerId, setPendingShipmentSellerId] = useState(null);
  const [thumbByProductId, setThumbByProductId] = useState({});
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState(null);
  const [deliveryError, setDeliveryError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [shipmentNotes, setShipmentNotes] = useState({});
  const [shippingMethodsBySellerId, setShippingMethodsBySellerId] = useState({});
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [isCouponUpdating, setIsCouponUpdating] = useState(false);
  const notification = useNotification();

  const applyCartResponse = (response) => {
    setCart(response?.data || response?.cart || null);
    window.dispatchEvent(new Event("cart:updated"));
  };

  const fetchCart = async () => {
    setIsLoading(true);
    setError("");
    const response = await CartsService.getCurrentCart();

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie pobrac koszyka.");
      setIsLoading(false);
      return;
    }

    applyCartResponse(response);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    setCouponCodeInput(cart?.couponCode || "");
  }, [cart?.couponCode]);

  useEffect(() => {
    const loadDeliveryAddresses = async () => {
      const response = await AccountService.getMyDeliveryAddresses();
      if (response?.status && response.status >= 400) {
        return;
      }

      const addresses = response?.data || response?.addresses || [];
      const normalized = Array.isArray(addresses) ? addresses : [];
      setDeliveryAddresses(normalized);

      const defaultAddress = normalized.find((item) => item.isDefault) || normalized[0];
      setSelectedDeliveryAddressId((prev) => prev || defaultAddress?.id || null);
    };

    loadDeliveryAddresses();
  }, []);

  const items = useMemo(() => cart?.items || [], [cart]);
  const shipments = useMemo(() => cart?.shipments || [], [cart]);
  const activeCouponDiscounts = useMemo(
    () =>
      shipments.filter((shipment) => shipment?.appliedDiscount?.ruleType === "coupon_code"),
    [shipments],
  );
  const productsTotalGross = useMemo(
    () => shipments.reduce((sum, shipment) => sum + Number(shipment?.totals?.itemsGross || 0), 0),
    [shipments],
  );
  const shippingTotalGross = useMemo(
    () => shipments.reduce((sum, shipment) => sum + Number(shipment?.shippingGross || 0), 0),
    [shipments],
  );
  const discountTotalGross = Number(cart?.discountGross || 0);
  const orderTotalGross = Number(cart?.totalGross || 0);

  useEffect(() => {
    setShipmentNotes(
      shipments.reduce((acc, shipment) => {
        acc[shipment.sellerId] = shipment.clientNote || "";
        return acc;
      }, {}),
    );
  }, [shipments]);

  useEffect(() => {
    let isMounted = true;

    const loadThumbs = async () => {
      const uniqueProductIds = [
        ...new Set(items.map((item) => Number(item.productId)).filter(Boolean)),
      ];

      if (uniqueProductIds.length === 0) {
        setThumbByProductId({});
        return;
      }

      const responses = await Promise.all(
        uniqueProductIds.map((productId) => ProductsService.getProductById(productId)),
      );

      if (!isMounted) return;

      const nextThumbMap = {};
      responses.forEach((response) => {
        if (response?.status && response.status >= 400) return;
        const product = response?.data || response?.product;
        if (!product?.id) return;
        const mainImage = Array.isArray(product.images)
          ? product.images.find((image) => Number(image.isMain) === 1) || product.images[0]
          : null;
        nextThumbMap[Number(product.id)] = mainImage?.thumbUrl || "";
      });

      setThumbByProductId(nextThumbMap);
    };

    loadThumbs();
    return () => {
      isMounted = false;
    };
  }, [items]);

  useEffect(() => {
    let isMounted = true;

    const loadShippingMethods = async () => {
      const sellerIds = [...new Set(shipments.map((shipment) => Number(shipment.sellerId)).filter(Boolean))];

      if (sellerIds.length === 0) {
        setShippingMethodsBySellerId({});
        return;
      }

      const responses = await Promise.all(
        sellerIds.map(async (sellerId) => {
          const response = await CartsService.getShipmentShippingMethods({ sellerId });
          return { sellerId, response };
        }),
      );

      if (!isMounted) return;

      const nextMap = {};
      responses.forEach(({ sellerId, response }) => {
        if (response?.status && response.status >= 400) {
          nextMap[sellerId] = [];
          return;
        }
        const methods = response?.data || response?.shippingMethods || [];
        nextMap[sellerId] = Array.isArray(methods) ? methods : [];
      });
      setShippingMethodsBySellerId(nextMap);

      const shipmentNeedingDefault = shipments.find((shipment) => {
        const shippingMethods = nextMap[shipment.sellerId] || [];
        return shippingMethods.length > 0 && !shipment.shippingMethodId;
      });

      if (shipmentNeedingDefault) {
        const firstMethod = nextMap[shipmentNeedingDefault.sellerId][0];
        const syncResponse = await CartsService.updateCartShipment({
          sellerId: shipmentNeedingDefault.sellerId,
          payload: { shippingMethodId: firstMethod.id },
        });

        if (!(syncResponse?.status && syncResponse.status >= 400) && isMounted) {
          applyCartResponse(syncResponse);
        }
      }
    };

    loadShippingMethods();
    return () => {
      isMounted = false;
    };
  }, [shipments]);

  const selectedDeliveryAddress = useMemo(
    () =>
      deliveryAddresses.find((item) => Number(item.id) === Number(selectedDeliveryAddressId)) ||
      null,
    [deliveryAddresses, selectedDeliveryAddressId],
  );

  const shipmentsWithoutShippingMethods = useMemo(
    () =>
      shipments.filter((shipment) => {
        const shippingMethods = shippingMethodsBySellerId[shipment.sellerId] || [];
        return shippingMethods.length === 0;
      }),
    [shipments, shippingMethodsBySellerId],
  );

  const shipmentsWithoutSelectedMethod = useMemo(
    () =>
      shipments.filter((shipment) => {
        const shippingMethods = shippingMethodsBySellerId[shipment.sellerId] || [];
        return shippingMethods.length > 0 && !shipment.shippingMethodId;
      }),
    [shipments, shippingMethodsBySellerId],
  );

  const shipmentsBelowMinimumOrderValue = useMemo(
    () =>
      shipments.filter((shipment) => {
        const minimumOrderValueGross = Number(shipment?.minimumOrderValueGross || 0);
        if (minimumOrderValueGross <= 0) return false;
        const itemsGrossBeforeCampaignDiscount = Number(
          shipment?.totals?.itemsGrossBeforeCampaignDiscount ?? shipment?.totals?.itemsGross ?? 0,
        );
        return itemsGrossBeforeCampaignDiscount < minimumOrderValueGross;
      }),
    [shipments],
  );

  const isCheckoutBlocked =
    shipmentsWithoutShippingMethods.length > 0 ||
    shipmentsWithoutSelectedMethod.length > 0 ||
    shipmentsBelowMinimumOrderValue.length > 0;

  const isDeliveryAddressValid = useMemo(() => {
    if (!selectedDeliveryAddress) return false;
    const requiredFields = [
      "recipientName",
      "addressLine1",
      "city",
      "postalCode",
      "countryCode",
    ];

    return requiredFields.every((field) => {
      const value = selectedDeliveryAddress[field];
      return value !== null && value !== undefined && String(value).trim() !== "";
    });
  }, [selectedDeliveryAddress]);

  const syncShipment = async (sellerId, payload, errorMessage) => {
    setPendingShipmentSellerId(sellerId);
    const response = await CartsService.updateCartShipment({ sellerId, payload });

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || errorMessage);
      setPendingShipmentSellerId(null);
      return false;
    }

    applyCartResponse(response);
    setPendingShipmentSellerId(null);
    return true;
  };

  const syncAllShipmentsAddress = async (deliveryAddressId) => {
    for (const shipment of shipments) {
      const ok = await syncShipment(
        shipment.sellerId,
        { deliveryAddressId },
        "Nie udalo sie zaktualizowac adresu dostawy.",
      );
      if (!ok) break;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    setPendingItemId(itemId);
    const response = await CartsService.updateCartItem({ itemId, quantity });
    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie zaktualizowac pozycji.");
      setPendingItemId(null);
      return;
    }

    applyCartResponse(response);
    setPendingItemId(null);
  };

  const removeItem = async (itemId) => {
    setPendingItemId(itemId);
    const response = await CartsService.removeCartItem({ itemId });
    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie usunac pozycji.");
      setPendingItemId(null);
      return;
    }

    applyCartResponse(response);
    setPendingItemId(null);
  };

  const clearAll = async () => {
    setPendingItemId("all");
    const response = await CartsService.clearCart();
    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie wyczyscic koszyka.");
      setPendingItemId(null);
      return;
    }

    applyCartResponse(response);
    setPendingItemId(null);
  };

  const handleDeliveryAddressChange = async (nextDeliveryAddressId) => {
    setSelectedDeliveryAddressId(nextDeliveryAddressId);
    setDeliveryError("");

    if (!nextDeliveryAddressId || shipments.length === 0) return;
    await syncAllShipmentsAddress(nextDeliveryAddressId);
  };

  const handleShipmentNoteBlur = async (sellerId) => {
    await syncShipment(
      sellerId,
      { clientNote: shipmentNotes[sellerId] || null },
      "Nie udalo sie zapisac notatki do dostawy.",
    );
  };

  const handleShippingMethodChange = async (sellerId, shippingMethodId) => {
    await syncShipment(
      sellerId,
      { shippingMethodId },
      "Nie udalo sie wybrac metody dostawy.",
    );
  };

  const handleSubmitOrder = async () => {
    if (shipmentsWithoutShippingMethods.length > 0) {
      const message =
        "Nie mozna zlozyc zamowienia. Co najmniej jeden sprzedawca nie ma skonfigurowanej dostawy.";
      setDeliveryError(message);
      notification.error(message);
      return;
    }

    if (shipmentsWithoutSelectedMethod.length > 0) {
      const message =
        "Nie mozna zlozyc zamowienia. Wybierz metode dostawy dla kazdego sprzedawcy.";
      setDeliveryError(message);
      notification.error(message);
      return;
    }

    if (shipmentsBelowMinimumOrderValue.length > 0) {
      const message =
        "Nie mozna zlozyc zamowienia. Nie osiagnieto minimalnej wartosci zakupu dla co najmniej jednego sprzedawcy.";
      setDeliveryError(message);
      notification.error(message);
      return;
    }

    if (!isDeliveryAddressValid) {
      const message = "Uzupelnij dane dostawy i wybierz poprawny adres.";
      setDeliveryError(message);
      notification.error(message);
      return;
    }

    setDeliveryError("");
    setIsSubmittingOrder(true);
    const response = await OrdersService.createOrder({
      deliveryAddressId: selectedDeliveryAddressId,
    });

    if (response?.status && response.status >= 400) {
      const message = response?.data?.error || "Nie udalo sie wyslac zamowienia.";
      setDeliveryError(message);
      notification.error(message);
      setIsSubmittingOrder(false);
      return;
    }

    const orderGroupId = response?.data?.orderGroupId || response?.orderGroupId;
    const orderId = response?.data?.primaryOrderId || response?.primaryOrderId;
    window.dispatchEvent(new Event("cart:updated"));
    notification.success("Zamowienie zostalo zlozone.");
    setIsSubmittingOrder(false);

    if (orderGroupId) {
      navigate(`/zamowienia/grupa/${orderGroupId}`);
      return;
    }

    if (orderId) {
      navigate(`/zamowienia/${orderId}`);
      return;
    }

    navigate("/zamowienia");
  };

  const handleCouponSubmit = async () => {
    setIsCouponUpdating(true);
    const response = await CartsService.updateCurrentCart({
      couponCode: String(couponCodeInput || "").trim().toUpperCase() || null,
    });

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie zapisac kodu rabatowego.");
      setIsCouponUpdating(false);
      return;
    }

    applyCartResponse(response);
    setIsCouponUpdating(false);
  };

  if (isLoading) {
    return <section className="cartModule">Ladowanie koszyka...</section>;
  }

  return (
    <section className="cartModule">
      {error ? <p className="cartError">{error}</p> : null}

      <div className="cartLayout">
        <div className="cartMainColumn">
          <div className="cartMainHeader">
            <label className="cartMainHeaderLabel">
              <input type="checkbox" checked readOnly />
              <span>Caly koszyk</span>
            </label>
            <button
              type="button"
              className="cartGhostButton"
              onClick={clearAll}
              disabled={pendingItemId === "all" || items.length === 0}
            >
              Usun
            </button>
          </div>

          {items.length === 0 ? (
            <p className="cartEmpty">Koszyk jest pusty.</p>
          ) : (
            <div className="cartShipmentList">
              {shipments.map((shipment) => {
                const shippingMethods = shippingMethodsBySellerId[shipment.sellerId] || [];

                return (
                  <section className="cartShipmentCard" key={shipment.sellerId}>
                    <div className="cartShipmentHeader">
                      <div>
                        <p className="cartShipmentEyebrow">Sprzedawca</p>
                        <h2>{shipment?.seller?.companyName || `Seller #${shipment.sellerId}`}</h2>
                      </div>
                      <div className="cartShipmentMeta">
                        <span>Produkty: {formatPrice(shipment?.totals?.itemsGross || 0)} zl</span>
                        <span>Dostawa: {formatPrice(shipment?.shippingGross || 0)} zl</span>
                      </div>
                    </div>

                    <div className="cartTableWrap">
                      <table className="cartTable">
                        <thead>
                          <tr>
                            <th>Produkt</th>
                            <th>Ilosc</th>
                            <th>Netto</th>
                            <th>Brutto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shipment.items.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <div className="cartProductCell">
                                  <div className="cartThumbWrap">
                                    {thumbByProductId[Number(item.productId)] ? (
                                      <img
                                        src={thumbByProductId[Number(item.productId)]}
                                        alt={item.productNameSnapshot}
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="cartThumbPlaceholder">Brak</div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="cartProductName">{item.productNameSnapshot}</p>
                                    {item.variantNameSnapshot ? (
                                      <p className="cartProductVariant">{item.variantNameSnapshot}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="cartQtyControl">
                                  <button
                                    type="button"
                                    className="cartQtyButton"
                                    onClick={() =>
                                      updateQuantity(item.id, Math.max(1, Number(item.quantity) - 1))
                                    }
                                    disabled={pendingItemId === item.id}
                                    aria-label="Zmniejsz ilosc"
                                  >
                                    <i className="fa-solid fa-minus" aria-hidden="true" />
                                  </button>
                                  <input
                                    className="cartQtyInput"
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    disabled={pendingItemId === item.id}
                                    onChange={(event) => {
                                      const nextValue = Number(event.target.value);
                                      if (Number.isInteger(nextValue) && nextValue > 0) {
                                        updateQuantity(item.id, nextValue);
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="cartQtyButton"
                                    onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                                    disabled={pendingItemId === item.id}
                                    aria-label="Zwikszez ilosc"
                                  >
                                    <i className="fa-solid fa-plus" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className="cartPriceValue">{formatPrice(item.lineNet)} zl</span>
                              </td>
                              <td>
                                <div className="cartPriceCell cartPriceCellWithDelete">
                                  <span className="cartPriceStack">
                                    {Number(item.originalLineGrossBeforeCampaignDiscount || 0) >
                                    Number(item.lineGross || 0) ? (
                                      <span className="cartOriginalPriceValue">
                                        {formatPrice(item.originalLineGrossBeforeCampaignDiscount)} zl
                                      </span>
                                    ) : null}
                                    <span className="cartPriceValue">
                                      {formatPrice(item.lineGross)} zl
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    className="cartDeleteButton"
                                    onClick={() => removeItem(item.id)}
                                    disabled={pendingItemId === item.id}
                                    aria-label="Usun pozycje"
                                  >
                                    <i className="fa-solid fa-trash" aria-hidden="true" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="cartShipmentDetails">
                      <div className="cartShipmentSummaryBox">
                        <span>Wartosc produktow</span>
                        <strong>{formatPrice(shipment?.totals?.itemsGross || 0)} zl</strong>
                        <span>Dostawa</span>
                        <strong>{formatPrice(shipment?.shippingGross || 0)} zl</strong>
                        {Number(shipment?.totals?.discountGross || 0) > 0 ? (
                          <>
                            <span>Rabat</span>
                            <strong>-{formatPrice(shipment?.totals?.discountGross || 0)} zl</strong>
                          </>
                        ) : null}
                        <span>Razem dla sprzedawcy</span>
                        <strong>
                          {formatPrice(
                            shipment?.totals?.totalGrossAfterDiscount ??
                              shipment?.totals?.totalGross ??
                              0,
                          )}{" "}
                          zl
                        </strong>
                      </div>

                      <div className="cartShipmentInfoBox">
                        {shipment?.appliedDiscount ? (
                          <div className="cartShippingMethodsAlert">
                            <strong>Aktywna promocja</strong>
                            <span>{formatAppliedDiscountLabel(shipment.appliedDiscount)}</span>
                          </div>
                        ) : null}
                        {Number(shipment?.minimumOrderValueGross || 0) > 0 &&
                        Number(
                          shipment?.totals?.itemsGrossBeforeCampaignDiscount ??
                            shipment?.totals?.itemsGross ??
                            0,
                        ) <
                          Number(shipment?.minimumOrderValueGross || 0) ? (
                          <div className="cartShippingMethodsAlert" role="alert">
                            <strong>Nie osiagnieto minimalnego progu zakupu.</strong>
                            <span>
                              Minimalne zamowienie u tego sprzedawcy wynosi{" "}
                              {formatPrice(shipment.minimumOrderValueGross)} zl. Brakuje{" "}
                              {formatPrice(
                                Number(shipment.minimumOrderValueGross) -
                                  Number(
                                    shipment?.totals?.itemsGrossBeforeCampaignDiscount ??
                                      shipment?.totals?.itemsGross ??
                                      0,
                                  ),
                              )}{" "}
                              zl.
                            </span>
                          </div>
                        ) : null}

                        <div className="cartInfoGrid">
                          <span>Adres dostawy</span>
                          <span>
                            {selectedDeliveryAddress
                              ? selectedDeliveryAddress.label ||
                                selectedDeliveryAddress.recipientName ||
                                "Wybrany adres"
                              : "Brak"}
                          </span>
                          <span>Metoda dostawy</span>
                          <span>{shipment.shippingMethodName || "Wybierz metode"}</span>
                          <span>Przyblizony termin</span>
                          <span>
                            {formatEta(
                              shipment.estimatedDeliveryFrom,
                              shipment.estimatedDeliveryTo,
                            )}
                          </span>
                        </div>

                        <div className="cartShippingMethods">
                          <p className="cartShippingMethodsTitle">Wybierz metode dostawy</p>
                          {shippingMethods.length === 0 ? (
                            <div className="cartShippingMethodsAlert" role="alert">
                              <strong>Brak dostawy dla tego sprzedawcy.</strong>
                              <span>
                                Nie mozna sfinalizowac zamowienia z tym shipmentem, dopoki
                                sprzedawca nie doda metody dostawy albo nie usuniesz tych
                                produktow z koszyka.
                              </span>
                            </div>
                          ) : (
                            <div className="cartShippingMethodsList">
                              {shippingMethods.map((method) => {
                                const isSelected =
                                  Number(shipment.shippingMethodId) === Number(method.id);
                                const threshold = Number(method.freeShippingAmountGross || 0);
                                const itemsGross = Number(shipment?.totals?.itemsGross || 0);
                                const isFreeShippingReached =
                                  threshold > 0 && itemsGross >= threshold;
                                const missingToThreshold =
                                  threshold > itemsGross ? threshold - itemsGross : 0;

                                return (
                                  <label className="cartShippingMethodOption" key={method.id}>
                                    <input
                                      type="radio"
                                      name={`shipment-shipping-${shipment.sellerId}`}
                                      checked={isSelected}
                                      disabled={pendingShipmentSellerId === shipment.sellerId}
                                      onChange={() =>
                                        handleShippingMethodChange(shipment.sellerId, method.id)
                                      }
                                    />
                                    <div className="cartShippingMethodContent">
                                      <div className="cartShippingMethodTop">
                                        <strong>{method.name}</strong>
                                        <strong>
                                          {isSelected
                                            ? `${formatPrice(shipment.shippingGross)} zl`
                                            : `${formatPrice(method.priceGross || 0)} zl`}
                                        </strong>
                                      </div>
                                      <div className="cartShippingMethodMeta">
                                        <span>{formatEtaDays(method.etaMinDays, method.etaMaxDays)}</span>
                                        {threshold > 0 ? (
                                          <span>
                                            {isFreeShippingReached
                                              ? `Darmowa dostawa od ${formatPrice(threshold)} zl - osiagnieto`
                                              : `Do darmowej dostawy brakuje ${formatPrice(missingToThreshold)} zl`}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <label
                          className="cartShipmentNoteLabel"
                          htmlFor={`shipment-note-${shipment.sellerId}`}
                        >
                          Notatka do dostawy
                        </label>
                        <textarea
                          id={`shipment-note-${shipment.sellerId}`}
                          className="cartShipmentNote"
                          value={shipmentNotes[shipment.sellerId] || ""}
                          disabled={pendingShipmentSellerId === shipment.sellerId}
                          onChange={(event) =>
                            setShipmentNotes((prev) => ({
                              ...prev,
                              [shipment.sellerId]: event.target.value,
                            }))
                          }
                          onBlur={() => handleShipmentNoteBlur(shipment.sellerId)}
                          placeholder="Instrukcje dla tego sprzedawcy"
                        />
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          <section className="cartDeliverySection">
            <div className="cartDeliveryHead">
              <h2>Adres dostawy</h2>
              <NavLink to="/adresy-dostawy" className="cartGhostButton">
                Zmien dane
              </NavLink>
            </div>

            {deliveryAddresses.length > 0 ? (
              <div className="cartDeliveryPicker">
                <label htmlFor="cartDeliveryAddressSelect">Wybierz adres</label>
                <select
                  id="cartDeliveryAddressSelect"
                  value={selectedDeliveryAddressId || ""}
                  disabled={pendingShipmentSellerId !== null}
                  onChange={(event) => {
                    handleDeliveryAddressChange(Number(event.target.value) || null);
                  }}
                >
                  {deliveryAddresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {(address.label || address.recipientName || "Adres dostawy") +
                        (address.isDefault ? " (domyslny)" : "")}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p>Brak danych dostawy. Uzupelnij je w zakladce Konto.</p>
            )}

            {selectedDeliveryAddress ? (
              <div className="cartDeliveryAddressBox">
                <p>
                  <strong>{selectedDeliveryAddress.recipientName}</strong>
                </p>
                {selectedDeliveryAddress.phone ? <p>{selectedDeliveryAddress.phone}</p> : null}
                <p>{selectedDeliveryAddress.addressLine1}</p>
                {selectedDeliveryAddress.addressLine2 ? (
                  <p>{selectedDeliveryAddress.addressLine2}</p>
                ) : null}
                <p>
                  {selectedDeliveryAddress.postalCode} {selectedDeliveryAddress.city},{" "}
                  {selectedDeliveryAddress.countryCode}
                </p>
              </div>
            ) : null}

            {deliveryError ? <p className="cartDeliveryValidation">{deliveryError}</p> : null}

            <div className="cartInfoGrid">
              <span>Data zamowienia</span>
              <span>{formatDate(new Date())}</span>
              <span>Liczba dostaw</span>
              <span>{shipments.length}</span>
              <span>Metoda platnosci</span>
              <span>Przedplata</span>
              <span>Status dostawy</span>
              <span>Rozdzielona per sprzedawca</span>
            </div>
          </section>
        </div>

        <aside className="cartSummaryColumn">
          <section className="cartSummaryCard">
            {isCheckoutBlocked ? (
              <div className="cartSummaryAlert" role="alert">
                Nie mozna przejsc dalej, bo czesc produktow nie ma dostepnej dostawy albo nie spelnia minimalnego progu zakupu.
              </div>
            ) : null}

            <div className="cartDeliveryPicker">
              <label htmlFor="cartCouponCode">Kod rabatowy</label>
              <div className="cartQtyControl">
                <input
                  id="cartCouponCode"
                  className="cartQtyInput"
                  type="text"
                  value={couponCodeInput}
                  maxLength={64}
                  disabled={isCouponUpdating}
                  onChange={(event) => setCouponCodeInput(event.target.value.toUpperCase())}
                  placeholder="Wpisz kod"
                />
                <button
                  type="button"
                  className="cartGhostButton"
                  disabled={isCouponUpdating}
                  onClick={handleCouponSubmit}
                >
                  Zastosuj
                </button>
              </div>
            </div>

            {activeCouponDiscounts.length > 0 ? (
              <div className="cartCouponSuccess" role="status">
                <strong>Kod rabatowy aktywny</strong>
                <span>
                  {activeCouponDiscounts
                    .map((shipment) => formatAppliedDiscountLabel(shipment.appliedDiscount))
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            ) : null}

            <div className="cartSummaryRow">
              <span>Wartosc produktow</span>
              <strong>{formatPrice(productsTotalGross)} zl</strong>
            </div>
            <div className="cartSummaryRow">
              <span>Dostawa</span>
              <strong>{formatPrice(shippingTotalGross)} zl</strong>
            </div>
            {discountTotalGross > 0 ? (
              <div className="cartSummaryRow">
                <span>Rabaty</span>
                <strong>-{formatPrice(discountTotalGross)} zl</strong>
              </div>
            ) : null}

            <div className="cartTotalLine">
              <strong>Razem</strong>
              <strong>{formatPrice(orderTotalGross)} zl</strong>
            </div>

            <div className="cartSummaryShipmentList">
              {shipments.map((shipment) => (
                <div className="cartSummaryShipmentRow" key={`summary-${shipment.sellerId}`}>
                  <span>{shipment?.seller?.companyName || `Seller #${shipment.sellerId}`}</span>
                  <strong>
                    {formatPrice(
                      shipment?.totals?.totalGrossAfterDiscount ??
                        shipment?.totals?.totalGross ??
                        0,
                    )}{" "}
                    zl
                  </strong>
                </div>
              ))}
            </div>

            <div className="cartSubmitWrap">
              <button
                type="button"
                className="cartSubmitButton"
                disabled={isCheckoutBlocked || isSubmittingOrder}
                onClick={handleSubmitOrder}
              >
                {isSubmittingOrder ? "Wysylanie..." : "Wyslij zamowienie"}
              </button>
            </div>
          </section>

          <section className="cartSummaryCard">
            <p className="cartSummaryInfoTitle">Bezpieczne zakupy</p>
            <p className="cartSummaryInfoText">
              Kazdy sprzedawca ma wlasna dostawe, koszt i termin realizacji.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default Cart;
