import { useEffect, useMemo, useState } from "react";
import FetchWrapper from "components/FetchWrapper";
import { useNotification } from "components/GlobalNotification/index.js";
import CartsService from "services/carts";
import ProductsService from "services/products";
import "./FastProductView.scss";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)} zl`;
};

const FastProductViewBody = ({ payload, onClose }) => {
  const product = payload?.data || payload?.product || payload;
  const images = Array.isArray(product?.images) ? product.images : [];
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.status === "active"),
    [variants],
  );
  const mainImage = useMemo(
    () => images.find((image) => Number(image.isMain) === 1) || images[0] || null,
    [images],
  );
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const notification = useNotification();

  useEffect(() => {
    if (activeVariants.length === 0) {
      setSelectedVariantId(null);
      return;
    }

    const defaultVariant = activeVariants.find((variant) => variant.isDefault) || activeVariants[0];
    setSelectedVariantId(Number(defaultVariant.id));
  }, [activeVariants]);

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return activeVariants.find((variant) => Number(variant.id) === Number(selectedVariantId)) || null;
  }, [activeVariants, selectedVariantId]);

  const addToCart = async () => {
    if (!product?.id) return;
    setIsPending(true);
    const response = await CartsService.addItemToCart({
      productId: Number(product.id),
      variantId: selectedVariant ? Number(selectedVariant.id) : null,
      quantity: Math.max(1, Number(quantity) || 1),
    });

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie dodac produktu do koszyka.");
      setIsPending(false);
      return;
    }

    notification.success("Produkt dodany do koszyka.");
    window.dispatchEvent(new Event("cart:updated"));
    setIsPending(false);
    if (typeof onClose === "function") {
      onClose();
    }
  };

  if (!product?.id) {
    return <p className="fastProductViewEmpty">Nie znaleziono produktu.</p>;
  }

  const source = selectedVariant || product;

  return (
    <section className="fastProductView">
      <h3 className="fastProductViewTitle">{product.name || "Produkt"}</h3>

      <div className="fastProductViewImageWrap">
        {mainImage?.url ? (
          <img src={mainImage.url} alt={mainImage.alt || product.name || "Zdjecie produktu"} />
        ) : (
          <div className="fastProductViewImagePlaceholder">Brak zdjecia</div>
        )}
      </div>

      <div className="fastProductViewRow">
        <div className="fastProductViewField fastProductViewPriceBox">
          <p className="fastProductViewPriceLabel">Netto</p>
          <p className="fastProductViewPriceValue">{formatPrice(source.netPrice)}</p>
          <p className="fastProductViewPriceLabel">Brutto</p>
          <p className="fastProductViewPriceValue">{formatPrice(source.grossPrice)}</p>
        </div>

        {activeVariants.length > 0 ? (
          <div className="fastProductViewField">
            <label htmlFor={`fastProductVariant-${product.id}`}>Wariant</label>
            <select
              id={`fastProductVariant-${product.id}`}
              value={selectedVariantId || ""}
              onChange={(event) => setSelectedVariantId(Number(event.target.value) || null)}
              disabled={isPending}
            >
              {activeVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} ({formatPrice(variant.grossPrice)})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="fastProductViewField">
          <label htmlFor={`fastProductQty-${product.id}`}>Ilosc</label>
          <div className="fastProductViewQtyControl">
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(1, Number(prev) - 1))}
              disabled={isPending}
              aria-label="Zmniejsz ilosc"
            >
              <i className="fa-solid fa-minus" aria-hidden="true" />
            </button>
            <input
              id={`fastProductQty-${product.id}`}
              type="number"
              min={1}
              value={quantity}
              disabled={isPending}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isInteger(next) && next > 0) {
                  setQuantity(next);
                }
              }}
            />
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(1, Number(prev) + 1))}
              disabled={isPending}
              aria-label="Zwieksz ilosc"
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="fastProductViewDescription">
        <p>{product.description || "Brak opisu produktu."}</p>
      </div>

      <button type="button" className="fastProductViewAddButton" onClick={addToCart} disabled={isPending}>
        Dodaj do koszyka
      </button>
    </section>
  );
};

const FastProductView = ({ productId, onClose }) => (
  <FetchWrapper
    name="FastProductView"
    component={FastProductViewBody}
    connector={() => ProductsService.getProductById(productId)}
    onClose={onClose}
  />
);

export default FastProductView;
