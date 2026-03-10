import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from 'components/AuthLayout'
import { useNotification } from 'components/GlobalNotification/index.js'
import UserService from 'services/userService'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const notification = useNotification()

  const handleSubmit = async (event) => {
    event.preventDefault()
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
      const text = response?.data?.error || 'Nie udalo sie ustawic nowego hasla.'
      setErrorMessage(text)
      notification.error(text)
      setIsSubmitting(false)
      return
    }

    notification.success('Haslo zostalo zmienione. Mozesz sie zalogowac.')
    setIsSubmitting(false)
  }

  return (
    <AuthLayout title="Nowe haslo" subtitle="Ustaw nowe haslo do konta">
      <form onSubmit={handleSubmit}>
        <label className="authLabel" htmlFor="reset-password">
          Nowe haslo
        </label>
        <input
          id="reset-password"
          className="authInput"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
        />

        <label className="authLabel" htmlFor="reset-password-repeat">
          Powtorz haslo
        </label>
        <input
          id="reset-password-repeat"
          className="authInput"
          type="password"
          value={passwordRepeat}
          onChange={(event) => setPasswordRepeat(event.target.value)}
          required
          autoComplete="new-password"
        />

        {errorMessage ? <p className="authError">{errorMessage}</p> : null}
        <button className="authButton" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz nowe haslo'}
        </button>

        <div className="authLinks">
          <Link to="/login">Przejdz do logowania</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage

