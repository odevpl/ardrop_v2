import { useCallback, useEffect, useState } from 'react'
import LoadingSpinner from 'components/LoadingSpinner'

const FetchWrapper = ({
  component,
  name,
  id,
  connector,
  filters: defaultFilters = {},
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState(defaultFilters)
  const [data, setData] = useState(null)

  const Component = component

  const fetchElement = useCallback(
    async (nextFilters = filters) => {
      if (id !== 'new') {
        setIsLoading(true)
        try {
          const response = await connector(nextFilters)
          setData(response)
        } catch (error) {
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

  if (isLoading && !data) {
    return <LoadingSpinner />
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
