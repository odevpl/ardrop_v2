const EMPTY_METHOD = {
  name: '',
  isActive: true,
  vatRate: '23',
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
  vatRate:
    method?.vatRate === null || method?.vatRate === undefined ? '23' : String(method.vatRate),
  regions: Array.isArray(method?.regions) ? method.regions.join(', ') : method?.regions || '',
})
