import { useEffect, useMemo, useState } from "react";
import FetchWrapper from "components/FetchWrapper";
import ProductsService from "services/products";
import CartsService from "services/carts";
import "./ProductPreview.scss";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)} zl`;
};

const ProductPreviewView = ({ payload }) => {
  const product = payload?.data || payload?.product || payload;
  const images = Array.isArray(product?.images) ? product.images : [];
  const mainImage = useMemo(
    () => images.find((image) => Number(image.isMain) === 1) || images[0] || null,
    [images],
  );
  const galleryImages = useMemo(() => images, [images]);

  const [selectedImageUrl, setSelectedImageUrl] = useState(mainImage?.url || "");
  const [quantity, setQuantity] = useState(1);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSelectedImageUrl(mainImage?.url || "");
  }, [mainImage?.url]);

  const addToCart = async () => {
    if (!product?.id) return;
    setIsPending(true);
    setMessage("");
    const response = await CartsService.addItemToCart({
      productId: product.id,
      quantity: Math.max(1, Number(quantity) || 1),
    });

    if (response?.status && response.status >= 400) {
      setMessage(response?.data?.error || "Nie udalo sie dodac produktu do koszyka.");
      setIsPending(false);
      return;
    }

    setMessage("Produkt dodany do koszyka.");
    window.dispatchEvent(new Event("cart:updated"));
    setIsPending(false);
  };

  if (!product?.id) {
    return <p className="productPreviewEmpty">Nie znaleziono produktu.</p>;
  }

  const vatRate = Number(product.vatRate);
  const hasVatRate = !Number.isNaN(vatRate);

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
            <p className="productPreviewPriceGross">{formatPrice(product.grossPrice)}</p>
            <p className="productPreviewPriceMeta">
              Netto: <strong>{formatPrice(product.netPrice)}</strong>
            </p>
            <p className="productPreviewPriceMeta">
              VAT: <strong>{hasVatRate ? `${vatRate}%` : "-"}</strong>
            </p>

            <div className="productPreviewQtyBlock">
              <label htmlFor="productPreviewQty">Liczba sztuk</label>
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

            <button
              type="button"
              className="productPreviewAddButton"
              onClick={addToCart}
              disabled={isPending}
            >
              Dodaj do koszyka
            </button>

            {message ? <p className="productPreviewMessage">{message}</p> : null}
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
