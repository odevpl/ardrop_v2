import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import ApplicationLoading from '../components/ApplicationLoading'
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

  const [authToken, setAuthToken] = useState(localAuthToken || null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = () => {
    setAuthToken(null)
    setRole(null)
    localStorage.removeItem('authToken')
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/')
    }
  }

  const checkUser = async () => {
    const result = await UserService.me()
    if (result?.status === 401) {
      logout()
      setIsLoading(false)
      return
    }

    if (result?.user?.email) {
      setRole(result.user.role || null)
    } else {
      logout()
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (authToken) {
      checkUser()
    } else {
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/')
      }
      setIsLoading(false)
    }
  }, [authToken])

  const authContextValue = useMemo(
    () => ({
      authToken,
      setAuthToken,
      setRole,
      role,
      logout,
    }),
    [authToken, role],
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
