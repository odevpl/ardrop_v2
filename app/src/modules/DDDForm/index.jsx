import { useState } from "react";
import { useFormikContext } from "formik";
import FormikWrapper from "components/FormikWrapper";
import Input from "components/FormikWrapper/FormControls/Input";
import Textarea from "components/FormikWrapper/FormControls/Textarea";
import DateInput from "components/FormikWrapper/FormControls/Date";
import DDDService from "services/ddd";
import { initialValues } from "./initialValues";
import { SERVICE_TYPES, validationSchema } from "./validation";
import "./DDDForm.scss";

const ServiceTypeSelect = () => {
  const formik = useFormikContext();

  return (
    <div className="select-input-wrapper">
      <label htmlFor="serviceType">Rodzaj uslugi *</label>
      <select
        id="serviceType"
        value={formik.values.serviceType || ""}
        onChange={(event) => formik.setFieldValue("serviceType", event.target.value)}
      >
        <option value="" disabled>
          Wybierz usluge
        </option>
        {Object.entries(SERVICE_TYPES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {formik.errors.serviceType ? (
        <span className="validation-error-description">{formik.errors.serviceType}</span>
      ) : null}
    </div>
  );
};

const DDDForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (values, formik) => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    const response = await DDDService.sendInquiry(values);
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie wyslac formularza.");
      setIsSubmitting(false);
      return;
    }

    formik.resetForm();
    setMessage("Zgloszenie zostalo wyslane. Skontaktujemy sie z Toba.");
    setIsSubmitting(false);
  };

  return (
    <section className="dddModule">
      <header className="dddHeader">
        <h1>Dezynfekcja / Dezynsekcja / Deratyzacja</h1>
        <p>Wypelnij zgloszenie uslugi. Przekazemy je do obslugi.</p>
      </header>

      {message ? <p className="dddSuccess">{message}</p> : null}
      {error ? <p className="dddError">{error}</p> : null}

      <FormikWrapper
        className="dddFormWrap"
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnChange={false}
        validateOnBlur={false}
        onSubmit={handleSubmit}
      >
        <div className="dddFormGrid">
          <ServiceTypeSelect />
          <Input id="contactName" placeholder="Imie i nazwisko *" />
          <Input id="companyName" placeholder="Nazwa firmy" />
          <Input id="phone" placeholder="Telefon *" />
          <Input id="email" placeholder="Email *" />
          <Input id="addressLine" placeholder="Ulica i numer *" />
          <Input id="postalCode" placeholder="Kod pocztowy *" />
          <Input id="city" placeholder="Miasto *" />
          <Input id="area" placeholder="Powierzchnia (m2) *" type="decimal" />
          <DateInput id="preferredDate" placeholder="Preferowany termin" />
          <Textarea id="problemDescription" placeholder="Opis problemu *" />
          <Textarea id="notes" placeholder="Uwagi" />
        </div>
        <div className="dddActions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Wysylanie..." : "Wyslij zgloszenie"}
          </button>
        </div>
      </FormikWrapper>
    </section>
  );
};

export default DDDForm;
