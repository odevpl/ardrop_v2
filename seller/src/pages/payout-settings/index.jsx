import PayoutSettingsForm from "modules/PayoutSettingsForm";

const PayoutSettingsPage = () => {
  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Dane do przelewow</h2>
      </div>

      <PayoutSettingsForm />
    </section>
  );
};

export default PayoutSettingsPage;
