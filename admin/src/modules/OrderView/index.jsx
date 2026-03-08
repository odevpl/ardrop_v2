import FormikWrapper from 'components/FormikWrapper'
import { useNavigate } from 'react-router-dom'
import OrdersService from 'services/orders'

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`

const OrderView = ({ payload }) => {
  const navigate = useNavigate()
  const order = payload?.data || payload?.order || payload || {}
  const items = Array.isArray(order?.items) ? order.items : []

  const initialValues = {
    status: order?.status || 'new',
    paymentStatus: order?.paymentStatus || 'pending',
  }

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    const response = await OrdersService.updateOrder({
      id: order.id,
      payload: values,
    })

    if (response?.status && response.status >= 400) {
      setStatus(response?.data?.error || 'Nie udalo sie zapisac zmian')
      setSubmitting(false)
      return
    }

    navigate('/orders')
  }

  const handleDelete = async () => {
    const response = await OrdersService.deleteOrder(order.id)
    if (response?.status && response.status >= 400) {
      return
    }
    navigate('/orders')
  }

  return (
    <section className="adminPageSection">
      <FormikWrapper className="adminProductForm" initialValues={initialValues} onSubmit={handleSubmit}>
        {({ values, status, setFieldValue }) => (
          <div className="adminOrderView">
            <h2>Zamowienie #{order?.id || '-'}</h2>
            {status ? <p className="adminOrderError">{status}</p> : null}

            <div className="adminOrderMeta">
              <p>
                <strong>Klient:</strong> {order?.clientId || '-'}
              </p>
              <p>
                <strong>Sprzedawca:</strong> {order?.sellerId || '-'}
              </p>
              <p>
                <strong>Brutto:</strong> {formatPrice(order?.totalGross)}
              </p>
            </div>

            <div className="adminOrderControls">
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

              <label htmlFor="adminOrderPaymentStatus">Platnosc</label>
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

            <div className="adminOrderItems">
              {items.map((item) => (
                <div key={item.id} className="adminOrderItem">
                  <span>{item?.productSnapshot?.name || `Produkt #${item.productId}`}</span>
                  <span>
                    {item.quantity} x {formatPrice(item.grossPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="adminOrderFooter">
              <button type="submit">Zapisz</button>
              <button type="button" onClick={() => navigate('/orders')}>
                Anuluj
              </button>
              <button type="button" onClick={handleDelete}>
                Usun
              </button>
            </div>
          </div>
        )}
      </FormikWrapper>
    </section>
  )
}

export default OrderView
