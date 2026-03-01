import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import fallbackConfig from '../../stories/apiConfigs.json'
import http from '../services/http'

const ConfigContext = createContext(null)

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(fallbackConfig)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await http.get('/configs')
        if (response.data && typeof response.data === 'object') {
          setConfig(response.data)
        }
      } catch (error) {
        console.error('Nie udalo sie pobrac configow, uzywam fallbacku:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfig()
  }, [])

  const value = useMemo(
    () => ({
      config,
      isLoading,
    }),
    [config, isLoading],
  )

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export const useConfig = () => {
  const context = useContext(ConfigContext)

  if (!context) {
    throw new Error('useConfig musi byc uzywany wewnatrz ConfigProvider')
  }

  return context
}
