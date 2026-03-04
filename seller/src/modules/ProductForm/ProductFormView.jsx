import FormikWrapper from 'components/FormikWrapper'
import Input from 'components/FormikWrapper/FormControls/Input'
import Select from 'components/FormikWrapper/FormControls/Select'
import Textarea from 'components/FormikWrapper/FormControls/Textarea'
import { useEffect, useRef } from 'react'
import { addProductValidationSchema, STATUS_OPTIONS } from './validation'
import ImageDropzone from './ImageDropzone'
import { parseNumber, round2 } from './helpers'

const PriceSync = ({ values, setFieldValue }) => {
  const prevRef = useRef({
    netPrice: values.netPrice,
    grossPrice: values.grossPrice,
    vatRate: values.vatRate,
  })
  const autoUpdatedFieldRef = useRef(null)

  useEffect(() => {
    if (values.vatRate === '' || values.vatRate === null || values.vatRate === undefined) {
      setFieldValue('vatRate', 23, false)
    }
  }, [])

  useEffect(() => {
    const prev = prevRef.current
    const changedNet = prev.netPrice !== values.netPrice
    const changedGross = prev.grossPrice !== values.grossPrice
    const changedVat = prev.vatRate !== values.vatRate

    const vat = parseNumber(values.vatRate)
    const net = parseNumber(values.netPrice)
    const gross = parseNumber(values.grossPrice)

    if (autoUpdatedFieldRef.current === 'grossPrice' && changedGross) {
      autoUpdatedFieldRef.current = null
      prevRef.current = values
      return
    }

    if (autoUpdatedFieldRef.current === 'netPrice' && changedNet) {
      autoUpdatedFieldRef.current = null
      prevRef.current = values
      return
    }

    if (vat !== null && vat >= 0) {
      const multiplier = 1 + vat / 100

      if (changedNet && net !== null) {
        const roundedNet = round2(net)
        if (Math.abs(net - roundedNet) > 0.009) {
          autoUpdatedFieldRef.current = 'netPrice'
          setFieldValue('netPrice', roundedNet, false)
          prevRef.current = values
          return
        }
        const nextGross = round2(roundedNet * multiplier)
        if (gross === null || Math.abs(gross - nextGross) > 0.009) {
          autoUpdatedFieldRef.current = 'grossPrice'
          setFieldValue('grossPrice', nextGross, false)
        }
      } else if (changedGross && gross !== null) {
        const roundedGross = round2(gross)
        if (Math.abs(gross - roundedGross) > 0.009) {
          autoUpdatedFieldRef.current = 'grossPrice'
          setFieldValue('grossPrice', roundedGross, false)
          prevRef.current = values
          return
        }
        const nextNet = round2(roundedGross / multiplier)
        if (net === null || Math.abs(net - nextNet) > 0.009) {
          autoUpdatedFieldRef.current = 'netPrice'
          setFieldValue('netPrice', nextNet, false)
        }
      } else if (changedVat && net !== null) {
        const nextGross = round2(net * multiplier)
        if (gross === null || Math.abs(gross - nextGross) > 0.009) {
          autoUpdatedFieldRef.current = 'grossPrice'
          setFieldValue('grossPrice', nextGross, false)
        }
      }
    }

    prevRef.current = values
  }, [values, setFieldValue])

  return null
}

const ProductFormView = ({
  title,
  initialValues,
  onSubmit,
  images,
  setImages,
  existingImages = [],
  onDeleteExistingImage,
  onSetMainExistingImage,
  isImagesActionLoading = false,
  onCancel,
  loading = false,
}) => {
  if (loading) {
    return (
      <section className="sellerPageSection">
        <div className="sellerToolbar">
          <h2>{title}</h2>
        </div>
        <p>Ladowanie...</p>
      </section>
    )
  }

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>{title}</h2>
      </div>

      <FormikWrapper
        className="sellerForm"
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={addProductValidationSchema}
      >
        {({ isSubmitting, status, values, setFieldValue }) => (
          <>
            <PriceSync values={values} setFieldValue={setFieldValue} />

            <div className="sellerFormGrid">
              <Input id="name" placeholder="Nazwa" />
              <Input id="netPrice" placeholder="Cena netto" type="decimal" />
              <Input id="grossPrice" placeholder="Cena brutto" type="decimal" />
              <Input id="vatRate" placeholder="Stawka VAT (%)" type="decimal" />
              <Select id="status" placeholder="Status" config={STATUS_OPTIONS} />
            </div>

            <Textarea id="description" placeholder="Opis" />

            <ImageDropzone
              images={images}
              setImages={setImages}
              existingImages={existingImages}
              onDeleteExistingImage={onDeleteExistingImage}
              onSetMainExistingImage={onSetMainExistingImage}
              isExistingActionLoading={isImagesActionLoading}
              disabled={isSubmitting}
            />

            {status ? <p className="sellerFormError">{status}</p> : null}

            <div className="sellerActions sellerFormActions">
              <button type="submit" className="sellerPrimaryButton" disabled={isSubmitting}>
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
