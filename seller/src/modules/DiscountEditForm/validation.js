export const DISCOUNT_RULE_TYPE_OPTIONS = {
  cart_threshold: "Rabat od progu koszyka",
  quantity_threshold: "Rabat od liczby sztuk",
  coupon_code: "Kod rabatowy",
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
      showCouponCode: false,
      showUsageLimitPerClient: false,
      showBonusLabel: false,
      showVariantPicker: true,
    };
  }

  if (ruleType === "coupon_code") {
    return {
      showThreshold: false,
      showDiscountPercent: true,
      showCouponCode: true,
      showUsageLimitPerClient: true,
      showBonusLabel: false,
      showVariantPicker: false,
    };
  }

  return {
    showThreshold: true,
    showDiscountPercent: true,
    showCouponCode: false,
    showUsageLimitPerClient: false,
    showBonusLabel: false,
    showVariantPicker: false,
  };
};

export const getThresholdLabel = (ruleType) => {
  if (ruleType === "cart_threshold") return "Prog wartosci koszyka";
  if (ruleType === "quantity_threshold") return "Prog liczby sztuk";

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
    (String(values.thresholdValue || "").trim() === "" ||
      !Number.isFinite(Number(values.thresholdValue)) ||
      Number(values.thresholdValue) < 0)
  ) {
    errors.thresholdValue = "Prog musi byc liczba >= 0";
  }

  if (
    visibility.showDiscountPercent &&
    (String(values.discountPercent || "").trim() === "" ||
      !Number.isFinite(Number(values.discountPercent)) ||
      Number(values.discountPercent) < 0 ||
      Number(values.discountPercent) > 100)
  ) {
    errors.discountPercent = "Rabat musi byc liczba od 0 do 100";
  }

  if (visibility.showCouponCode && !String(values.couponCode || "").trim()) {
    errors.couponCode = "Podaj kod rabatowy";
  }

  if (
    visibility.showUsageLimitPerClient &&
    (!Number.isInteger(Number(values.usageLimitPerClient)) ||
      Number(values.usageLimitPerClient) < 0)
  ) {
    errors.usageLimitPerClient = "Limit uzyc musi byc liczba calkowita >= 0";
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
