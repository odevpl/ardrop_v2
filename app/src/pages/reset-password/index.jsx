import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import UserService from 'services/userService'
import '../login/login.scss'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!token) {
      setErrorMessage('Brak tokenu resetu hasla.')
      return
    }

    if (password !== passwordRepeat) {
      setErrorMessage('Hasla musza byc takie same.')
      return
    }

    if (String(password).length < 8) {
      setErrorMessage('Haslo musi miec minimum 8 znakow.')
      return
    }

    setIsSubmitting(true)
    const response = await UserService.resetPassword({ token, password })
    if (response?.status && response.status >= 400) {
      setErrorMessage(response?.data?.error || 'Nie udalo sie ustawic nowego hasla.')
      setIsSubmitting(false)
      return
    }

    setMessage('Haslo zostalo zmienione. Mozesz sie zalogowac.')
    setIsSubmitting(false)
  }

  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h1 className="loginTitle">Ustaw nowe haslo</h1>

        <label className="loginLabel" htmlFor="reset-password">
          Nowe haslo
        </label>
        <input
          id="reset-password"
          className="loginInput"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
        />

        <label className="loginLabel" htmlFor="reset-password-repeat">
          Powtorz haslo
        </label>
        <input
          id="reset-password-repeat"
          className="loginInput"
          type="password"
          value={passwordRepeat}
          onChange={(event) => setPasswordRepeat(event.target.value)}
          required
          autoComplete="new-password"
        />

        {errorMessage ? <p className="loginError">{errorMessage}</p> : null}
        {message ? <p>{message}</p> : null}

        <button className="loginButton" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz nowe haslo'}
        </button>

        <div className="loginLinks">
          <Link to="/login">Przejdz do logowania</Link>
        </div>
      </form>
    </main>
  )
}

export default ResetPasswordPage
