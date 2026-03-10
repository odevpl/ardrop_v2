import FetchWrapper from "components/FetchWrapper";
import { useNotification } from "components/GlobalNotification/index.js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartsService from "services/carts";
import ProductsService from "services/products";
import "./SuggestedProducts.scss";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)} zl`;
};

const getMainImage = (product) => {
  if (!Array.isArray(product.images) || product.images.length === 0)
    return null;
  return (
    product.images.find((image) => Number(image.isMain) === 1) ||
    product.images[0]
  );
};

const getVisibleLimit = (width) => {
  if (width >= 1400) return 5;
  if (width >= 1100) return 4;
  if (width >= 860) return 3;
  if (width >= 620) return 2;
  return 1;
};

const SuggestedProductsView = ({ payload }) => {
  const navigate = useNavigate();
  const products = Array.isArray(payload?.data) ? payload.data : [];
  const [visibleLimit, setVisibleLimit] = useState(() =>
    getVisibleLimit(window.innerWidth),
  );
  const [pendingId, setPendingId] = useState(null);
  const notification = useNotification();

  useEffect(() => {
    const updateLimit = () =>
      setVisibleLimit(getVisibleLimit(window.innerWidth));
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  const visibleProducts = products.slice(0, visibleLimit);

  const addToCart = async (productId) => {
    setPendingId(productId);
    const response = await CartsService.addItemToCart({
      productId,
      quantity: 1,
    });

    if (response?.status && response.status >= 400) {
      notification.error(
        response?.data?.error || "Nie udalo sie dodac do koszyka.",
      );
      setPendingId(null);
      return;
    }

    notification.success("Produkt dodany do koszyka.");
    window.dispatchEvent(new Event("cart:updated"));
    setPendingId(null);
  };

  return (
    <section className="suggestedProducts">
      {/* <h2 className="suggestedProductsTitle">Polecane produkty</h2> */}
      <div className="suggestedProductsGrid">
        {visibleProducts.map((product) => {
          const mainImage = getMainImage(product);
          return (
            <article
              key={product.id}
              className="suggestedProductsCard"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div className="suggestedProductsImageWrap">
                {mainImage?.thumbUrl ? (
                  <img
                    src={mainImage.thumbUrl}
                    alt={mainImage.alt || product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="suggestedProductsImagePlaceholder">
                    Brak zdjecia
                  </div>
                )}
              </div>
              <p className="suggestedProductsPrice">
                {formatPrice(product.grossPrice)}
              </p>
              <h3 className="suggestedProductsName">{product.name}</h3>
              <button
                type="button"
                className="suggestedProductsAddButton"
                onClick={(event) => {
                  event.stopPropagation();
                  addToCart(product.id);
                }}
                disabled={pendingId === product.id}
                aria-label={`Dodaj ${product.name} do koszyka`}
              >
                <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                <i className="fa-solid fa-plus" aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};

const SuggestedProducts = () => {
  return (
    <FetchWrapper
      name="SuggestedProducts"
      component={SuggestedProductsView}
      connector={ProductsService.getSuggestedProducts}
    />
  );
};

export default SuggestedProducts;
