import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail, signUpWithEmail } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'
import { Heart, Shield, Zap } from 'lucide-react'

export default function Auth() {
  const navigate = useNavigate()
  const { setSession, fetchProfile } = useAuthStore()

  const [mode, setMode]       = useState('signin')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail
    const { data, error: authErr } = await fn(email, password)
    setLoading(false)

    if (authErr) { setError(authErr.message); return }

    if (mode === 'signup') {
      setError('Check your email to confirm your account, then sign in.')
      return
    }

    if (data?.session) {
      setSession(data.session)
      await fetchProfile(data.session.user.id)
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(160deg, #FFF0F5 0%, #FEF6F0 50%, #FFF0E8 100%)' }}>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6 text-center">

        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
            style={{ background: 'linear-gradient(135deg, #E8336A, #FF6B6B)', boxShadow: '0 8px 32px rgba(232,51,106,0.35)' }}>
            <Heart size={36} className="text-white" fill="white" />
          </div>
          <div className="flex items-center justify-center gap-1">
            <span className="font-heading text-5xl" style={{ color: '#1C1018' }}>FUSSY</span>
            <span className="w-2 h-2 rounded-full mb-auto mt-2 ml-0.5" style={{ background: '#E8336A' }} />
          </div>
          <p className="text-sm mt-2" style={{ color: '#9B8890' }}>Dating with standards.</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {[
            { icon: Shield, text: 'Reciprocal matching' },
            { icon: Zap,    text: '72h to book a date' },
            { icon: Heart,  text: 'Real compatibility' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: '#FFFFFF', border: '1.5px solid #F0E4DC', color: '#6B4C58', boxShadow: '0 2px 8px rgba(28,16,24,0.06)' }}>
              <Icon size={11} style={{ color: '#E8336A' }} />
              {text}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">
          <div className="rounded-3xl p-6" style={{ background: '#FFFFFF', boxShadow: '0 8px 40px rgba(28,16,24,0.1)', border: '1.5px solid #F0E4DC' }}>

            {/* Mode tabs */}
            <div className="flex rounded-2xl p-1 mb-6" style={{ background: '#FEF6F0' }}>
              {['signin', 'signup'].map((m) => (
                <button key={m} onClick={() => { setMode(m); setError(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={mode === m ? {
                    background: '#FFFFFF',
                    color: '#1C1018',
                    boxShadow: '0 2px 8px rgba(28,16,24,0.1)',
                  } : {
                    color: '#9B8890',
                    background: 'transparent',
                  }}>
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-3">
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
                onChange={(e) => setPass(e.target.value)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />

              {error && (
                <p className="text-xs px-3 py-2.5 rounded-xl leading-relaxed"
                  style={error.includes('Check your email')
                    ? { background: 'rgba(0,179,122,0.08)', color: '#00B37A', border: '1px solid rgba(0,179,122,0.2)' }
                    : { background: 'rgba(232,51,106,0.08)', color: '#E8336A', border: '1px solid rgba(232,51,106,0.2)' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <p className="text-center text-xs pb-8 px-6" style={{ color: '#C4ADB5' }}>
        By continuing you agree to our Terms &amp; Privacy Policy.
      </p>
    </div>
  )
}
