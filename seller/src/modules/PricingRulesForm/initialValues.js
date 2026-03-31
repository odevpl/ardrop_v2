export const ROUNDING_OPTIONS = {
  none: "Brak zaokraglania",
  full: "Do pelnych zl",
  x99: "Koncowka .99",
};

export const UNIT_OPTIONS = {
  pcs: "szt.",
  g: "g",
  l: "l",
};

export const initialValues = (payload) => ({
  defaultMarkupPercent:
    payload?.settings?.defaultMarkupPercent === null ||
    payload?.settings?.defaultMarkupPercent === undefined
      ? ""
      : String(payload.settings.defaultMarkupPercent),
  minimumSalePriceGross:
    payload?.settings?.minimumSalePriceGross === null ||
    payload?.settings?.minimumSalePriceGross === undefined
      ? ""
      : String(payload.settings.minimumSalePriceGross),
  priceRoundingMode: payload?.settings?.priceRoundingMode || "none",
  defaultVatRate:
    payload?.settings?.defaultVatRate === null ||
    payload?.settings?.defaultVatRate === undefined
      ? ""
      : String(payload.settings.defaultVatRate),
  defaultUnit: payload?.settings?.defaultUnit || "pcs",
  freeShippingThresholdGross:
    payload?.salesSettings?.freeShippingThresholdGross === null ||
    payload?.salesSettings?.freeShippingThresholdGross === undefined
      ? ""
      : String(payload.salesSettings.freeShippingThresholdGross),
  upsellMessageText: payload?.salesSettings?.upsellMessageText || "",
  minimumOrderValueGross:
    payload?.salesSettings?.minimumOrderValueGross === null ||
    payload?.salesSettings?.minimumOrderValueGross === undefined
      ? ""
      : String(payload.salesSettings.minimumOrderValueGross),
  crossSellProductIds: Array.isArray(payload?.salesSettings?.crossSellProductIds)
    ? payload.salesSettings.crossSellProductIds
    : [],
  bundleOffersText: payload?.salesSettings?.bundleOffersText || "",
  crossSellSearch: "",
});
