import FetchWrapper from "components/FetchWrapper";
import SellerSettingsService from "services/sellerSettings";
import { useNavigate } from "react-router-dom";

const SellerDashboardView = ({ payload }) => {
  const navigate = useNavigate();
  const salesReadiness = payload?.data?.salesReadiness || payload?.salesReadiness || {};
  const checklist = Array.isArray(salesReadiness?.checklist) ? salesReadiness.checklist : [];
  const missingItems = checklist.filter((item) => !item?.isComplete);

  return (
    <div className="sellerDashboard">
      <section
        className={`sellerDashboardHero${
          salesReadiness?.isReadyForSales ? " sellerDashboardHeroReady" : " sellerDashboardHeroWarning"
        }`}
      >
        <div>
          <p className="sellerKicker">Status sprzedazy</p>
          <h3 className="sellerTitle">
            {salesReadiness?.isReadyForSales
              ? "Produkty moga byc pokazywane klientom"
              : "Produkty sa ukryte do czasu uzupelnienia konfiguracji"}
          </h3>
          <p className="sellerConfigPlaceholderText">
            {salesReadiness?.isReadyForSales
              ? "Konto ma komplet danych wymaganych do publikacji oferty."
              : "Uzupelnij brakujace pola i aktywuj co najmniej jedna metode dostawy."}
          </p>
        </div>
        {!salesReadiness?.isReadyForSales && missingItems[0]?.path ? (
          <div className="sellerActions">
            <button
              type="button"
              className="sellerPrimaryButton"
              onClick={() => navigate(missingItems[0].path)}
            >
              Uzupelnij pierwszy brak
            </button>
          </div>
        ) : null}
      </section>

      <section className="sellerDashboardSection">
        <h3>Checklista publikacji</h3>
        <div className="sellerDashboardChecklist">
          {checklist.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sellerDashboardChecklistItem${
                item.isComplete
                  ? " sellerDashboardChecklistItemComplete"
                  : " sellerDashboardChecklistItemMissing"
              }`}
              onClick={() => navigate(item.path)}
            >
              <div className="sellerDashboardChecklistIcon">
                <i
                  className={`fa-solid ${item.isComplete ? "fa-circle-check" : "fa-circle-exclamation"}`}
                  aria-hidden="true"
                />
              </div>
              <div className="sellerDashboardChecklistBody">
                <strong>{item.label}</strong>
                <span>{item.isComplete ? "Uzupelnione" : "Brakuje"}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {!salesReadiness?.isReadyForSales ? (
        <section className="sellerDashboardSection">
          <h3>Czego brakuje</h3>
          <div className="sellerConfigPlaceholderList">
            {missingItems.map((item) => (
              <button
                key={`missing-${item.key}`}
                type="button"
                className="sellerConfigCard"
                onClick={() => navigate(item.path)}
              >
                <div className="sellerConfigCardIcon">
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </div>
                <div className="sellerConfigCardBody">
                  <strong>{item.label}</strong>
                  <p>Przejdz do ustawien i uzupelnij ten element.</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};

const SellerDashboard = () => (
  <FetchWrapper
    name="SellerDashboard"
    component={SellerDashboardView}
    connector={SellerSettingsService.getSellerSettings}
  />
);

export default SellerDashboard;
