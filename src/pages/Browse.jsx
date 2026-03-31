import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, SearchX } from 'lucide-react'
import { getCandidates } from '../lib/supabaseClient'
import CandidateCard from '../components/CandidateCard'
import { Button } from '../components/ui/Button'
import useAuthStore from '../store/useAuthStore'

export default function Browse() {
  const user = useAuthStore((s) => s.user)
  const [candidates, setCandidates] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await getCandidates(user.id)
    setLoading(false)
    if (rpcError) { setError(rpcError.message); return }
    setCandidates(data ?? [])
    setIndex(0)
  }, [user])

  useEffect(() => { load() }, [load])

  const handleAction = (action, id) => {
    setIndex((i) => i + 1)
  }

  const current = candidates[index]

  return (
    <div className="flex flex-col min-h-0 flex-1 px-4 pt-2 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl">Browse</h1>
        <button onClick={load} className="p-2 text-subdued hover:text-text transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-urgency/30 border-t-urgency rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-xs text-urgency">{error}</p>
          <Button variant="ghost" onClick={load}>Retry</Button>
        </div>
      )}

      {!loading && !error && !current && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <SearchX size={36} className="text-subdued/40 mb-4" />
          <h2 className="font-heading text-lg mb-2">No candidates right now.</h2>
          <p className="text-sm text-subdued max-w-xs leading-relaxed mb-6">
            Fussy's reciprocal filter means you only see people whose criteria you also meet. Quality over volume.
          </p>
          <Button variant="ghost" onClick={load}>
            <RefreshCw size={14} /> Check again
          </Button>
        </div>
      )}

      {!loading && current && (
        <div className="max-w-sm mx-auto w-full">
          <p className="font-mono text-xs text-subdued mb-3">
            {candidates.length - index} candidate{candidates.length - index !== 1 ? 's' : ''} · reciprocal match
          </p>
          <CandidateCard key={current.id} candidate={current} onAction={handleAction} />
        </div>
      )}
    </div>
  )
}
