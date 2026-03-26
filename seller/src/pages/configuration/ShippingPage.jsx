import { useEffect, useState } from 'react'
import Checkbox from 'components/FormikWrapper/FormControls/Checkbox'
import Input from 'components/FormikWrapper/FormControls/Input'
import FormikWrapper from 'components/FormikWrapper'
import { useNotification } from 'components/GlobalNotification/useNotification'
import ProductsService from 'services/products'
import SellerSettingsService from 'services/sellerSettings'

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
  countries: '',
  regions: '',
  excludedProductIds: '',
  exclusionSearch: '',
}

const createInitialValues = (payload) => ({
  shippingMethods: Array.isArray(payload?.shippingMethods) && payload.shippingMethods.length > 0
    ? payload.shippingMethods.map((method) => ({
        name: method.name || '',
        isActive: Boolean(method.isActive),
        priceNet: method.priceNet ?? '',
        priceGross: method.priceGross ?? '',
        freeShippingAmountGross: method.freeShippingAmountGross ?? '',
        freeShippingQuantity: method.freeShippingQuantity ?? '',
        freeShippingWeight: method.freeShippingWeight ?? '',
        etaMinDays: method.etaMinDays ?? '',
        etaMaxDays: method.etaMaxDays ?? '',
        countries: Array.isArray(method.countries) ? method.countries.join(', ') : '',
        regions: Array.isArray(method.regions) ? method.regions.join(', ') : '',
        excludedProductIds: Array.isArray(method.excludedProductIds)
          ? method.excludedProductIds.join(', ')
          : '',
        exclusionSearch: '',
      }))
    : [EMPTY_METHOD],
})

const validateForm = (values) => {
  const errors = {}

  const shippingMethodsErrors = values.shippingMethods.map((method) => {
    const rowErrors = {}
    if (!String(method.name || '').trim()) {
      rowErrors.name = 'Podaj nazwe metody'
    }

    const validateOptionalNumber = (field, label, integer = false) => {
      if (method[field] === '' || method[field] === null || method[field] === undefined) return
      const normalized = Number(method[field])
      if (!Number.isFinite(normalized) || normalized < 0 || (integer && !Number.isInteger(normalized))) {
        rowErrors[field] = integer
          ? `${label} musi byc nieujemna liczba calkowita`
          : `${label} musi byc nieujemna liczba`
      }
    }

    validateOptionalNumber('priceNet', 'Cena netto')
    validateOptionalNumber('priceGross', 'Cena brutto')
    validateOptionalNumber('freeShippingAmountGross', 'Prog darmowej dostawy')
    validateOptionalNumber('freeShippingQuantity', 'Prog liczby sztuk', true)
    validateOptionalNumber('freeShippingWeight', 'Prog wagi')
    validateOptionalNumber('etaMinDays', 'ETA od', true)
    validateOptionalNumber('etaMaxDays', 'ETA do', true)

    if (
      method.etaMinDays !== '' &&
      method.etaMaxDays !== '' &&
      Number(method.etaMinDays) > Number(method.etaMaxDays)
    ) {
      rowErrors.etaMaxDays = 'ETA do musi byc wieksze lub rowne ETA od'
    }

    return rowErrors
  })

  if (shippingMethodsErrors.some((row) => Object.keys(row).length > 0)) {
    errors.shippingMethods = shippingMethodsErrors
  }

  return errors
}

const normalizeMethodPayload = (method) => ({
  name: method.name,
  isActive: Boolean(method.isActive),
  priceNet: method.priceNet === '' ? null : Number(method.priceNet),
  priceGross: method.priceGross === '' ? null : Number(method.priceGross),
  freeShippingAmountGross:
    method.freeShippingAmountGross === '' ? null : Number(method.freeShippingAmountGross),
  freeShippingQuantity:
    method.freeShippingQuantity === '' ? null : Number(method.freeShippingQuantity),
  freeShippingWeight:
    method.freeShippingWeight === '' ? null : Number(method.freeShippingWeight),
  etaMinDays: method.etaMinDays === '' ? null : Number(method.etaMinDays),
  etaMaxDays: method.etaMaxDays === '' ? null : Number(method.etaMaxDays),
  countries: String(method.countries || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  regions: String(method.regions || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  excludedProductIds: String(method.excludedProductIds || '')
    .split(',')
    .map((item) => Number(String(item).trim()))
    .filter((item) => Number.isInteger(item) && item > 0),
})

const ShippingPage = () => {
  const notification = useNotification()
  const [initialValues, setInitialValues] = useState(createInitialValues())
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState([])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const [settingsResponse, productsResponse] = await Promise.all([
        SellerSettingsService.getSellerSettings(),
        ProductsService.getProducts({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      ])

      if (settingsResponse?.status && settingsResponse.status >= 400) {
        notification.error(response?.data?.error || 'Nie udalo sie pobrac ustawien dostawy')
        setIsLoading(false)
        return
      }

      if (productsResponse?.status && productsResponse.status >= 400) {
        notification.error(productsResponse?.data?.error || 'Nie udalo sie pobrac listy produktow')
        setIsLoading(false)
        return
      }

      setInitialValues(createInitialValues(settingsResponse?.data || settingsResponse))
      setProducts(Array.isArray(productsResponse?.data) ? productsResponse.data : productsResponse?.data?.data || [])
      setIsLoading(false)
    }

    loadData()
  }, [notification])

  const handleSubmit = async (values, formikHelpers) => {
    const response = await SellerSettingsService.updateSellerSettings({
      shippingMethods: values.shippingMethods.map(normalizeMethodPayload),
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie zapisac ustawien dostawy')
      formikHelpers.setSubmitting(false)
      return
    }

    const nextValues = createInitialValues(response?.data || response)
    setInitialValues(nextValues)
    formikHelpers.resetForm({ values: nextValues })
    formikHelpers.setSubmitting(false)
    notification.success('Ustawienia dostawy zapisane')
  }

  if (isLoading) {
    return (
      <section className="sellerPageSection">
        <div className="sellerToolbar">
          <h2>Dostawa</h2>
        </div>
        <p>Ladowanie ustawien...</p>
      </section>
    )
  }

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Dostawa</h2>
      </div>

      <FormikWrapper initialValues={initialValues} onSubmit={handleSubmit} validate={validateForm}>
        {({ values, setFieldValue, isSubmitting }) => (
          <div className="sellerSettingsForm sellerForm">
            {values.shippingMethods.map((method, index) => (
              <section key={`shipping-method-${index}`} className="sellerFormSection">
                <div className="sellerToolbar">
                  <h3>Metoda dostawy {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMethods =
                        values.shippingMethods.length === 1
                          ? [EMPTY_METHOD]
                          : values.shippingMethods.filter((_, itemIndex) => itemIndex !== index)
                      setFieldValue('shippingMethods', nextMethods)
                    }}
                  >
                    Usun
                  </button>
                </div>

                <div className="sellerFormGrid">
                  <Input id={`shippingMethods.${index}.name`} placeholder="Nazwa metody" />
                  <Checkbox id={`shippingMethods.${index}.isActive`} placeholder="Aktywna" />
                  <Input id={`shippingMethods.${index}.priceNet`} placeholder="Cena netto" type="number" step="0.01" min="0" />
                  <Input id={`shippingMethods.${index}.priceGross`} placeholder="Cena brutto" type="number" step="0.01" min="0" />
                  <Input
                    id={`shippingMethods.${index}.freeShippingAmountGross`}
                    placeholder="Darmowa dostawa od kwoty brutto"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                  <Input
                    id={`shippingMethods.${index}.freeShippingQuantity`}
                    placeholder="Darmowa dostawa od liczby sztuk"
                    type="number"
                    min="0"
                  />
                  <Input
                    id={`shippingMethods.${index}.freeShippingWeight`}
                    placeholder="Darmowa dostawa od wagi"
                    type="number"
                    step="0.01"
                    min="0"
                  />
                  <Input
                    id={`shippingMethods.${index}.etaMinDays`}
                    placeholder="ETA od (dni)"
                    type="number"
                    min="0"
                  />
                  <Input
                    id={`shippingMethods.${index}.etaMaxDays`}
                    placeholder="ETA do (dni)"
                    type="number"
                    min="0"
                  />
                  <Input
                    id={`shippingMethods.${index}.countries`}
                    placeholder="Kraje, np. PL, DE"
                  />
                  <Input
                    id={`shippingMethods.${index}.regions`}
                    placeholder="Regiony, np. mazowieckie, slaskie"
                  />
                </div>

                <div className="sellerShippingPicker">
                  <h4>Wykluczone produkty</h4>
                  <Input
                    id={`shippingMethods.${index}.exclusionSearch`}
                    placeholder="Filtruj produkty po nazwie"
                  />
                  <div className="sellerShippingPickerList">
                    {products
                      .filter((product) =>
                        String(product?.name || '')
                          .toLowerCase()
                          .includes(String(method.exclusionSearch || '').trim().toLowerCase()),
                      )
                      .map((product) => {
                        const currentIds = String(method.excludedProductIds || '')
                          .split(',')
                          .map((item) => Number(String(item).trim()))
                          .filter((item) => Number.isInteger(item) && item > 0)
                        const isChecked = currentIds.includes(Number(product.id))

                        return (
                          <label
                            key={product.id}
                            className={`sellerShippingPickerItem${
                              isChecked ? ' sellerShippingPickerItemActive' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                const nextIds = isChecked
                                  ? currentIds.filter((item) => item !== Number(product.id))
                                  : [...currentIds, Number(product.id)].sort((a, b) => a - b)
                                setFieldValue(
                                  `shippingMethods.${index}.excludedProductIds`,
                                  nextIds.join(', '),
                                )
                              }}
                            />
                            <span>{product.name}</span>
                          </label>
                        )
                      })}
                  </div>
                </div>
              </section>
            ))}

            <div className="sellerActions">
              <button
                type="button"
                onClick={() =>
                  setFieldValue('shippingMethods', [...values.shippingMethods, { ...EMPTY_METHOD }])
                }
              >
                Dodaj metode dostawy
              </button>
            </div>

            <div className="sellerActions sellerFormActions">
              <button type="submit" className="sellerPrimaryButton" disabled={isSubmitting}>
                {isSubmitting ? 'Zapisywanie...' : 'Zapisz ustawienia'}
              </button>
            </div>
          </div>
        )}
      </FormikWrapper>
    </section>
  )
}

export default ShippingPage
