import DiscountList from "modules/DiscountList";
import { useNavigate } from "react-router-dom";

const DiscountsPage = () => {
  const navigate = useNavigate();

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Rabaty</h2>
        <div className="sellerActions">
          <button
            type="button"
            className="sellerPrimaryButton"
            onClick={() => navigate("/discounts/new")}
          >
            Dodaj rabat
          </button>
        </div>
      </div>

      <DiscountList />
    </section>
  );
};

export default DiscountsPage;
