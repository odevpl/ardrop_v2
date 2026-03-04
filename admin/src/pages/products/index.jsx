import FetchWrapper from "components/FetchWrapper";
import ProductList from "modules/ProductList";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../../services/products";

const ProductsWrapper = () => {
  const navigate = useNavigate();

  return (
    <>
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => navigate("/products/add")}>
          Dodaj produkt
        </button>
      </div>
      <FetchWrapper
        component={ProductList}
        name="Produkty"
        connector={getProducts}
        filters={{ page: 1, limit: 20, search: "" }}
      />
    </>
  );
};

export default ProductsWrapper;
