export const buildInitialValues = (variants = [], existingSpecialPrices = []) => {
  const existingByVariantId = existingSpecialPrices.reduce((acc, variant) => {
    acc[Number(variant.variantId)] = variant
    return acc
  }, {})

  return {
    priceType: existingSpecialPrices[0]?.discountPercent !== null &&
      existingSpecialPrices[0]?.discountPercent !== undefined
      ? 'percent'
      : 'amount',
    variants: variants.map((variant) => {
      const existing = existingByVariantId[Number(variant.id)]

      return {
        variantId: Number(variant.id),
        name: variant.name || `Wariant #${variant.id}`,
        vatRate: Number(variant.vatRate || 0),
        originalNetPrice: Number(variant.netPrice || 0),
        originalGrossPrice: Number(variant.grossPrice || 0),
        specialNetPrice: existing?.specialNetPrice ?? variant.netPrice ?? '',
        specialGrossPrice: existing?.specialGrossPrice ?? variant.grossPrice ?? '',
        discountPercent: existing?.discountPercent ?? '',
        remove: false,
      }
    }),
  }
}

export default buildInitialValues
