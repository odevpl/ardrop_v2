import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { getClients } from "../../services/clients";
import { getClientsTableConfig } from "./table.config";

const Clients = ({ payload }) => {
  return (
    <section className="adminPageSection">
      <Table config={getClientsTableConfig()} data={payload?.data ?? payload} />
    </section>
  );
};

const ClientsWrapper = () => {
  return (
    <FetchWrapper component={Clients} name="Klienci" connector={getClients} />
  );
};

export default ClientsWrapper;
