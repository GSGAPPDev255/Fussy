import { useNavigate } from 'react-router-dom'
import { Timer, Zap } from 'lucide-react'
import { useMatches, calcFussyScore } from '../hooks/useMatches'
import { useCountdown } from '../hooks/useCountdown'
import useAuthStore from '../store/useAuthStore'

function MatchRow({ match, userId, myPrefs }) {
  const navigate = useNavigate()
  const isUser1 = match.user_1 === userId
  const other = isUser1 ? match.profile_2 : match.profile_1
  const { display, isUrgent, isCritical, isExpired } = useCountdown(match.expires_at)
  const score = calcFussyScore(myPrefs, other?.soft_prefs ?? {})

  return (
    <button
      onClick={() => navigate(`/match/${match.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3.5 border border-border rounded-xl bg-surface transition-all active:scale-[0.98] hover:border-muted text-left"
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-muted flex-none flex items-center justify-center overflow-hidden">
        {other?.avatar_url ? (
          <img src={other.avatar_url} alt={other.display_name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-heading text-base text-subdued">
            {other?.display_name?.[0]?.toUpperCase() ?? '?'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-heading text-sm text-text truncate">{other?.display_name}</p>
        <p className="text-xs text-subdued truncate">
          {other?.attributes?.age} · {other?.attributes?.location_city}
        </p>
      </div>

      {/* Timer + score */}
      <div className="flex-none text-right">
        <p className={`font-mono text-xs tabular-nums ${isCritical ? 'text-urgency animate-pulse-red' : isUrgent ? 'text-warn' : 'text-subdued'}`}>
          {isExpired ? 'EXPIRED' : display}
        </p>
        <p className="text-xs text-subdued mt-0.5">
          {score}% <span className="opacity-50">match</span>
        </p>
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
    <div className="flex flex-col flex-1 px-4 pt-2 pb-4">
      <h1 className="font-heading text-xl mb-4">Matches</h1>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-urgency/30 border-t-urgency rounded-full animate-spin" />
        </div>
      )}

      {!loading && matches.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <Zap size={32} className="text-subdued/30 mb-4" />
          <p className="font-heading text-lg mb-2">No active matches.</p>
          <p className="text-sm text-subdued">Browse candidates to light the fuse.</p>
        </div>
      )}

      {!loading && active.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={13} className="text-urgency" />
            <span className="section-label m-0">Active fuses ({active.length})</span>
          </div>
          <div className="space-y-2">
            {active.map((m) => (
              <MatchRow key={m.id} match={m} userId={user?.id} myPrefs={profile?.soft_prefs ?? {}} />
            ))}
          </div>
        </div>
      )}

      {!loading && booked.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-success" />
            <span className="section-label m-0">Date booked ({booked.length})</span>
          </div>
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
