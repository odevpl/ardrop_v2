export const validatePricingRulesForm = (values) => {
  const errors = {};

  const validateOptionalNumber = (field, label, { min = 0, max = null } = {}) => {
    if (values[field] === "") return;

    const normalized = Number(values[field]);
    if (
      !Number.isFinite(normalized) ||
      normalized < min ||
      (max !== null && normalized > max)
    ) {
      errors[field] =
        max !== null
          ? `${label} musi byc liczba od ${min} do ${max}`
          : `${label} musi byc liczba >= ${min}`;
    }
  };

  validateOptionalNumber("defaultMarkupPercent", "Domyslny narzut");
  validateOptionalNumber("minimumSalePriceGross", "Minimalna cena brutto");
  validateOptionalNumber("defaultVatRate", "Domyslny VAT", {
    min: 0,
    max: 100,
  });
  validateOptionalNumber(
    "freeShippingThresholdGross",
    "Prog darmowej dostawy",
  );
  validateOptionalNumber(
    "minimumOrderValueGross",
    "Minimalna wartosc zamowienia",
  );

  return errors;
};
