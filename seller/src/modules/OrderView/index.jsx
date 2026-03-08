import FormikWrapper from 'components/FormikWrapper'
import { useNavigate } from 'react-router-dom'

const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`

const OrderView = ({ payload }) => {
  const navigate = useNavigate()
  const order = payload?.data || payload?.order || payload || {}
  const items = Array.isArray(order?.items) ? order.items : []

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Zamowienie #{order?.id || '-'}</h2>
      </div>

      <FormikWrapper className="sellerProductForm" initialValues={{}} onSubmit={() => {}}>
        <div className="sellerPanel">
          <p>
            <strong>Status:</strong> {order?.status || '-'}
          </p>
          <p>
            <strong>Platnosc:</strong> {order?.paymentStatus || '-'}
          </p>
          <p>
            <strong>Wartosc:</strong> {formatPrice(order?.sellerScope?.totalGross ?? order?.totalGross)}
          </p>

          <div className="sellerOrderItems">
            {items.map((item) => (
              <div key={item.id} className="sellerOrderItem">
                <span>{item?.productSnapshot?.name || `Produkt #${item.productId}`}</span>
                <span>
                  {item.quantity} x {formatPrice(item.grossPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="sellerFormFooter">
            <button type="button" onClick={() => navigate(-1)}>
              Wstecz
            </button>
          </div>
        </div>
      </FormikWrapper>
    </section>
  )
}

export default OrderView
