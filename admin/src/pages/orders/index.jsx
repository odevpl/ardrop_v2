import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import dayjs from "dayjs";
import { useOrderConfigMapper } from "../../mappers/useOrderConfigMapper";
import { getOrders } from "../../services/orders";
import { getOrdersTableConfig } from "./table.config";

const Orders = ({ payload }) => {
  const { mapOrderIdsToLabels } = useOrderConfigMapper();
  const withFormattedDate = (order) => {
    const parsedDate = dayjs(order?.created);

    return {
      ...order,
      created: parsedDate.isValid()
        ? parsedDate.format("DD-MM-YYYY")
        : order?.created,
    };
  };

  return (
    <section className="adminPageSection">
      <Table
        config={getOrdersTableConfig()}
        data={(payload?.data ?? payload)
          ?.map?.(mapOrderIdsToLabels)
          ?.map?.(withFormattedDate)}
      />
    </section>
  );
};

const OrdersWrapper = () => {
  return (
    <FetchWrapper component={Orders} name="Zamowienia" connector={getOrders} />
  );
};

export default OrdersWrapper;
