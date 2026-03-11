import ProductsService from 'services/products'
import SellersService from 'services/sellers'
import { useNotification } from 'components/GlobalNotification/index.js'
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
  unit: 'pcs',
  stockQuantity: '',
  status: 'draft',
}

const AddProduct = () => {
  const navigate = useNavigate()
  const notification = useNotification()
  const [images, setImages] = useState([])
  const [variants, setVariants] = useState([])
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
    if (!Array.isArray(variants) || variants.length === 0) {
      setStatus('Produkt musi miec co najmniej jeden wariant')
      setSubmitting(false)
      return
    }

    const normalizedVariants = variants.map((variant, index) => ({
      ...variant,
      isDefault: variants.some((item) => Boolean(item.isDefault))
        ? Boolean(variant.isDefault)
        : index === 0,
      position: Number.isFinite(Number(variant.position)) ? Number(variant.position) : index,
    }))
    const defaultVariant = normalizedVariants.find((variant) => Boolean(variant.isDefault)) || normalizedVariants[0]

    const payload = {
      ...values,
      sellerId: Number(values.sellerId),
      netPrice: round2(Number(defaultVariant?.netPrice || 0)),
      grossPrice: round2(Number(defaultVariant?.grossPrice || 0)),
      vatRate: round2(Number(values.vatRate)),
      unit: values.unit || 'pcs',
      stockQuantity: Number(values.stockQuantity || 0),
      description: values.description?.trim() || null,
      variants: normalizedVariants,
    }

    const result = await ProductsService.createProduct(payload)

    if (result?.status && result.status >= 400) {
      notification.error(result?.data?.error || 'Nie udalo sie zapisac produktu')
      setSubmitting(false)
      return
    }

    const productId = result?.data?.id || result?.product?.id
    if (!productId) {
      notification.error('Brak ID produktu po zapisie')
      setSubmitting(false)
      return
    }

    if (images.length > 0) {
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
    navigate('/products')
  }

  return (
    <ProductFormView
      title="Dodaj produkt"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      images={images}
      setImages={setImages}
      variants={variants}
      setVariants={setVariants}
      sellerOptions={sellerOptions}
      onCancel={() => navigate(-1)}
      loading={loading}
    />
  )
}

export default AddProduct

