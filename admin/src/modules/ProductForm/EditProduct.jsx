import ProductsService from 'services/products'
import SellersService from 'services/sellers'
import { useNotification } from 'components/GlobalNotification/index.js'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeImageUrl, round2 } from './helpers'
import ProductFormView from './ProductFormView'

const EditProduct = ({ id }) => {
  const navigate = useNavigate()
  const notification = useNotification()
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [isImagesActionLoading, setIsImagesActionLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sellers, setSellers] = useState([])
  const [initialValues, setInitialValues] = useState({
    sellerId: '',
    name: '',
    description: '',
    netPrice: '',
    grossPrice: '',
    vatRate: '',
    unit: 'pcs',
    stockQuantity: '',
    status: 'draft',
  })

  useEffect(() => {
    const load = async () => {
      const [productResponse, sellersResponse] = await Promise.all([
        ProductsService.getProductById(id),
        SellersService.getSellers({ page: 1, limit: 1000, sortBy: 'companyName' }),
      ])

      setSellers(sellersResponse?.data || [])
      if (productResponse?.status && productResponse.status >= 400) {
        setLoading(false)
        return
      }
      const product = productResponse?.data || productResponse?.product
      if (product) {
        setInitialValues({
          sellerId: product.sellerId ?? '',
          name: product.name || '',
          description: product.description || '',
          netPrice: product.netPrice ?? '',
          grossPrice: product.grossPrice ?? '',
          vatRate: product.vatRate ?? '',
          unit: product.unit || 'pcs',
          stockQuantity: product.stockQuantity ?? '',
          status: product.status || 'draft',
        })
        setExistingImages(
          Array.isArray(product.images)
            ? product.images.map((image) => ({
                ...image,
                url: normalizeImageUrl(image.url),
              }))
            : [],
        )
      }
      setLoading(false)
    }
    load()
  }, [id])

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
      unit: values.unit || 'pcs',
      stockQuantity: Number(values.stockQuantity || 0),
      description: values.description?.trim() || null,
    }

    const result = await ProductsService.updateProduct({ id, payload })
    if (result?.status && result.status >= 400) {
      notification.error(result?.data?.error || 'Nie udalo sie zaktualizowac produktu')
      setSubmitting(false)
      return
    }

    if (images.length > 0) {
      for (const file of images) {
        const uploadResult = await ProductsService.uploadProductImage({ productId: id, file })
        if (uploadResult?.status && uploadResult.status >= 400) {
          notification.error(uploadResult?.data?.error || 'Nie udalo sie przeslac jednego ze zdjec')
          setSubmitting(false)
          return
        }
      }
    }

    notification.success('Produkt zostal zaktualizowany')
    navigate('/products')
  }

  const handleDeleteExistingImage = async (image) => {
    setIsImagesActionLoading(true)
    const response = await ProductsService.deleteProductImage({
      productId: id,
      fileName: image.fileName,
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie usunac zdjecia')
      setIsImagesActionLoading(false)
      return
    }

    setExistingImages((prev) => prev.filter((item) => item.id !== image.id))
    notification.success('Zdjecie zostalo usuniete')
    setIsImagesActionLoading(false)
  }

  const handleSetMainExistingImage = async (image) => {
    setIsImagesActionLoading(true)
    const response = await ProductsService.setMainProductImage({
      productId: id,
      imageId: image.id,
    })

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || 'Nie udalo sie ustawic zdjecia glownego')
      setIsImagesActionLoading(false)
      return
    }

    setExistingImages((prev) =>
      prev.map((item) => ({
        ...item,
        isMain: item.id === image.id ? 1 : 0,
      })),
    )
    notification.success('Zmieniono zdjecie glowne')
    setIsImagesActionLoading(false)
  }

  return (
    <ProductFormView
      title="Edytuj produkt"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      images={images}
      setImages={setImages}
      sellerOptions={sellerOptions}
      existingImages={existingImages}
      onDeleteExistingImage={handleDeleteExistingImage}
      onSetMainExistingImage={handleSetMainExistingImage}
      isImagesActionLoading={isImagesActionLoading}
      onCancel={() => navigate(-1)}
      loading={loading}
    />
  )
}

export default EditProduct

