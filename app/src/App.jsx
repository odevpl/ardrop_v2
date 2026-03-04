import SidebarMenu from './components/SidebarMenu'
import { SIDEBAR_MENU_CONFIG } from './components/SidebarMenu/sidebar.config'
import HomePage from 'pages/home'
import './App.scss'

function App() {
  return (
    <div className="clientLayout">
      <aside className="clientSidebarColumn">
        <div className="clientLogoWrap" aria-label="Logo aplikacji">
          <img className="clientLogoImage" src="/logo.png" alt="Airdrop" />
        </div>
        <SidebarMenu config={SIDEBAR_MENU_CONFIG} />
      </aside>
      <main className="clientMain">
        <HomePage />
      </main>
    </div>
  )
}

export default App

