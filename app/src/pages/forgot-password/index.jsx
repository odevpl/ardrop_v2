import { useState } from 'react'
import { Link } from 'react-router-dom'
import UserService from 'services/userService'
import '../login/login.scss'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)
    await UserService.forgotPassword({ email })
    setMessage('Jesli konto istnieje, wyslalismy link do resetu hasla.')
    setIsSubmitting(false)
  }

  return (
    <main className="loginPage">
      <form className="loginCard" onSubmit={handleSubmit}>
        <h1 className="loginTitle">Przypomnienie hasla</h1>

        <label className="loginLabel" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          className="loginInput"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />

        {message ? <p>{message}</p> : null}

        <button className="loginButton" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wysylanie...' : 'Wyslij link'}
        </button>

        <div className="loginLinks">
          <Link to="/login">Wroc do logowania</Link>
        </div>
      </form>
    </main>
  )
}

export default ForgotPasswordPage
