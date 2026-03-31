import { NavLink } from 'react-router-dom'
import { useAuth } from '../../providers/authProvider'
import './sidebar-menu.scss'

const SidebarMenu = ({ config }) => {
  const { logout } = useAuth()

  return (
    <aside className="sidebarMenu">
      <div className="sidebarMenuBrand">
        <span className="sidebarMenuLogo">A</span>
        <div>
          <p className="sidebarMenuBrandTitle">AR DROP</p>
          <p className="sidebarMenuBrandSubtitle">Seller</p>
        </div>
      </div>

      {config.map((section) => (
        <div key={section.label} className="sidebarMenuGroup">
          <p className="sidebarMenuSectionLabel">{section.label}</p>
          <nav className="sidebarMenuNav" aria-label={section.label}>
            {section.items.map((item) => (
              <NavLink
                key={item.title}
                to={item.path}
                end={item.path === "/products" || item.path === "/orders"}
                className={({ isActive }) =>
                  `sidebarMenuItem${isActive ? ' sidebarMenuItemActive' : ''}`
                }
              >
                <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                <span className="sidebarMenuItemText">{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ))}

      <button type="button" className="sidebarLogoutButton" onClick={logout}>
        <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
        <span className="sidebarMenuItemText">Wyloguj</span>
      </button>
    </aside>
  )
}

export default SidebarMenu
