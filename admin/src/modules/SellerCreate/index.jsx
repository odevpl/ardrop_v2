import Checkbox from "components/FormikWrapper/FormControls/Checkbox";
import Input from "components/FormikWrapper/FormControls/Input";
import FormikWrapper from "components/FormikWrapper";
import { useNotification } from "components/GlobalNotification/index.js";
import { useNavigate } from "react-router-dom";
import { createSeller } from "services/sellers";

const initialValues = {
  email: "",
  password: "",
  companyName: "",
  phone: "",
  nip: "",
  address: "",
  city: "",
  postalCode: "",
  isActive: true,
};

const SellerCreate = () => {
  const navigate = useNavigate();
  const notification = useNotification();

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>Dodaj sprzedawce</h2>
      </div>

      <FormikWrapper
        className="adminProductForm"
        initialValues={initialValues}
        onSubmit={async (values, { setSubmitting }) => {
          const payload = {
            email: values.email?.trim(),
            password: values.password || "",
            companyName: values.companyName?.trim(),
            phone: values.phone?.trim() || null,
            nip: values.nip?.trim() || null,
            address: values.address?.trim() || null,
            city: values.city?.trim() || null,
            postalCode: values.postalCode?.trim() || null,
            isActive: Boolean(values.isActive),
          };

          const result = await createSeller(payload);
          if (result?.status && result.status >= 400) {
            notification.error(result?.data?.error || "Nie udalo sie utworzyc sprzedawcy");
            setSubmitting(false);
            return;
          }

          notification.success("Sprzedawca zostal utworzony");
          const sellerId = result?.seller?.id;
          setSubmitting(false);
          if (sellerId) {
            navigate(`/sellers/${sellerId}`);
            return;
          }
          navigate("/sellers");
        }}
      >
        {({ isSubmitting }) => (
          <>
            <div className="adminFormGrid">
              <Input id="email" placeholder="Email" type="email" autoComplete="email" />
              <Input
                id="password"
                placeholder="Haslo"
                type="password"
                autoComplete="new-password"
              />
              <Input id="companyName" placeholder="Firma" />
              <Input id="phone" placeholder="Telefon" />
              <Input id="nip" placeholder="NIP" />
              <Input id="city" placeholder="Miasto" />
              <Input id="address" placeholder="Adres" />
              <Input id="postalCode" placeholder="Kod pocztowy" />
            </div>
            <Checkbox id="isActive" placeholder="Aktywny" />

            <div className="adminActions adminFormActions">
              <button type="submit" className="adminPrimaryButton" disabled={isSubmitting}>
                Zapisz
              </button>
              <button type="button" onClick={() => navigate("/sellers")} disabled={isSubmitting}>
                Wroc do listy
              </button>
            </div>
          </>
        )}
      </FormikWrapper>
    </section>
  );
};

export default SellerCreate;

