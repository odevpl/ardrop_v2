import FetchWrapper from 'components/FetchWrapper'
import FormikWrapper from 'components/FormikWrapper'
import { useNavigate } from 'react-router-dom'
import OrdersService from 'services/orders'
import './OrderView.scss'

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const resolveThumbUrl = (item) => {
  const images = Array.isArray(item?.productSnapshot?.images) ? item.productSnapshot.images : []
  const main = images.find((image) => Number(image?.isMain) === 1) || images[0]
  if (!main?.fileName) return ''
  return `${apiBaseUrl}/uploads/images/thumbs/${main.fileName.replace(/\.[^.]+$/, '.jpg')}`
}

const OrderViewContent = ({ payload }) => {
  const navigate = useNavigate()
  const order = payload?.data || payload?.order || payload || {}
  const items = Array.isArray(order?.items) ? order.items : []
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
                <span>{order?.createdAt || '-'}</span>
              </div>
            </div>

            <div className="orderViewCard">
              <h2>Adres</h2>
              <p className="orderViewMuted">
                W payloadzie zamowienia brak dedykowanych pol adresowych.
              </p>
              <div className="orderViewInfoGrid">
                <span>ID klienta</span>
                <span>{order?.clientId || '-'}</span>
                <span>ID sprzedawcy</span>
                <span>{order?.sellerId || '-'}</span>
              </div>
            </div>

            <div className="orderViewCard">
              <h2>Pozycje</h2>
              {items.length === 0 ? (
                <p className="orderViewMuted">Brak pozycji.</p>
              ) : (
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
                                <p className="orderItemProductName">
                                  {item?.productSnapshot?.name || `Produkt #${item.productId}`}
                                </p>
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
              )}
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
              <strong>{formatPrice(order?.totalGross)}</strong>
            </div>
            <div className="orderViewSummaryRow">
              <span>Razem netto</span>
              <strong>{formatPrice(order?.totalNet)}</strong>
            </div>
          </section>

          <section className="orderViewSummaryCard">
            <button type="button" className="orderViewBackButton" onClick={() => navigate('/zamowienia')}>
              Wstecz do listy
            </button>
          </section>
        </aside>
      </div>
    </section>
  )
}

const OrderView = ({ id }) => (
  <FetchWrapper
    name="ClientOrderView"
    component={OrderViewContent}
    connector={() => OrdersService.getOrderById(id)}
  />
)

export default OrderView
