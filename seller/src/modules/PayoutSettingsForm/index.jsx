import Input from "components/FormikWrapper/FormControls/Input";
import FormikWrapper from "components/FormikWrapper";
import FetchWrapper from "components/FetchWrapper";
import { useNotification } from "components/GlobalNotification/useNotification";
import SellerSettingsService from "services/sellerSettings";
import { initialValues, normalizeBankAccount } from "./initialValues";
import { payoutSettingsValidationSchema } from "./validation";

const getSellerSettingsFromResponse = (response) => response?.data || response || {};

const PayoutSettingsFormView = ({ payload }) => {
  const notification = useNotification();
  const sellerSettings = getSellerSettingsFromResponse(payload);

  const handleSubmit = async (values, formikHelpers) => {
    const response = await SellerSettingsService.updateSellerSettings({
      payoutAccountHolder: String(values.payoutAccountHolder || "").trim() || null,
      payoutBankAccount: normalizeBankAccount(values.payoutBankAccount) || null,
      payoutBankName: String(values.payoutBankName || "").trim() || null,
    });

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie zapisac danych do przelewow");
      formikHelpers.setSubmitting(false);
      return;
    }

    const nextValues = initialValues(getSellerSettingsFromResponse(response));
    formikHelpers.resetForm({ values: nextValues });
    formikHelpers.setSubmitting(false);
    notification.success("Dane do przelewow zapisane");
  };

  return (
    <FormikWrapper
      initialValues={initialValues(sellerSettings)}
      onSubmit={handleSubmit}
      validationSchema={payoutSettingsValidationSchema}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({ isSubmitting }) => (
        <div className="sellerForm sellerCompactForm">
          <div className="sellerCompactFormGrid">
            <Input id="payoutAccountHolder" placeholder="Nazwa odbiorcy przelewu" />
            <Input id="payoutBankName" placeholder="Nazwa banku" />
            <Input id="payoutBankAccount" placeholder="Numer rachunku bankowego" />
          </div>
          <div className="sellerActions sellerFormActions">
            <button type="submit" className="sellerPrimaryButton" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz dane do przelewow"}
            </button>
          </div>
        </div>
      )}
    </FormikWrapper>
  );
};

const PayoutSettingsForm = () => (
  <FetchWrapper
    component={PayoutSettingsFormView}
    connector={SellerSettingsService.getSellerSettings}
  />
);

export default PayoutSettingsForm;
