import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { NavLink } from "react-router-dom";
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
  const orders = Array.isArray(payload?.data || payload?.orders)
    ? payload?.data || payload?.orders
    : [];

  const tableConfig = [
    {
      key: "id",
      title: "Nr zamowienia",
      onRender: (row) => (
        <NavLink to={`/dostawy/${row.id}`} className="deliveriesListOrderLink">
          #{row.id}
        </NavLink>
      ),
    },
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
        <h1>Dostawy</h1>
        <NavLink to="/adresy-dostawy" className="deliveriesListLinkButton">
          Przejdz do danych dostawy
        </NavLink>
      </header>

      <Table config={tableConfig} data={orders} />
    </section>
  );
};

const DeliveriesList = () => (
  <FetchWrapper
    name="DeliveriesList"
    component={DeliveriesListView}
    connector={OrdersService.getOrders}
  />
);

export default DeliveriesList;
