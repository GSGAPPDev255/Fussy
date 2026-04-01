import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, SearchX, Sliders } from 'lucide-react'
import { getCandidates } from '../lib/supabaseClient'
import CandidateCard from '../components/CandidateCard'
import useAuthStore from '../store/useAuthStore'

export default function Browse() {
  const user = useAuthStore((s) => s.user)
  const [candidates, setCandidates] = useState([])
  const [index, setIndex]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [lessFussy, setLessFussy]   = useState(false)

  const load = useCallback(async (lf = lessFussy) => {
    if (!user) return
    setLoading(true); setError(null)
    const { data, error: rpcError } = await getCandidates(user.id, lf)
    setLoading(false)
    if (rpcError) { setError(rpcError.message); return }
    setCandidates(data ?? []); setIndex(0)
  }, [user, lessFussy])

  useEffect(() => { load() }, [load])

  const handleAction = () => setIndex((i) => i + 1)

  const toggleLessFussy = () => {
    const next = !lessFussy
    setLessFussy(next)
    load(next)
  }

  const current   = candidates[index]
  const nextCard  = candidates[index + 1]
  const remaining = candidates.length - index

  return (
    <div className="px-4 pt-4 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl" style={{ color: '#1C1018' }}>Browse</h1>
          {!loading && remaining > 0 && (
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#FEF0F4', border: '1.5px solid #F8D6E0', color: '#C0526E' }}>
              {remaining}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleLessFussy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
            style={lessFussy ? {
              background: 'rgba(245,158,11,0.1)', border: '1.5px solid rgba(245,158,11,0.35)', color: '#D97706',
            } : {
              background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#9B8890',
            }}>
            <Sliders size={12} />
            {lessFussy ? 'Less Fussy' : 'Fussy'}
          </button>
          <button onClick={() => load()}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#C4ADB5' }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Less Fussy banner */}
      {lessFussy && (
        <div className="mb-3 px-3 py-2.5 rounded-2xl animate-fade-in"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#B45309' }}>
            Less Fussy mode — showing more people. Their filters may not perfectly match yours.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(232,51,106,0.2)', borderTopColor: '#E8336A' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center text-center py-20 gap-4">
          <p className="text-sm px-4 py-2.5 rounded-2xl"
            style={{ background: 'rgba(232,51,106,0.08)', color: '#E8336A', border: '1.5px solid rgba(232,51,106,0.2)' }}>
            {error}
          </p>
          <button onClick={() => load()} className="text-sm px-5 py-2.5 rounded-2xl font-medium"
            style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#6B4C58' }}>
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !current && (
        <div className="flex flex-col items-center text-center px-6 py-20">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, #FFF0F5, #FEF6F0)', border: '1.5px solid #F0E4DC' }}>
            <SearchX size={24} style={{ color: '#C4ADB5' }} />
          </div>
          <h2 className="font-heading text-xl mb-2" style={{ color: '#1C1018' }}>No one new right now</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#9B8890' }}>
            {lessFussy
              ? "You've seen everyone available. Check back later."
              : "Fussy only shows people who mutually match your criteria. Try Less Fussy for more results."}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => load()} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-2xl font-medium"
              style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#9B8890' }}>
              <RefreshCw size={13} /> Refresh
            </button>
            {!lessFussy && (
              <button onClick={toggleLessFussy} className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-2xl font-medium"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)', color: '#D97706' }}>
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
            {nextCard && (
              <div className="absolute inset-x-0 top-0 pointer-events-none"
                style={{ zIndex: 1, transform: 'scale(0.94) translateY(12px)', transformOrigin: 'bottom center' }}>
                <CandidateCard key={`back-${nextCard.id}`} candidate={nextCard} isBack />
              </div>
            )}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <CandidateCard key={current.id} candidate={current} onAction={handleAction} />
            </div>
          </div>

          {index === 0 && candidates.length > 1 && (
            <p className="text-center font-mono text-[10px] mt-4"
              style={{ color: '#C4ADB5', letterSpacing: '0.08em' }}>
              SWIPE RIGHT TO LIKE · LEFT TO PASS
            </p>
          )}
        </div>
      )}
    </div>
  )
}
