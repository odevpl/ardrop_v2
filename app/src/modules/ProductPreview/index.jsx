import { useEffect, useMemo, useState } from "react";
import FetchWrapper from "components/FetchWrapper";
import { useNotification } from "components/GlobalNotification/index.js";
import ProductsService from "services/products";
import CartsService from "services/carts";
import "./ProductPreview.scss";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)} zl`;
};

const formatUnitLabel = (unit) => {
  if (unit === "g") return "gramow";
  if (unit === "l") return "litrow";
  return "sztuk";
};

const formatUnitShort = (unit) => {
  if (unit === "g") return "g";
  if (unit === "l") return "l";
  return "szt.";
};

const ProductPreviewView = ({ payload }) => {
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
  const galleryImages = useMemo(() => images, [images]);

  const [selectedImageUrl, setSelectedImageUrl] = useState(mainImage?.url || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const notification = useNotification();

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return activeVariants.find((variant) => Number(variant.id) === Number(selectedVariantId)) || null;
  }, [activeVariants, selectedVariantId]);

  useEffect(() => {
    setSelectedImageUrl(mainImage?.url || "");
  }, [mainImage?.url]);

  useEffect(() => {
    if (activeVariants.length === 0) {
      setSelectedVariantId(null);
      return;
    }

    const hasSelectedVariant = activeVariants.some(
      (variant) => Number(variant.id) === Number(selectedVariantId),
    );
    if (hasSelectedVariant) return;

    const defaultVariant =
      activeVariants.find((variant) => variant.isDefault) || activeVariants[0];
    setSelectedVariantId(Number(defaultVariant.id));
  }, [activeVariants, selectedVariantId]);

  const addToCart = async () => {
    if (!product?.id) return;
    setIsPending(true);
    const response = await CartsService.addItemToCart({
      productId: product.id,
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
  };

  if (!product?.id) {
    return <p className="productPreviewEmpty">Nie znaleziono produktu.</p>;
  }

  const source = selectedVariant || product;
  const vatRate = Number(source.vatRate);
  const hasVatRate = !Number.isNaN(vatRate);
  const normalizedUnit = product.unit || source.unit;
  const unitLabel = formatUnitLabel(normalizedUnit);
  const unitShort = formatUnitShort(normalizedUnit);
  const stockQuantity = Number(source.stockQuantity ?? 0);

  return (
    <section className="productPreview">
      <div className="productPreviewLayout">
        <div className="productPreviewMain">
          <h1 className="productPreviewTitle">{product.name || "Produkt"}</h1>

          <div className="productPreviewImagePanel">
            <div className="productPreviewMainImageWrap">
              {selectedImageUrl ? (
                <img src={selectedImageUrl} alt={product.name || "Zdjecie produktu"} />
              ) : (
                <div className="productPreviewImagePlaceholder">Brak zdjecia</div>
              )}
            </div>

            {galleryImages.length > 0 ? (
              <div className="productPreviewThumbList">
                {galleryImages.map((image) => (
                  <button
                    key={image.id || image.url}
                    type="button"
                    className={`productPreviewThumb${
                      selectedImageUrl === image.url ? " productPreviewThumbActive" : ""
                    }`}
                    onClick={() => setSelectedImageUrl(image.url)}
                  >
                    <img src={image.thumbUrl || image.url} alt={image.alt || product.name} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <section className="productPreviewDescription">
            <h2>Opis produktu</h2>
            <p>{product.description || "Brak opisu produktu."}</p>
          </section>
        </div>

        <aside className="productPreviewSidebar">
          <section className="productPreviewCard">
            <p className="productPreviewPriceGross">{formatPrice(source.grossPrice)}</p>
            <p className="productPreviewPriceMeta">
              Netto: <strong>{formatPrice(source.netPrice)}</strong>
            </p>
            <p className="productPreviewPriceMeta">
              VAT: <strong>{hasVatRate ? `${vatRate}%` : "-"}</strong>
            </p>

            {activeVariants.length > 1 ? (
              <div className="productPreviewVariantBlock">
                <label htmlFor="productPreviewVariant">Wariant</label>
                <select
                  id="productPreviewVariant"
                  value={selectedVariantId || ""}
                  onChange={(event) => setSelectedVariantId(Number(event.target.value) || null)}
                  disabled={isPending}
                >
                  {activeVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} (netto: {formatPrice(variant.netPrice)}, brutto: {formatPrice(variant.grossPrice)})
                    </option>
                  ))}
                </select>
              </div>
            ) : activeVariants.length === 1 ? (
              <div className="productPreviewVariantBlock">
                <p className="productPreviewVariantSingleLabel">Wariant</p>
                <p className="productPreviewVariantSingleValue">
                  {activeVariants[0].name} (netto: {formatPrice(activeVariants[0].netPrice)}, brutto: {formatPrice(activeVariants[0].grossPrice)})
                </p>
              </div>
            ) : null}

            <div className="productPreviewQtyBlock">
              <label htmlFor="productPreviewQty">Liczba {unitLabel}</label>
              <div className="productPreviewQtyControl">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, Number(prev) - 1))}
                  disabled={isPending}
                >
                  <i className="fa-solid fa-minus" aria-hidden="true" />
                </button>
                <input
                  id="productPreviewQty"
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
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                </button>
              </div>
            </div>

            <p className="productPreviewPriceMeta">
              Jednostka: <strong>{unitShort}</strong>
            </p>
            <p className="productPreviewPriceMeta">
              Dostepny stan: <strong>{stockQuantity} {unitLabel}</strong>
            </p>

            <button
              type="button"
              className="productPreviewAddButton"
              onClick={addToCart}
              disabled={isPending}
            >
              Dodaj do koszyka
            </button>

          </section>
        </aside>
      </div>
    </section>
  );
};

const ProductPreview = ({ productId }) => {
  return (
    <FetchWrapper
      name="ProductPreview"
      component={ProductPreviewView}
      connector={() => ProductsService.getProductById(productId)}
    />
  );
};

export default ProductPreview;

