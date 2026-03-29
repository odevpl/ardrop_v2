import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import ApplicationLoading from 'components/ApplicationLoading'
import ConfigService from 'services/config'

const ConfigContext = createContext(null)

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadConfig = async () => {
      const response = await ConfigService.getConfig()

      if (response?.status && response.status >= 400) {
        console.error('Nie udalo sie pobrac konfiguracji aplikacji')
        setConfig({})
        setIsLoading(false)
        return
      }

      setConfig(response?.data || response || {})
      setIsLoading(false)
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

  if (isLoading || !config) {
    return <ApplicationLoading />
  }

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export const useConfig = () => {
  const context = useContext(ConfigContext)

  if (!context) {
    throw new Error('useConfig musi byc uzywany wewnatrz ConfigProvider')
  }

  return context
}
