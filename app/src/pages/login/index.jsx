import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from 'components/AuthLayout'
import { useAuth } from '../../providers/authProvider'
import UserService from '../../services/userService'

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
        if (response?.user?.role !== 'CLIENT') {
          setErrorMessage('To konto nie ma dostepu do panelu klienta.')
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
    <AuthLayout title="Witaj!" subtitle="Zaloguj sie do panelu klienta">
      <form onSubmit={handleSubmit}>
        <label className="authLabel" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="authInput"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />

        <label className="authLabel" htmlFor="password">
          Haslo
        </label>
        <input
          id="password"
          className="authInput"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />

        {errorMessage ? <p className="authError">{errorMessage}</p> : null}

        <button className="authButton" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
        </button>

        <div className="authLinks">
          <Link to="/register">Zaloz konto</Link>
          <Link to="/forgot-password">Nie pamietasz hasla?</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default LoginPage
