import { useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'

export default function TerminatedScreen({ matchId, otherName }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 relative overflow-hidden animate-fade-in"
      style={{ background: '#080808' }}>

      {/* Background bleed */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,59,48,0.05) 0%, transparent 65%)' }} />

      {/* Top line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,59,48,0.3), transparent)' }} />

      <div className="relative z-10 w-full max-w-xs text-center">

        {/* Icon ring */}
        <div className="flex items-center justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ border: '1px solid rgba(255,59,48,0.2)', background: 'rgba(255,59,48,0.04)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ border: '1px solid rgba(255,59,48,0.35)', background: 'rgba(255,59,48,0.08)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF3B30',
                  boxShadow: '0 0 8px rgba(255,59,48,0.8), 0 0 20px rgba(255,59,48,0.4)' }} />
              </div>
            </div>
            {/* Ping ring */}
            <div className="absolute inset-0 rounded-full animate-ping"
              style={{ border: '1px solid rgba(255,59,48,0.1)', animationDuration: '2s' }} />
          </div>
        </div>

        {/* Headline */}
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3"
          style={{ color: 'rgba(255,59,48,0.5)' }}>Connection Terminated</p>
        <h1 className="font-heading text-5xl text-white leading-none mb-2">
          FUSE<br />
          <span style={{ color: '#FF3B30', textShadow: '0 0 30px rgba(255,59,48,0.4)' }}>BURNT.</span>
        </h1>

        {otherName && (
          <p className="text-sm mt-4 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Your match with <span style={{ color: 'rgba(255,255,255,0.7)' }}>{otherName}</span> expired.
          </p>
        )}

        <p className="font-mono text-xs mb-10"
          style={{ color: 'rgba(255,59,48,0.45)', letterSpacing: '0.1em' }}>
          72 HOURS · NO REPLAY · NO EXCEPTIONS
        </p>

        {/* Philosophy */}
        <div className="mb-10 rounded-2xl p-5 text-left"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="section-label mb-2">Why Fussy does this</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Zombie matches waste your time. The 72-hour fuse keeps intent real.
            If the connection mattered, a date would have been set.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/browse')}
            className="btn-primary flex items-center justify-between w-full group"
          >
            <span>Back to Browse</span>
            <RotateCcw size={14} className="transition-transform duration-300 group-hover:-rotate-180" />
          </button>
          <button
            onClick={() => navigate('/matches')}
            className="btn-ghost w-full"
          >
            View Active Matches
          </button>
        </div>
      </div>
    </div>
  )
}
