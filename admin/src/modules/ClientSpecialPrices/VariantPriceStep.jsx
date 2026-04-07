import { useEffect, useState } from 'react'
import { useNotification } from 'components/GlobalNotification/index.js'
import { getProductById } from 'services/products'
import { upsertClientSpecialPrices } from 'services/clients'
import { buildInitialValues } from './initialValues'
import { validateSpecialPricesPayload } from './validation'

const roundPrice = (value) => Math.round((Number(value) || 0) * 100) / 100

const calcGross = (net, vatRate) => roundPrice(Number(net) * (1 + Number(vatRate || 0) / 100))
const calcNet = (gross, vatRate) => roundPrice(Number(gross) / (1 + Number(vatRate || 0) / 100))

const VariantPriceStep = ({
  clientId,
  product,
  existingSpecialPrices = [],
  onBack,
  onClose,
  onSaved,
}) => {
  const notification = useNotification()
  const [loadedProduct, setLoadedProduct] = useState(product)
  const [priceType, setPriceType] = useState('amount')
  const [variants, setVariants] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const refreshProduct = async () => {
      const productId = product?.id || product?.productId
      if (!productId) return
      const response = await getProductById(productId)
      if (!(response?.status && response.status >= 400)) {
        setLoadedProduct(response?.data || response?.product || product)
      }
    }
    refreshProduct()
  }, [product])

  useEffect(() => {
    const nextValues = buildInitialValues(loadedProduct?.variants || [], existingSpecialPrices)
    setPriceType(nextValues.priceType)
    setVariants(nextValues.variants)
  }, [loadedProduct, existingSpecialPrices])

  const updateVariant = (variantId, patch) => {
    setVariants((current) =>
      current.map((variant) =>
        Number(variant.variantId) === Number(variantId)
          ? { ...variant, ...patch }
          : variant,
      ),
    )
  }

  const handleSubmit = async () => {
    const validationError = validateSpecialPricesPayload({ priceType, variants })
    if (validationError) {
      notification.error(validationError)
      return
    }

    setIsSubmitting(true)
    const response = await upsertClientSpecialPrices({
      clientId,
      payload: {
        productId: loadedProduct?.id || loadedProduct?.productId || product?.productId,
        priceType,
        variants: variants.map((variant) => ({
          variantId: variant.variantId,
          specialNetPrice: variant.remove ? null : Number(variant.specialNetPrice),
          specialGrossPrice: variant.remove ? null : Number(variant.specialGrossPrice),
          discountPercent: variant.remove ? null : Number(variant.discountPercent),
          remove: Boolean(variant.remove),
        })),
      },
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie zapisac cen specjalnych.')
      setIsSubmitting(false)
      return
    }

    notification.success('Zapisano ceny specjalne.')
    setIsSubmitting(false)
    await onSaved()
  }

  return (
    <div className="clientSpecialPricesVariantStep">
      <div className="clientSpecialPricesPickerFilters">
        <select value={priceType} onChange={(event) => setPriceType(event.target.value)}>
          <option value="amount">Kwota</option>
          <option value="percent">Procent</option>
        </select>
      </div>

      {variants.map((variant) => (
        <div
          className={`clientSpecialPricesVariantRow ${variant.remove ? 'isRemoved' : ''}`}
          key={variant.variantId}
        >
          <div>
            <strong>{variant.name}</strong>
            <div>
              Oryginalnie: {variant.originalNetPrice.toFixed(2)} /{' '}
              {variant.originalGrossPrice.toFixed(2)} zl
            </div>
          </div>

          {priceType === 'amount' ? (
            <>
              <input
                type="number"
                step="0.01"
                value={variant.specialNetPrice}
                disabled={variant.remove}
                onChange={(event) => {
                  const specialNetPrice = event.target.value
                  updateVariant(variant.variantId, {
                    specialNetPrice,
                    specialGrossPrice: calcGross(specialNetPrice, variant.vatRate),
                  })
                }}
              />
              <input
                type="number"
                step="0.01"
                value={variant.specialGrossPrice}
                disabled={variant.remove}
                onChange={(event) => {
                  const specialGrossPrice = event.target.value
                  updateVariant(variant.variantId, {
                    specialGrossPrice,
                    specialNetPrice: calcNet(specialGrossPrice, variant.vatRate),
                  })
                }}
              />
            </>
          ) : (
            <input
              type="number"
              step="0.01"
              value={variant.discountPercent}
              disabled={variant.remove}
              placeholder="Wartosc %"
              onChange={(event) =>
                updateVariant(variant.variantId, {
                  discountPercent: event.target.value,
                })
              }
            />
          )}

          <button
            type="button"
            onClick={() => updateVariant(variant.variantId, { remove: !variant.remove })}
          >
            {variant.remove ? 'Cofnij' : 'X'}
          </button>
        </div>
      ))}

      <div className="adminActions">
        {onBack ? (
          <button type="button" onClick={onBack} disabled={isSubmitting}>
            Wroc
          </button>
        ) : null}
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Anuluj
        </button>
        <button
          type="button"
          className="adminPrimaryButton"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          Zapisz
        </button>
      </div>
    </div>
  )
}

export default VariantPriceStep
