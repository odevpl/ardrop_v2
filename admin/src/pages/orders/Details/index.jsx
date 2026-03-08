import FetchWrapper from 'components/FetchWrapper'
import OrderView from 'modules/OrderView'
import { useParams } from 'react-router-dom'
import OrdersService from 'services/orders'

const OrderDetailsPage = () => {
  const { id } = useParams()

  return (
    <FetchWrapper
      component={OrderView}
      name="AdminOrderView"
      connector={() => OrdersService.getOrderById(id)}
    />
  )
}

export default OrderDetailsPage
