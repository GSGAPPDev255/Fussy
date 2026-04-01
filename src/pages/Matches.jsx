import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useMatches, calcFussyScore } from '../hooks/useMatches'
import { useCountdown } from '../hooks/useCountdown'
import useAuthStore from '../store/useAuthStore'

function MatchRow({ match, userId, myPrefs }) {
  const navigate = useNavigate()
  const isUser1 = match.user_1 === userId
  const other = isUser1 ? match.profile_2 : match.profile_1
  const { display, isUrgent, isCritical, isExpired } = useCountdown(match.expires_at)
  const score = calcFussyScore(myPrefs, other?.soft_prefs ?? {})
  const isBooked = match.status === 'date_set'
  const timerColor = isExpired ? 'rgba(255,255,255,0.2)' : isCritical ? '#FF3B30' : isUrgent ? '#FF9F0A' : 'rgba(255,255,255,0.4)'

  return (
    <button
      onClick={() => navigate(`/match/${match.id}`)}
      className="w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] text-left"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${isCritical ? 'rgba(255,59,48,0.2)' : 'rgba(255,255,255,0.06)'}` }}>

      <div className="w-11 h-11 rounded-full flex-none flex items-center justify-center overflow-hidden relative"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {other?.avatar_url
          ? <img src={other.avatar_url} alt={other.display_name} className="w-full h-full object-cover" />
          : <span className="font-heading text-base" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {other?.display_name?.[0]?.toUpperCase() ?? '?'}
            </span>}
        {isBooked && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(52,199,89,0.7)' }}>
            <Zap size={12} className="text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm text-white truncate">{other?.display_name}</p>
        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {other?.attributes?.age}{other?.attributes?.location_city ? ` · ${other.attributes.location_city}` : ''}
        </p>
      </div>

      <div className="flex-none text-right">
        <p className={`font-mono text-xs tabular-nums ${isCritical ? 'animate-pulse-red' : ''}`}
          style={{ color: timerColor }}>
          {isExpired ? 'EXPIRED' : isBooked ? 'BOOKED' : display}
        </p>
        <p className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{score}%</p>
      </div>
    </button>
  )
}

export default function Matches() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const { matches, loading } = useMatches()

  const active = matches.filter((m) => m.status === 'active')
  const booked = matches.filter((m) => m.status === 'date_set')

  return (
    <div className="px-4 pt-4 pb-6">

      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-heading text-2xl text-white">Matches</h1>
        {active.length > 0 && (
          <span className="font-mono text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.25)', color: '#FF3B30' }}>
            {active.length} active
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(255,59,48,0.2)', borderTopColor: '#FF3B30' }} />
        </div>
      )}

      {/* Empty state */}
      {!loading && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center px-4 py-24">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.15)' }}>
            <Zap size={22} style={{ color: 'rgba(255,59,48,0.4)' }} />
          </div>
          <p className="font-heading text-lg text-white mb-2">No active matches</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Browse candidates to light the first fuse.
          </p>
        </div>
      )}

      {/* Active fuses */}
      {!loading && active.length > 0 && (
        <div className="mb-6">
          <p className="section-label mb-3">Active fuses</p>
          <div className="space-y-2">
            {active.map((m) => (
              <MatchRow key={m.id} match={m} userId={user?.id} myPrefs={profile?.soft_prefs ?? {}} />
            ))}
          </div>
        </div>
      )}

      {/* Booked dates */}
      {!loading && booked.length > 0 && (
        <div>
          <p className="section-label mb-3">Date booked</p>
          <div className="space-y-2">
            {booked.map((m) => (
              <MatchRow key={m.id} match={m} userId={user?.id} myPrefs={profile?.soft_prefs ?? {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
