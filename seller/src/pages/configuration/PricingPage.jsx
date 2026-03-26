import { useEffect, useState } from 'react'
import Checkbox from 'components/FormikWrapper/FormControls/Checkbox'
import Input from 'components/FormikWrapper/FormControls/Input'
import Select from 'components/FormikWrapper/FormControls/Select'
import Textarea from 'components/FormikWrapper/FormControls/Textarea'
import FormikWrapper from 'components/FormikWrapper'
import { useNotification } from 'components/GlobalNotification/useNotification'
import ProductsService from 'services/products'
import SellerSettingsService from 'services/sellerSettings'

const ROUNDING_OPTIONS = {
  none: 'Brak zaokraglania',
  full: 'Do pelnych zl',
  x99: 'Koncowka .99',
}

const UNIT_OPTIONS = {
  pcs: 'szt.',
  g: 'g',
  l: 'l',
}

const DISCOUNT_RULE_TYPE_OPTIONS = {
  cart_threshold: 'Rabat od progu koszyka',
  quantity_threshold: 'Rabat od liczby sztuk',
  first_purchase: 'Rabat dla pierwszego zakupu',
  loyal_customer: 'Rabat dla stalych klientow',
  b2b_customer: 'Rabat dla klientow B2B',
  happy_hours: 'Happy hours',
  free_bonus: 'Gratis po przekroczeniu progu',
}

const EMPTY_RULE = {
  ruleType: 'cart_threshold',
  name: '',
  isActive: true,
  thresholdValue: '',
  discountPercent: '',
  bonusLabel: '',
}

const createInitialValues = (payload) => ({
  defaultMarkupPercent:
    payload?.settings?.defaultMarkupPercent === null ||
    payload?.settings?.defaultMarkupPercent === undefined
      ? ''
      : String(payload.settings.defaultMarkupPercent),
  minimumSalePriceGross:
    payload?.settings?.minimumSalePriceGross === null ||
    payload?.settings?.minimumSalePriceGross === undefined
      ? ''
      : String(payload.settings.minimumSalePriceGross),
  priceRoundingMode: payload?.settings?.priceRoundingMode || 'none',
  defaultVatRate:
    payload?.settings?.defaultVatRate === null ||
    payload?.settings?.defaultVatRate === undefined
      ? ''
      : String(payload.settings.defaultVatRate),
  defaultUnit: payload?.settings?.defaultUnit || 'pcs',
  discountRules:
    Array.isArray(payload?.discountRules) && payload.discountRules.length > 0
      ? payload.discountRules.map((rule) => ({
          ruleType: rule.ruleType || 'cart_threshold',
          name: rule.name || '',
          isActive: Boolean(rule.isActive),
          thresholdValue:
            rule?.config?.thresholdValue === null || rule?.config?.thresholdValue === undefined
              ? ''
              : String(rule.config.thresholdValue),
          discountPercent:
            rule?.config?.discountPercent === null || rule?.config?.discountPercent === undefined
              ? ''
              : String(rule.config.discountPercent),
          bonusLabel: rule?.config?.bonusLabel || '',
        }))
      : [EMPTY_RULE],
  freeShippingThresholdGross:
    payload?.salesSettings?.freeShippingThresholdGross === null ||
    payload?.salesSettings?.freeShippingThresholdGross === undefined
      ? ''
      : String(payload.salesSettings.freeShippingThresholdGross),
  upsellMessageText: payload?.salesSettings?.upsellMessageText || '',
  minimumOrderValueGross:
    payload?.salesSettings?.minimumOrderValueGross === null ||
    payload?.salesSettings?.minimumOrderValueGross === undefined
      ? ''
      : String(payload.salesSettings.minimumOrderValueGross),
  crossSellProductIds: Array.isArray(payload?.salesSettings?.crossSellProductIds)
    ? payload.salesSettings.crossSellProductIds
    : [],
  bundleOffersText: payload?.salesSettings?.bundleOffersText || '',
  crossSellSearch: '',
})

const validateForm = (values) => {
  const errors = {}

  const validateOptionalNumber = (field, label, { min = 0, max = null } = {}) => {
    if (values[field] === '') return
    const normalized = Number(values[field])
    if (!Number.isFinite(normalized) || normalized < min || (max !== null && normalized > max)) {
      errors[field] = max !== null
        ? `${label} musi byc liczba od ${min} do ${max}`
        : `${label} musi byc liczba >= ${min}`
    }
  }

  validateOptionalNumber('defaultMarkupPercent', 'Domyslny narzut')
  validateOptionalNumber('minimumSalePriceGross', 'Minimalna cena brutto')
  validateOptionalNumber('defaultVatRate', 'Domyslny VAT', { min: 0, max: 100 })
  validateOptionalNumber('freeShippingThresholdGross', 'Prog darmowej dostawy')
  validateOptionalNumber('minimumOrderValueGross', 'Minimalna wartosc zamowienia')

  const discountRuleErrors = values.discountRules.map((rule) => {
    const rowErrors = {}
    if (!String(rule.name || '').trim()) {
      rowErrors.name = 'Podaj nazwe reguly'
    }
    if (rule.thresholdValue !== '' && (!Number.isFinite(Number(rule.thresholdValue)) || Number(rule.thresholdValue) < 0)) {
      rowErrors.thresholdValue = 'Prog musi byc liczba >= 0'
    }
    if (rule.discountPercent !== '' && (!Number.isFinite(Number(rule.discountPercent)) || Number(rule.discountPercent) < 0 || Number(rule.discountPercent) > 100)) {
      rowErrors.discountPercent = 'Rabat musi byc liczba od 0 do 100'
    }
    return rowErrors
  })

  if (discountRuleErrors.some((row) => Object.keys(row).length > 0)) {
    errors.discountRules = discountRuleErrors
  }

  return errors
}

const PricingPage = () => {
  const notification = useNotification()
  const [initialValues, setInitialValues] = useState(createInitialValues())
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const [settingsResponse, productsResponse] = await Promise.all([
        SellerSettingsService.getSellerSettings(),
        ProductsService.getProducts({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      ])

      if (settingsResponse?.status && settingsResponse.status >= 400) {
        notification.error(settingsResponse?.data?.error || 'Nie udalo sie pobrac ustawien cenowych')
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
      defaultMarkupPercent: values.defaultMarkupPercent === '' ? null : Number(values.defaultMarkupPercent),
      minimumSalePriceGross:
        values.minimumSalePriceGross === '' ? null : Number(values.minimumSalePriceGross),
      priceRoundingMode: values.priceRoundingMode || 'none',
      defaultVatRate: values.defaultVatRate === '' ? null : Number(values.defaultVatRate),
      defaultUnit: values.defaultUnit || 'pcs',
      discountRules: values.discountRules.map((rule) => ({
        ruleType: rule.ruleType,
        name: rule.name,
        isActive: Boolean(rule.isActive),
        config: {
          thresholdValue: rule.thresholdValue === '' ? null : Number(rule.thresholdValue),
          discountPercent: rule.discountPercent === '' ? null : Number(rule.discountPercent),
          bonusLabel: rule.bonusLabel || null,
        },
      })),
      salesSettings: {
        freeShippingThresholdGross:
          values.freeShippingThresholdGross === '' ? null : Number(values.freeShippingThresholdGross),
        upsellMessageText: values.upsellMessageText || null,
        minimumOrderValueGross:
          values.minimumOrderValueGross === '' ? null : Number(values.minimumOrderValueGross),
        crossSellProductIds: values.crossSellProductIds,
        bundleOffersText: values.bundleOffersText || null,
      },
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie zapisac ustawien cenowych')
      formikHelpers.setSubmitting(false)
      return
    }

    const nextValues = createInitialValues(response?.data || response)
    setInitialValues(nextValues)
    formikHelpers.resetForm({ values: nextValues })
    formikHelpers.setSubmitting(false)
    notification.success('Ustawienia cenowe zapisane')
  }

  if (isLoading) {
    return (
      <section className="sellerPageSection">
        <div className="sellerToolbar">
          <h2>Ceny i rabaty</h2>
        </div>
        <p>Ladowanie ustawien...</p>
      </section>
    )
  }

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Ceny i rabaty</h2>
      </div>

      <FormikWrapper initialValues={initialValues} onSubmit={handleSubmit} validate={validateForm}>
        {({ values, setFieldValue, isSubmitting }) => (
          <div className="sellerSettingsForm sellerForm">
            <section className="sellerFormSection">
              <h3>Polityka cenowa</h3>
              <div className="sellerFormGrid">
                <Input id="defaultMarkupPercent" placeholder="Domyslny narzut pomocniczy (%)" type="number" step="0.01" min="0" />
                <Input id="minimumSalePriceGross" placeholder="Minimalna cena sprzedazy brutto" type="number" step="0.01" min="0" />
                <Select id="priceRoundingMode" placeholder="Automatyczne zaokraglanie cen" config={ROUNDING_OPTIONS} />
                <Input id="defaultVatRate" placeholder="Domyslna stawka VAT (%)" type="number" step="0.01" min="0" max="100" />
                <Select id="defaultUnit" placeholder="Domyslna jednostka" config={UNIT_OPTIONS} />
              </div>
            </section>

            <section className="sellerFormSection">
              <div className="sellerToolbar">
                <h3>Rabaty i promocje automatyczne</h3>
                <button
                  type="button"
                  onClick={() => setFieldValue('discountRules', [...values.discountRules, { ...EMPTY_RULE }])}
                >
                  Dodaj regule
                </button>
              </div>

              <div className="sellerSettingsForm">
                {values.discountRules.map((rule, index) => (
                  <div key={`discount-rule-${index}`} className="sellerSettingsHoursRow">
                    <div className="sellerFormGrid">
                      <Select
                        id={`discountRules.${index}.ruleType`}
                        placeholder="Typ reguly"
                        config={DISCOUNT_RULE_TYPE_OPTIONS}
                      />
                      <Input id={`discountRules.${index}.name`} placeholder="Nazwa reguly" />
                      <Checkbox id={`discountRules.${index}.isActive`} placeholder="Aktywna" />
                      <Input id={`discountRules.${index}.thresholdValue`} placeholder="Prog" type="number" step="0.01" min="0" />
                      <Input id={`discountRules.${index}.discountPercent`} placeholder="Rabat (%)" type="number" step="0.01" min="0" max="100" />
                      <Input id={`discountRules.${index}.bonusLabel`} placeholder="Gratis / bonus" />
                    </div>
                    <button
                      type="button"
                      className="sellerSettingsClearButton"
                      onClick={() => {
                        const nextRules =
                          values.discountRules.length === 1
                            ? [{ ...EMPTY_RULE }]
                            : values.discountRules.filter((_, itemIndex) => itemIndex !== index)
                        setFieldValue('discountRules', nextRules)
                      }}
                    >
                      Usun regule
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="sellerFormSection">
              <h3>Strategia koszyka i AOV</h3>
              <div className="sellerFormGrid">
                <Input
                  id="freeShippingThresholdGross"
                  placeholder="Prog darmowej dostawy brutto"
                  type="number"
                  step="0.01"
                  min="0"
                />
                <Input
                  id="minimumOrderValueGross"
                  placeholder="Minimalna wartosc zamowienia brutto"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
              <Textarea
                id="upsellMessageText"
                placeholder='Komunikat upsellowy, np. "Dobierz jeszcze 20 zl do darmowej dostawy"'
              />
              <Textarea
                id="bundleOffersText"
                placeholder="Oferty pakietowe / notatki dla bundle offers"
              />

              <div className="sellerShippingPicker">
                <h4>Cross-sell i produkty powiazane</h4>
                <Input id="crossSellSearch" placeholder="Filtruj produkty po nazwie" />
                <div className="sellerShippingPickerList">
                  {products
                    .filter((product) =>
                      String(product?.name || '')
                        .toLowerCase()
                        .includes(String(values.crossSellSearch || '').trim().toLowerCase()),
                    )
                    .map((product) => {
                      const isChecked = values.crossSellProductIds.includes(Number(product.id))
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
                                ? values.crossSellProductIds.filter((item) => item !== Number(product.id))
                                : [...values.crossSellProductIds, Number(product.id)].sort((a, b) => a - b)
                              setFieldValue('crossSellProductIds', nextIds)
                            }}
                          />
                          <span>{product.name}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            </section>

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

export default PricingPage
