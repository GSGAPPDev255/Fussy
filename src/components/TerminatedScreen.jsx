import { useNavigate } from 'react-router-dom'
import { Zap, RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'

export default function TerminatedScreen({ matchId, otherName }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Symbol */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border border-urgency/20 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-urgency/40 flex items-center justify-center">
            <Zap size={28} className="text-urgency/60" />
          </div>
        </div>
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full border border-urgency/10 scale-110 animate-ping" />
      </div>

      {/* Copy */}
      <h1 className="font-heading text-3xl text-text text-center mb-3 leading-tight">
        Connection<br />
        <span className="text-urgency">Lost.</span>
      </h1>

      <p className="text-sm text-subdued text-center max-w-xs leading-relaxed mb-2">
        {otherName ? (
          <>Your match with <span className="text-text">{otherName}</span> expired without a date being booked.</>
        ) : (
          'This match expired without a date being booked.'
        )}
      </p>

      <p className="font-mono text-xs text-urgency/60 text-center mb-10 uppercase tracking-widest">
        72 hours. No replay.
      </p>

      {/* Philosophy block */}
      <div className="w-full max-w-xs border border-border rounded-xl p-5 mb-8">
        <p className="section-label mb-3">Why Fussy does this</p>
        <p className="text-xs text-subdued leading-relaxed">
          Zombie matches — conversations that go nowhere for weeks — are the #1 reason dating apps waste your time.
          The 72-hour fuse keeps intent real. If the connection mattered, a date would've been set.
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <Button onClick={() => navigate('/browse')}>
          <RotateCcw size={15} /> Back to Browse
        </Button>
        <Button variant="ghost" onClick={() => navigate('/matches')}>
          View Active Matches
        </Button>
      </div>
    </div>
  )
}
