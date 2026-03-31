import Checkbox from "components/FormikWrapper/FormControls/Checkbox";
import Input from "components/FormikWrapper/FormControls/Input";
import FormikWrapper from "components/FormikWrapper";
import FetchWrapper from "components/FetchWrapper";
import { useNotification } from "components/GlobalNotification/useNotification";
import { useNavigate } from "react-router-dom";
import ShippingMethodsService from "services/shippingMethods";
import { initialValues } from "./initialValues";
import { shippingValidationSchema } from "./validation";

const getShippingMethodFromResponse = (response) => response.data;

const ShippingEditFormView = ({ payload, id = "new" }) => {
  const notification = useNotification();
  const navigate = useNavigate();
  const isNew = id === "new";
  const shippingMethod = getShippingMethodFromResponse(payload);

  const handleSubmit = async (values, formikHelpers) => {
    const response = isNew
      ? await ShippingMethodsService.createShippingMethod(values)
      : await ShippingMethodsService.updateShippingMethod({
          id,
          payload: values,
        });

    if (response?.status && response.status >= 400) {
      notification.error(
        response?.data?.error || "Nie udalo sie zapisac ustawien dostawy",
      );
      formikHelpers.setSubmitting(false);
      return;
    }

    const savedShippingMethod = getShippingMethodFromResponse(response);
    const nextValues = initialValues(savedShippingMethod);
    formikHelpers.resetForm({ values: nextValues });
    formikHelpers.setSubmitting(false);
    notification.success("Ustawienia dostawy zapisane");

    if (isNew) {
      navigate(`/shipping/${savedShippingMethod.id}`, {
        replace: true,
      });
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      navigate("/shipping");
      return;
    }

    const response = await ShippingMethodsService.deleteShippingMethod(id);

    if (response?.status && response.status >= 400) {
      notification.error(
        response?.data?.error || "Nie udalo sie usunac metody dostawy",
      );
      return;
    }

    notification.success("Metoda dostawy usunieta");
    navigate("/shipping");
  };

  return (
    <FormikWrapper
      initialValues={initialValues(shippingMethod)}
      onSubmit={handleSubmit}
      validationSchema={shippingValidationSchema}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {({ isSubmitting }) => (
        <div className="sellerSettingsForm sellerForm">
          <section className="sellerFormSection">
            <div className="sellerCheckboxRow">
              <Checkbox id="isActive" placeholder="Aktywna" size="md" />
            </div>

            <div className="form-container">
              <Input id="name" placeholder="Nazwa metody" />
              <Input
                id="priceNet"
                placeholder="Cena netto"
                type="number"
                step="0.01"
                min="0"
                size="sm"
              />
              <Input
                id="priceGross"
                placeholder="Cena brutto"
                type="number"
                step="0.01"
                min="0"
                size="sm"
              />
              <Input
                id="freeShippingAmountGross"
                placeholder="Próg darmowej dostawy"
                type="number"
                step="0.01"
                min="0"
                size="sm"
              />
              {/*
              <Input
                id="freeShippingQuantity"
                placeholder="Darmowa dostawa od liczby sztuk"
                type="number"
                min="0"
              />
              <Input
                id="freeShippingWeight"
                placeholder="Darmowa dostawa od wagi"
                type="number"
                step="0.01"
                min="0"
              />
              */}
              <Input
                id="etaMinDays"
                placeholder="Min. czas dostawy - dni"
                type="number"
                min="0"
                size="sm"
              />
              <Input
                id="etaMaxDays"
                placeholder="Maks. czas dostawy - dni"
                type="number"
                min="0"
                size="sm"
              />
              {/*
              <Input
                id="regions"
                placeholder="Regiony, np. mazowieckie, slaskie"
              />
              */}
            </div>
          </section>

          <div className="sellerActions sellerFormActions">
            <button
              type="submit"
              className="sellerPrimaryButton"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Zapisywanie..." : "Zapisz ustawienia"}
            </button>
            {!isNew && (
              <button
                type="button"
                className="sellerDangerButton"
                onClick={handleDelete}
              >
                Usun metode dostawy
              </button>
            )}
          </div>
        </div>
      )}
    </FormikWrapper>
  );
};

const ShippingEditForm = ({ id = "new" }) => (
  <FetchWrapper
    component={ShippingEditFormView}
    id={id}
    connector={() => ShippingMethodsService.getShippingMethodById(id)}
  />
);

export default ShippingEditForm;
