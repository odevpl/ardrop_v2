export const validateSpecialPricesPayload = ({ priceType, variants }) => {
  if (!['amount', 'percent'].includes(priceType)) {
    return 'Wybierz typ ceny.'
  }

  const activeVariants = Array.isArray(variants)
    ? variants.filter((variant) => !variant.remove)
    : []

  if (activeVariants.length === 0) {
    return 'Zostaw przynajmniej jeden aktywny wariant albo usun produkt z listy.'
  }

  const invalidVariant = activeVariants.find((variant) => {
    if (priceType === 'amount') {
      return Number(variant.specialNetPrice) <= 0 || Number(variant.specialGrossPrice) <= 0
    }

    return !Number.isFinite(Number(variant.discountPercent)) || Number(variant.discountPercent) === 0
  })

  if (invalidVariant) {
    return `Uzupelnij poprawnie wariant: ${invalidVariant.name}.`
  }

  return ''
}

export default validateSpecialPricesPayload
