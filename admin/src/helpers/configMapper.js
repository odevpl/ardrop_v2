export const mapConfigValue = (dict, value, fallback = '-') => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  const mappedValue = dict?.[String(value)]
  return mappedValue ?? String(value)
}
