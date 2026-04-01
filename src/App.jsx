import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import Auth from './pages/Auth'
import Browse from './pages/Browse'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Profile from './pages/Profile'
import FussyOnboarding from './components/FussyOnboarding'
import BottomNav from './components/BottomNav'

function ScrollReset({ scrollRef }) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [pathname])
  return null
}

function ProtectedLayout({ children }) {
  const scrollRef = useRef(null)
  return (
    <div className="max-w-md mx-auto" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#080808' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <ScrollReset scrollRef={scrollRef} />
        {children}
      </div>
      <BottomNav />
    </div>
  )
}

function RequireAuth({ children }) {
  const { session, loading } = useAuthStore()
  if (loading) {
    return (
      <div style={{ height: '100dvh', background: '#0D0D0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(255,59,48,0.2)', borderTopColor: '#FF3B30' }} />
      </div>
    )
  }
  if (!session) return <Navigate to="/auth" replace />
  return children
}

function RequireOnboarding({ children }) {
  const { profile, profileFetched } = useAuthStore()
  if (!profileFetched) {
    return (
      <div style={{ height: '100dvh', background: '#0D0D0F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(255,59,48,0.2)', borderTopColor: '#FF3B30' }} />
      </div>
    )
  }
  if (!profile || !profile.onboarding_complete) {
    return <FussyOnboarding onComplete={() => { window.location.href = '/browse' }} />
  }
  return children
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  useEffect(() => { init() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/*" element={
          <RequireAuth>
            <RequireOnboarding>
              <ProtectedLayout>
                <Routes>
                  <Route path="/"          element={<Navigate to="/browse" replace />} />
                  <Route path="/browse"    element={<Browse />} />
                  <Route path="/matches"   element={<Matches />} />
                  <Route path="/match/:id" element={<MatchDetail />} />
                  <Route path="/profile"   element={<Profile />} />
                  <Route path="*"          element={<Navigate to="/browse" replace />} />
                </Routes>
              </ProtectedLayout>
            </RequireOnboarding>
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  )
}
