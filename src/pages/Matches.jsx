import { useNavigate } from 'react-router-dom'
import { Zap, Flame } from 'lucide-react'
import { useMatches, calcFussyScore } from '../hooks/useMatches'
import { useCountdown } from '../hooks/useCountdown'
import useAuthStore from '../store/useAuthStore'

function MatchRow({ match, userId, myPrefs }) {
  const navigate = useNavigate()
  const isUser1  = match.user_1 === userId
  const other    = isUser1 ? match.profile_2 : match.profile_1
  const { display, isUrgent, isCritical, isExpired } = useCountdown(match.expires_at)
  const score    = calcFussyScore(myPrefs, other?.soft_prefs ?? {})
  const isBooked = match.status === 'date_set'

  const timerColor = isExpired ? '#C4ADB5' : isCritical ? '#E8336A' : isUrgent ? '#F59E0B' : '#9B8890'
  const timerBg    = isExpired ? '#F7EDE7' : isCritical ? 'rgba(232,51,106,0.08)' : isUrgent ? 'rgba(245,158,11,0.08)' : '#F7EDE7'

  return (
    <button
      onClick={() => navigate(`/match/${match.id}`)}
      className="w-full flex items-center gap-3.5 px-4 py-4 rounded-2xl transition-all duration-200 active:scale-[0.98] text-left"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${isCritical ? 'rgba(232,51,106,0.3)' : '#F0E4DC'}`,
        boxShadow: `0 2px 12px rgba(28,16,24,0.06)${isCritical ? ', 0 0 0 3px rgba(232,51,106,0.08)' : ''}`,
      }}>

      {/* Avatar */}
      <div className="w-12 h-12 rounded-full flex-none flex items-center justify-center overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #FFF0F5, #FEF6F0)', border: '1.5px solid #F0E4DC' }}>
        {other?.avatar_url
          ? <img src={other.avatar_url} alt={other.display_name} className="w-full h-full object-cover" />
          : <span className="font-heading text-lg" style={{ color: '#D4A8B5' }}>
              {other?.display_name?.[0]?.toUpperCase() ?? '?'}
            </span>}
        {isBooked && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,179,122,0.85)' }}>
            <Zap size={14} className="text-white" fill="white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm truncate" style={{ color: '#1C1018' }}>{other?.display_name}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: '#9B8890' }}>
          {other?.attributes?.age}{other?.attributes?.location_city ? ` · ${other.attributes.location_city}` : ''}
        </p>
      </div>

      {/* Timer + score */}
      <div className="flex-none text-right">
        <span className={`inline-block font-mono text-xs px-2 py-0.5 rounded-full tabular-nums ${isCritical ? 'animate-pulse-rose' : ''}`}
          style={{ background: timerBg, color: timerColor }}>
          {isExpired ? 'EXPIRED' : isBooked ? '✓ BOOKED' : display}
        </span>
        <p className="text-xs mt-1 font-mono" style={{ color: '#C4ADB5' }}>{score}% match</p>
      </div>
    </button>
  )
}

export default function Matches() {
  const user    = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const { matches, loading } = useMatches()

  const active = matches.filter((m) => m.status === 'active')
  const booked = matches.filter((m) => m.status === 'date_set')

  return (
    <div className="px-4 pt-4 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl" style={{ color: '#1C1018' }}>Matches</h1>
        {active.length > 0 && (
          <span className="font-mono text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(232,51,106,0.08)', border: '1.5px solid rgba(232,51,106,0.2)', color: '#E8336A' }}>
            {active.length} active
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(232,51,106,0.2)', borderTopColor: '#E8336A' }} />
        </div>
      )}

      {/* Empty */}
      {!loading && matches.length === 0 && (
        <div className="flex flex-col items-center text-center px-4 py-20">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, #FFF0F5, #FEF6F0)', border: '1.5px solid #F0E4DC' }}>
            <Flame size={24} style={{ color: '#E8336A' }} />
          </div>
          <p className="font-heading text-lg mb-2" style={{ color: '#1C1018' }}>No active matches</p>
          <p className="text-sm leading-relaxed" style={{ color: '#9B8890' }}>
            Browse candidates and like someone to light the first fuse.
          </p>
        </div>
      )}

      {/* Active fuses */}
      {!loading && active.length > 0 && (
        <div className="mb-6">
          <p className="section-label">Active fuses 🔥</p>
          <div className="space-y-2.5">
            {active.map((m) => (
              <MatchRow key={m.id} match={m} userId={user?.id} myPrefs={profile?.soft_prefs ?? {}} />
            ))}
          </div>
        </div>
      )}

      {/* Booked */}
      {!loading && booked.length > 0 && (
        <div>
          <p className="section-label">Date booked ✓</p>
          <div className="space-y-2.5">
            {booked.map((m) => (
              <MatchRow key={m.id} match={m} userId={user?.id} myPrefs={profile?.soft_prefs ?? {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
