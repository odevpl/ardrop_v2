import FetchWrapper from "components/FetchWrapper";
import Table from "components/Table";
import { useNavigate } from "react-router-dom";
import { getForms } from "services/forms";

const tableConfig = [
  { key: "formName", title: "Formularz" },
  { key: "count", title: "Liczba wiadomosci" },
  {
    key: "lastReceivedAt",
    title: "Ostatnia wiadomosc",
    onRender: (row) =>
      row.lastReceivedAt ? new Date(row.lastReceivedAt).toLocaleString("pl-PL") : "-",
  },
];

const Forms = ({ payload }) => {
  const navigate = useNavigate();
  const rows = payload?.data || [];

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Formularze</h2>
      </div>

      <Table
        config={tableConfig}
        data={rows}
        onRowClick={(row, options) => {
          const targetPath = `/forms/${row.formName}`;
          if (options?.openInNewTab) {
            window.open(targetPath, "_blank", "noopener,noreferrer");
            return;
          }
          navigate(targetPath);
        }}
      />
    </section>
  );
};

const FormsPage = () => (
  <FetchWrapper component={Forms} name="Formularze" connector={getForms} />
);

export default FormsPage;
