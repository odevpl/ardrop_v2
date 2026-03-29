import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { useConfig } from "providers/configProvider";
import { NavLink, useNavigate } from "react-router-dom";
import OrdersService from "services/orders";
import "./DeliveriesList.scss";

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`;

const formatDate = (rawDate) => {
  if (!rawDate) return "-";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatEta = (from, to) => {
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return formatDate(from);
  if (to) return formatDate(to);
  return "-";
};

const DeliveriesListView = ({ payload }) => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const orders = Array.isArray(payload?.data || payload?.orders)
    ? payload?.data || payload?.orders
    : [];
  const statusOptions = Array.isArray(config?.orders?.statuses) ? config.orders.statuses : [];
  const paymentStatusOptions = Array.isArray(config?.orders?.paymentStatuses) ? config.orders.paymentStatuses : [];
  const mapStatusLabel = (value, options) =>
    options.find((option) => option.value === value)?.label || value || "-";

  const tableConfig = [
    {
      key: "createdAt",
      title: "Data",
      onRender: (row) => formatDate(row.createdAt),
    },
    {
      key: "status",
      title: "Status",
      onRender: (row) => mapStatusLabel(row?.status, statusOptions),
    },
    {
      key: "orderGroupId",
      title: "Grupa",
      onRender: (row) => row?.orderGroupId || "-",
    },
    {
      key: "paymentStatus",
      title: "Platnosc",
      onRender: (row) => mapStatusLabel(row?.paymentStatus, paymentStatusOptions),
    },
    {
      key: "delivery",
      title: "Dostawa",
      onRender: (row) =>
        row?.shippingMethodName || formatEta(row?.estimatedDeliveryFrom, row?.estimatedDeliveryTo),
    },
    {
      key: "itemsCount",
      title: "Pozycje",
      onRender: (row) =>
        row?.sellerScope?.itemsCount || row?.items?.length || "-",
    },
    {
      key: "totalGross",
      title: "Wartosc",
      onRender: (row) =>
        formatPrice(row?.sellerScope?.totalGross ?? row.totalGross),
    },
  ];

  return (
    <section className="deliveriesListModule">
      <header className="deliveriesListHeader">
        <h1>Zamowienia</h1>
        <NavLink to="/adresy-dostawy" className="deliveriesListLinkButton">
          Przejdz do adresow dostawy
        </NavLink>
      </header>

      <Table
        config={tableConfig}
        data={orders}
        onRowClick={(row) => navigate(`/zamowienia/${row.id}`)}
      />
    </section>
  );
};

const DeliveriesList = () => (
  <FetchWrapper
    name="OrdersList"
    component={DeliveriesListView}
    connector={OrdersService.getOrders}
  />
);

export default DeliveriesList;
