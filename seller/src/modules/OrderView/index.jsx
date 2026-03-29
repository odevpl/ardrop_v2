import { useNotification } from 'components/GlobalNotification'
import { useNavigate } from 'react-router-dom'
import OrdersService from 'services/orders'
import CustomerDeliverySection from './components/CustomerDeliverySection'
import DeliveryAddressSection from './components/DeliveryAddressSection'
import OrderDetailsSection from './components/OrderDetailsSection'
import OrderItemsSection from './components/OrderItemsSection'
import { formatPrice } from './components/OrderView.utils'
import './OrderView.scss'

const OrderView = ({ payload }) => {
  const navigate = useNavigate()
  const notification = useNotification()
  const order = payload?.data || payload?.order || payload || {}
  const items = Array.isArray(order?.items) ? order.items : []
  const address = order?.deliveryAddressSnapshot || null
  const orderTotalFromItems = items.reduce(
    (sum, item) => sum + Number(item.grossPrice || 0) * Number(item.quantity || 0),
    0,
  )

  const handleStatusSubmit = async (values, { setSubmitting }, onClose) => {
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
    if (typeof onClose === 'function') {
      onClose()
    }
    window.location.reload()
  }

  return (
    <section className="orderViewModule">
      <header className="orderViewHeader">
        <h1>Zamowienie #{order?.id || '-'}</h1>
      </header>

      <div className="orderViewLayout">
        <div className="orderViewMainColumn">
          <OrderDetailsSection order={order} onStatusSubmit={handleStatusSubmit} />
          <CustomerDeliverySection order={order} />
          <DeliveryAddressSection address={address} />
          <OrderItemsSection items={items} />
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
            <button type="button" className="orderViewGhostButton" onClick={() => navigate(-1)}>
              Wstecz
            </button>
          </section>
        </aside>
      </div>
    </section>
  )
}

export default OrderView
