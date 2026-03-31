import FetchWrapper from "components/FetchWrapper";
import { useConfig } from "providers/configProvider";
import { useNavigate } from "react-router-dom";
import OrdersService from "services/orders";
import "./OrderGroupView.scss";

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const resolveThumbUrl = (item) => {
  const images = Array.isArray(item?.productSnapshot?.images) ? item.productSnapshot.images : [];
  const main = images.find((image) => Number(image?.isMain) === 1) || images[0];
  if (!main?.fileName) return "";
  return `${apiBaseUrl}/uploads/images/thumbs/${main.fileName.replace(/\.[^.]+$/, ".jpg")}`;
};

const formatDate = (rawDate) => {
  if (!rawDate) return "-";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatDateTime = (rawDate) => {
  if (!rawDate) return "-";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const formatEta = (from, to) => {
  if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
  if (from) return formatDate(from);
  if (to) return formatDate(to);
  return "Do ustalenia";
};

const formatBankAccount = (value) =>
  String(value || "")
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

const mapStatusLabel = (value, options) =>
  options.find((option) => option.value === value)?.label || value || "-";

const mapGroupStatusLabel = (value) => {
  if (value === "awaiting_payment") return "Oczekuje na platnosc";
  if (value === "payment_failed") return "Platnosc nieudana";
  if (value === "completed") return "Oplacone";
  return value || "-";
};

const OrderGroupContent = ({ payload }) => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const orderGroup = payload?.data || payload?.orderGroup || payload || {};
  const orders = Array.isArray(orderGroup?.orders) ? orderGroup.orders : [];
  const summary = orderGroup?.summary || {};
  const deliveryAddress = orderGroup?.deliveryAddressSnapshot || null;
  const paymentStatusOptions = Array.isArray(config?.orders?.paymentStatuses)
    ? config.orders.paymentStatuses
    : [];
  const displayOrderGroupNumber = orderGroup?.orderGroupNumber || orderGroup?.orderGroupId || "-";

  return (
    <section className="orderGroupViewModule">
      <header className="orderGroupViewHeader">
        <div>
          <p className="orderGroupViewEyebrow">Zakup zakonczony</p>
          <h1>Zakup #{displayOrderGroupNumber}</h1>
          <p className="orderGroupViewLead">
            Zamowienie zostalo przyjete. Oplac sekcje proforma ponizej, aby sprzedawcy mogli
            rozpocza realizacje.
          </p>
        </div>
        <button type="button" className="orderGroupViewPrintButton" onClick={() => window.print()}>
          Drukuj
        </button>
      </header>

      <div className="orderGroupViewLayout">
        <div className="orderGroupViewMainColumn">
          <div className="orderGroupViewIntroGrid">
            <section className="orderGroupViewCard orderGroupViewCardHighlight">
              <div className="orderGroupViewInfoGrid">
                <span>Numer zakupu</span>
                <span>#{displayOrderGroupNumber}</span>
                <span>Data utworzenia</span>
                <span>{formatDateTime(orderGroup?.createdAt)}</span>
                <span>Status</span>
                <span>{mapGroupStatusLabel(orderGroup?.status)}</span>
                <span>Status platnosci</span>
                <span>{mapStatusLabel(orderGroup?.paymentStatus, paymentStatusOptions)}</span>
                <span>Liczba sprzedawcow</span>
                <span>{summary?.sellersCount || 0}</span>
              </div>
            </section>

            <section className="orderGroupViewCard">
              <div className="orderGroupViewSectionHead">
                <h2>Adres dostawy</h2>
              </div>
              {deliveryAddress ? (
                <div className="orderGroupViewAddressBox">
                  <p>
                    <strong>{deliveryAddress.recipientName || "-"}</strong>
                  </p>
                  {deliveryAddress.phone ? <p>{deliveryAddress.phone}</p> : null}
                  {deliveryAddress.label ? <p>{deliveryAddress.label}</p> : null}
                  <p>{deliveryAddress.addressLine1 || "-"}</p>
                  {deliveryAddress.addressLine2 ? <p>{deliveryAddress.addressLine2}</p> : null}
                  <p>
                    {deliveryAddress.postalCode || "-"} {deliveryAddress.city || "-"},{" "}
                    {deliveryAddress.countryCode || "PL"}
                  </p>
                </div>
              ) : (
                <p className="orderGroupViewMuted">Brak danych adresu dostawy.</p>
              )}
            </section>
          </div>

          <div className="orderGroupViewShipmentList">
            {orders.map((order) => {
              const seller = order?.seller || {};
              const proforma = order?.proforma || {};
              const hasPayoutDetails = Boolean(
                seller?.payoutAccountHolder && seller?.payoutBankAccount,
              );

              return (
                <section className="orderGroupViewShipmentCard" key={order.id}>
                  <div className="orderGroupViewShipmentHeader">
                    <div>
                      <p className="orderGroupViewEyebrow">Sprzedawca</p>
                      <h2>{seller?.companyName || `Seller #${order.sellerId}`}</h2>
                    </div>
                    <div className="orderGroupViewShipmentMeta">
                      <span>Zamowienie #{order.id}</span>
                      <span>{formatPrice(order?.totalGross)}</span>
                    </div>
                  </div>

                  <div className="orderGroupViewTableWrap">
                    <table className="orderGroupViewTable">
                      <thead>
                        <tr>
                          <th>Produkt</th>
                          <th>Ilosc</th>
                          <th>Netto</th>
                          <th>Brutto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order?.items || []).map((item) => {
                          const thumbUrl = resolveThumbUrl(item);
                          return (
                            <tr key={item.id}>
                              <td>
                                <div className="orderGroupViewProductCell">
                                  <div className="orderGroupViewThumbWrap">
                                    {thumbUrl ? (
                                      <img
                                        src={thumbUrl}
                                        alt={item?.productSnapshot?.name || "Produkt"}
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="orderGroupViewThumbPlaceholder">Brak</div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="orderGroupViewProductName">
                                      {item?.productSnapshot?.name || `Produkt #${item.productId}`}
                                    </p>
                                    {item?.variantNameSnapshot ? (
                                      <p className="orderGroupViewProductVariant">
                                        {item.variantNameSnapshot}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{formatPrice(item.netPrice * item.quantity)}</td>
                              <td>{formatPrice(item.grossPrice * item.quantity)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="orderGroupViewShipmentDetails">
                    <div className="orderGroupViewSummaryBox">
                      <span>Suma pozycji</span>
                      <strong>{formatPrice(order?.sellerScope?.totalGross)}</strong>
                      <span>Dostawa</span>
                      <strong>{formatPrice(order?.totalShipping)}</strong>
                      <span>Razem</span>
                      <strong>{formatPrice(order?.totalGross)}</strong>
                      <span>Status platnosci</span>
                      <strong>{mapStatusLabel(order?.paymentStatus, paymentStatusOptions)}</strong>
                    </div>

                    <div className="orderGroupViewProformaBox">
                      <div className="orderGroupViewSectionHead">
                        <h3>Faktura proforma</h3>
                        <span className="orderGroupViewProformaNumber">
                          {proforma?.documentNumber || "-"}
                        </span>
                      </div>

                      <div className="orderGroupViewInfoGrid">
                        <span>Data wystawienia</span>
                        <span>{formatDate(proforma?.issuedAt)}</span>
                        <span>Termin platnosci</span>
                        <span>{formatDate(proforma?.dueDate)}</span>
                        <span>Metoda platnosci</span>
                        <span>{proforma?.paymentMethodLabel || "-"}</span>
                        <span>Tytul przelewu</span>
                        <span>{proforma?.paymentTitle || "-"}</span>
                      </div>

                      <div className="orderGroupViewProformaColumns">
                        <div className="orderGroupViewPartyBox">
                          <p className="orderGroupViewPartyTitle">Sprzedawca</p>
                          <p>
                            <strong>{seller?.companyName || "-"}</strong>
                          </p>
                          {seller?.nip ? <p>NIP: {seller.nip}</p> : null}
                          {seller?.address ? <p>{seller.address}</p> : null}
                          {(seller?.postalCode || seller?.city) ? (
                            <p>
                              {seller?.postalCode || "-"} {seller?.city || "-"}
                            </p>
                          ) : null}
                        </div>

                        <div className="orderGroupViewPartyBox">
                          <p className="orderGroupViewPartyTitle">Nabywca</p>
                          <p>
                            <strong>
                              {order?.client?.companyName || order?.client?.name || "-"}
                            </strong>
                          </p>
                          {order?.client?.nip ? <p>NIP: {order.client.nip}</p> : null}
                          {order?.client?.address ? <p>{order.client.address}</p> : null}
                          {(order?.client?.postalCode || order?.client?.city) ? (
                            <p>
                              {order?.client?.postalCode || "-"} {order?.client?.city || "-"}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="orderGroupViewPaymentBox">
                        <div className="orderGroupViewInfoGrid">
                          <span>Kwota do zaplaty</span>
                          <strong>{formatPrice(proforma?.amountGross)}</strong>
                          <span>Status</span>
                          <strong>{mapStatusLabel(proforma?.paymentStatus, paymentStatusOptions)}</strong>
                        </div>

                        {hasPayoutDetails ? (
                          <div className="orderGroupViewTransferBox">
                            <p>
                              <strong>Odbiorca:</strong> {seller.payoutAccountHolder}
                            </p>
                            <p>
                              <strong>Rachunek:</strong> {formatBankAccount(seller.payoutBankAccount)}
                            </p>
                            {seller?.payoutBankName ? (
                              <p>
                                <strong>Bank:</strong> {seller.payoutBankName}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="orderGroupViewTransferFallback">
                            Dane do przelewu zostana przekazane przez sprzedawce.
                          </div>
                        )}
                      </div>

                      <div className="orderGroupViewInfoGrid">
                        <span>Metoda dostawy</span>
                        <span>{order?.shippingMethodName || "Do ustalenia"}</span>
                        <span>Przyblizony termin</span>
                        <span>
                          {formatEta(order?.estimatedDeliveryFrom, order?.estimatedDeliveryTo)}
                        </span>
                      </div>

                      {order?.clientNote ? (
                        <div className="orderGroupViewNoteBox">
                          <p className="orderGroupViewPartyTitle">Notatka do dostawy</p>
                          <p>{order.clientNote}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <aside className="orderGroupViewSidebar">
          <section className="orderGroupViewCard">
            <h2>Podsumowanie zakupu</h2>
            <div className="orderGroupViewSummaryRow">
              <span>Pozycje</span>
              <strong>{summary?.itemsCount || 0}</strong>
            </div>
            <div className="orderGroupViewSummaryRow">
              <span>Dostawa</span>
              <strong>{formatPrice(summary?.totalShipping)}</strong>
            </div>
            <div className="orderGroupViewTotalLine">
              <strong>Razem brutto</strong>
              <strong>{formatPrice(summary?.totalGross)}</strong>
            </div>
            <div className="orderGroupViewOrdersList">
              {orders.map((order) => (
                <div className="orderGroupViewOrderRow" key={`summary-${order.id}`}>
                  <span>
                    {order?.seller?.companyName || `Seller #${order.sellerId}`} / #{order.id}
                  </span>
                  <strong>{formatPrice(order?.totalGross)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="orderGroupViewCard">
            <button
              type="button"
              className="orderGroupViewBackButton"
              onClick={() => navigate("/zamowienia")}
            >
              Wstecz do listy
            </button>
          </section>
        </aside>
      </div>
    </section>
  );
};

const OrderGroupView = ({ orderGroupId }) => (
  <FetchWrapper
    name="ClientOrderGroupView"
    component={OrderGroupContent}
    connector={() => OrdersService.getOrderGroupById(orderGroupId)}
    syncSearchParams={false}
  />
);

export default OrderGroupView;
