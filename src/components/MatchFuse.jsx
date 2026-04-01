import { useState, useEffect } from 'react'
import { CalendarCheck, Zap, X, ChevronDown } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import { calcFussyScore } from '../hooks/useMatches'
import { requestExtension, approveExtension, setDateBooked } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

const EXTENSION_REASONS = [
  { value: 'traveling', label: 'Travelling' },
  { value: 'work',      label: 'Work commitment' },
  { value: 'emergency', label: 'Personal emergency' },
]

function FuseTimer({ expiresAt }) {
  const { display, hours, isUrgent, isCritical, isExpired } = useCountdown(expiresAt)
  const progressPct = isExpired ? 0 : Math.max(0, Math.min(100, (hours / 72) * 100))

  const accent = isCritical ? '#E8336A' : isUrgent ? '#F59E0B' : '#E8336A'
  const bgCard = isCritical ? 'rgba(232,51,106,0.04)' : '#FFFFFF'
  const border  = isCritical ? 'rgba(232,51,106,0.25)' : '#F0E4DC'

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: bgCard, border: `1.5px solid ${border}`, boxShadow: '0 2px 12px rgba(28,16,24,0.06)' }}>

      {/* Progress bar */}
      <div className="h-1.5 w-full" style={{ background: '#F7EDE7' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}80)` }} />
      </div>

      <div className="px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: '#C4ADB5' }}>
          {isExpired ? 'Fuse Burnt' : 'Fuse Burns In'}
        </p>
        <div className={`font-mono font-bold tabular-nums leading-none mb-3 ${isCritical ? 'animate-pulse-rose' : ''}`}
          style={{ fontSize: 'clamp(38px,11vw,52px)', color: isCritical ? '#E8336A' : isUrgent ? '#F59E0B' : '#1C1018' }}>
          {isExpired ? '00:00:00' : display}
        </div>
        <p className="text-xs" style={{ color: '#9B8890' }}>
          {isExpired ? 'This match has permanently expired.' : 'Book a date before the timer hits zero.'}
        </p>
      </div>
    </div>
  )
}

function FussyScore({ score }) {
  const color = score >= 70 ? '#00B37A' : score >= 40 ? '#F59E0B' : '#E8336A'
  const label = score >= 70 ? 'Great match' : score >= 40 ? 'Good match' : 'Some overlap'
  const bg    = score >= 70 ? 'rgba(0,179,122,0.06)' : score >= 40 ? 'rgba(245,158,11,0.06)' : 'rgba(232,51,106,0.06)'
  const border = score >= 70 ? 'rgba(0,179,122,0.2)' : score >= 40 ? 'rgba(245,158,11,0.2)' : 'rgba(232,51,106,0.2)'

  return (
    <div className="rounded-2xl p-4" style={{ background: bg, border: `1.5px solid ${border}` }}>
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className="section-label m-0">Fussy Score</p>
          <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
        </div>
        <span className="font-heading text-3xl" style={{ color }}>{score}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(28,16,24,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
      <p className="text-xs mt-2" style={{ color: '#9B8890' }}>Soft preference overlap · hard filters already matched</p>
    </div>
  )
}

function ExtensionPanel({ match, userId, onUpdated }) {
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason]     = useState('')
  const [loading, setLoading]   = useState(false)

  const iRequested      = match.extension_requested_by === userId
  const theyRequested   = match.extension_requested_by && match.extension_requested_by !== userId
  const alreadyApproved = match.extension_approved === true
  const canRequest      = !match.extension_requested_by && !match.is_extended

  const handleRequest = async () => {
    if (!reason) return
    setLoading(true)
    await requestExtension(match.id, userId, reason)
    setLoading(false); setShowForm(false); onUpdated()
  }

  const handleApprove = async () => {
    setLoading(true)
    await approveExtension(match.id, userId)
    setLoading(false); onUpdated()
  }

  if (match.is_extended && alreadyApproved) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(0,179,122,0.06)', border: '1.5px solid rgba(0,179,122,0.2)' }}>
        <Zap size={14} style={{ color: '#00B37A', flexShrink: 0 }} fill="#00B37A" />
        <span className="text-xs font-medium" style={{ color: '#00B37A' }}>48-hour extension active · one-time used</span>
      </div>
    )
  }

  if (iRequested && !alreadyApproved) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
        <Zap size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
        <span className="text-xs font-medium" style={{ color: '#B45309' }}>Extension requested · waiting on their approval</span>
      </div>
    )
  }

  if (theyRequested && !alreadyApproved) {
    return (
      <div className="rounded-2xl p-4 space-y-3"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
        <div>
          <p className="section-label m-0 mb-1">Extension Request</p>
          <p className="text-sm" style={{ color: '#6B4C58' }}>
            Reason: <span style={{ color: '#1C1018', fontWeight: 500 }}>{match.extension_reason}</span>
          </p>
        </div>
        <button onClick={handleApprove} disabled={loading}
          className="btn-success flex items-center justify-center gap-2 w-full py-3">
          <Zap size={14} fill="white" />
          {loading ? 'Approving…' : 'Approve +48h Extension'}
        </button>
      </div>
    )
  }

  if (!canRequest) return null

  return (
    <div>
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#9B8890' }}>
          <span className="flex items-center gap-2 text-sm font-medium">
            <Zap size={14} /> Request 48h extension
          </span>
          <ChevronDown size={14} />
        </button>
      ) : (
        <div className="rounded-2xl p-4 space-y-3 animate-slide-up"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', boxShadow: '0 4px 16px rgba(28,16,24,0.08)' }}>
          <p className="section-label m-0">Valid reason required</p>
          <div className="space-y-2">
            {EXTENSION_REASONS.map((r) => (
              <label key={r.value}
                className="flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all duration-150"
                style={{
                  background: reason === r.value ? 'rgba(232,51,106,0.06)' : '#FEF6F0',
                  border: `1.5px solid ${reason === r.value ? 'rgba(232,51,106,0.25)' : '#F0E4DC'}`,
                }}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none"
                  style={{ borderColor: reason === r.value ? '#E8336A' : '#D4A8B5', background: reason === r.value ? '#E8336A' : 'transparent' }}>
                  {reason === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input type="radio" className="sr-only" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
                <span className="text-sm" style={{ color: '#6B4C58' }}>{r.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowForm(false)}
              className="flex-none px-4 py-3 rounded-2xl flex items-center justify-center transition-colors"
              style={{ border: '1.5px solid #F0E4DC', color: '#9B8890', background: '#FFFFFF' }}>
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
  const user    = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [localMatch, setLocalMatch] = useState(match)
  const { isExpired } = useCountdown(localMatch.expires_at)
  const [bookingDate, setBookingDate] = useState(false)

  const isUser1    = localMatch.user_1 === user?.id
  const other      = isUser1 ? localMatch.profile_2 : localMatch.profile_1
  const score      = calcFussyScore(profile?.soft_prefs ?? {}, other?.soft_prefs ?? {})

  useEffect(() => { if (isExpired) onExpired?.() }, [isExpired])

  const handleDateSet = async () => {
    setBookingDate(true)
    await setDateBooked(localMatch.id)
    setBookingDate(false)
    onDateSet?.()
  }

  return (
    <div className="space-y-3 animate-fade-in">

      {/* Other person */}
      <div className="flex items-center gap-3 px-1 pb-1">
        <div className="w-14 h-14 rounded-full flex-none overflow-hidden flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FFF0F5, #FEF6F0)', border: '1.5px solid #F0E4DC' }}>
          {other?.avatar_url
            ? <img src={other.avatar_url} alt={other.display_name} className="w-full h-full object-cover" />
            : <span className="font-heading text-xl" style={{ color: '#D4A8B5' }}>{other?.display_name?.[0]?.toUpperCase() ?? '?'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl truncate" style={{ color: '#1C1018' }}>{other?.display_name}</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9B8890' }}>
            {other?.attributes?.age && `${other.attributes.age}`}
            {other?.attributes?.location_city && ` · ${other.attributes.location_city}`}
          </p>
        </div>
        <div className="tag-active text-[10px] flex-none">Active</div>
      </div>

      <FuseTimer expiresAt={localMatch.expires_at} />
      <FussyScore score={score} />

      {/* Book date */}
      <button
        onClick={handleDateSet}
        disabled={bookingDate || isExpired}
        className="btn-success w-full flex items-center justify-between py-4 px-5"
      >
        <span className="flex items-center gap-2">
          <CalendarCheck size={16} />
          {bookingDate ? 'Locking in…' : 'Date Booked — Lock It In'}
        </span>
        <span className="font-mono text-xs opacity-70">→</span>
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
