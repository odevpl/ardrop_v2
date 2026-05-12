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
  syncSearchParamKeys = PAGINATION_FILTER_KEYS,
  ...props
}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeSearchParamKeys = Array.isArray(syncSearchParamKeys)
    ? syncSearchParamKeys.filter((key) => Object.prototype.hasOwnProperty.call(defaultFilters, key))
    : PAGINATION_FILTER_KEYS
  const getInitialFilters = () => {
    const mergedFilters = { ...defaultFilters }

    if (!syncSearchParams) {
      return mergedFilters
    }

    activeSearchParamKeys.forEach((key) => {
      const paramValue = searchParams.get(key)
      if (paramValue === null) {
        return
      }

      if (PAGINATION_FILTER_KEYS.includes(key)) {
        const parsedValue = Number(paramValue)
        if (!Number.isNaN(parsedValue)) {
          mergedFilters[key] = parsedValue
        }
        return
      }

      mergedFilters[key] = paramValue
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

    if (activeSearchParamKeys.length === 0) {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    activeSearchParamKeys.forEach((key) => {
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
  }, [activeSearchParamKeys, filters, searchParams, setSearchParams, syncSearchParams])

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
