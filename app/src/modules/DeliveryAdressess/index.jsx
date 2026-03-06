import { useState } from "react";
import FetchWrapper from "components/FetchWrapper";
import Popup from "components/Popup";
import DeliveryAdressessService from "services/deliveryAdressess";
import "./DeliveryAdressess.scss";

const EMPTY_ADDRESS = {
  label: "",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  countryCode: "PL",
  isDefault: false,
};

const mapAddressToForm = (address) => ({
  label: address?.label || "",
  recipientName: address?.recipientName || "",
  phone: address?.phone || "",
  addressLine1: address?.addressLine1 || "",
  addressLine2: address?.addressLine2 || "",
  city: address?.city || "",
  postalCode: address?.postalCode || "",
  countryCode: address?.countryCode || "PL",
  isDefault: Boolean(address?.isDefault),
});

const DeliveryAddressPopupForm = ({ mode = "create", addressId = null, initialAddress, onSaved, onClose }) => {
  const [values, setValues] = useState(() => mapAddressToForm(initialAddress));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleInput = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = {
      ...values,
      countryCode: values.countryCode || "PL",
    };

    const isEditMode = mode === "edit" && addressId !== undefined && addressId !== null && String(addressId).trim() !== "";
    const response = isEditMode
      ? await DeliveryAdressessService.updateDeliveryAdressess(addressId, payload)
      : await DeliveryAdressessService.createDeliveryAdressess(payload);

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie zapisac adresu.");
      setIsSaving(false);
      return;
    }

    if (typeof onSaved === "function") {
      await onSaved(isEditMode ? "updated" : "created");
    }

    setIsSaving(false);
    onClose();
  };

  return (
    <form className="deliveriesAddressPopupForm" onSubmit={handleSubmit}>
      <h3>{mode === "edit" ? "Edytuj adres" : "Dodaj adres"}</h3>

      {error ? <p className="deliveriesError">{error}</p> : null}

      <div className="deliveriesAddressGrid">
        <label>
          Etykieta
          <input name="label" value={values.label} onChange={handleInput} placeholder="np. Biuro" />
        </label>
        <label>
          Odbiorca
          <input name="recipientName" value={values.recipientName} onChange={handleInput} placeholder="Imie i nazwisko odbiorcy" required />
        </label>
        <label>
          Telefon
          <input name="phone" value={values.phone} onChange={handleInput} placeholder="Telefon" />
        </label>
        <label>
          Ulica i numer
          <input name="addressLine1" value={values.addressLine1} onChange={handleInput} placeholder="Ulica i numer" required />
        </label>
        <label>
          Dodatkowe informacje
          <input name="addressLine2" value={values.addressLine2} onChange={handleInput} placeholder="Mieszkanie, pietro, itp." />
        </label>
        <label>
          Miasto
          <input name="city" value={values.city} onChange={handleInput} placeholder="Miasto" required />
        </label>
        <label>
          Kod pocztowy
          <input name="postalCode" value={values.postalCode} onChange={handleInput} placeholder="Kod pocztowy" required />
        </label>
        <label>
          Kraj
          <input name="countryCode" value={values.countryCode} onChange={handleInput} placeholder="PL" maxLength={2} />
        </label>
      </div>

      <label className="deliveriesDefaultCheck">
        <input type="checkbox" name="isDefault" checked={values.isDefault} onChange={handleInput} />
        <span>Ustaw jako domyslny</span>
      </label>

      <div className="deliveriesActions">
        <button type="button" className="deliveriesCancelButton" onClick={onClose}>
          Anuluj
        </button>
        <button type="submit" className="deliveriesSaveButton" disabled={isSaving}>
          {isSaving ? "Zapisywanie..." : "Zapisz adres"}
        </button>
      </div>
    </form>
  );
};

const DeliveryAdressessView = ({ payload, refetch }) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const addresses = Array.isArray(payload?.data || payload?.addresses)
    ? (payload?.data || payload?.addresses)
    : [];

  const handleAddressSaved = async (mode) => {
    await refetch();
    setError("");
    setMessage(mode === "updated" ? "Adres zostal zaktualizowany." : "Adres zostal dodany.");
  };

  const handleDeleteAddress = async (id) => {
    if (id === undefined || id === null || String(id).trim() === "") {
      setError("Nieprawidlowy identyfikator adresu.");
      return;
    }

    setError("");
    setMessage("");
    const response = await DeliveryAdressessService.deleteDeliveryAdressess(id);
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie usunac adresu.");
      return;
    }

    await refetch();
    setMessage("Adres zostal usuniety.");
  };

  return (
    <section className="deliveriesModule">
      <header className="deliveriesHeader">
        <h1>Dostawy</h1>
        <p>Zarzadzaj adresami dostawy i glownym adresem dla zamowien.</p>
      </header>

      {error ? <p className="deliveriesError">{error}</p> : null}
      {message ? <p className="deliveriesSuccess">{message}</p> : null}

      <section className="deliveriesListSection">
        <div className="deliveriesListHeader">
          <h2>Lista adresow dostawy</h2>
          <Popup
            openButtonText="Dodaj nowy adres"
            buttonProps={{ className: "deliveriesSaveButton", type: "button" }}
            component={DeliveryAddressPopupForm}
            componentProps={{
              mode: "create",
              addressId: null,
              initialAddress: EMPTY_ADDRESS,
              onSaved: handleAddressSaved,
            }}
            isAutoForget
          />
        </div>

        <div className="deliveriesList">
          {addresses.length === 0 ? <p>Brak zapisanych adresow dostawy.</p> : null}
          {addresses.map((address) => (
            <article key={address.id} className="deliveriesCard">
              <div>
                <strong>
                  {address.label || "Adres dostawy"}
                  {address.isDefault ? " (domyslny)" : ""}
                </strong>
                <p>{address.recipientName}</p>
                <p>{address.phone}</p>
                <p>{address.addressLine1}</p>
                {address.addressLine2 ? <p>{address.addressLine2}</p> : null}
                <p>
                  {address.postalCode} {address.city}, {address.countryCode}
                </p>
              </div>

              <div className="deliveriesCardActions">
                <Popup
                  openButtonText="Edytuj"
                  buttonProps={{ className: "deliveriesMiniButton", type: "button" }}
                  component={DeliveryAddressPopupForm}
                  componentProps={{
                    mode: "edit",
                    addressId: address.id,
                    initialAddress: address,
                    onSaved: handleAddressSaved,
                  }}
                  isAutoForget
                />
                <button
                  type="button"
                  className="deliveriesMiniButton deliveriesMiniButtonDanger"
                  onClick={() => handleDeleteAddress(address.id)}
                >
                  Usun
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

const DeliveryAdressess = () => (
  <FetchWrapper
    name="DeliveryAdressess"
    component={DeliveryAdressessView}
    connector={DeliveryAdressessService.getDeliveryAdressess}
  />
);

export default DeliveryAdressess;
