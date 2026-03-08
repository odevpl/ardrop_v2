import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import UserService from 'services/userService'
import '../login/login.scss'

function ActivatePage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [message, setMessage] = useState('Aktywacja konta...')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const activate = async () => {
      if (!token) {
        setErrorMessage('Brak tokenu aktywacyjnego.')
        setMessage('')
        return
      }

      const response = await UserService.activate({ token })
      if (response?.status && response.status >= 400) {
        setErrorMessage(response?.data?.error || 'Nie udalo sie aktywowac konta.')
        setMessage('')
        return
      }

      setMessage('Konto aktywowane, mozesz sie zalogowac.')
    }

    activate()
  }, [token])

  return (
    <main className="loginPage">
      <div className="loginCard">
        <h1 className="loginTitle">Aktywacja konta</h1>
        {errorMessage ? <p className="loginError">{errorMessage}</p> : null}
        {message ? <p>{message}</p> : null}
        <div className="loginLinks">
          <Link to="/login">Przejdz do logowania</Link>
        </div>
      </div>
    </main>
  )
}

export default ActivatePage
