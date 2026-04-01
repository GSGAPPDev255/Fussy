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
    if (authError) { setLoading(false); setError(authError.message); return }
    if (mode === 'signup' && data?.user && !data?.session) {
      setLoading(false); setMessage('Check your email to confirm your account.'); return
    }
    if (data?.session) { setSession(data.session); await fetchProfile(data.session.user.id) }
    setLoading(false)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#0D0D0F' }}>

      {/* Hero top section */}
      <div className="flex-1 flex flex-col justify-end px-6 pb-8 pt-16 max-w-sm mx-auto w-full">

        {/* Wordmark */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-0.5 mb-3">
            <span className="font-heading text-5xl text-white tracking-tight">FUSSY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] mb-auto mt-2 ml-1" />
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
            High-intent dating. No games.
          </p>
        </div>

        {/* Feature list */}
        <div className="mb-10 space-y-2.5">
          {[
            'Reciprocal matching — you only see who also matches you',
            '72-hour fuse on every match — book a date or it expires',
            'Zero zombie conversations',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" style={{ background: '#FF3B30' }} />
              <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2.5">
            <input
              type="email"
              className="input-field"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="text-xs px-1 animate-fade-in" style={{ color: '#FF6B63' }}>{error}</p>
          )}
          {message && (
            <p className="text-xs px-1 animate-fade-in" style={{ color: '#34C759' }}>{message}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-between gap-2">
            <span>{loading ? 'Signing in…' : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
            {!loading && <ArrowRight size={16} />}
            {loading && <div className="w-4 h-4 border-2 rounded-full border-white/20 border-t-white animate-spin" />}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
          className="mt-5 text-xs text-center"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {mode === 'signin'
            ? <>No account? <span style={{ color: 'rgba(255,255,255,0.6)' }}>Sign up</span></>
            : <>Have an account? <span style={{ color: 'rgba(255,255,255,0.6)' }}>Sign in</span></>
          }
        </button>
      </div>
    </div>
  )
}
