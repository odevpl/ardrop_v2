import { useEffect, useState } from "react";
import GlobalDiscountsService from "services/globalDiscounts";

const DEFAULT_FORM = {
  name: "Rabat na otwarcie Ardrop",
  discountPercent: "20",
  isActive: true,
  startsAt: "",
  endsAt: "",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pl-PL");
};

const DiscountsPage = () => {
  const [discounts, setDiscounts] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDiscounts = async () => {
    setIsLoading(true);
    const response = await GlobalDiscountsService.getGlobalDiscounts();
    setIsLoading(false);

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie pobrac rabatow.");
      return;
    }

    setDiscounts(Array.isArray(response?.data) ? response.data : []);
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name,
      discountPercent: Number(form.discountPercent),
      isActive: Boolean(form.isActive),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    };

    const response = await GlobalDiscountsService.createGlobalDiscount(payload);
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie zapisac rabatu.");
      return;
    }

    setForm(DEFAULT_FORM);
    await fetchDiscounts();
  };

  const toggleDiscount = async (discount) => {
    setError("");
    const response = await GlobalDiscountsService.updateGlobalDiscount({
      id: discount.id,
      payload: { isActive: !discount.isActive },
    });

    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie zmienic statusu rabatu.");
      return;
    }

    await fetchDiscounts();
  };

  const deleteDiscount = async (discount) => {
    const confirmed = window.confirm(`Usunac rabat "${discount.name}"?`);
    if (!confirmed) return;

    setError("");
    const response = await GlobalDiscountsService.deleteGlobalDiscount(discount.id);
    if (response?.status && response.status >= 400) {
      setError(response?.data?.error || "Nie udalo sie usunac rabatu.");
      return;
    }

    await fetchDiscounts();
  };

  return (
    <section className="adminPageSection adminDiscounts">
      <div className="adminToolbar">
        <h2>Rabaty</h2>
      </div>

      {error ? <p className="adminFormError">{error}</p> : null}
      {isLoading ? <p>Ladowanie...</p> : null}

      <form className="adminDiscountForm" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nazwa rabatu"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          type="number"
          min="0.01"
          max="99.99"
          step="0.01"
          placeholder="Rabat (%)"
          value={form.discountPercent}
          onChange={(event) => setForm({ ...form, discountPercent: event.target.value })}
          required
        />
        <label>
          Start
          <input
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
          />
        </label>
        <label>
          Koniec
          <input
            type="datetime-local"
            value={form.endsAt}
            onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
          />
        </label>
        <label className="adminDiscountCheckbox">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Aktywny
        </label>
        <button type="submit" className="adminPrimaryButton">
          Dodaj rabat
        </button>
      </form>

      <div className="adminDiscountList">
        {discounts.map((discount) => (
          <article className="adminDiscountRow" key={discount.id}>
            <div>
              <strong>{discount.name}</strong>
              <p>
                {Number(discount.discountPercent).toFixed(2)}% /{" "}
                {discount.isActive ? "aktywny" : "nieaktywny"}
              </p>
              <p>
                {formatDateTime(discount.startsAt)} - {formatDateTime(discount.endsAt)}
              </p>
            </div>
            <div className="adminActions">
              <button type="button" onClick={() => toggleDiscount(discount)}>
                {discount.isActive ? "Dezaktywuj" : "Aktywuj"}
              </button>
              <button
                type="button"
                className="adminDangerButton"
                onClick={() => deleteDiscount(discount)}
              >
                Usun
              </button>
            </div>
          </article>
        ))}
        {discounts.length === 0 && !isLoading ? <p>Brak rabatow.</p> : null}
      </div>
    </section>
  );
};

export default DiscountsPage;
