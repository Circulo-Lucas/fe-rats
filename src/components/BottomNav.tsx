import { NavLink } from 'react-router-dom'
import { IconAdd, IconHome, IconRanking, IconUser } from './NavIcons'

const tabs = [
  { to: '/', label: 'Início', Icon: IconHome, end: true },
  { to: '/ranking', label: 'Pontuação', Icon: IconRanking },
  { to: '/registrar', label: 'Registrar', Icon: IconAdd, primary: true },
  { to: '/perfil', label: 'Conta', Icon: IconUser },
] as const

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={'end' in tab ? tab.end : false}
          className={({ isActive }) =>
            [
              'nav-item',
              'primary' in tab && tab.primary ? 'nav-item--primary' : '',
              isActive ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')
          }
        >
          <span className="nav-icon-wrap">
            <tab.Icon className="nav-icon" />
          </span>
          <span className="nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
