import FetchWrapper from "components/FetchWrapper";
import { useEffect, useState } from "react";
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
  const products = Array.isArray(payload?.data) ? payload.data : [];
  const [visibleLimit, setVisibleLimit] = useState(() =>
    getVisibleLimit(window.innerWidth),
  );

  useEffect(() => {
    const updateLimit = () =>
      setVisibleLimit(getVisibleLimit(window.innerWidth));
    window.addEventListener("resize", updateLimit);
    return () => window.removeEventListener("resize", updateLimit);
  }, []);

  const visibleProducts = products.slice(0, visibleLimit);

  return (
    <section className="suggestedProducts">
      <h2 className="suggestedProductsTitle">Polecane produkty</h2>

      <div className="suggestedProductsGrid">
        {visibleProducts.map((product) => {
          const mainImage = getMainImage(product);
          return (
            <article key={product.id} className="suggestedProductsCard">
              <div className="suggestedProductsImageWrap">
                {mainImage?.url ? (
                  <img
                    src={mainImage.url}
                    alt={mainImage.alt || product.name}
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
