import http from './http'

const objectToQueryString = (params) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export const apiRequest = async ({ method, url, params = null, data = null }) => {
  try {
    const stringifyParams = params ? objectToQueryString(params) : ''
    const response = await http({
      method,
      url: `/${url}${stringifyParams}`,
      data: method !== 'DELETE' ? data : undefined,
    })

    return response.data
  } catch (error) {
    return error?.response
  }
}

export const apiGet = (config) => apiRequest({ method: 'GET', ...config })
export const apiPost = (config) => apiRequest({ method: 'POST', ...config })
export const apiPut = (config) => apiRequest({ method: 'PUT', ...config })

export default {
  apiGet,
  apiPost,
  apiPut,
}
