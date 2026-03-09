import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotification } from 'components/GlobalNotification/index.js'
import UserService from 'services/userService'
import '../login/login.scss'

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const notification = useNotification()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    if (password !== passwordRepeat) {
      setErrorMessage('Hasla musza byc takie same.')
      return
    }

    if (String(password).length < 8) {
      setErrorMessage('Haslo musi miec minimum 8 znakow.')
      return
    }

    setIsSubmitting(true)
    const response = await UserService.register({ email, password, role: 'CLIENT' })
    if (response?.status && response.status >= 400) {
      setErrorMessage(response?.data?.error || 'Rejestracja nie powiodla sie.')
      notification.error(response?.data?.error || 'Rejestracja nie powiodla sie.')
      setIsSubmitting(false)
      return
    }

    notification.success('Sprawdz email, aby aktywowac konto.')
    setIsSubmitting(false)
  }

  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h1 className="loginTitle">Rejestracja klienta</h1>

        <label className="loginLabel" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          className="loginInput"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />

        <label className="loginLabel" htmlFor="register-password">
          Haslo
        </label>
        <input
          id="register-password"
          className="loginInput"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
        />

        <label className="loginLabel" htmlFor="register-password-repeat">
          Powtorz haslo
        </label>
        <input
          id="register-password-repeat"
          className="loginInput"
          type="password"
          value={passwordRepeat}
          onChange={(event) => setPasswordRepeat(event.target.value)}
          required
          autoComplete="new-password"
        />

        {errorMessage ? <p className="loginError">{errorMessage}</p> : null}
        <button className="loginButton" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Rejestracja...' : 'Zarejestruj'}
        </button>

        <div className="loginLinks">
          <Link to="/login">Masz juz konto? Zaloguj sie</Link>
        </div>
      </form>
    </main>
  )
}

export default RegisterPage

