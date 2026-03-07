import { useParams } from "react-router-dom";
import ProductPreview from "modules/ProductPreview";

const ProductPreviewPage = () => {
  const { id } = useParams();

  return (
    <section className="productPreviewPage">
      <ProductPreview productId={id} />
    </section>
  );
};

export default ProductPreviewPage;
