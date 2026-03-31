import { useState } from 'react'
import { Heart, X, MapPin, Ruler } from 'lucide-react'
import { createMatch } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

export default function CandidateCard({ candidate, onAction }) {
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState(null) // 'liked' | 'passed' | null

  const { id, display_name, attributes, avatar_url } = candidate
  const { age, gender, location_city, height_cm, has_kids, wants_kids } = attributes ?? {}

  const handleLike = async () => {
    setStatus('liked')
    await createMatch(user.id, id)
    setTimeout(() => onAction?.('like', id), 400)
  }

  const handlePass = () => {
    setStatus('passed')
    setTimeout(() => onAction?.('pass', id), 300)
  }

  if (status === 'liked') {
    return (
      <div className="card border-success/30 bg-success/5 flex flex-col items-center justify-center py-10 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-3">
          <Heart size={20} className="text-success" fill="currentColor" />
        </div>
        <p className="font-heading text-success">Fuse Lit</p>
        <p className="text-xs text-subdued mt-1">72-hour timer has started</p>
      </div>
    )
  }

  if (status === 'passed') {
    return (
      <div className="card border-border/50 flex flex-col items-center justify-center py-8 opacity-40 animate-fade-in">
        <X size={20} className="text-subdued mb-2" />
        <p className="text-xs text-subdued">Passed</p>
      </div>
    )
  }

  return (
    <div className="card animate-slide-up">
      {/* Avatar */}
      <div className="aspect-[4/3] rounded-lg bg-muted overflow-hidden mb-4 flex items-center justify-center">
        {avatar_url ? (
          <img src={avatar_url} alt={display_name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-heading text-6xl text-subdued/30">
            {display_name?.[0]?.toUpperCase() ?? '?'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="font-heading text-xl">{display_name}</h3>
          {age && <span className="font-mono text-sm text-subdued">{age}</span>}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-subdued">
          {location_city && (
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {location_city}
            </span>
          )}
          {height_cm && (
            <span className="flex items-center gap-1">
              <Ruler size={11} /> {height_cm}cm
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {has_kids === false && <span className="tag">No kids</span>}
        {has_kids === true && <span className="tag">Has kids</span>}
        {wants_kids === true && <span className="tag">Wants kids</span>}
        {attributes?.smoking && <span className="tag">{attributes.smoking === 'never' ? 'Non-smoker' : attributes.smoking}</span>}
        {attributes?.drinking && <span className="tag">{attributes.drinking === 'socially' ? 'Social drinker' : attributes.drinking}</span>}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePass}
          className="flex-1 py-3 rounded-lg border border-border text-subdued text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:border-muted"
        >
          <X size={16} /> Pass
        </button>
        <button
          onClick={handleLike}
          className="flex-1 py-3 rounded-lg bg-urgency/15 border border-urgency/30 text-urgency text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-urgency/25"
        >
          <Heart size={16} /> Like
        </button>
      </div>
    </div>
  )
}
