import DiscountEditForm from "modules/DiscountEditForm";
import { useParams } from "react-router-dom";

const DiscountDetailsPage = () => {
  const { id } = useParams();

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Rabaty</h2>
      </div>

      <DiscountEditForm id={id} />
    </section>
  );
};

export default DiscountDetailsPage;
