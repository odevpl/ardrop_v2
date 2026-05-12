import { useMemo } from "react";
import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { useNavigate, useParams } from "react-router-dom";
import { getFormMessages } from "services/forms";
import { getFormMessagesTableConfig } from "./table.config";

const FormMessages = ({ payload, filters, setFilters, formName }) => {
  const navigate = useNavigate();
  const rows = useMemo(() => payload?.data || [], [payload?.data]);
  const pagination = payload?.meta?.pagination;
  const tableConfig = useMemo(
    () => getFormMessagesTableConfig({ formName, rows }),
    [formName, rows],
  );

  const handleRowClick = (row, { openInNewTab }) => {
    const path = `/forms/${formName}/${row.id}`;
    if (openInNewTab) {
      window.open(path, "_blank");
    } else {
      navigate(path);
    }
  };

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Formularz: {formName}</h2>
      </div>

      <Table
        config={tableConfig}
        data={rows}
        pagination={pagination}
        onRowClick={handleRowClick}
        onPageChange={(page) => setFilters({ ...filters, page })}
        onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
      />
    </section>
  );
};

const FormMessagesPage = () => {
  const { formName } = useParams();

  return (
    <FetchWrapper
      component={FormMessages}
      name="Wiadomosci formularza"
      connector={(filters) => getFormMessages({ formName, ...filters })}
      filters={{ page: 1, limit: 20 }}
      formName={formName}
    />
  );
};

export default FormMessagesPage;
