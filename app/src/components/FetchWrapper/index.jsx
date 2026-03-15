import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '../LoadingSpinner'

const PAGINATION_FILTER_KEYS = ['page', 'limit']

const FetchWrapper = ({
  component,
  name,
  id,
  connector,
  filters: defaultFilters = {},
  syncSearchParams = true,
  ...props
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const getInitialFilters = () => {
    const mergedFilters = { ...defaultFilters }

    if (!syncSearchParams) {
      return mergedFilters
    }

    PAGINATION_FILTER_KEYS.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(defaultFilters, key)) {
        return
      }

      const paramValue = searchParams.get(key)
      if (paramValue === null) {
        return
      }

      const parsedValue = Number(paramValue)
      if (!Number.isNaN(parsedValue)) {
        mergedFilters[key] = parsedValue
      }
    })

    return mergedFilters
  }

  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState(getInitialFilters)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const Component = component

  const fetchElement = useCallback(
    async (nextFilters = filters) => {
      if (id !== 'new') {
        setIsLoading(true)
        setError(null)
        try {
          const response = await connector(nextFilters)
          if (response?.status && response.status >= 400) {
            throw new Error(response?.data?.error || response?.statusText || 'Blad pobierania danych')
          }
          setData(response)
        } catch (error) {
          setError(error)
          if (typeof window?.showNotification === 'function') {
            window.showNotification(`Komponent ${name} nie pobral danych`, 'error')
          } else {
            console.error(`Komponent ${name} nie pobral danych`, error)
          }
        } finally {
          setIsLoading(false)
        }
      } else {
        setData({})
        setIsLoading(false)
      }
    },
    [connector, filters, id, name],
  )

  useEffect(() => {
    fetchElement(filters)
  }, [fetchElement, filters])

  useEffect(() => {
    if (!syncSearchParams) {
      return
    }

    const hasPaginationFilters = PAGINATION_FILTER_KEYS.some((key) =>
      Object.prototype.hasOwnProperty.call(defaultFilters, key),
    )

    if (!hasPaginationFilters) {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    PAGINATION_FILTER_KEYS.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(defaultFilters, key)) {
        return
      }

      const value = filters?.[key]
      if (value === undefined || value === null || value === '') {
        nextSearchParams.delete(key)
      } else {
        nextSearchParams.set(key, String(value))
      }
    })
    if (nextSearchParams.toString() !== searchParams.toString()) {
      setSearchParams(nextSearchParams, { replace: true })
    }
  }, [defaultFilters, filters, searchParams, setSearchParams, syncSearchParams])

  if (isLoading && !data) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div>
        <p>Nie udalo sie pobrac danych.</p>
        <button type="button" onClick={() => fetchElement(filters)}>
          Sprobuj ponownie
        </button>
      </div>
    )
  }

  if (!data) {
    return <div>Brak danych.</div>
  }

  return (
    <Component
      payload={data}
      refetch={fetchElement}
      filters={filters}
      setFilters={(value) => {
        setFilters(value)
      }}
      {...props}
    />
  )
}

export default FetchWrapper
