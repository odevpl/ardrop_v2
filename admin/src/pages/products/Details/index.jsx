import ProductForm from "modules/ProductForm";
import { useParams } from "react-router-dom";

const ProductDetailsPage = () => {
  const { id } = useParams();
  const parsedId = Number(id);

  return <ProductForm id={Number.isNaN(parsedId) ? undefined : parsedId} />;
};

export default ProductDetailsPage;
