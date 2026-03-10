import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from 'components/AuthLayout'
import { useNotification } from 'components/GlobalNotification/index.js'
import UserService from 'services/userService'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const notification = useNotification()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    await UserService.forgotPassword({ email })
    notification.success('Jesli konto istnieje, wyslalismy link do resetu hasla.')
    setIsSubmitting(false)
  }

  return (
    <AuthLayout title="Reset hasla" subtitle="Podaj email, a wyslemy link resetujacy">
      <form onSubmit={handleSubmit}>
        <label className="authLabel" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          className="authInput"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />

        <button className="authButton" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wysylanie...' : 'Wyslij link'}
        </button>

        <div className="authLinks">
          <Link to="/login">Wroc do logowania</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage

