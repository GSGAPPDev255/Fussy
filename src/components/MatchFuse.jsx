import { useState, useEffect } from 'react'
import { CalendarCheck, Zap, X, ChevronDown } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { calcFussyScore } from '../hooks/useMatches'
import { requestExtension, approveExtension, setDateBooked } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

const EXTENSION_REASONS = [
  { value: 'traveling', label: 'Traveling' },
  { value: 'work', label: 'Work commitment' },
  { value: 'emergency', label: 'Personal emergency' },
]

function FuseTimer({ expiresAt }) {
  const { display, hours, isUrgent, isCritical, isExpired } = useCountdown(expiresAt)

  const progressPct = isExpired ? 0 : Math.max(0, Math.min(100, (hours / 72) * 100))
  const color = isCritical ? '#FF3B30' : isUrgent ? '#FF9F0A' : '#F0F0F0'

  return (
    <div className="rounded-2xl overflow-hidden relative"
      style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${isCritical ? 'rgba(255,59,48,0.3)' : 'rgba(255,255,255,0.07)'}`,
        ...(isCritical && { boxShadow: '0 0 30px rgba(255,59,48,0.1)' }) }}>

      {/* Progress bar at top */}
      <div className="h-0.5 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full transition-all duration-1000"
          style={{ width: `${progressPct}%`,
            background: isCritical
              ? 'linear-gradient(90deg, #FF3B30, rgba(255,59,48,0.5))'
              : isUrgent
              ? 'linear-gradient(90deg, #FF9F0A, rgba(255,159,10,0.5))'
              : 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))' }} />
      </div>

      <div className="px-5 py-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3"
          style={{ color: 'rgba(255,255,255,0.25)' }}>
          {isExpired ? 'Fuse Burnt' : 'Fuse Burns In'}
        </p>
        <div className={`font-mono font-semibold tabular-nums leading-none mb-4 ${isCritical ? 'animate-pulse-red' : ''}`}
          style={{ fontSize: 'clamp(40px,12vw,56px)', color,
            ...(isCritical && { textShadow: '0 0 30px rgba(255,59,48,0.5)' }) }}>
          {isExpired ? '00:00:00' : display}
        </div>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {isExpired ? 'This match has permanently expired.' : 'Book a date before the timer hits zero.'}
        </p>
      </div>
    </div>
  )
}

function FussyScore({ score }) {
  const color = score >= 70 ? '#34C759' : score >= 40 ? '#FF9F0A' : '#FF3B30'
  const label = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="section-label m-0">Fussy Score</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
            {label}
          </span>
          <span className="font-mono font-semibold text-2xl" style={{ color }}>{score}%</span>
        </div>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
      </div>
      <p className="text-xs mt-2.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Soft preference overlap · Hard filters already matched
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
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.2)' }}>
        <Zap size={12} className="text-[#34C759] flex-none" />
        <span className="text-xs" style={{ color: 'rgba(52,199,89,0.8)' }}>
          48-hour extension active · one-time used
        </span>
      </div>
    )
  }

  if (iRequested && !alreadyApproved) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.2)' }}>
        <Zap size={12} style={{ color: '#FF9F0A' }} className="flex-none" />
        <span className="text-xs" style={{ color: 'rgba(255,159,10,0.8)' }}>
          Extension requested · waiting on their approval
        </span>
      </div>
    )
  }

  if (theyRequested && !alreadyApproved) {
    return (
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(255,159,10,0.04)', border: '1px solid rgba(255,159,10,0.2)' }}>
        <div>
          <p className="section-label m-0 mb-1">Extension Request</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Reason: <span style={{ color: 'rgba(255,255,255,0.7)' }}>{match.extension_reason}</span>
          </p>
        </div>
        <button onClick={handleApprove} disabled={loading} className="btn-success flex items-center justify-center gap-2 w-full">
          <Zap size={14} />
          {loading ? 'Approving…' : 'Approve +48h Extension'}
        </button>
      </div>
    )
  }

  if (!canRequest) return null

  return (
    <div>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.3)' }}>
          <span className="flex items-center gap-2 text-sm">
            <Zap size={14} /> Request 48h extension
          </span>
          <ChevronDown size={13} />
        </button>
      ) : (
        <div className="rounded-2xl p-5 space-y-4 animate-slide-up"
          style={{ background: 'rgba(255,159,10,0.04)', border: '1px solid rgba(255,159,10,0.2)' }}>
          <p className="section-label m-0">Valid reason required</p>
          <div className="space-y-2">
            {EXTENSION_REASONS.map((r) => (
              <label key={r.value}
                className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-150"
                style={{ background: reason === r.value ? 'rgba(255,59,48,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${reason === r.value ? 'rgba(255,59,48,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none transition-all"
                  style={{ borderColor: reason === r.value ? '#FF3B30' : 'rgba(255,255,255,0.2)',
                    background: reason === r.value ? '#FF3B30' : 'transparent' }}>
                  {reason === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" className="sr-only" value={r.value} checked={reason === r.value}
                  onChange={() => setReason(r.value)} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{r.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="btn-ghost flex-none px-4 py-3 flex items-center justify-center">
              <X size={14} />
            </button>
            <button onClick={handleRequest} disabled={!reason || loading}
              className="btn-primary flex-1 py-3">
              {loading ? 'Sending…' : 'Send request'}
            </button>
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

  const isUser1 = localMatch.user_1 === user?.id
  const other = isUser1 ? localMatch.profile_2 : localMatch.profile_1
  const myPrefs = profile?.soft_prefs ?? {}
  const theirPrefs = other?.soft_prefs ?? {}
  const score = calcFussyScore(myPrefs, theirPrefs)

  useEffect(() => { if (isExpired) onExpired?.() }, [isExpired])

  const handleDateSet = async () => {
    setBookingDate(true)
    await setDateBooked(localMatch.id)
    setBookingDate(false)
    onDateSet?.()
  }

  return (
    <div className="space-y-3 animate-fade-in">

      {/* Other person header */}
      <div className="flex items-center gap-4 px-1 py-2">
        <div className="w-12 h-12 rounded-full flex-none flex items-center justify-center overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {other?.avatar_url ? (
            <img src={other.avatar_url} alt={other.display_name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-heading text-lg" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {other?.display_name?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl text-white truncate">{other?.display_name}</h2>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {other?.attributes?.age && `${other.attributes.age}`}
            {other?.attributes?.location_city && ` · ${other.attributes.location_city}`}
          </p>
        </div>
        <div className="tag-active text-[10px]">Active</div>
      </div>

      <FuseTimer expiresAt={localMatch.expires_at} />
      <FussyScore score={score} />

      {/* Date CTA */}
      <button
        onClick={handleDateSet}
        disabled={bookingDate || isExpired}
        className="btn-success w-full flex items-center justify-between py-4"
      >
        <span className="flex items-center gap-2">
          <CalendarCheck size={16} />
          {bookingDate ? 'Locking in…' : 'Date Booked — Lock It In'}
        </span>
        <span className="font-mono text-xs opacity-60">→</span>
      </button>

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
