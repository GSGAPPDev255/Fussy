import { NavLink } from 'react-router-dom'
import { Search, Zap, User } from 'lucide-react'
import { useMatches } from '../hooks/useMatches'

export default function BottomNav() {
  const { matches } = useMatches()
  const activeCount = matches.filter((m) => m.status === 'active').length

  const navItems = [
    { to: '/browse',  icon: Search, label: 'Browse' },
    { to: '/matches', icon: Zap,    label: 'Matches', badge: activeCount },
    { to: '/profile', icon: User,   label: 'Profile' },
  ]

  return (
    <nav style={{
      borderTop: '1.5px solid #F0E4DC',
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)',
    }}>
      <div className="flex">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 relative">

                {/* Active pill indicator */}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #E8336A, #FF6B6B)' }} />
                )}

                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    style={{ color: isActive ? '#E8336A' : '#C4ADB5', transition: 'color 0.2s' }}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 font-mono text-[9px] text-white"
                      style={{ background: 'linear-gradient(135deg, #E8336A, #FF6B6B)', boxShadow: '0 2px 6px rgba(232,51,106,0.4)' }}>
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>

                <span className="text-[9px] font-mono uppercase tracking-widest transition-all duration-200"
                  style={{ color: isActive ? '#E8336A' : '#C4ADB5', letterSpacing: '0.1em' }}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
