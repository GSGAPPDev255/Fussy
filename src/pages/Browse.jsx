import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, SearchX, Sliders } from 'lucide-react'
import { getCandidates } from '../lib/supabaseClient'
import CandidateCard from '../components/CandidateCard'
import useAuthStore from '../store/useAuthStore'

export default function Browse() {
  const user = useAuthStore((s) => s.user)
  const [candidates, setCandidates] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lessFussy, setLessFussy] = useState(false)

  const load = useCallback(async (lf = lessFussy) => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await getCandidates(user.id, lf)
    setLoading(false)
    if (rpcError) { setError(rpcError.message); return }
    setCandidates(data ?? [])
    setIndex(0)
  }, [user, lessFussy])

  useEffect(() => { load() }, [load])

  const handleAction = () => setIndex((i) => i + 1)

  const toggleLessFussy = () => {
    const next = !lessFussy
    setLessFussy(next)
    load(next)
  }

  const current  = candidates[index]
  const nextCard = candidates[index + 1]
  const remaining = candidates.length - index

  return (
    <div className="px-4 pt-4 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl text-white">Browse</h1>
          {!loading && remaining > 0 && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
              {remaining}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLessFussy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200"
            style={lessFussy ? {
              background: 'rgba(255,159,10,0.12)', border: '1px solid rgba(255,159,10,0.35)', color: '#FF9F0A',
            } : {
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)',
            }}>
            <Sliders size={12} />
            <span className="text-[11px] font-mono tracking-wide">{lessFussy ? 'Less Fussy' : 'Fussy'}</span>
          </button>
          <button onClick={() => load()}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Less Fussy banner */}
      {lessFussy && (
        <div className="mb-3 px-3 py-2 rounded-xl animate-fade-in"
          style={{ background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)' }}>
          <span className="text-xs leading-relaxed" style={{ color: 'rgba(255,159,10,0.85)' }}>
            Less Fussy mode — you'll see more people. Their filters may not perfectly match yours.
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(255,59,48,0.2)', borderTopColor: '#FF3B30' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center text-center py-24 gap-4">
          <p className="text-xs" style={{ color: '#FF6B63' }}>{error}</p>
          <button onClick={() => load()} className="text-sm px-4 py-2 rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !current && (
        <div className="flex flex-col items-center justify-center text-center px-6 py-24">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <SearchX size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <h2 className="font-heading text-lg text-white mb-2">No candidates right now</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {lessFussy
              ? "You've seen everyone available. Check back later."
              : "Fussy's reciprocal filter means you only see people who also meet yours. Try Less Fussy for more results."}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => load()} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
              <RefreshCw size={13} /> Refresh
            </button>
            {!lessFussy && (
              <button onClick={toggleLessFussy} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
                style={{ border: '1px solid rgba(255,159,10,0.3)', color: '#FF9F0A', background: 'rgba(255,159,10,0.08)' }}>
                <Sliders size={13} /> Try Less Fussy
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card stack */}
      {!loading && !error && current && (
        <div className="max-w-sm mx-auto w-full">
          <div className="relative">
            {/* Back card */}
            {nextCard && (
              <div className="absolute inset-x-0 top-0 pointer-events-none"
                style={{ zIndex: 1, transform: 'scale(0.94) translateY(10px)', transformOrigin: 'bottom center' }}>
                <CandidateCard key={`back-${nextCard.id}`} candidate={nextCard} isBack />
              </div>
            )}
            {/* Front card */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <CandidateCard key={current.id} candidate={current} onAction={handleAction} />
            </div>
          </div>

          {index === 0 && candidates.length > 0 && (
            <p className="text-center font-mono text-[10px] mt-4"
              style={{ color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em' }}>
              SWIPE RIGHT TO LIKE · LEFT TO PASS
            </p>
          )}
        </div>
      )}
    </div>
  )
}
