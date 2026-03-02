import FormikWrapper from 'components/FormikWrapper'
import Input from 'components/FormikWrapper/FormControls/Input'
import Select from 'components/FormikWrapper/FormControls/Select'
import Textarea from 'components/FormikWrapper/FormControls/Textarea'
import ProductsService from 'services/products'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addProductValidationSchema, STATUS_OPTIONS } from './validation'
import ImageDropzone from './ImageDropzone'

const initialValues = {
  name: '',
  description: '',
  netPrice: '',
  grossPrice: '',
  vatRate: '',
  status: 'draft',
}

const AddProductModule = () => {
  const navigate = useNavigate()
  const [images, setImages] = useState([])

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null)
    const payload = {
      ...values,
      netPrice: Number(values.netPrice),
      grossPrice: Number(values.grossPrice),
      vatRate: Number(values.vatRate),
      description: values.description?.trim() || null,
    }

    const result = await ProductsService.createProduct(payload)

    if (result?.status && result.status >= 400) {
      setStatus(result?.data?.error || 'Nie udalo sie zapisac produktu')
      setSubmitting(false)
      return
    }

    const productId = result?.product?.id

    if (productId && images.length > 0) {
      for (const file of images) {
        const uploadResult = await ProductsService.uploadProductImage({ productId, file })
        if (uploadResult?.status && uploadResult.status >= 400) {
          setStatus(uploadResult?.data?.error || 'Nie udalo sie przeslac jednego ze zdjec')
          setSubmitting(false)
          return
        }
      }
    }

    navigate(-1)
  }

  return (
    <section className="sellerPageSection">
      <div className="sellerToolbar">
        <h2>Dodaj produkt</h2>
      </div>

      <FormikWrapper
        className="sellerForm"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validationSchema={addProductValidationSchema}
      >
        {({ isSubmitting, status }) => (
          <>
            <div className="sellerFormGrid">
              <Input id="name" placeholder="Nazwa" />
              <Input id="netPrice" placeholder="Cena netto" type="decimal" />
              <Input id="grossPrice" placeholder="Cena brutto" type="decimal" />
              <Input id="vatRate" placeholder="Stawka VAT (%)" type="decimal" />
              <Select id="status" placeholder="Status" config={STATUS_OPTIONS} />
            </div>

            <Textarea id="description" placeholder="Opis" />

            <ImageDropzone images={images} setImages={setImages} disabled={isSubmitting} />

            {status ? <p className="sellerFormError">{status}</p> : null}

            <div className="sellerActions sellerFormActions">
              <button type="submit" className="sellerPrimaryButton" disabled={isSubmitting}>
                Zapisz
              </button>
              <button type="button" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Anuluj
              </button>
            </div>
          </>
        )}
      </FormikWrapper>
    </section>
  )
}

export default AddProductModule
