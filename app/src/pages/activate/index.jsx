import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthLayout from 'components/AuthLayout'
import { useNotification } from 'components/GlobalNotification/index.js'
import UserService from 'services/userService'

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
    <AuthLayout title="Aktywacja konta" subtitle="Finalizujemy aktywacje Twojego konta">
      {errorMessage ? <p className="authError">{errorMessage}</p> : null}
      {message ? <p className="authInfo">{message}</p> : null}
      <div className="authLinks">
        <Link to="/login">Przejdz do logowania</Link>
      </div>
    </AuthLayout>
  )
}

export default ActivatePage

