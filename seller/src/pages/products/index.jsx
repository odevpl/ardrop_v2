import ProductList from 'modules/ProductList'
import FetchWrapper from 'components/FetchWrapper'
import SellerSettingsService from 'services/sellerSettings'
import { useNavigate } from 'react-router-dom'

const SalesReadinessAlert = ({ payload }) => {
  const salesReadiness = payload?.data?.salesReadiness || payload?.salesReadiness || {};
  const missingItems = Array.isArray(salesReadiness?.checklist)
    ? salesReadiness.checklist.filter((item) => !item?.isComplete)
    : [];

  if (salesReadiness?.isReadyForSales) {
    return null;
  }

  return (
    <div className="sellerDashboardInlineAlert">
      <strong>Produkty sa obecnie ukryte dla klientow.</strong>
      <span>
        Brakuje: {missingItems.map((item) => item.label).join(", ")}.
      </span>
    </div>
  );
};

const ProductsPage = () => {
  const navigate = useNavigate()

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Produkty</h2>
        <div className="sellerActions">
          <button
            type="button"
            className="sellerPrimaryButton"
            onClick={() => navigate('/products/add')}
          >
            Dodaj produkt
          </button>
        </div>
      </div>

      <FetchWrapper
        name="SalesReadinessAlert"
        component={SalesReadinessAlert}
        connector={SellerSettingsService.getSellerSettings}
      />

      <ProductList />
    </section>
  )
}

export default ProductsPage
