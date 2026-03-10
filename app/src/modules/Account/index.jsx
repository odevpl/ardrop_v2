import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import FormikWrapper from "components/FormikWrapper";
import Input from "components/FormikWrapper/FormControls/Input";
import { useNotification } from "components/GlobalNotification/index.js";
import AccountService from "services/account";
import "./Account.scss";

const EMPTY_FORM = {
  email: "",
  name: "",
  phone: "",
  companyName: "",
  nip: "",
  address: "",
  city: "",
  postalCode: "",
};

const Account = () => {
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const notification = useNotification();

  const loadAccount = async () => {
    setIsLoading(true);
    setError("");

    const response = await AccountService.getMyAccount();
    if (response?.status && response.status >= 400) {
      const text = response?.data?.error || "Nie udalo sie pobrac danych konta.";
      setError(text);
      notification.error(text);
      setIsLoading(false);
      return;
    }

    const profile = response?.data || response?.profile || {};
    const user = profile?.user || {};
    const client = profile?.client || {};

    setFormValues({
      email: user.email || "",
      name: client.name || "",
      phone: client.phone || "",
      companyName: client.companyName || "",
      nip: client.nip || "",
      address: client.address || "",
      city: client.city || "",
      postalCode: client.postalCode || "",
    });

    setIsLoading(false);
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const initialValues = useMemo(() => formValues, [formValues]);

  const handleSubmit = async (values) => {
    setIsSaving(true);
    setMessage("");
    setError("");

    const response = await AccountService.updateMyAccount(values);
    if (response?.status && response.status >= 400) {
      const text = response?.data?.error || "Nie udalo sie zapisac zmian.";
      setError(text);
      notification.error(text);
      setIsSaving(false);
      return;
    }

    const profile = response?.data || response?.profile || {};
    const user = profile?.user || {};
    const client = profile?.client || {};
    setFormValues({
      email: user.email || "",
      name: client.name || "",
      phone: client.phone || "",
      companyName: client.companyName || "",
      nip: client.nip || "",
      address: client.address || "",
      city: client.city || "",
      postalCode: client.postalCode || "",
    });
    setMessage("Dane konta zostaly zaktualizowane.");
    notification.success("Dane konta zostaly zaktualizowane.");
    window.dispatchEvent(new Event("client-profile:updated"));
    setIsSaving(false);
  };

  if (isLoading) {
    return <section className="accountModule">Ladowanie danych konta...</section>;
  }

  return (
    <section className="accountModule">
      <header className="accountHeader">
        <h1>Konto</h1>
        <p>Zarzadzaj danymi swojego konta klienta.</p>
        <NavLink to="/adresy-dostawy" className="accountLinkButton">
          Przejdz do danych dostawy
        </NavLink>
      </header>

      {error ? <p className="accountError">{error}</p> : null}
      {message ? <p className="accountSuccess">{message}</p> : null}

      <FormikWrapper
        className="accountFormWrap"
        initialValues={initialValues}
        onSubmit={handleSubmit}
      >
        <div className="accountFormGrid">
          <Input id="email" type="email" placeholder="Email" />
          <Input id="name" placeholder="Imie i nazwisko" />
          <Input id="phone" placeholder="Telefon" />
          <Input id="companyName" placeholder="Nazwa firmy" />
          <Input id="nip" placeholder="NIP" />
          <Input id="address" placeholder="Adres" />
          <Input id="city" placeholder="Miasto" />
          <Input id="postalCode" placeholder="Kod pocztowy" />
        </div>

        <div className="accountActions">
          <button type="submit" className="accountSaveButton" disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
          </button>
        </div>
      </FormikWrapper>
    </section>
  );
};

export default Account;

