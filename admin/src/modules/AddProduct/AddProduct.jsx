import ProductsService from 'services/products'
import SellersService from 'services/sellers'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { round2 } from './helpers'
import ProductFormView from './ProductFormView'

const initialValues = {
  sellerId: '',
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
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSellers = async () => {
      const response = await SellersService.getSellers({ page: 1, limit: 1000, sortBy: 'companyName' })
      setSellers(response?.data || [])
      setLoading(false)
    }
    loadSellers()
  }, [])

  const sellerOptions = useMemo(() => {
    return sellers.reduce((acc, seller) => {
      acc[seller.id] = seller.companyName
      return acc
    }, {})
  }, [sellers])

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null)
    if (!values.sellerId) {
      setStatus('Sprzedawca jest wymagany')
      setSubmitting(false)
      return
    }

    const payload = {
      ...values,
      sellerId: Number(values.sellerId),
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

    const productId = result?.data?.id || result?.product?.id
    if (!productId) {
      setStatus('Brak ID produktu po zapisie')
      setSubmitting(false)
      return
    }

    if (images.length > 0) {
      for (const file of images) {
        const uploadResult = await ProductsService.uploadProductImage({ productId, file })
        if (uploadResult?.status && uploadResult.status >= 400) {
          setStatus(uploadResult?.data?.error || 'Nie udalo sie przeslac jednego ze zdjec')
          setSubmitting(false)
          return
        }
      }
    }

    navigate('/products')
  }

  return (
    <ProductFormView
      title="Dodaj produkt"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      images={images}
      setImages={setImages}
      sellerOptions={sellerOptions}
      onCancel={() => navigate(-1)}
      loading={loading}
    />
  )
}

export default AddProduct
