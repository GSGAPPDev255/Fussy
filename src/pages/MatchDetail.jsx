import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getMatch, subscribeToMatch } from '../lib/supabaseClient'
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
    return () => channel.unsubscribe()
  }, [id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-urgency/30 border-t-urgency rounded-full animate-spin" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex-1 flex items-center justify-center text-subdued text-sm">
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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Nav bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate('/matches')}
          className="p-1.5 text-subdued hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <span className="font-heading text-base">{other?.display_name}</span>
      </div>

      {/* Fuse UI */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <MatchFuse
          match={match}
          onDateSet={() => load()}
          onExpired={() => load()}
        />
      </div>
    </div>
  )
}
