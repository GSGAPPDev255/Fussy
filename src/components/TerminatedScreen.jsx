import { useNavigate } from 'react-router-dom'
import { RotateCcw, HeartCrack } from 'lucide-react'

export default function TerminatedScreen({ otherName }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 animate-fade-in"
      style={{ background: 'linear-gradient(160deg, #FFF0F5 0%, #FEF6F0 60%, #FFF0E8 100%)' }}>

      <div className="w-full max-w-xs text-center">

        {/* Icon */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(232,51,106,0.08)', border: '1.5px solid rgba(232,51,106,0.2)', boxShadow: '0 8px 24px rgba(232,51,106,0.15)' }}>
            <HeartCrack size={32} style={{ color: '#E8336A' }} />
          </div>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: '#C4ADB5' }}>
          Connection Ended
        </p>
        <h1 className="font-heading text-4xl mb-3" style={{ color: '#1C1018' }}>
          Fuse Burnt.
        </h1>

        {otherName && (
          <p className="text-sm mb-2" style={{ color: '#9B8890' }}>
            Your match with <span className="font-medium" style={{ color: '#1C1018' }}>{otherName}</span> has expired.
          </p>
        )}

        <p className="font-mono text-xs mb-8" style={{ color: '#C4ADB5', letterSpacing: '0.08em' }}>
          72 HOURS · NO REPLAY · NO EXCEPTIONS
        </p>

        {/* Info card */}
        <div className="rounded-2xl p-4 mb-8 text-left"
          style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', boxShadow: '0 2px 12px rgba(28,16,24,0.06)' }}>
          <p className="section-label mb-2">Why Fussy does this</p>
          <p className="text-xs leading-relaxed" style={{ color: '#9B8890' }}>
            Zombie matches waste your time. The 72-hour fuse keeps intent real — if the connection mattered, a date would have been set.
          </p>
        </div>

        <div className="space-y-3">
          <button onClick={() => navigate('/browse')} className="btn-primary flex items-center justify-between w-full group">
            <span>Back to Browse</span>
            <RotateCcw size={14} className="transition-transform duration-300 group-hover:-rotate-180" />
          </button>
          <button onClick={() => navigate('/matches')} className="btn-ghost w-full">
            View Active Matches
          </button>
        </div>
      </div>
    </div>
  )
}
