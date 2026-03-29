import * as yup from 'yup'

const optionalNumber = (label, integer = false) =>
  yup
    .number()
    .transform((value, originalValue) => {
      if (
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined ||
        (typeof originalValue === 'string' && originalValue.trim() === '')
      ) {
        return null
      }
      return value
    })
    .nullable()
    .typeError(integer ? `${label} musi byc nieujemna liczba calkowita` : `${label} musi byc nieujemna liczba`)
    .min(0, integer ? `${label} musi byc nieujemna liczba calkowita` : `${label} musi byc nieujemna liczba`)
    .test(
      `${label}-type`,
      integer ? `${label} musi byc nieujemna liczba calkowita` : `${label} musi byc nieujemna liczba`,
      (value) => value === null || value === undefined || (integer ? Number.isInteger(value) : Number.isFinite(value)),
    )

export const shippingValidationSchema = yup.object({
  name: yup.string().trim().required('Podaj nazwe metody'),
  isActive: yup.boolean(),
  priceNet: optionalNumber('Cena netto'),
  priceGross: optionalNumber('Cena brutto'),
  freeShippingAmountGross: optionalNumber('Prog darmowej dostawy'),
  freeShippingQuantity: optionalNumber('Prog liczby sztuk', true),
  freeShippingWeight: optionalNumber('Prog wagi'),
  etaMinDays: optionalNumber('Przewidywany czas dostawy od', true),
  etaMaxDays: optionalNumber('Przewidywany czas dostawy do', true).test(
    'eta-max-gte-min',
    'Czas dostawy do musi byc wiekszy lub rowny czasowi dostawy od',
    function (value) {
      const { etaMinDays } = this.parent
      if (etaMinDays === null || etaMinDays === undefined || value === null || value === undefined) {
        return true
      }
      return value >= etaMinDays
    },
  ),
  regions: yup.string(),
})
