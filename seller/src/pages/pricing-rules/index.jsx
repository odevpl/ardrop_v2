import PricingRulesForm from "modules/PricingRulesForm";

const PricingRulesPage = () => {
  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Reguly cenowe</h2>
      </div>

      <PricingRulesForm />
    </section>
  );
};

export default PricingRulesPage;
