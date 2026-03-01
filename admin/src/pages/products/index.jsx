import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { getProducts } from "../../services/products";
import { getProductsTableConfig } from "./table.config";

const Products = ({ payload }) => {
  return (
    <Table config={getProductsTableConfig()} data={payload?.data ?? payload} />
  );
};

const ProductsWrapper = () => {
  return (
    <FetchWrapper
      component={Products}
      name="Produkty"
      connector={getProducts}
    />
  );
};

export default ProductsWrapper;
