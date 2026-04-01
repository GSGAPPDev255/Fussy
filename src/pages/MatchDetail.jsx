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
  const [match, setMatch] = useState(null)
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
          style={{ borderColor: 'rgba(255,59,48,0.2)', borderTopColor: '#FF3B30' }} />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="py-24 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
        Match not found.
      </div>
    )
  }

  const isUser1 = match.user_1 === user?.id
  const other = isUser1 ? match.profile_2 : match.profile_1

  if (match.status === 'expired') {
    return <TerminatedScreen matchId={id} otherName={other?.display_name} />
  }

  return (
    <div>
      {/* Nav bar */}
      <div className="flex items-center gap-3 px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate('/matches')}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}>
          <ArrowLeft size={18} />
        </button>
        <span className="font-heading text-base text-white">{other?.display_name}</span>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <MatchFuse match={match} onDateSet={() => load()} onExpired={() => load()} />
      </div>
    </div>
  )
}
