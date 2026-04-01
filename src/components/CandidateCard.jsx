import { useState } from 'react'
import { Heart, X, MapPin, Ruler, Flame } from 'lucide-react'
import { createMatch } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

export default function CandidateCard({ candidate, onAction }) {
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState(null)

  const { id, display_name, attributes, avatar_url } = candidate
  const { age, gender, location_city, height_cm, has_kids, wants_kids, smoking, drinking } = attributes ?? {}

  const handleLike = async () => {
    setStatus('liked')
    await createMatch(user.id, id)
    setTimeout(() => onAction?.('like', id), 600)
  }

  const handlePass = () => {
    setStatus('passed')
    setTimeout(() => onAction?.('pass', id), 350)
  }

  if (status === 'liked') {
    return (
      <div className="animate-fade-in rounded-2xl overflow-hidden relative"
        style={{ border: '1px solid rgba(52,199,89,0.25)', background: 'rgba(52,199,89,0.04)' }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(52,199,89,0.08) 0%, transparent 70%)' }} />
        <div className="flex flex-col items-center justify-center py-14 relative z-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(52,199,89,0.15)', border: '1px solid rgba(52,199,89,0.3)',
              boxShadow: '0 0 30px rgba(52,199,89,0.2)' }}>
            <Flame size={24} className="text-[#34C759]" />
          </div>
          <p className="font-heading text-2xl text-white mb-1">Fuse Lit</p>
          <p className="text-xs font-mono" style={{ color: 'rgba(52,199,89,0.7)', letterSpacing: '0.1em' }}>
            72:00:00 STARTS NOW
          </p>
        </div>
      </div>
    )
  }

  if (status === 'passed') {
    return (
      <div className="animate-fade-in rounded-2xl py-10 flex flex-col items-center justify-center opacity-30"
        style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
        <X size={18} style={{ color: 'rgba(255,255,255,0.3)' }} className="mb-2" />
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Passed</p>
      </div>
    )
  }

  const initial = display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="animate-slide-up rounded-2xl overflow-hidden relative"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>

      {/* Avatar area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a1a, #111)' }}>
        {avatar_url ? (
          <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Decorative background circles */}
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(255,59,48,0.06) 0%, transparent 60%)' }} />
            <span className="font-heading select-none relative z-10"
              style={{ fontSize: 'clamp(80px, 30vw, 140px)', color: 'rgba(255,255,255,0.06)',
                textShadow: '0 0 60px rgba(255,59,48,0.15)' }}>
              {initial}
            </span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.4) 60%, transparent 100%)' }} />

        {/* Name + location overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="font-heading text-2xl text-white leading-none mb-1"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {display_name}{age && <span className="font-mono text-base text-white/50 ml-2">{age}</span>}
              </h3>
              {location_city && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{location_city}</span>
                  {height_cm && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{height_cm}cm</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Reciprocal badge */}
            <div className="px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)' }}>
              <span className="text-[10px] font-mono" style={{ color: '#FF3B30', letterSpacing: '0.08em' }}>MATCH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags row */}
      <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
        {has_kids === false && <span className="tag">No kids</span>}
        {has_kids === true && <span className="tag">Has kids</span>}
        {wants_kids === true && <span className="tag">Wants kids</span>}
        {smoking === 'never' && <span className="tag">Non-smoker</span>}
        {drinking === 'socially' && <span className="tag">Social drinker</span>}
        {drinking === 'never' && <span className="tag">Non-drinker</span>}
      </div>

      {/* Action buttons */}
      <div className="p-4 pt-3 flex gap-3">
        <button onClick={handlePass}
          className="flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97]"
          style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
          <X size={15} /> Pass
        </button>
        <button onClick={handleLike}
          className="flex-[2] py-3.5 rounded-xl flex items-center justify-center gap-2 font-heading text-sm tracking-wider uppercase transition-all duration-200 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, rgba(255,59,48,0.15), rgba(255,59,48,0.08))',
            border: '1px solid rgba(255,59,48,0.3)', color: '#FF3B30',
            boxShadow: '0 0 20px rgba(255,59,48,0.08)' }}>
          <Heart size={15} /> Like
        </button>
      </div>
    </div>
  )
}
