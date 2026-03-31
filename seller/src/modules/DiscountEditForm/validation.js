export const DISCOUNT_RULE_TYPE_OPTIONS = {
  cart_threshold: "Rabat od progu koszyka",
  quantity_threshold: "Rabat od liczby sztuk",
  first_purchase: "Rabat dla pierwszego zakupu",
  loyal_customer: "Rabat dla stalych klientow",
  free_bonus: "Gratis po przekroczeniu progu",
};

export const getRuleFieldVisibility = (ruleType) => {
  if (ruleType === "cart_threshold") {
    return {
      showThreshold: true,
      showDiscountPercent: true,
      showBonusLabel: false,
      showVariantPicker: false,
    };
  }

  if (ruleType === "quantity_threshold") {
    return {
      showThreshold: true,
      showDiscountPercent: true,
      showBonusLabel: false,
      showVariantPicker: true,
    };
  }

  if (ruleType === "first_purchase") {
    return {
      showThreshold: false,
      showDiscountPercent: true,
      showBonusLabel: false,
      showVariantPicker: false,
    };
  }

  if (ruleType === "loyal_customer") {
    return {
      showThreshold: false,
      showDiscountPercent: true,
      showBonusLabel: false,
      showVariantPicker: false,
    };
  }

  if (ruleType === "free_bonus") {
    return {
      showThreshold: true,
      showDiscountPercent: false,
      showBonusLabel: true,
      showVariantPicker: false,
    };
  }

  return {
    showThreshold: true,
    showDiscountPercent: true,
    showBonusLabel: false,
    showVariantPicker: false,
  };
};

export const getThresholdLabel = (ruleType) => {
  if (ruleType === "cart_threshold") return "Prog wartosci koszyka";
  if (ruleType === "quantity_threshold") return "Prog liczby sztuk";
  if (ruleType === "free_bonus") return "Prog aktywujacy gratis";
  if (ruleType === "first_purchase") return "Warunek aktywacji";
  if (ruleType === "loyal_customer") return "Warunek aktywacji";

  return "Prog";
};

export const validateDiscountEditForm = (values) => {
  const errors = {};
  const visibility = getRuleFieldVisibility(values.ruleType);

  if (!String(values.name || "").trim()) {
    errors.name = "Podaj nazwe reguly";
  }

  if (
    visibility.showThreshold &&
    values.thresholdValue !== "" &&
    (!Number.isFinite(Number(values.thresholdValue)) ||
      Number(values.thresholdValue) < 0)
  ) {
    errors.thresholdValue = "Prog musi byc liczba >= 0";
  }

  if (
    visibility.showDiscountPercent &&
    values.discountPercent !== "" &&
    (!Number.isFinite(Number(values.discountPercent)) ||
      Number(values.discountPercent) < 0 ||
      Number(values.discountPercent) > 100)
  ) {
    errors.discountPercent = "Rabat musi byc liczba od 0 do 100";
  }

  if (
    visibility.showBonusLabel &&
    !String(values.bonusLabel || "").trim()
  ) {
    errors.bonusLabel = "Podaj nazwe gratisu lub bonusu";
  }

  if (
    visibility.showVariantPicker &&
    (!Array.isArray(values.selectedVariantIds) || values.selectedVariantIds.length === 0)
  ) {
    errors.selectedVariantIds = "Wybierz co najmniej jeden wariant";
  }

  return errors;
};
