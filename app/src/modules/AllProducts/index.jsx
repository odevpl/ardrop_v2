import FetchWrapper from "components/FetchWrapper";
import Pagination from "components/Pagination";
import { useNotification } from "components/GlobalNotification/index.js";
import Popup2 from "components/Popup2";
import FastProductView from "modules/FastProductView";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const products = Array.isArray(payload?.data) ? payload.data : [];
  const pagination = payload?.meta?.pagination || {};
  const page = Number(pagination.page || filters?.page || 1);
  const totalPages = Number(pagination.totalPages || 1);
  const searchValue = filters?.search || "";
  const [pendingId, setPendingId] = useState(null);
  const [inlineCartConfig, setInlineCartConfig] = useState(null);
  const notification = useNotification();

  const addToCart = async ({ productId, variantId = null, quantity = 1 }) => {
    setPendingId(productId);
    const response = await CartsService.addItemToCart({
      productId,
      variantId,
      quantity: Math.max(1, Number(quantity) || 1),
    });

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie dodac do koszyka.");
      setPendingId(null);
      return;
    }

    notification.success("Produkt dodany do koszyka.");
    window.dispatchEvent(new Event("cart:updated"));
    setPendingId(null);
    setInlineCartConfig(null);
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
      <div className="allProductsToolbar">
        <input
          className="allProductsSearchInput"
          type="search"
          value={searchValue}
          placeholder="Szukaj produktu..."
          onChange={(event) =>
            setFilters({
              ...(filters || {}),
              search: event.target.value,
              page: 1,
            })
          }
        />
      </div>
      <div className="allProductsGrid">
        {products.map((product) => {
          const mainImage = getMainImage(product);
          const variants = Array.isArray(product.variants) ? product.variants : [];
          const activeVariants = variants.filter((variant) => variant.status === "active");
          const defaultVariant =
            activeVariants.find((variant) => variant.isDefault) || activeVariants[0] || null;
          const isInlineOpen = Number(inlineCartConfig?.productId) === Number(product.id);
          const selectedVariantId =
            inlineCartConfig?.variantId ?? (defaultVariant ? Number(defaultVariant.id) : null);
          const displayPrice = defaultVariant?.grossPrice ?? product.grossPrice;

          return (
            <article
              key={product.id}
              className="allProductsCard"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div className="allProductsImageWrap">
                {mainImage?.thumbUrl ? (
                  <img src={mainImage.thumbUrl} alt={mainImage.alt || product.name} loading="lazy" />
                ) : (
                  <div className="allProductsImagePlaceholder">Brak zdjecia</div>
                )}

                {isInlineOpen ? (
                  <div className="allProductsInlineConfig" onClick={(event) => event.stopPropagation()}>
                    {activeVariants.length > 1 ? (
                      <div className="allProductsInlineField">
                        <label htmlFor={`inlineVariant-${product.id}`}>Wariant</label>
                        <select
                          id={`inlineVariant-${product.id}`}
                          value={selectedVariantId || ""}
                          disabled={pendingId === product.id}
                          onChange={(event) =>
                            setInlineCartConfig((prev) => ({
                              ...prev,
                              variantId: Number(event.target.value) || null,
                            }))
                          }
                        >
                          {activeVariants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div className="allProductsInlineField">
                      <label htmlFor={`inlineQty-${product.id}`}>Ilosc</label>
                      <div className="allProductsInlineQty">
                        <button
                          type="button"
                          onClick={() =>
                            setInlineCartConfig((prev) => ({
                              ...prev,
                              quantity: Math.max(1, Number(prev?.quantity || 1) - 1),
                            }))
                          }
                          disabled={pendingId === product.id}
                          aria-label="Zmniejsz ilosc"
                        >
                          <i className="fa-solid fa-minus" aria-hidden="true" />
                        </button>
                        <input
                          id={`inlineQty-${product.id}`}
                          type="number"
                          min={1}
                          value={inlineCartConfig?.quantity || 1}
                          disabled={pendingId === product.id}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (Number.isInteger(next) && next > 0) {
                              setInlineCartConfig((prev) => ({
                                ...prev,
                                quantity: next,
                              }));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setInlineCartConfig((prev) => ({
                              ...prev,
                              quantity: Math.max(1, Number(prev?.quantity || 1) + 1),
                            }))
                          }
                          disabled={pendingId === product.id}
                          aria-label="Zwieksz ilosc"
                        >
                          <i className="fa-solid fa-plus" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="allProductsInlineActions">
                      <button
                        type="button"
                        className="allProductsInlineSubmit"
                        onClick={() =>
                          addToCart({
                            productId: product.id,
                            variantId: selectedVariantId,
                            quantity: inlineCartConfig?.quantity || 1,
                          })
                        }
                        disabled={pendingId === product.id}
                      >
                        Dodaj
                      </button>
                      <button
                        type="button"
                        className="allProductsInlineCancel"
                        onClick={() => setInlineCartConfig(null)}
                        disabled={pendingId === product.id}
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <p className="allProductsPrice">{formatPrice(displayPrice)}</p>
              <h3 className="allProductsName">{product.name}</h3>
              <div className="allProductsActions" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="allProductsAddButton"
                  onClick={(event) => {
                    event.stopPropagation();
                    setInlineCartConfig({
                      productId: product.id,
                      variantId: defaultVariant ? Number(defaultVariant.id) : null,
                      quantity: 1,
                    });
                  }}
                  disabled={pendingId === product.id || isInlineOpen}
                  aria-label={`Dodaj ${product.name} do koszyka`}
                >
                  <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                </button>
                <Popup2
                  openButtonText="Szybki podglad"
                  buttonComponent="button"
                  buttonProps={{
                    type: "button",
                    className: "allProductsPopupButton",
                    "aria-label": `Otworz szybki podglad produktu ${product.name}`,
                    onClick: (event) => event.stopPropagation(),
                  }}
                  component={FastProductView}
                  componentProps={{ productId: product.id }}
                  modalProps={{ width: 580 }}
                />
              </div>
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
    filters={{ page: 1, limit: 20, search: "" }}
  />
);

export default AllProducts;
