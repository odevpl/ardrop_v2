import { NavLink } from 'react-router-dom'
import './sidebar-menu.scss'

const SidebarMenu = ({ config }) => {
  return (
    <aside className="sidebarMenu">
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
    </aside>
  )
}

export default SidebarMenu
