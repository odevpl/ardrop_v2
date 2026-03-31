import dayjs from 'dayjs'

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
  const date = dayjs(rawDate)
  if (!date.isValid()) return rawDate
  return date.format('DD.MM.YYYY HH:mm')
}

export const formatEta = (from, to) => {
  const fromDate = from ? dayjs(from) : null
  const toDate = to ? dayjs(to) : null
  const fromLabel = fromDate?.isValid() ? fromDate.format('DD.MM.YYYY') : from || null
  const toLabel = toDate?.isValid() ? toDate.format('DD.MM.YYYY') : to || null

  if (fromLabel && toLabel) return `${fromLabel} - ${toLabel}`
  if (fromLabel) return fromLabel
  if (toLabel) return toLabel
  return 'Do ustalenia'
}
