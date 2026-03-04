import FetchWrapper from "components/FetchWrapper";
import ProductList from "modules/ProductList";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../../services/products";

const Products = ({ payload, filters, setFilters }) => {
  const navigate = useNavigate();

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Produkty</h2>
        <div className="adminActions">
          <button
            type="button"
            className="adminPrimaryButton"
            onClick={() => navigate("/products/add")}
          >
            Dodaj produkt
          </button>
        </div>
      </div>

      <ProductList payload={payload} filters={filters} setFilters={setFilters} />
    </section>
  );
};

const ProductsWrapper = () => {
  return (
    <FetchWrapper
      component={Products}
      name="Produkty"
      connector={getProducts}
      filters={{ page: 1, limit: 20, search: "" }}
    />
  );
};

export default ProductsWrapper;
