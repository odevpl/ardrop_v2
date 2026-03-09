import ProductsService from 'services/products'
import { useNotification } from 'components/GlobalNotification/index.js'
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
  unit: 'pcs',
  stockQuantity: '',
  status: 'draft',
}

const AddProduct = () => {
  const navigate = useNavigate()
  const notification = useNotification()
  const [images, setImages] = useState([])

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null)
    const payload = {
      ...values,
      netPrice: round2(Number(values.netPrice)),
      grossPrice: round2(Number(values.grossPrice)),
      vatRate: round2(Number(values.vatRate)),
      unit: values.unit || 'pcs',
      stockQuantity: Number(values.stockQuantity || 0),
      description: values.description?.trim() || null,
    }

    const result = await ProductsService.createProduct(payload)

    if (result?.status && result.status >= 400) {
      notification.error(result?.data?.error || 'Nie udalo sie zapisac produktu')
      setSubmitting(false)
      return
    }

    const productId = result?.product?.id
    if (!productId) {
      notification.error('Brak ID produktu po zapisie')
      setSubmitting(false)
      return
    }

    if (productId && images.length > 0) {
      for (const file of images) {
        const uploadResult = await ProductsService.uploadProductImage({ productId, file })
        if (uploadResult?.status && uploadResult.status >= 400) {
          notification.error(uploadResult?.data?.error || 'Nie udalo sie przeslac jednego ze zdjec')
          setSubmitting(false)
          return
        }
      }
    }

    notification.success('Produkt zostal zapisany')
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

