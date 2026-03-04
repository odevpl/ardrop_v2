import ProductsService from 'services/products'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { round2 } from './helpers'
import ProductFormView from './ProductFormView'

const initialValues = {
  name: '',
  description: '',
  netPrice: '',
  grossPrice: '',
  vatRate: '',
  status: 'draft',
}

const AddProduct = () => {
  const navigate = useNavigate()
  const [images, setImages] = useState([])

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null)
    const payload = {
      ...values,
      netPrice: round2(Number(values.netPrice)),
      grossPrice: round2(Number(values.grossPrice)),
      vatRate: round2(Number(values.vatRate)),
      description: values.description?.trim() || null,
    }

    const result = await ProductsService.createProduct(payload)

    if (result?.status && result.status >= 400) {
      setStatus(result?.data?.error || 'Nie udalo sie zapisac produktu')
      setSubmitting(false)
      return
    }

    const productId = result?.product?.id
    if (!productId) {
      setStatus('Brak ID produktu po zapisie')
      setSubmitting(false)
      return
    }

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
    <ProductFormView
      title="Dodaj produkt"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      images={images}
      setImages={setImages}
      onCancel={() => navigate(-1)}
    />
  )
}

export default AddProduct
