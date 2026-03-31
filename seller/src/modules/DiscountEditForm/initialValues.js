export const EMPTY_RULE = {
  id: null,
  ruleType: "cart_threshold",
  name: "",
  isActive: true,
  thresholdValue: "",
  discountPercent: "",
  bonusLabel: "",
  selectedVariantIds: [],
  variantSearch: "",
};

export const mapRuleToValues = (rule) => ({
  id: rule?.id ? Number(rule.id) : null,
  ruleType: rule?.ruleType || "cart_threshold",
  name: rule?.name || "",
  isActive: rule?.isActive === undefined ? true : Boolean(rule.isActive),
  thresholdValue:
    rule?.config?.thresholdValue === null || rule?.config?.thresholdValue === undefined
      ? ""
      : String(rule.config.thresholdValue),
  discountPercent:
    rule?.config?.discountPercent === null || rule?.config?.discountPercent === undefined
      ? ""
      : String(rule.config.discountPercent),
  bonusLabel: rule?.config?.bonusLabel || "",
  selectedVariantIds: Array.isArray(rule?.config?.selectedVariantIds)
    ? rule.config.selectedVariantIds.map((item) => Number(item)).filter(Boolean)
    : [],
  variantSearch: "",
});

export const initialValues = (payload, id = "new") => {
  if (id === "new") {
    return { ...EMPTY_RULE };
  }

  const discountRules = Array.isArray(payload?.discountRules) ? payload.discountRules : [];
  const matchedRule = discountRules.find((rule) => Number(rule.id) === Number(id));

  return matchedRule ? mapRuleToValues(matchedRule) : { ...EMPTY_RULE };
};
