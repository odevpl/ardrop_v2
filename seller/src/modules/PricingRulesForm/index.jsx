import { useEffect, useState } from "react";
import Input from "components/FormikWrapper/FormControls/Input";
import Select from "components/FormikWrapper/FormControls/Select";
import Textarea from "components/FormikWrapper/FormControls/Textarea";
import FormikWrapper from "components/FormikWrapper";
import { useNotification } from "components/GlobalNotification/useNotification";
import ProductsService from "services/products";
import SellerSettingsService from "services/sellerSettings";
import {
  initialValues,
  ROUNDING_OPTIONS,
  UNIT_OPTIONS,
} from "./initialValues";
import { validatePricingRulesForm } from "./validation";

const getPayload = (response) => response?.data || response || {};

const PricingRulesForm = () => {
  const notification = useNotification();
  const [formValues, setFormValues] = useState(initialValues());
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [settingsResponse, productsResponse] = await Promise.all([
        SellerSettingsService.getSellerSettings(),
        ProductsService.getProducts({
          page: 1,
          limit: 100,
          sortBy: "name",
          sortOrder: "asc",
        }),
      ]);

      if (settingsResponse?.status && settingsResponse.status >= 400) {
        notification.error(
          settingsResponse?.data?.error ||
            "Nie udalo sie pobrac ustawien cenowych",
        );
        setIsLoading(false);
        return;
      }

      if (productsResponse?.status && productsResponse.status >= 400) {
        notification.error(
          productsResponse?.data?.error || "Nie udalo sie pobrac listy produktow",
        );
        setIsLoading(false);
        return;
      }

      setFormValues(initialValues(getPayload(settingsResponse)));
      setProducts(
        Array.isArray(productsResponse?.data)
          ? productsResponse.data
          : productsResponse?.data?.data || [],
      );
      setIsLoading(false);
    };

    loadData();
  }, [notification]);

  const handleSubmit = async (values, formikHelpers) => {
    const response = await SellerSettingsService.updateSellerSettings({
      defaultMarkupPercent:
        values.defaultMarkupPercent === ""
          ? null
          : Number(values.defaultMarkupPercent),
      minimumSalePriceGross:
        values.minimumSalePriceGross === ""
          ? null
          : Number(values.minimumSalePriceGross),
      priceRoundingMode: values.priceRoundingMode || "none",
      defaultVatRate:
        values.defaultVatRate === "" ? null : Number(values.defaultVatRate),
      defaultUnit: values.defaultUnit || "pcs",
      salesSettings: {
        freeShippingThresholdGross:
          values.freeShippingThresholdGross === ""
            ? null
            : Number(values.freeShippingThresholdGross),
        upsellMessageText: values.upsellMessageText || null,
        minimumOrderValueGross:
          values.minimumOrderValueGross === ""
            ? null
            : Number(values.minimumOrderValueGross),
        crossSellProductIds: values.crossSellProductIds,
        bundleOffersText: values.bundleOffersText || null,
      },
    });

    if (response?.status && response.status >= 400) {
      notification.error(
        response?.data?.error || "Nie udalo sie zapisac ustawien cenowych",
      );
      formikHelpers.setSubmitting(false);
      return;
    }

    const nextValues = initialValues(getPayload(response));
    setFormValues(nextValues);
    formikHelpers.resetForm({ values: nextValues });
    formikHelpers.setSubmitting(false);
    notification.success("Ustawienia cenowe zapisane");
  };

  if (isLoading) {
    return <p>Ladowanie ustawien...</p>;
  }

  return (
    <FormikWrapper
      initialValues={formValues}
      onSubmit={handleSubmit}
      validate={validatePricingRulesForm}
    >
      {({ values, setFieldValue, isSubmitting }) => (
        <div className="sellerSettingsForm sellerForm">
          <section className="sellerFormSection">
            <h3>Polityka cenowa</h3>
            <div className="sellerFormGrid">
              <Input
                id="defaultMarkupPercent"
                placeholder="Domyslny narzut pomocniczy (%)"
                type="number"
                step="0.01"
                min="0"
              />
              <Input
                id="minimumSalePriceGross"
                placeholder="Minimalna cena sprzedazy brutto"
                type="number"
                step="0.01"
                min="0"
              />
              <Select
                id="priceRoundingMode"
                placeholder="Automatyczne zaokraglanie cen"
                config={ROUNDING_OPTIONS}
              />
              <Input
                id="defaultVatRate"
                placeholder="Domyslna stawka VAT (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
              />
              <Select
                id="defaultUnit"
                placeholder="Domyslna jednostka"
                config={UNIT_OPTIONS}
              />
            </div>
          </section>

          <section className="sellerFormSection">
            <h3>Strategia koszyka i AOV</h3>
            <div className="sellerFormGrid">
              <Input
                id="freeShippingThresholdGross"
                placeholder="Prog darmowej dostawy brutto"
                type="number"
                step="0.01"
                min="0"
              />
              <Input
                id="minimumOrderValueGross"
                placeholder="Minimalna wartosc zamowienia brutto"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <Textarea
              id="upsellMessageText"
              placeholder='Komunikat upsellowy, np. "Dobierz jeszcze 20 zl do darmowej dostawy"'
            />
            <Textarea
              id="bundleOffersText"
              placeholder="Oferty pakietowe / notatki dla bundle offers"
            />

            <div className="sellerShippingPicker">
              <h4>Cross-sell i produkty powiazane</h4>
              <Input
                id="crossSellSearch"
                placeholder="Filtruj produkty po nazwie"
              />
              <div className="sellerShippingPickerList">
                {products
                  .filter((product) =>
                    String(product?.name || "")
                      .toLowerCase()
                      .includes(
                        String(values.crossSellSearch || "")
                          .trim()
                          .toLowerCase(),
                      ),
                  )
                  .map((product) => {
                    const isChecked = values.crossSellProductIds.includes(
                      Number(product.id),
                    );
                    return (
                      <label
                        key={product.id}
                        className={`sellerShippingPickerItem${
                          isChecked ? " sellerShippingPickerItemActive" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const nextIds = isChecked
                              ? values.crossSellProductIds.filter(
                                  (item) => item !== Number(product.id),
                                )
                              : [
                                  ...values.crossSellProductIds,
                                  Number(product.id),
                                ].sort((a, b) => a - b);
                            setFieldValue("crossSellProductIds", nextIds);
                          }}
                        />
                        <span>{product.name}</span>
                      </label>
                    );
                  })}
              </div>
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
          </div>
        </div>
      )}
    </FormikWrapper>
  );
};

export default PricingRulesForm;
