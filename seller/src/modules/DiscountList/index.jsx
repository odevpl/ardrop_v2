import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { useNavigate } from "react-router-dom";
import SellerSettingsService from "services/sellerSettings";
import { getDiscountTableConfig } from "./table.config";

const RULE_TYPE_LABELS = {
  cart_threshold: "Prog koszyka",
  quantity_threshold: "Prog ilosci",
  first_purchase: "Pierwszy zakup",
  loyal_customer: "Staly klient",
  b2b_customer: "Klienci",
  free_bonus: "Gratis",
};

const formatThreshold = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toFixed(2);
};

const formatDiscount = (value, bonusLabel) => {
  if (value !== null && value !== undefined && value !== "") {
    return `${Number(value).toFixed(2)} %`;
  }

  if (bonusLabel) return bonusLabel;

  return "-";
};

const DiscountsListView = ({ payload }) => {
  const navigate = useNavigate();
  const discountRules = Array.isArray(payload?.data?.discountRules)
    ? payload.data.discountRules
    : [];

  const data = discountRules.map((rule) => ({
    id: Number(rule.id),
    name: rule?.name || "-",
    ruleTypeLabel: RULE_TYPE_LABELS[rule?.ruleType] || rule?.ruleType || "-",
    statusLabel: rule?.isActive ? "Aktywna" : "Nieaktywna",
    thresholdLabel: formatThreshold(rule?.config?.thresholdValue),
    discountLabel: formatDiscount(
      rule?.config?.discountPercent,
      rule?.config?.bonusLabel,
    ),
  }));

  return (
    <Table
      config={getDiscountTableConfig()}
      data={data}
      onRowClick={(row, options) => {
        const targetPath = `/discounts/${row.id}`;
        if (options?.openInNewTab) {
          window.open(targetPath, "_blank", "noopener,noreferrer");
          return;
        }

        navigate(targetPath);
      }}
    />
  );
};

const DiscountList = () => (
  <FetchWrapper
    component={DiscountsListView}
    name="DiscountList"
    connector={SellerSettingsService.getSellerSettings}
  />
);

export default DiscountList;
