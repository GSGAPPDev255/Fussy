import { NavLink } from 'react-router-dom'
import { Search, Zap, User } from 'lucide-react'
import { useMatches } from '../hooks/useMatches'

export default function BottomNav() {
  const { matches } = useMatches()
  const activeCount = matches.filter((m) => m.status === 'active').length

  const navItems = [
    { to: '/browse', icon: Search, label: 'Browse' },
    { to: '/matches', icon: Zap, label: 'Matches', badge: activeCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="flex border-t border-border bg-bg safe-bottom">
      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              isActive ? 'text-text' : 'text-subdued'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-urgency text-white text-[10px] font-mono flex items-center justify-center leading-none">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono tracking-wide">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
