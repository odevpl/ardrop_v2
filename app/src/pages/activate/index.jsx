import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useNotification } from 'components/GlobalNotification/index.js'
import UserService from 'services/userService'
import '../login/login.scss'

function ActivatePage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [message, setMessage] = useState('Aktywacja konta...')
  const [errorMessage, setErrorMessage] = useState('')
  const notification = useNotification()

  useEffect(() => {
    const activate = async () => {
      if (!token) {
        const text = 'Brak tokenu aktywacyjnego.'
        setErrorMessage(text)
        notification.error(text)
        setMessage('')
        return
      }

      const response = await UserService.activate({ token })
      if (response?.status && response.status >= 400) {
        const text = response?.data?.error || 'Nie udalo sie aktywowac konta.'
        setErrorMessage(text)
        notification.error(text)
        setMessage('')
        return
      }

      setMessage('Konto aktywowane, mozesz sie zalogowac.')
      notification.success('Konto aktywowane, mozesz sie zalogowac.')
    }

    activate()
  }, [token, notification])

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

