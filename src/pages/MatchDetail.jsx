import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase, getMatch, subscribeToMatch } from '../lib/supabaseClient'
import MatchFuse from '../components/MatchFuse'
import TerminatedScreen from '../components/TerminatedScreen'
import useAuthStore from '../store/useAuthStore'

export default function MatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [match, setMatch]   = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data, error } = await getMatch(id)
    if (!error && data) setMatch(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = subscribeToMatch(id, ({ new: updated }) => {
      setMatch((prev) => prev ? { ...prev, ...updated } : updated)
    })
    return () => supabase.removeChannel(channel)
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(232,51,106,0.2)', borderTopColor: '#E8336A' }} />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="py-24 text-center text-sm" style={{ color: '#9B8890' }}>Match not found.</div>
    )
  }

  const isUser1 = match.user_1 === user?.id
  const other   = isUser1 ? match.profile_2 : match.profile_1

  if (match.status === 'expired') {
    return <TerminatedScreen matchId={id} otherName={other?.display_name} />
  }

  return (
    <div>
      {/* Nav */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: '1.5px solid #F0E4DC', background: 'rgba(254,246,240,0.95)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate('/matches')}
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#9B8890', background: '#FFFFFF', border: '1.5px solid #F0E4DC' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFF0F5, #FEF6F0)', border: '1.5px solid #F0E4DC' }}>
            {other?.avatar_url
              ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="font-heading text-sm" style={{ color: '#D4A8B5' }}>{other?.display_name?.[0]?.toUpperCase()}</span>}
          </div>
          <span className="font-heading text-base" style={{ color: '#1C1018' }}>{other?.display_name}</span>
        </div>
      </div>

      <div className="px-4 py-4">
        <MatchFuse match={match} onDateSet={() => load()} onExpired={() => load()} />
      </div>
    </div>
  )
}
