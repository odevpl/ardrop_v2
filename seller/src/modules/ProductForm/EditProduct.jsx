import ProductsService from 'services/products'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeImageUrl, round2 } from './helpers'
import ProductFormView from './ProductFormView'

const EditProduct = ({ id }) => {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [isImagesActionLoading, setIsImagesActionLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialValues, setInitialValues] = useState({
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
      const response = await ProductsService.getProductById(id)
      if (response?.status && response.status >= 400) {
        setLoading(false)
        return
      }
      const product = response?.product
      if (product) {
        setInitialValues({
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

    const result = await ProductsService.updateProduct({ id, payload })
    if (result?.status && result.status >= 400) {
      setStatus(result?.data?.error || 'Nie udalo sie zaktualizowac produktu')
      setSubmitting(false)
      return
    }

    if (images.length > 0) {
      for (const file of images) {
        const uploadResult = await ProductsService.uploadProductImage({ productId: id, file })
        if (uploadResult?.status && uploadResult.status >= 400) {
          setStatus(uploadResult?.data?.error || 'Nie udalo sie przeslac jednego ze zdjec')
          setSubmitting(false)
          return
        }
      }
    }

    navigate(-1)
  }

  const handleDeleteExistingImage = async (image) => {
    setIsImagesActionLoading(true)
    const response = await ProductsService.deleteProductImage({
      productId: id,
      fileName: image.fileName,
    })

    if (!(response?.status && response.status >= 400)) {
      setExistingImages((prev) => prev.filter((item) => item.id !== image.id))
    }
    setIsImagesActionLoading(false)
  }

  const handleSetMainExistingImage = async (image) => {
    setIsImagesActionLoading(true)
    const response = await ProductsService.setMainProductImage({
      productId: id,
      imageId: image.id,
    })

    if (!(response?.status && response.status >= 400)) {
      setExistingImages((prev) =>
        prev.map((item) => ({
          ...item,
          isMain: item.id === image.id ? 1 : 0,
        })),
      )
    }
    setIsImagesActionLoading(false)
  }

  const handleDeleteProduct = async () => {
    const confirmed = window.confirm('Czy na pewno chcesz usunac ten produkt?')
    if (!confirmed) {
      return
    }

    const response = await ProductsService.deleteProduct(id)
    if (response?.status && response.status >= 400) {
      window.alert(response?.data?.error || 'Nie udalo sie usunac produktu')
      return
    }

    navigate('/products')
  }

  return (
    <ProductFormView
      title="Edytuj produkt"
      initialValues={initialValues}
      onSubmit={handleSubmit}
      images={images}
      setImages={setImages}
      existingImages={existingImages}
      onDeleteExistingImage={handleDeleteExistingImage}
      onSetMainExistingImage={handleSetMainExistingImage}
      isImagesActionLoading={isImagesActionLoading}
      onDelete={handleDeleteProduct}
      onCancel={() => navigate(-1)}
      loading={loading}
    />
  )
}

export default EditProduct
