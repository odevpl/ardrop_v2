import ShippingEditForm from "modules/ShippingEditForm";
import { useParams } from "react-router-dom";

const ShippingDetailsPage = () => {
  const { id } = useParams();

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>{"Dostawa"}</h2>
      </div>

      <ShippingEditForm id={id} />
    </section>
  );
};

export default ShippingDetailsPage;
