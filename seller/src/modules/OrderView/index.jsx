import FormikWrapper from 'components/FormikWrapper'
import { useNavigate } from 'react-router-dom'
import './OrderView.scss'

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const resolveThumbUrl = (item) => {
  const images = Array.isArray(item?.productSnapshot?.images) ? item.productSnapshot.images : []
  const main = images.find((image) => Number(image?.isMain) === 1) || images[0]
  if (!main?.fileName) return ''
  return `${apiBaseUrl}/uploads/images/thumbs/${main.fileName.replace(/\.[^.]+$/, '.jpg')}`
}

const formatDateTime = (rawDate) => {
  if (!rawDate) return '-'
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return rawDate
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

const formatEta = (from, to) => {
  if (from && to) return `${formatDateTime(from)} - ${formatDateTime(to)}`
  if (from) return formatDateTime(from)
  if (to) return formatDateTime(to)
  return 'Do ustalenia'
}

const OrderView = ({ payload }) => {
  const navigate = useNavigate()
  const order = payload?.data || payload?.order || payload || {}
  const items = Array.isArray(order?.items) ? order.items : []
  const address = order?.deliveryAddressSnapshot || null
  const orderTotalFromItems = items.reduce(
    (sum, item) => sum + Number(item.grossPrice || 0) * Number(item.quantity || 0),
    0,
  )

  return (
    <section className="orderViewModule">
      <header className="orderViewHeader">
        <h1>Zamowienie #{order?.id || '-'}</h1>
      </header>

      <div className="orderViewLayout">
        <div className="orderViewMainColumn">
          <FormikWrapper initialValues={{}} onSubmit={() => {}}>
            <div className="orderViewCard">
              <h2>Dane zamowienia</h2>
              <div className="orderViewInfoGrid">
                <span>Numer zamowienia</span>
                <span>#{order?.id || '-'}</span>
                <span>ID grupy</span>
                <span>{order?.orderGroupId || '-'}</span>
                <span>Status</span>
                <span>{order?.status || '-'}</span>
                <span>Status platnosci</span>
                <span>{order?.paymentStatus || '-'}</span>
                <span>Data utworzenia</span>
                <span>{formatDateTime(order?.createdAt)}</span>
              </div>
            </div>

            <div className="orderViewCard">
              <h2>Dostawa klienta</h2>
              <div className="orderViewInfoGrid">
                <span>Metoda dostawy</span>
                <span>{order?.shippingMethodName || 'Do ustalenia'}</span>
                <span>Przyblizony termin</span>
                <span>{formatEta(order?.estimatedDeliveryFrom, order?.estimatedDeliveryTo)}</span>
                <span>Koszt dostawy</span>
                <span>{formatPrice(order?.totalShipping)}</span>
              </div>
              {order?.clientNote ? (
                <div className="orderViewNoteBox">
                  <p className="orderViewNoteTitle">Notatka klienta</p>
                  <p className="orderViewNoteText">{order.clientNote}</p>
                </div>
              ) : null}
            </div>

            <div className="orderViewCard">
              <h2>Adres dostawy</h2>
              {address ? (
                <div className="orderViewAddressBox">
                  <p>
                    <strong>{address.recipientName || '-'}</strong>
                  </p>
                  {address.phone ? <p>{address.phone}</p> : null}
                  {address.label ? <p>{address.label}</p> : null}
                  <p>{address.addressLine1 || '-'}</p>
                  {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
                  <p>
                    {address.postalCode || '-'} {address.city || '-'}, {address.countryCode || 'PL'}
                  </p>
                </div>
              ) : (
                <p className="orderViewMuted">Brak snapshotu adresu dostawy w tym zamowieniu.</p>
              )}
            </div>

            <div className="orderViewCard">
              <h2>Pozycje</h2>
              <div className="orderItemsTableWrap">
                <table className="orderItemsTable">
                  <thead>
                    <tr>
                      <th>Produkt</th>
                      <th>Ilosc</th>
                      <th>Netto</th>
                      <th>Brutto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const thumbUrl = resolveThumbUrl(item)
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="orderItemProductCell">
                              <div className="orderItemThumbWrap">
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt={item?.productSnapshot?.name || 'Produkt'} />
                                ) : (
                                  <div className="orderItemThumbPlaceholder">Brak</div>
                                )}
                              </div>
                              <div>
                                <p className="orderItemProductName">
                                  {item?.productSnapshot?.name || `Produkt #${item.productId}`}
                                </p>
                                {item?.variantNameSnapshot ? (
                                  <p className="orderItemProductVariant">{item.variantNameSnapshot}</p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.netPrice * item.quantity)}</td>
                          <td>{formatPrice(item.grossPrice * item.quantity)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </FormikWrapper>
        </div>

        <aside className="orderViewSummaryColumn">
          <section className="orderViewSummaryCard">
            <h2>Podsumowanie finansowe</h2>
            <div className="orderViewSummaryRow">
              <span>Suma pozycji</span>
              <strong>{formatPrice(orderTotalFromItems)}</strong>
            </div>
            <div className="orderViewSummaryRow">
              <span>Dostawa</span>
              <strong>{formatPrice(order?.totalShipping)}</strong>
            </div>
            <div className="orderViewTotalLine">
              <strong>Razem brutto</strong>
              <strong>{formatPrice(order?.sellerScope?.totalGross ?? order?.totalGross)}</strong>
            </div>
            <div className="orderViewSummaryRow">
              <span>Razem netto</span>
              <strong>{formatPrice(order?.sellerScope?.totalNet ?? order?.totalNet)}</strong>
            </div>
          </section>

          <section className="orderViewSummaryCard">
            <button type="button" className="orderViewBackButton" onClick={() => navigate(-1)}>
              Wstecz
            </button>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OrderView
