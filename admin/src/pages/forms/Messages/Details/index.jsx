import { useNavigate, useParams } from "react-router-dom";
import FetchWrapper from "components/FetchWrapper";
import { getFormMessage } from "services/forms";

const FIELD_LABELS = {
  ddd: {
    serviceType: "Rodzaj usługi",
    contactName: "Imię i nazwisko",
    companyName: "Nazwa firmy",
    phone: "Telefon",
    email: "Email",
    addressLine: "Adres",
    postalCode: "Kod pocztowy",
    city: "Miasto",
    area: "Powierzchnia (m²)",
    problemDescription: "Opis problemu",
    preferredDate: "Preferowany termin",
    notes: "Uwagi",
  },
};

const getLabel = (formName, key) => FIELD_LABELS[formName]?.[key] ?? key;

const FormMessageDetails = ({ payload, formName }) => {
  const navigate = useNavigate();
  const row = payload?.data;

  if (!row) return <p>Brak danych.</p>;

  const fields = Object.entries(row.dataJson || {});
  const date = row.createdAt
    ? new Date(row.createdAt).toLocaleString("pl-PL")
    : "-";

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Wiadomość #{row.id}</h2>
        <div className="adminActions">
          <button
            type="button"
            onClick={() => navigate(`/forms/${formName}`)}
          >
            ← Wróć do listy
          </button>
        </div>
      </div>

      <div className="tableCard" style={{ padding: "0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #e5edf2" }}>
              <th style={thStyle}>Formularz</th>
              <td style={tdStyle}>{row.formName}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #e5edf2" }}>
              <th style={thStyle}>Data zgłoszenia</th>
              <td style={tdStyle}>{date}</td>
            </tr>
            {fields.map(([key, value]) => (
              <tr key={key} style={{ borderBottom: "1px solid #e5edf2" }}>
                <th style={thStyle}>{getLabel(formName, key)}</th>
                <td style={tdStyle}>
                  {value !== null && value !== "" ? (
                    String(value)
                  ) : (
                    <span style={{ color: "#aaa" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  width: "220px",
  fontWeight: 600,
  color: "#374151",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const tdStyle = {
  padding: "12px 16px",
  color: "#111827",
  verticalAlign: "top",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const FormMessageDetailsPage = () => {
  const { formName, id } = useParams();

  return (
    <FetchWrapper
      component={FormMessageDetails}
      name="Szczegoly wiadomosci"
      connector={() => getFormMessage(formName, id)}
      formName={formName}
    />
  );
};

export default FormMessageDetailsPage;
