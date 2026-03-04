export const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  const normalized = String(value).replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const round2 = (value) => Math.round(value * 100) / 100

export const normalizeImageUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const normalizedBase = String(baseUrl).replace(/\/+$/, '')
  const normalizedPath = String(url).startsWith('/') ? url : `/${url}`
  return `${normalizedBase}${normalizedPath}`
}
