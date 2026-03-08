import FormikWrapper from 'components/FormikWrapper'
import { useNavigate } from 'react-router-dom'
import './OrderView.scss'

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`

const OrderView = ({ payload }) => {
  const navigate = useNavigate()
  const order = payload?.data || payload?.order || payload || {}
  const items = Array.isArray(order?.items) ? order.items : []

  return (
    <section className="clientOrderView">
      <header className="clientOrderViewHeader">
        <h1>Podsumowanie zamowienia #{order?.id || '-'}</h1>
      </header>

      <FormikWrapper initialValues={{}} onSubmit={() => {}}>
        <div className="clientOrderCard">
          <div className="clientOrderMeta">
            <p>
              <strong>Status:</strong> {order?.status || '-'}
            </p>
            <p>
              <strong>Platnosc:</strong> {order?.paymentStatus || '-'}
            </p>
          </div>

          <div className="clientOrderItems">
            {items.map((item) => (
              <article key={item.id} className="clientOrderItemRow">
                <div>
                  <p className="clientOrderItemName">
                    {item?.productSnapshot?.name || `Produkt #${item.productId}`}
                  </p>
                  <p className="clientOrderItemSub">Ilosc: {item.quantity}</p>
                </div>
                <div className="clientOrderItemPrice">{formatPrice(item.grossPrice * item.quantity)}</div>
              </article>
            ))}
          </div>

          <div className="clientOrderTotal">
            <strong>Razem:</strong>
            <strong>{formatPrice(order?.totalGross)}</strong>
          </div>

          <div className="clientOrderActions">
            <button type="button" onClick={() => navigate('/dostawy')}>
              Wstecz
            </button>
          </div>
        </div>
      </FormikWrapper>
    </section>
  )
}

export default OrderView
