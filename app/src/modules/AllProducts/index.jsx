import FetchWrapper from "components/FetchWrapper";
import Pagination from "components/Pagination";
import { useState } from "react";
import CartsService from "services/carts";
import ProductsService from "services/products";
import "./AllProducts.scss";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)} zl`;
};

const getMainImage = (product) => {
  if (!Array.isArray(product.images) || product.images.length === 0) return null;
  return product.images.find((image) => Number(image.isMain) === 1) || product.images[0];
};

const AllProductsView = ({ payload, filters, setFilters }) => {
  const products = Array.isArray(payload?.data) ? payload.data : [];
  const pagination = payload?.meta?.pagination || {};
  const page = Number(pagination.page || filters?.page || 1);
  const totalPages = Number(pagination.totalPages || 1);
  const [pendingId, setPendingId] = useState(null);
  const [message, setMessage] = useState("");

  const addToCart = async (productId) => {
    setPendingId(productId);
    setMessage("");
    const response = await CartsService.addItemToCart({
      productId,
      quantity: 1,
    });

    if (response?.status && response.status >= 400) {
      setMessage(response?.data?.error || "Nie udalo sie dodac do koszyka.");
      setPendingId(null);
      return;
    }

    setMessage("Produkt dodany do koszyka.");
    window.dispatchEvent(new Event("cart:updated"));
    setPendingId(null);
  };

  const changePage = (nextPage) => {
    const safePage = Math.min(Math.max(1, nextPage), Math.max(1, totalPages));
    setFilters({
      ...(filters || {}),
      page: safePage,
      limit: 20,
    });
  };

  return (
    <section className="allProducts">
      <div className="allProductsHead">
        <h2 className="allProductsTitle">Wszystkie produkty</h2>
        <span className="allProductsMeta">
          Strona {page} / {Math.max(totalPages, 1)}
        </span>
      </div>
      {message ? <p className="allProductsMessage">{message}</p> : null}

      <div className="allProductsGrid">
        {products.map((product) => {
          const mainImage = getMainImage(product);
          return (
            <article key={product.id} className="allProductsCard">
              <div className="allProductsImageWrap">
                {mainImage?.url ? (
                  <img src={mainImage.url} alt={mainImage.alt || product.name} />
                ) : (
                  <div className="allProductsImagePlaceholder">Brak zdjecia</div>
                )}
              </div>
              <p className="allProductsPrice">{formatPrice(product.grossPrice)}</p>
              <h3 className="allProductsName">{product.name}</h3>
              <button
                type="button"
                className="allProductsAddButton"
                onClick={() => addToCart(product.id)}
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

      <Pagination
        page={page}
        totalPages={totalPages}
        total={pagination.total}
        limit={pagination.limit || filters?.limit || 20}
        onPageChange={changePage}
        onLimitChange={(nextLimit) =>
          setFilters({
            ...(filters || {}),
            page: 1,
            limit: nextLimit,
          })
        }
      />
    </section>
  );
};

const AllProducts = () => (
  <FetchWrapper
    name="AllProducts"
    component={AllProductsView}
    connector={ProductsService.getProducts}
    filters={{ page: 1, limit: 20 }}
  />
);

export default AllProducts;
