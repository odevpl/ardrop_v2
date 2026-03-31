import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { useNavigate } from "react-router-dom";
import ShippingMethodsService from "services/shippingMethods";
import { getShippingTableConfig } from "./table.config.jsx";

const ShippingListView = ({ payload }) => {
  const navigate = useNavigate();
  const shippingMethods = Array.isArray(payload?.data) ? payload.data : [];

  const data = shippingMethods.map((method) => ({
    ...method,
    isActiveLabel: method?.isActive ? "Aktywna" : "Nieaktywna",
  }));

  return (
    <Table
      config={getShippingTableConfig()}
      data={data}
      onRowClick={(row, options) => {
        const targetPath = `/shipping/${row.id}`;
        if (options?.openInNewTab) {
          window.open(targetPath, "_blank", "noopener,noreferrer");
          return;
        }
        navigate(targetPath);
      }}
    />
  );
};

const ShippingList = () => (
  <FetchWrapper
    name="ShippingList"
    component={ShippingListView}
    connector={ShippingMethodsService.getShippingMethods}
  />
);

export default ShippingList;
