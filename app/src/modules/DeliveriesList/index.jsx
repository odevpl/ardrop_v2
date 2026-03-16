import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
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

const DeliveriesListView = ({ payload }) => {
  const navigate = useNavigate();
  const orders = Array.isArray(payload?.data || payload?.orders)
    ? payload?.data || payload?.orders
    : [];

  const tableConfig = [
    {
      key: "createdAt",
      title: "Data",
      onRender: (row) => formatDate(row.createdAt),
    },
    {
      key: "status",
      title: "Status",
    },
    {
      key: "paymentStatus",
      title: "Platnosc",
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
