import DetailsList from 'components/DetailsList'
import { formatEta, formatPrice } from './OrderView.utils'

const CustomerDeliverySection = ({ order }) => {
  const items = [
    { key: 'shippingMethodName', label: 'Metoda dostawy', value: order?.shippingMethodName || 'Do ustalenia' },
    {
      key: 'estimatedDelivery',
      label: 'Przyblizony termin',
      value: formatEta(order?.estimatedDeliveryFrom, order?.estimatedDeliveryTo),
    },
    { key: 'totalShipping', label: 'Koszt dostawy', value: formatPrice(order?.totalShipping) },
  ]

  return (
    <>
      <DetailsList title="Dostawa klienta" items={items} />
      {order?.clientNote ? (
        <div className="orderViewCard">
          <div className="orderViewNoteBox">
            <p className="orderViewNoteTitle">Notatka klienta</p>
            <p className="orderViewNoteText">{order.clientNote}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default CustomerDeliverySection
