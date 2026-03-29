export const formatPrice = (value) => `${Number(value || 0).toFixed(2)} zl`

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export const resolveThumbUrl = (item) => {
  const images = Array.isArray(item?.productSnapshot?.images) ? item.productSnapshot.images : []
  const main = images.find((image) => Number(image?.isMain) === 1) || images[0]
  if (!main?.fileName) return ''
  return `${apiBaseUrl}/uploads/images/thumbs/${main.fileName.replace(/\.[^.]+$/, '.jpg')}`
}

export const formatDateTime = (rawDate) => {
  if (!rawDate) return '-'
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return rawDate
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

export const formatEta = (from, to) => {
  if (from && to) return `${formatDateTime(from)} - ${formatDateTime(to)}`
  if (from) return formatDateTime(from)
  if (to) return formatDateTime(to)
  return 'Do ustalenia'
}
