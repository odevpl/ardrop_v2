import FetchWrapper from 'components/FetchWrapper'
import OrderView from 'modules/OrderView'
import OrdersService from 'services/orders'
import { useParams } from 'react-router-dom'

const OrderDetailsPage = () => {
  const { id } = useParams()

  return (
    <FetchWrapper
      name="ClientOrderView"
      component={OrderView}
      connector={() => OrdersService.getOrderById(id)}
    />
  )
}

export default OrderDetailsPage
