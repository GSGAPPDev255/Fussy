import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail, signUpWithEmail } from '../lib/supabaseClient'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
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

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else if (mode === 'signup' && data?.user && !data?.session) {
      setMessage('Check your email to confirm your account.')
    } else {
      // Sign-in succeeded — navigate explicitly instead of relying on reactive store
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col justify-center px-6 py-12">
      {/* Wordmark */}
      <div className="mb-10">
        <h1 className="font-heading text-4xl text-urgency tracking-tight">FUSSY</h1>
        <p className="text-subdued text-sm mt-1">The anti-waste-of-time dating app.</p>
      </div>

      {/* Manifesto pills */}
      <div className="flex flex-wrap gap-2 mb-10">
        {['Reciprocal filtering', '72h match fuse', 'No zombie matches'].map((t) => (
          <span key={t} className="tag-active text-xs">{t}</span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />

        {error && (
          <p className="text-xs text-urgency bg-urgency/10 px-3 py-2 rounded-lg">{error}</p>
        )}
        {message && (
          <p className="text-xs text-success bg-success/10 px-3 py-2 rounded-lg">{message}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Loading…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <button
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
        className="mt-6 text-sm text-subdued hover:text-text transition-colors text-center"
      >
        {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
