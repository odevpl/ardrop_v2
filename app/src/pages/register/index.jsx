import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from 'components/AuthLayout'
import { useNotification } from 'components/GlobalNotification/index.js'
import UserService from 'services/userService'

const normalizeNip = (value) => String(value || '').replace(/\D+/g, '')

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [nip, setNip] = useState('')
  const [companyData, setCompanyData] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLookingUpCompany, setIsLookingUpCompany] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const notification = useNotification()

  const handleLookupCompany = async () => {
    const normalizedNip = normalizeNip(nip)
    setErrorMessage('')

    if (normalizedNip.length !== 10) {
      setCompanyData(null)
      setErrorMessage('NIP musi zawierac 10 cyfr.')
      return false
    }

    setIsLookingUpCompany(true)
    const response = await UserService.lookupCompanyByNip(normalizedNip)
    if (response?.status && response.status >= 400) {
      setCompanyData(null)
      setErrorMessage(response?.data?.error || 'Nie udalo sie pobrac danych firmy po NIP.')
      setIsLookingUpCompany(false)
      return false
    }

    setCompanyData(response?.data || null)
    setIsLookingUpCompany(false)
    return true
  }

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

    const normalizedNip = normalizeNip(nip)
    if (normalizedNip.length !== 10) {
      setErrorMessage('NIP musi zawierac 10 cyfr.')
      return
    }

    if (normalizeNip(companyData?.data?.nip || companyData?.nip || '') !== normalizedNip) {
      const lookupSucceeded = await handleLookupCompany()
      if (!lookupSucceeded) {
        return
      }
    }

    setIsSubmitting(true)
    const response = await UserService.register({
      email,
      password,
      role: 'CLIENT',
      nip: normalizedNip,
    })
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
    <AuthLayout title="Dolacz do nas" subtitle="Zaloz konto klienta">
      <form onSubmit={handleSubmit}>
        <label className="authLabel" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
          className="authInput"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />

        <label className="authLabel" htmlFor="register-nip">
          NIP firmy
        </label>
        <div className="authInlineRow">
          <input
            id="register-nip"
            className="authInput"
            type="text"
            value={nip}
            onChange={(event) => {
              setNip(event.target.value)
              setCompanyData(null)
            }}
            onBlur={() => {
              if (normalizeNip(nip).length === 10) {
                handleLookupCompany()
              }
            }}
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="Np. 5250001009"
          />
          <button
            className="authSecondaryButton"
            type="button"
            onClick={handleLookupCompany}
            disabled={isLookingUpCompany || isSubmitting}
          >
            {isLookingUpCompany ? 'Pobieranie...' : 'Pobierz dane'}
          </button>
        </div>

        {companyData?.data ? (
          <div className="authLookupCard">
            <p className="authLookupTitle">Dane firmy zostana uzupelnione automatycznie</p>
            <input
              className="authInput authInputReadonly"
              type="text"
              value={companyData.data.companyName || ''}
              readOnly
              aria-label="Nazwa firmy"
            />
            <input
              className="authInput authInputReadonly"
              type="text"
              value={companyData.data.address || ''}
              readOnly
              aria-label="Adres firmy"
            />
            <div className="authLookupGrid">
              <input
                className="authInput authInputReadonly"
                type="text"
                value={companyData.data.postalCode || ''}
                readOnly
                aria-label="Kod pocztowy firmy"
              />
              <input
                className="authInput authInputReadonly"
                type="text"
                value={companyData.data.city || ''}
                readOnly
                aria-label="Miasto firmy"
              />
            </div>
          </div>
        ) : null}

        <label className="authLabel" htmlFor="register-password">
          Haslo
        </label>
        <input
          id="register-password"
          className="authInput"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="new-password"
        />

        <label className="authLabel" htmlFor="register-password-repeat">
          Powtorz haslo
        </label>
        <input
          id="register-password-repeat"
          className="authInput"
          type="password"
          value={passwordRepeat}
          onChange={(event) => setPasswordRepeat(event.target.value)}
          required
          autoComplete="new-password"
        />

        {errorMessage ? <p className="authError">{errorMessage}</p> : null}
        <button className="authButton" type="submit" disabled={isSubmitting || isLookingUpCompany}>
          {isSubmitting ? 'Rejestracja...' : 'Zarejestruj'}
        </button>

        <div className="authLinks">
          <Link to="/login">Masz juz konto? Zaloguj sie</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage

