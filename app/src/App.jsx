import { useAuth } from './providers/authProvider'

function App() {
  const { role, logout } = useAuth()

  return (
    <main style={{ padding: 24 }}>
      <h1>Panel klienta</h1>
      <p>Zalogowano jako: {role || 'CLIENT'}</p>
      <button type="button" onClick={logout}>
        Wyloguj
      </button>
    </main>
  )
}

export default App
