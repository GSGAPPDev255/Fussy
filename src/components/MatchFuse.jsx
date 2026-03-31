import { useState, useEffect } from 'react'
import { Timer, CalendarCheck, Zap, X, ChevronDown } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { calcFussyScore } from '../hooks/useMatches'
import { requestExtension, approveExtension, setDateBooked } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'
import { Button } from './ui/Button'

const EXTENSION_REASONS = [
  { value: 'traveling', label: 'Traveling' },
  { value: 'work', label: 'Work commitment' },
  { value: 'emergency', label: 'Personal emergency' },
]

function FuseTimer({ expiresAt }) {
  const { display, isUrgent, isCritical, isExpired } = useCountdown(expiresAt)

  return (
    <div className={`flex flex-col items-center py-5 ${isCritical ? 'animate-pulse-red' : ''}`}>
      <div className="flex items-center gap-2 mb-1">
        <Timer size={13} className={isCritical ? 'text-urgency' : isUrgent ? 'text-warn' : 'text-subdued'} />
        <span className="font-mono text-xs uppercase tracking-widest text-subdued">
          {isExpired ? 'EXPIRED' : 'Fuse burns in'}
        </span>
      </div>
      <span
        className={`font-mono text-4xl font-semibold tabular-nums ${
          isExpired ? 'text-urgency/50' : isCritical ? 'text-urgency' : isUrgent ? 'text-warn' : 'text-text'
        }`}
      >
        {isExpired ? '00:00:00' : display}
      </span>
    </div>
  )
}

function FussyScore({ score }) {
  const color = score >= 70 ? 'text-success' : score >= 40 ? 'text-warn' : 'text-urgency'
  const barColor = score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warn' : 'bg-urgency'

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">Fussy Score</span>
        <span className={`font-mono text-xl font-semibold ${color}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-subdued mt-2">
        Based on soft preference overlap. Hard filters already matched.
      </p>
    </div>
  )
}

function ExtensionPanel({ match, userId, onUpdated }) {
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const iRequested = match.extension_requested_by === userId
  const theyRequested = match.extension_requested_by && match.extension_requested_by !== userId
  const alreadyApproved = match.extension_approved === true
  const canRequest = !match.extension_requested_by && !match.is_extended

  const handleRequest = async () => {
    if (!reason) return
    setLoading(true)
    await requestExtension(match.id, userId, reason)
    setLoading(false)
    setShowForm(false)
    onUpdated()
  }

  const handleApprove = async () => {
    setLoading(true)
    await approveExtension(match.id, userId)
    setLoading(false)
    onUpdated()
  }

  if (match.is_extended && alreadyApproved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
        <Zap size={13} className="text-success" />
        <span className="text-xs text-success">48-hour extension active — used your one-time extend.</span>
      </div>
    )
  }

  if (iRequested && !alreadyApproved) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-warn/10 border border-warn/20 rounded-lg">
        <Timer size={13} className="text-warn" />
        <span className="text-xs text-warn">Extension requested — waiting on their approval.</span>
      </div>
    )
  }

  if (theyRequested && !alreadyApproved) {
    return (
      <div className="card border-warn/30">
        <p className="text-xs text-warn mb-1 font-mono uppercase tracking-widest">Extension Request</p>
        <p className="text-sm text-text mb-3">
          Reason: <span className="text-subdued">{match.extension_reason}</span>
        </p>
        <div className="flex gap-2">
          <Button variant="success" onClick={handleApprove} disabled={loading}>
            {loading ? 'Approving…' : <><Zap size={14} /> Approve +48h</>}
          </Button>
        </div>
      </div>
    )
  }

  if (!canRequest) return null

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-between px-4 py-2.5 border border-border rounded-lg text-subdued hover:border-muted text-sm transition-colors"
        >
          <span className="flex items-center gap-2">
            <Zap size={14} /> Request 48h extension
          </span>
          <ChevronDown size={14} />
        </button>
      ) : (
        <div className="card border-warn/20 space-y-3 animate-slide-up">
          <p className="text-xs font-mono text-warn uppercase tracking-widest">Valid reason required</p>
          <div className="flex flex-col gap-2">
            {EXTENSION_REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-3 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  reason === r.value ? 'border-urgency bg-urgency' : 'border-border'
                }`}>
                  {reason === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input
                  type="radio"
                  className="sr-only"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                <span className="text-sm text-text">{r.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="flex-none w-auto px-4">
              <X size={14} />
            </Button>
            <Button onClick={handleRequest} disabled={!reason || loading}>
              {loading ? 'Sending…' : 'Send request'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MatchFuse({ match, onDateSet, onExpired }) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [localMatch, setLocalMatch] = useState(match)
  const { isExpired } = useCountdown(localMatch.expires_at)
  const [bookingDate, setBookingDate] = useState(false)

  // Determine the other profile
  const isUser1 = localMatch.user_1 === user?.id
  const other = isUser1 ? localMatch.profile_2 : localMatch.profile_1
  const myPrefs = profile?.soft_prefs ?? {}
  const theirPrefs = other?.soft_prefs ?? {}
  const score = calcFussyScore(myPrefs, theirPrefs)

  useEffect(() => {
    if (isExpired) onExpired?.()
  }, [isExpired])

  const handleDateSet = async () => {
    setBookingDate(true)
    await setDateBooked(localMatch.id)
    setBookingDate(false)
    onDateSet?.()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Other person header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {other?.avatar_url ? (
            <img src={other.avatar_url} alt={other.display_name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-heading text-lg text-subdued">
              {other?.display_name?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <div>
          <h2 className="font-heading text-lg">{other?.display_name}</h2>
          <p className="text-xs text-subdued">
            {other?.attributes?.age && `${other.attributes.age} · `}
            {other?.attributes?.location_city}
          </p>
        </div>
        <div className="ml-auto">
          <span className="tag-active">Matched</span>
        </div>
      </div>

      {/* Countdown */}
      <div className="card">
        <FuseTimer expiresAt={localMatch.expires_at} />
        <p className="text-center text-xs text-subdued pb-1">
          Book a date or this match permanently self-destructs.
        </p>
      </div>

      {/* Fussy Score */}
      <FussyScore score={score} />

      {/* Actions */}
      <Button variant="success" onClick={handleDateSet} disabled={bookingDate || isExpired}>
        <CalendarCheck size={16} />
        {bookingDate ? 'Locking in…' : 'Date Booked — Lock It In'}
      </Button>

      {/* Extension */}
      {!isExpired && (
        <ExtensionPanel
          match={localMatch}
          userId={user?.id}
          onUpdated={() => setLocalMatch((m) => ({ ...m }))}
        />
      )}
    </div>
  )
}
