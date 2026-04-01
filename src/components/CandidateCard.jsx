import { useState, useRef, useCallback } from 'react'
import { Heart, X, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { createMatch } from '../lib/supabaseClient'
import { getAvatarGradient } from '../lib/avatarUtils'
import useAuthStore from '../store/useAuthStore'

const SWIPE_THRESHOLD = 75
const ROTATE_FACTOR   = 0.07

// ── Lifestyle tag pills ───────────────────────────────────────────────────────
function LifestyleTag({ children }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: '#FEF0F4', border: '1.5px solid #F8D6E0', color: '#C0526E' }}>
      {children}
    </span>
  )
}

function InterestTag({ children }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
      style={{ background: '#F0F4FE', border: '1.5px solid #D6DFF8', color: '#4B6AD4' }}>
      {children}
    </span>
  )
}

// ── Back card (peeking behind front) ─────────────────────────────────────────
export function BackCard({ candidate }) {
  const { display_name, avatar_url } = candidate
  const gradient = getAvatarGradient(display_name)

  return (
    <div className="rounded-3xl overflow-hidden pointer-events-none select-none"
      style={{ border: '1.5px solid #F0E4DC', background: '#FFFFFF', boxShadow: '0 4px 20px rgba(28,16,24,0.06)' }}>
      <div className="relative" style={{ aspectRatio: '3/4' }}>
        {avatar_url
          ? <img src={avatar_url} alt="" className="w-full h-full object-cover opacity-60" />
          : <div className="w-full h-full opacity-60" style={{ background: gradient }} />}
      </div>
      {/* Spacer matching action button height */}
      <div className="p-4" style={{ height: 72 }} />
    </div>
  )
}

// ── Main card ─────────────────────────────────────────────────────────────────
export default function CandidateCard({ candidate, onAction }) {
  const user = useAuthStore((s) => s.user)
  const [exitDir, setExitDir]   = useState(null)
  const [drag, setDrag]         = useState({ x: 0, y: 0, active: false })
  const [expanded, setExpanded] = useState(false)
  const startRef = useRef(null)
  const cardRef  = useRef(null)

  const { id, display_name, attributes, avatar_url, soft_prefs } = candidate
  const { age, location_city, height_cm, has_kids, wants_kids, smoking, drinking } = attributes ?? {}
  const interests = soft_prefs?.interests ?? []
  const initial   = display_name?.[0]?.toUpperCase() ?? '?'
  const gradient  = getAvatarGradient(display_name)

  // Lifestyle tags to show when expanded
  const lifestyleTags = [
    has_kids === false && 'No kids',
    has_kids === true  && 'Has kids',
    wants_kids === true  && 'Wants kids',
    wants_kids === false && 'No more kids',
    smoking === 'never'     && 'Non-smoker',
    smoking === 'socially'  && 'Social smoker',
    drinking === 'never'    && 'Non-drinker',
    drinking === 'socially' && 'Social drinker',
    height_cm && `${height_cm} cm`,
  ].filter(Boolean)

  const hasMore = lifestyleTags.length > 0 || interests.length > 0

  // ── Swipe handlers ──────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    setExitDir('right')
    try { await createMatch(user.id, id) } catch (_) {}
    setTimeout(() => onAction?.('like', id), 420)
  }, [user.id, id, onAction])

  const handlePass = useCallback(() => {
    setExitDir('left')
    setTimeout(() => onAction?.('pass', id), 420)
  }, [id, onAction])

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return
    e.preventDefault()
    cardRef.current?.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY }
    setDrag({ x: 0, y: 0, active: true })
  }
  const onPointerMove = (e) => {
    if (!drag.active || !startRef.current) return
    setDrag({ x: e.clientX - startRef.current.x, y: (e.clientY - startRef.current.y) * 0.3, active: true })
  }
  const onPointerUp = () => {
    if (!drag.active) return
    const dx = drag.x
    setDrag({ x: 0, y: 0, active: false })
    startRef.current = null
    if (dx > SWIPE_THRESHOLD) handleLike()
    else if (dx < -SWIPE_THRESHOLD) handlePass()
  }

  let tx = drag.x, ty = drag.y, rot = drag.x * ROTATE_FACTOR
  if (exitDir === 'right') { tx = 700;  ty = -80; rot =  22 }
  if (exitDir === 'left')  { tx = -700; ty = -80; rot = -22 }

  const likeOpacity = Math.min(Math.max(drag.x / SWIPE_THRESHOLD, 0), 1)
  const nopeOpacity = Math.min(Math.max(-drag.x / SWIPE_THRESHOLD, 0), 1)
  const isExiting   = exitDir !== null
  const transition  = (isExiting || !drag.active)
    ? 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.42s ease'
    : 'none'

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative rounded-3xl overflow-hidden select-none"
      style={{
        background: '#FFFFFF',
        border: '1.5px solid #F0E4DC',
        boxShadow: '0 8px 32px rgba(28,16,24,0.1)',
        transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`,
        opacity: isExiting ? 0 : 1,
        transition,
        touchAction: 'none',
        cursor: drag.active ? 'grabbing' : 'grab',
        willChange: 'transform',
      }}
    >
      {/* LIKE stamp */}
      <div className="absolute top-6 right-5 z-20 pointer-events-none px-4 py-2 rounded-2xl"
        style={{ opacity: likeOpacity, border: '2.5px solid #00B37A', background: 'rgba(0,179,122,0.1)', transform: `rotate(${-rot * 0.5}deg)` }}>
        <span className="font-heading text-xl tracking-widest" style={{ color: '#00B37A' }}>LIKE</span>
      </div>

      {/* NOPE stamp */}
      <div className="absolute top-6 left-5 z-20 pointer-events-none px-4 py-2 rounded-2xl"
        style={{ opacity: nopeOpacity, border: '2.5px solid #E8336A', background: 'rgba(232,51,106,0.1)', transform: `rotate(${-rot * 0.5}deg)` }}>
        <span className="font-heading text-xl tracking-widest" style={{ color: '#E8336A' }}>NOPE</span>
      </div>

      {/* Photo / gradient avatar */}
      <div className="relative" style={{ aspectRatio: '3/4' }}>
        {avatar_url ? (
          <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
            <span className="font-heading select-none text-white"
              style={{ fontSize: 'clamp(80px, 28vw, 130px)', opacity: 0.35 }}>
              {initial}
            </span>
          </div>
        )}

        {/* Gradient overlay — fades to white at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 40%, transparent 100%)' }} />

        {/* Name + location */}
        <div className="absolute bottom-0 inset-x-0 p-5 z-10">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading text-2xl leading-none mb-1 truncate" style={{ color: '#1C1018' }}>
                {display_name}
                {age && <span className="font-mono text-lg ml-2" style={{ color: '#9B8890' }}>{age}</span>}
              </h3>
              {location_city && (
                <div className="flex items-center gap-1.5" style={{ color: '#9B8890', fontSize: 12 }}>
                  <MapPin size={11} /><span>{location_city}</span>
                </div>
              )}
            </div>
            <div className="flex-none px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(232,51,106,0.08)', border: '1.5px solid rgba(232,51,106,0.2)' }}>
              <span className="text-[10px] font-mono tracking-widest" style={{ color: '#E8336A' }}>MATCH</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expandable detail section ─────────────────────────────────────── */}
      {hasMore && (
        <div>
          {/* Expand toggle */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 transition-colors"
            style={{ borderTop: '1.5px solid #F7EDE7', color: '#C4ADB5', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
            {expanded ? <><ChevronUp size={13} /> LESS</> : <><ChevronDown size={13} /> MORE ABOUT {display_name?.split(' ')[0]?.toUpperCase()}</>}
          </button>

          {/* Expanded content */}
          {expanded && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in" style={{ borderTop: '1.5px solid #F7EDE7' }}>

              {lifestyleTags.length > 0 && (
                <div className="pt-3">
                  <p className="section-label mb-2">Lifestyle</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lifestyleTags.map((t) => <LifestyleTag key={t}>{t}</LifestyleTag>)}
                  </div>
                </div>
              )}

              {interests.length > 0 && (
                <div>
                  <p className="section-label mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((i) => <InterestTag key={i}>{i}</InterestTag>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 pt-3 flex gap-3" style={{ borderTop: hasMore ? 'none' : '1.5px solid #F7EDE7' }}>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handlePass}
          className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-200 active:scale-[0.96]"
          style={{ border: '1.5px solid #F0E4DC', background: '#FFFFFF', color: '#9B8890' }}>
          <X size={16} /> Pass
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleLike}
          className="flex-[2] py-3.5 rounded-2xl flex items-center justify-center gap-2 font-heading text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.96] text-white"
          style={{ background: 'linear-gradient(135deg, #E8336A, #FF6B6B)', boxShadow: '0 4px 16px rgba(232,51,106,0.35)' }}>
          <Heart size={15} fill="white" /> Like
        </button>
      </div>
    </div>
  )
}
