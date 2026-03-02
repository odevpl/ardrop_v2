import { useState } from 'react'
import { useAuth } from '../../providers/authProvider'
import UserService from '../../services/userService'
import './login.scss'

function LoginPage() {
  const { setAuthToken, setRole } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await UserService.login({ email, password })

      if (response?.token) {
        if (response?.user?.role !== 'SELLER') {
          setErrorMessage('To konto nie ma dostepu do panelu sprzedawcy.')
          setIsSubmitting(false)
          return
        }

        localStorage.setItem('authToken', response.token)
        setAuthToken(response.token)
        setRole(response?.user?.role || null)
      } else {
        setErrorMessage('Nieprawidlowy email lub haslo.')
      }
    } catch (error) {
      setErrorMessage('Logowanie nie powiodlo sie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h1 className="loginTitle">Logowanie sprzedawcy</h1>

        <label className="loginLabel" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="loginInput"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />

        <label className="loginLabel" htmlFor="password">
          Haslo
        </label>
        <input
          id="password"
          className="loginInput"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />

        {errorMessage ? <p className="loginError">{errorMessage}</p> : null}

        <button className="loginButton" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
        </button>
      </form>
    </main>
  )
}

export default LoginPage
