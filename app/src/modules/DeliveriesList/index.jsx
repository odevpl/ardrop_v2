import FetchWrapper from "components/FetchWrapper";
import { useState } from "react";
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
  return "Do ustalenia";
};

const mapGroupPaymentLabel = (orders) => {
  const normalizedOrders = Array.isArray(orders) ? orders : [];
  if (normalizedOrders.length === 0) return "-";

  const allPaid = normalizedOrders.every((order) => order?.paymentStatus === "paid");
  if (allPaid) return "Oplacone";

  const somePaid = normalizedOrders.some((order) => order?.paymentStatus === "paid");
  if (somePaid) return "Oplacone czesciowo";

  const anyFailed = normalizedOrders.some((order) => order?.paymentStatus === "failed");
  if (anyFailed) return "Problem z platnoscia";

  return "Oczekuje na platnosc";
};

const mapPartPaymentLabel = (value) => {
  if (value === "paid") return "Oplacone";
  if (value === "failed") return "Blad platnosci";
  return "Oczekuje";
};

const groupOrders = (orders) => {
  const groupsMap = new Map();

  orders.forEach((order) => {
    const groupId = Number(order?.orderGroupId || order?.id || 0);
    if (!groupId) return;

    const existingGroup = groupsMap.get(groupId);
    const totalGross = Number(order?.sellerScope?.totalGross ?? order?.totalGross ?? 0);
    const itemsCount = Number(order?.sellerScope?.itemsCount ?? order?.items?.length ?? 0);
    const part = {
      id: Number(order?.id),
      sellerId: Number(order?.sellerId),
      sellerName: order?.seller?.companyName || `Sprzedawca #${order?.sellerId || "-"}`,
      createdAt: order?.createdAt || null,
      shippingMethodName: order?.shippingMethodName || null,
      estimatedDeliveryFrom: order?.estimatedDeliveryFrom || null,
      estimatedDeliveryTo: order?.estimatedDeliveryTo || null,
      paymentStatus: order?.paymentStatus || null,
      itemsCount,
      totalGross,
    };

    if (!existingGroup) {
      groupsMap.set(groupId, {
        id: groupId,
        orderGroupId: groupId,
        orderGroupNumber: order?.orderGroupNumber || null,
        createdAt: order?.createdAt || null,
        itemsCount,
        totalGross,
        parts: [part],
      });
      return;
    }

    existingGroup.itemsCount += itemsCount;
    existingGroup.totalGross += totalGross;
    existingGroup.parts.push(part);

    if (!existingGroup.createdAt || new Date(order?.createdAt) < new Date(existingGroup.createdAt)) {
      existingGroup.createdAt = order?.createdAt || existingGroup.createdAt;
    }
  });

  return Array.from(groupsMap.values())
    .map((group) => ({
      ...group,
      paymentLabel: mapGroupPaymentLabel(group.parts),
      sellersCount: group.parts.length,
      parts: group.parts.sort((left, right) => Number(left.id) - Number(right.id)),
    }))
    .sort((left, right) => {
      const leftDate = new Date(left.createdAt || 0).getTime();
      const rightDate = new Date(right.createdAt || 0).getTime();
      if (leftDate !== rightDate) return rightDate - leftDate;
      return Number(right.orderGroupId) - Number(left.orderGroupId);
    });
};

const DeliveriesListView = ({ payload }) => {
  const navigate = useNavigate();
  const [expandedGroupIds, setExpandedGroupIds] = useState([]);
  const orders = Array.isArray(payload?.data || payload?.orders)
    ? payload?.data || payload?.orders
    : [];
  const orderGroups = groupOrders(orders);

  const toggleGroup = (groupId) => {
    setExpandedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((value) => value !== groupId) : [...prev, groupId],
    );
  };

  return (
    <section className="deliveriesListModule">
      <header className="deliveriesListHeader">
        <h1>Zamowienia</h1>
        <NavLink to="/adresy-dostawy" className="deliveriesListLinkButton">
          Przejdz do adresow dostawy
        </NavLink>
      </header>

      <div className="deliveriesListCards">
        {orderGroups.length === 0 ? (
          <div className="deliveriesListEmpty">Brak zamowien.</div>
        ) : (
          orderGroups.map((group) => {
            const isExpanded = expandedGroupIds.includes(group.orderGroupId);

            return (
              <section className="deliveriesListCard" key={group.orderGroupId}>
                <div className="deliveriesListSummaryRow">
                  <button
                    type="button"
                    className="deliveriesListExpandButton"
                    onClick={() => toggleGroup(group.orderGroupId)}
                    aria-expanded={isExpanded}
                    aria-controls={`order-group-${group.orderGroupId}`}
                  >
                    <span className="deliveriesListExpandIcon" aria-hidden="true">
                      <i
                        className={`fa-solid ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}
                      />
                    </span>
                    <span className="deliveriesListSummaryTitle">
                      Zakup #{group.orderGroupNumber || group.orderGroupId}
                    </span>
                  </button>

                  <div className="deliveriesListSummaryMeta">
                    <div>
                      <span>Data</span>
                      <strong>{formatDate(group.createdAt)}</strong>
                    </div>
                    <div>
                      <span>Sprzedawcy</span>
                      <strong>{group.sellersCount}</strong>
                    </div>
                    <div>
                      <span>Pozycje</span>
                      <strong>{group.itemsCount}</strong>
                    </div>
                    <div>
                      <span>Platnosc</span>
                      <strong>{group.paymentLabel}</strong>
                    </div>
                    <div>
                      <span>Wartosc</span>
                      <strong>{formatPrice(group.totalGross)}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="deliveriesListDetailsButton"
                    onClick={() => navigate(`/zamowienia/grupa/${group.orderGroupId}`)}
                  >
                    Szczegoly
                  </button>
                </div>

                {isExpanded ? (
                  <div
                    id={`order-group-${group.orderGroupId}`}
                    className="deliveriesListParts"
                  >
                    <div className="deliveriesListPartsHeader">
                      <span>Sprzedawca</span>
                      <span>Dostawa</span>
                      <span>Pozycje</span>
                      <span>Platnosc</span>
                      <span>Wartosc</span>
                    </div>

                    {group.parts.map((part) => (
                      <div className="deliveriesListPartRow" key={part.id}>
                        <div className="deliveriesListPartPrimary">
                          <strong>{part.sellerName}</strong>
                        </div>
                        <span>{part.shippingMethodName || formatEta(part.estimatedDeliveryFrom, part.estimatedDeliveryTo)}</span>
                        <span>{part.itemsCount}</span>
                        <span>{mapPartPaymentLabel(part.paymentStatus)}</span>
                        <strong>{formatPrice(part.totalGross)}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })
        )}
      </div>
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
