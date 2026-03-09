import FormikWrapper from 'components/FormikWrapper'
import { useNotification } from 'components/GlobalNotification/index.js'
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

const OrderView = ({ payload }) => {
  const navigate = useNavigate()
  const notification = useNotification()
  const order = payload?.data || payload?.order || payload || {}
  const items = Array.isArray(order?.items) ? order.items : []
  const orderTotalFromItems = items.reduce(
    (sum, item) => sum + Number(item.grossPrice || 0) * Number(item.quantity || 0),
    0,
  )

  const initialValues = {
    status: order?.status || 'new',
    paymentStatus: order?.paymentStatus || 'pending',
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    const response = await OrdersService.updateOrder({
      id: order.id,
      payload: values,
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie zapisac zmian')
      setSubmitting(false)
      return
    }

    notification.success('Zamowienie zostalo zaktualizowane')
    navigate('/orders')
  }

  const handleDelete = async () => {
    const response = await OrdersService.deleteOrder(order.id)
    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie usunac zamowienia')
      return
    }
    notification.success('Zamowienie zostalo usuniete')
    navigate('/orders')
  }

  return (
    <section className="orderViewModule">
      <header className="orderViewHeader">
        <h1>Zamowienie #{order?.id || '-'}</h1>
      </header>

      <FormikWrapper initialValues={initialValues} onSubmit={handleSubmit}>
        {({ values, setFieldValue }) => (
          <div className="orderViewLayout">
            <div className="orderViewMainColumn">
              <div className="orderViewCard">
                <h2>Dane zamowienia</h2>
                <div className="orderViewInfoGrid">
                  <span>Numer zamowienia</span>
                  <span>#{order?.id || '-'}</span>
                  <span>ID grupy</span>
                  <span>{order?.orderGroupId || '-'}</span>
                  <span>ID klienta</span>
                  <span>{order?.clientId || '-'}</span>
                  <span>ID sprzedawcy</span>
                  <span>{order?.sellerId || '-'}</span>
                  <span>Data utworzenia</span>
                  <span>{order?.createdAt || '-'}</span>
                </div>
              </div>

              <div className="orderViewCard">
                <h2>Edycja statusu</h2>
                <div className="orderViewControls">
                  <label htmlFor="adminOrderStatus">Status</label>
                  <select
                    id="adminOrderStatus"
                    value={values.status}
                    onChange={(event) => setFieldValue('status', event.target.value)}
                  >
                    <option value="new">new</option>
                    <option value="processing">processing</option>
                    <option value="shipped">shipped</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>

                  <label htmlFor="adminOrderPaymentStatus">Status platnosci</label>
                  <select
                    id="adminOrderPaymentStatus"
                    value={values.paymentStatus}
                    onChange={(event) => setFieldValue('paymentStatus', event.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="failed">failed</option>
                  </select>
                </div>
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
              </div>
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
                <div className="orderViewActions">
                  <button type="submit" className="orderViewPrimaryButton">Zapisz</button>
                  <button type="button" className="orderViewGhostButton" onClick={() => navigate('/orders')}>
                    Anuluj
                  </button>
                  <button type="button" className="orderViewDangerButton" onClick={handleDelete}>
                    Usun
                  </button>
                </div>
              </section>
            </aside>
          </div>
        )}
      </FormikWrapper>
    </section>
  )
}

export default OrderView

