import ApplicationLoading from 'components/ApplicationLoading'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import UserService from '../services/userService'

export const AuthContext = createContext(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

const AuthProvider = ({ loggedChildren, noLoggedChildren }) => {
  const localAuthToken = localStorage.getItem('authToken')
  const localRefreshToken = localStorage.getItem('refreshToken')

  const [authToken, setAuthToken] = useState(localAuthToken || null)
  const [refreshToken, setRefreshToken] = useState(localRefreshToken || null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = () => {
    setAuthToken(null)
    setRefreshToken(null)
    setRole(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
  }

  const checkUser = async () => {
    const result = await UserService.me()
    if (result?.status === 401) {
      const refreshResult = await UserService.refresh()
      if (refreshResult?.status === 401) {
        logout()
        setIsLoading(false)
      } else {
        if (refreshResult?.authToken) {
          setAuthToken(refreshResult.authToken)
          localStorage.setItem('authToken', refreshResult.authToken)
        }
        const refreshedUser = await UserService.me()
        if (refreshedUser?.email) {
          setRole(refreshedUser.role || null)
        }
        setIsLoading(false)
      }
    }
    if (result?.email) {
      setRole(result.role || null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authToken) {
      checkUser()
    } else {
      setIsLoading(false)
    }
  }, [authToken])

  const authContextValue = useMemo(
    () => ({
      authToken,
      refreshToken,
      setAuthToken,
      setRefreshToken,
      setRole,
      role,
      logout,
    }),
    [authToken, refreshToken, role],
  )

  if (isLoading) {
    return <ApplicationLoading />
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {authToken ? loggedChildren : noLoggedChildren}
    </AuthContext.Provider>
  )
}

export default AuthProvider
