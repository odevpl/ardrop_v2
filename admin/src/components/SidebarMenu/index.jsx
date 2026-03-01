import { NavLink } from 'react-router-dom'
import { useAuth } from '../../providers/authProvider'
import './sidebar-menu.scss'

const SidebarMenu = ({ config }) => {
  const { logout } = useAuth()

  return (
    <aside className="sidebarMenu">
      <div className="sidebarMenuBrand">
        <i className="fa-solid fa-chart-simple" aria-hidden="true" />
      </div>

      <nav className="sidebarMenuNav" aria-label="Main navigation">
        {config.map((item) => (
          <NavLink
            key={item.title}
            to={item.path}
            className={({ isActive }) =>
              `sidebarMenuItem${isActive ? ' sidebarMenuItemActive' : ''}`
            }
          >
            <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebarLogoutButton" onClick={logout}>
        <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
        <span>Wyloguj</span>
      </button>
    </aside>
  )
}

export default SidebarMenu
