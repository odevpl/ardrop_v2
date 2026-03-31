import OrderGroupView from "modules/OrderGroupView";
import { useParams } from "react-router-dom";

const OrderGroupPage = () => {
  const { orderGroupId } = useParams();
  return <OrderGroupView orderGroupId={orderGroupId} />;
};

export default OrderGroupPage;
