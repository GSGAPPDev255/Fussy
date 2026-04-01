import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { signInWithEmail, signUpWithEmail } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

export default function Auth() {
  const navigate = useNavigate()
  const { setSession, fetchProfile } = useAuthStore()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const fn = mode === 'signup' ? signUpWithEmail : signInWithEmail
    const { error: authError, data } = await fn(email, password)

    if (authError) {
      setLoading(false)
      setError(authError.message)
      return
    }

    if (mode === 'signup' && data?.user && !data?.session) {
      setLoading(false)
      setMessage('Check your email to confirm your account.')
      return
    }

    if (data?.session) {
      setSession(data.session)
      await fetchProfile(data.session.user.id)
    }

    setLoading(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[#080808] flex flex-col relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,59,48,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60%] h-[40%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255,59,48,0.04) 0%, transparent 70%)' }} />

      {/* Top strip */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,59,48,0.4), transparent)' }} />

      <div className="flex-1 flex flex-col px-6 py-10 max-w-sm mx-auto w-full">

        {/* Wordmark */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="relative">
              <span className="font-heading text-7xl leading-none text-white animate-glow-pulse select-none"
                style={{ textShadow: '0 0 40px rgba(255,59,48,0.35)' }}>
                F
              </span>
              <div className="absolute -inset-2 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,59,48,0.15) 0%, transparent 70%)' }} />
            </div>
            <div className="pt-3">
              <p className="font-heading text-2xl text-white leading-none tracking-tight">USSY</p>
              <div className="h-px w-full mt-1.5"
                style={{ background: 'linear-gradient(90deg, rgba(255,59,48,0.6), transparent)' }} />
            </div>
          </div>
          <p className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
            THE ANTI-WASTE-OF-TIME DATING APP
          </p>
        </div>

        {/* Manifesto */}
        <div className="mb-10 space-y-3 animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
          {[
            { num: '01', label: 'Reciprocal filtering' },
            { num: '02', label: '72-hour match fuse' },
            { num: '03', label: 'No zombie matches' },
          ].map(({ num, label }) => (
            <div key={num} className="flex items-center gap-3">
              <span className="font-mono text-[10px] tabular-nums" style={{ color: 'rgba(255,59,48,0.6)' }}>{num}</span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 animate-slide-up"
          style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>

          <div className="space-y-3">
            <div>
              <label className="section-label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="section-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-xs animate-fade-in"
              style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30' }}>
              {error}
            </div>
          )}
          {message && (
            <div className="px-4 py-3 rounded-xl text-xs animate-fade-in"
              style={{ background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.2)', color: '#34C759' }}>
              {message}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-between group"
            >
              <span>{loading ? 'One moment…' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>
        </form>

        {/* Toggle mode */}
        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
          className="mt-6 text-xs text-center transition-colors duration-200"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {mode === 'signin'
            ? <span>No account? <span style={{ color: 'rgba(255,255,255,0.6)' }}>Sign up →</span></span>
            : <span>Have an account? <span style={{ color: 'rgba(255,255,255,0.6)' }}>Sign in →</span></span>
          }
        </button>
      </div>

      {/* Bottom strip */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }} />
    </div>
  )
}
