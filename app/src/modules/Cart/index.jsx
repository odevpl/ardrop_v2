import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import AccountService from "services/account";
import CartsService from "services/carts";
import ProductsService from "services/products";
import "./Cart.scss";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)}`;
};

const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingItemId, setPendingItemId] = useState(null);
  const [note, setNote] = useState("");
  const [thumbByProductId, setThumbByProductId] = useState({});
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState(null);
  const [deliveryError, setDeliveryError] = useState("");

  const fetchCart = async () => {
    setIsLoading(true);
    setError("");
    const response = await CartsService.getCurrentCart();

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie pobrac koszyka.");
      setIsLoading(false);
      return;
    }

    setCart(response?.data || response?.cart || null);
    window.dispatchEvent(new Event("cart:updated"));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

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
      setSelectedDeliveryAddressId(defaultAddress?.id || null);
    };

    loadDeliveryAddresses();
  }, []);

  const items = useMemo(() => cart?.items || [], [cart]);

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
        nextThumbMap[Number(product.id)] = mainImage?.url || "";
      });

      setThumbByProductId(nextThumbMap);
    };

    loadThumbs();
    return () => {
      isMounted = false;
    };
  }, [items]);

  const updateQuantity = async (itemId, quantity) => {
    setPendingItemId(itemId);
    const response = await CartsService.updateCartItem({ itemId, quantity });
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie zaktualizowac pozycji.");
      setPendingItemId(null);
      return;
    }

    setCart(response?.data || response?.cart || null);
    window.dispatchEvent(new Event("cart:updated"));
    setPendingItemId(null);
  };

  const removeItem = async (itemId) => {
    setPendingItemId(itemId);
    const response = await CartsService.removeCartItem({ itemId });
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie usunac pozycji.");
      setPendingItemId(null);
      return;
    }

    setCart(response?.data || response?.cart || null);
    window.dispatchEvent(new Event("cart:updated"));
    setPendingItemId(null);
  };

  const clearAll = async () => {
    setPendingItemId("all");
    const response = await CartsService.clearCart();
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie wyczyscic koszyka.");
      setPendingItemId(null);
      return;
    }

    setCart(response?.data || response?.cart || null);
    window.dispatchEvent(new Event("cart:updated"));
    setPendingItemId(null);
  };

  const selectedDeliveryAddress = useMemo(
    () =>
      deliveryAddresses.find((item) => Number(item.id) === Number(selectedDeliveryAddressId)) ||
      null,
    [deliveryAddresses, selectedDeliveryAddressId],
  );

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

  const handleSubmitOrder = () => {
    if (!isDeliveryAddressValid) {
      setDeliveryError("Uzupelnij dane dostawy i wybierz poprawny adres.");
      return;
    }

    setDeliveryError("");
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
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="cartProductCell">
                          <div className="cartThumbWrap">
                            {thumbByProductId[Number(item.productId)] ? (
                              <img
                                src={thumbByProductId[Number(item.productId)]}
                                alt={item.productNameSnapshot}
                              />
                            ) : (
                              <div className="cartThumbPlaceholder">Brak</div>
                            )}
                          </div>
                          <p className="cartProductName">{item.productNameSnapshot}</p>
                        </div>
                      </td>
                      <td>
                        <div className="cartQtyControl">
                          <button
                            type="button"
                            className="cartQtyButton"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                Math.max(1, Number(item.quantity) - 1),
                              )
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
                          <span className="cartPriceValue">{formatPrice(item.lineGross)} zl</span>
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
                  onChange={(event) => {
                    setSelectedDeliveryAddressId(Number(event.target.value) || null);
                    setDeliveryError("");
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
              <span>Przyblizony czas dostarczenia</span>
              <span>3 dni robocze</span>
              <span>Metoda platnosci</span>
              <span>Przedplata</span>
              <span>Metoda dostawy</span>
              <span>Kurier</span>
            </div>
          </section>

          <section className="cartNoteSection">
            <h2>Notatka do zamowienia:</h2>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Wpisz tresc wiadomosci"
            />
          </section>
        </div>

        <aside className="cartSummaryColumn">
          <section className="cartSummaryCard">
            <div className="cartSummaryRow">
              <span>Wartosc produktow</span>
              <strong>{formatPrice(cart?.totalGross || 0)} zl</strong>
            </div>
            <div className="cartSummaryRow">
              <span>Dostawa od</span>
              <strong>0,00 zl</strong>
            </div>

            <div className="cartTotalLine">
              <strong>Razem</strong>
              <strong>{formatPrice(cart?.totalGross || 0)} zl</strong>
            </div>

            <div className="cartSubmitWrap">
              <button
                type="button"
                className="cartSubmitButton"
                disabled={items.length === 0}
                onClick={handleSubmitOrder}
              >
                Wyslij zamowienie
              </button>
            </div>
          </section>

          <section className="cartSummaryCard">
            <p className="cartSummaryInfoTitle">Bezpieczne zakupy</p>
            <p className="cartSummaryInfoText">
              Wygodne zwroty, reklamacje online i ochrona zakupu.
            </p>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default Cart;
