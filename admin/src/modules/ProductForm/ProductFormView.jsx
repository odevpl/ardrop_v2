import FormikWrapper from 'components/FormikWrapper'
import Input from 'components/FormikWrapper/FormControls/Input'
import Select from 'components/FormikWrapper/FormControls/Select'
import Textarea from 'components/FormikWrapper/FormControls/Textarea'
import ImageDropzone from './ImageDropzone'
import { parseNumber, round2 } from './helpers'

export const STATUS_OPTIONS = {
  draft: 'Szkic',
  active: 'Aktywny',
  archived: 'Archiwalny',
}

export const UNIT_OPTIONS = {
  pcs: 'szt.',
  g: 'g',
  l: 'l',
}

const ProductFormView = ({
  title,
  initialValues,
  onSubmit,
  images,
  setImages,
  sellerOptions,
  existingImages = [],
  onDeleteExistingImage,
  onSetMainExistingImage,
  isImagesActionLoading = false,
  onCancel,
  loading = false,
  variants = [],
  setVariants,
  categoryOptions = [],
  selectedCategoryIds = [],
  setSelectedCategoryIds,
  primaryCategoryId = null,
  setPrimaryCategoryId,
}) => {
  const updateVariantValue = (index, field, rawValue, vatRateValue) => {
    const parsedValue = rawValue === '' ? '' : Number(rawValue)
    const vat = parseNumber(vatRateValue)
    const multiplier = vat !== null && vat >= 0 ? 1 + vat / 100 : null

    setVariants(
      variants.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        if (field === 'netPrice') {
          if (parsedValue === '' || multiplier === null) {
            return { ...item, netPrice: parsedValue }
          }
          return {
            ...item,
            netPrice: parsedValue,
            grossPrice: round2(parsedValue * multiplier),
          }
        }

        if (field === 'grossPrice') {
          if (parsedValue === '' || multiplier === null || multiplier === 0) {
            return { ...item, grossPrice: parsedValue }
          }
          return {
            ...item,
            grossPrice: parsedValue,
            netPrice: round2(parsedValue / multiplier),
          }
        }

        return { ...item, [field]: parsedValue }
      }),
    )
  }

  if (loading) {
    return (
      <section className="adminPageSection">
        <div className="adminToolbar">
          <h2>{title}</h2>
        </div>
        <p>Ladowanie...</p>
      </section>
    )
  }

  return (
    <section className="adminPageSection">
      <div className="adminToolbar">
        <h2>{title}</h2>
      </div>

      <FormikWrapper className="adminProductForm" initialValues={initialValues} onSubmit={onSubmit}>
        {({ isSubmitting, status, values }) => (
          <>
            <div className="adminFormGrid">
              <Input id="name" placeholder="Nazwa" />
              <Select id="sellerId" placeholder="Sprzedawca" config={sellerOptions} />
              <Input id="vatRate" placeholder="Stawka VAT (%)" type="decimal" />
              <Select id="unit" placeholder="Jednostka" config={UNIT_OPTIONS} />
              <Input id="stockQuantity" placeholder="Stan magazynowy" type="decimal" />
              <Select id="status" placeholder="Status" config={STATUS_OPTIONS} />
            </div>
            <Textarea id="description" placeholder="Opis" />

            {Array.isArray(categoryOptions) && typeof setSelectedCategoryIds === 'function' ? (
              <section className="adminVariantsSection">
                <div className="adminToolbar">
                  <h3>Kategorie</h3>
                </div>
                <div className="adminVariantsGrid">
                  {categoryOptions.map((category) => {
                    const isSelected = selectedCategoryIds.includes(Number(category.id))
                    return (
                      <div className="adminVariantCard" key={category.id}>
                        <label className="adminVariantDefault">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => {
                              const nextIds = event.target.checked
                                ? [...selectedCategoryIds, Number(category.id)]
                                : selectedCategoryIds.filter((id) => Number(id) !== Number(category.id))
                              setSelectedCategoryIds([...new Set(nextIds)])
                              if (!event.target.checked && Number(primaryCategoryId) === Number(category.id)) {
                                setPrimaryCategoryId(nextIds[0] || null)
                              }
                              if (event.target.checked && !primaryCategoryId) {
                                setPrimaryCategoryId(Number(category.id))
                              }
                            }}
                          />
                          {category.name}
                        </label>
                        <label className="adminVariantDefault">
                          <input
                            type="radio"
                            name="primaryCategory"
                            checked={isSelected && Number(primaryCategoryId) === Number(category.id)}
                            disabled={!isSelected}
                            onChange={() => setPrimaryCategoryId(Number(category.id))}
                          />
                          Glowna
                        </label>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}

            {typeof setVariants === 'function' ? (
              <section className="adminVariantsSection">
                <div className="adminToolbar">
                  <h3>Warianty produktu</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setVariants([
                        ...variants,
                        {
                          id: null,
                          name: '',
                          unitAmount: 1,
                          unit: values.unit || 'pcs',
                          netPrice: 0,
                          grossPrice: 0,
                          vatRate: values.vatRate || 23,
                          stockQuantity: values.stockQuantity || 0,
                          status: values.status || 'draft',
                          isDefault: variants.length === 0,
                          position: variants.length,
                        },
                      ])
                    }
                  >
                    Dodaj wariant
                  </button>
                </div>
                <div className="adminVariantsGrid">
                  {variants.map((variant, index) => (
                    <div className="adminVariantCard" key={variant.id || `new-${index}`}>
                      <div className="adminVariantField">
                        <label htmlFor={`variant-name-${index}`}>Nazwa wariantu</label>
                        <input
                          id={`variant-name-${index}`}
                          type="text"
                          placeholder="np. 250 g"
                          value={variant.name || ''}
                          onChange={(event) =>
                            setVariants(
                              variants.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, name: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="adminVariantField">
                        <label htmlFor={`variant-unit-amount-${index}`}>Waga/objetosc</label>
                        <input
                          id={`variant-unit-amount-${index}`}
                          type="number"
                          step="0.001"
                          min="0.001"
                          placeholder="0.250"
                          value={variant.unitAmount ?? ''}
                          onChange={(event) =>
                            setVariants(
                              variants.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, unitAmount: (event.target.value === "" ? "" : Number(event.target.value)) }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="adminVariantField">
                        <label htmlFor={`variant-net-price-${index}`}>Cena netto</label>
                        <input
                          id={`variant-net-price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={variant.netPrice ?? ''}
                          onChange={(event) =>
                            updateVariantValue(index, 'netPrice', event.target.value, values.vatRate)
                          }
                        />
                      </div>
                      <div className="adminVariantField">
                        <label htmlFor={`variant-gross-price-${index}`}>Cena brutto</label>
                        <input
                          id={`variant-gross-price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={variant.grossPrice ?? ''}
                          onChange={(event) =>
                            updateVariantValue(index, 'grossPrice', event.target.value, values.vatRate)
                          }
                        />
                      </div>
                      <div className="adminVariantField">
                        <label htmlFor={`variant-stock-quantity-${index}`}>Stan magazynowy</label>
                        <input
                          id={`variant-stock-quantity-${index}`}
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="0"
                          value={variant.stockQuantity ?? ''}
                          onChange={(event) =>
                            setVariants(
                              variants.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, stockQuantity: (event.target.value === "" ? "" : Number(event.target.value)) }
                                  : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <label className="adminVariantDefault">
                        <input
                          type="radio"
                          name="defaultVariant"
                          checked={Boolean(variant.isDefault)}
                          onChange={() =>
                            setVariants(
                              variants.map((item, itemIndex) => ({
                                ...item,
                                isDefault: itemIndex === index,
                              })),
                            )
                          }
                        />
                        Domyslny
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setVariants(variants.filter((_, itemIndex) => itemIndex !== index))
                        }
                        disabled={variants.length <= 1}
                      >
                        Usun wariant
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <ImageDropzone
              images={images}
              setImages={setImages}
              existingImages={existingImages}
              onDeleteExistingImage={onDeleteExistingImage}
              onSetMainExistingImage={onSetMainExistingImage}
              isExistingActionLoading={isImagesActionLoading}
              disabled={isSubmitting}
            />

            {status ? <p className="adminFormError">{status}</p> : null}

            <div className="adminActions adminFormActions">
              <button type="submit" className="adminPrimaryButton" disabled={isSubmitting}>
                Zapisz
              </button>
              <button type="button" onClick={onCancel} disabled={isSubmitting}>
                Anuluj
              </button>
            </div>
          </>
        )}
      </FormikWrapper>
    </section>
  )
}

export default ProductFormView
