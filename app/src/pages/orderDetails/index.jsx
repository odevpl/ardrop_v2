import OrderView from 'modules/OrderView'
import { useParams } from 'react-router-dom'

const OrderDetailsPage = () => {
  const { id } = useParams()
  return <OrderView id={id} />
}

export default OrderDetailsPage
