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
    <nav className="flex relative"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)' }}>

      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,59,48,0.2), transparent)' }} />

      {navItems.map(({ to, icon: Icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className="flex-1"
        >
          {({ isActive }) => (
            <div className="flex flex-col items-center justify-center py-3.5 gap-1 transition-all duration-200 relative">

              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(255,59,48,0.3), #FF3B30, rgba(255,59,48,0.3))' }} />
              )}

              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  style={{ color: isActive ? '#FF3B30' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 font-mono text-[9px] text-white"
                    style={{ background: '#FF3B30', boxShadow: '0 0 8px rgba(255,59,48,0.5)' }}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>

              <span className="text-[9px] font-mono uppercase tracking-widest transition-all duration-200"
                style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', letterSpacing: '0.12em' }}>
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
