const EMPTY_METHOD = {
  name: '',
  isActive: true,
  priceNet: '',
  priceGross: '',
  freeShippingAmountGross: '',
  freeShippingQuantity: '',
  freeShippingWeight: '',
  etaMinDays: '',
  etaMaxDays: '',
  regions: '',
}

export const initialValues = (method) => ({
  ...EMPTY_METHOD,
  ...(method || {}),
  regions: Array.isArray(method?.regions) ? method.regions.join(', ') : method?.regions || '',
})
