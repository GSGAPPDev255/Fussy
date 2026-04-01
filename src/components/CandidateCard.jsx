import { useState, useRef, useCallback } from 'react'
import { Heart, X, MapPin, Flame } from 'lucide-react'
import { createMatch } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

const SWIPE_THRESHOLD = 75   // px of horizontal drag before committing
const ROTATE_FACTOR = 0.07   // degrees per px of drag

export default function CandidateCard({ candidate, onAction, isBack = false }) {
  const user = useAuthStore((s) => s.user)
  const [exitDir, setExitDir] = useState(null)   // 'left' | 'right' | null
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false })
  const startRef = useRef(null)
  const cardRef = useRef(null)

  const { id, display_name, attributes, avatar_url } = candidate
  const { age, location_city, height_cm, has_kids, wants_kids, smoking, drinking } = attributes ?? {}
  const initial = display_name?.[0]?.toUpperCase() ?? '?'

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
    if (isBack) return
    if (e.target.closest('button')) return
    e.preventDefault()
    cardRef.current?.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY }
    setDrag({ x: 0, y: 0, active: true })
  }

  const onPointerMove = (e) => {
    if (!drag.active || !startRef.current) return
    setDrag({
      x: e.clientX - startRef.current.x,
      y: (e.clientY - startRef.current.y) * 0.3,
      active: true,
    })
  }

  const onPointerUp = () => {
    if (!drag.active) return
    const dx = drag.x
    setDrag({ x: 0, y: 0, active: false })
    startRef.current = null
    if (dx > SWIPE_THRESHOLD) handleLike()
    else if (dx < -SWIPE_THRESHOLD) handlePass()
  }

  // Compute transform
  let tx = drag.x
  let ty = drag.y
  let rot = drag.x * ROTATE_FACTOR
  if (exitDir === 'right') { tx = 600;  ty = -80; rot = 22 }
  if (exitDir === 'left')  { tx = -600; ty = -80; rot = -22 }

  const likeOpacity = Math.min(Math.max(drag.x / SWIPE_THRESHOLD, 0), 1)
  const nopeOpacity = Math.min(Math.max(-drag.x / SWIPE_THRESHOLD, 0), 1)

  const isExiting = exitDir !== null
  const transition = (isExiting || !drag.active)
    ? 'transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.42s ease'
    : 'none'

  if (isBack) {
    // Simplified back card — just the visual shell, no interaction
    return (
      <div
        className="rounded-2xl overflow-hidden pointer-events-none select-none"
        style={{
          border: '1px solid rgba(255,255,255,0.05)',
          background: '#0D0D0F',
        }}
      >
        <div className="relative" style={{ aspectRatio: '3/4' }}>
          {avatar_url ? (
            <img src={avatar_url} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(160deg, #161618, #0d0d0f)' }} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.9), transparent)' }} />
        </div>
        {/* Dummy buttons strip */}
        <div className="p-4 pt-2 flex gap-3 opacity-0">
          <div className="flex-1 py-3.5 rounded-xl" />
          <div className="flex-[2] py-3.5 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        border: '1px solid rgba(255,255,255,0.07)',
        background: '#0D0D0F',
        transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`,
        opacity: isExiting ? 0 : 1,
        transition,
        touchAction: 'none',
        cursor: drag.active ? 'grabbing' : 'grab',
        willChange: 'transform',
      }}
    >
      {/* LIKE stamp */}
      <div
        className="absolute top-6 right-6 z-20 pointer-events-none px-4 py-2 rounded-xl"
        style={{
          opacity: likeOpacity,
          border: '2px solid #34C759',
          background: 'rgba(52,199,89,0.12)',
          transform: `rotate(${-rot * 0.5}deg)`,
        }}
      >
        <span className="font-heading text-xl tracking-widest" style={{ color: '#34C759' }}>LIKE</span>
      </div>

      {/* NOPE stamp */}
      <div
        className="absolute top-6 left-6 z-20 pointer-events-none px-4 py-2 rounded-xl"
        style={{
          opacity: nopeOpacity,
          border: '2px solid #FF3B30',
          background: 'rgba(255,59,48,0.12)',
          transform: `rotate(${-rot * 0.5}deg)`,
        }}
      >
        <span className="font-heading text-xl tracking-widest" style={{ color: '#FF3B30' }}>NOPE</span>
      </div>

      {/* Photo area */}
      <div className="relative" style={{ aspectRatio: '3/4' }}>
        {avatar_url ? (
          <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(160deg, #1a1a1c, #0d0d0f)' }}>
            <span
              className="font-heading select-none"
              style={{ fontSize: 'clamp(80px, 28vw, 120px)', color: 'rgba(255,255,255,0.04)' }}
            >
              {initial}
            </span>
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.5) 50%, transparent 100%)' }} />

        {/* Name + location */}
        <div className="absolute bottom-0 inset-x-0 p-5 z-10">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading text-2xl text-white leading-none mb-1 truncate">
                {display_name}
                {age && <span className="font-mono text-lg ml-2" style={{ color: 'rgba(255,255,255,0.38)' }}>{age}</span>}
              </h3>
              {(location_city || height_cm) && (
                <div className="flex items-center gap-2 flex-wrap" style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>
                  {location_city && <><MapPin size={10} /><span>{location_city}</span></>}
                  {height_cm && <><span>·</span><span>{height_cm}cm</span></>}
                </div>
              )}
            </div>
            <div className="flex-none px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.28)' }}>
              <span className="text-[10px] font-mono tracking-widest" style={{ color: '#FF3B30' }}>MATCH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {(has_kids != null || wants_kids != null || smoking || drinking) && (
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
          {has_kids === false && <span className="tag">No kids</span>}
          {has_kids === true  && <span className="tag">Has kids</span>}
          {wants_kids === true && <span className="tag">Wants kids</span>}
          {smoking === 'never' && <span className="tag">Non-smoker</span>}
          {drinking === 'socially' && <span className="tag">Social drinker</span>}
          {drinking === 'never' && <span className="tag">Non-drinker</span>}
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 pt-3 flex gap-3">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handlePass}
          className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.96]"
          style={{
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.3)',
            fontSize: 13,
          }}
        >
          <X size={15} /> Pass
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleLike}
          className="flex-[2] py-3.5 rounded-xl flex items-center justify-center gap-2 font-heading text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.96]"
          style={{
            background: 'rgba(255,59,48,0.1)',
            border: '1px solid rgba(255,59,48,0.28)',
            color: '#FF3B30',
          }}
        >
          <Heart size={15} /> Like
        </button>
      </div>
    </div>
  )
}
