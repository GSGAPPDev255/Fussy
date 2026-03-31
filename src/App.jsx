import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import Auth from './pages/Auth'
import Browse from './pages/Browse'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Profile from './pages/Profile'
import FussyOnboarding from './components/FussyOnboarding'
import BottomNav from './components/BottomNav'

function ProtectedLayout({ children }) {
  return (
    <div className="flex flex-col min-h-dvh max-w-md mx-auto">
      <div className="flex-1 flex flex-col overflow-y-auto">
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
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-urgency/30 border-t-urgency rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />
  return children
}

function RequireOnboarding({ children }) {
  const { profile } = useAuthStore()

  if (profile && !profile.onboarding_complete) {
    return (
      <FussyOnboarding
        onComplete={() => window.location.href = '/browse'}
      />
    )
  }

  // Profile still loading — show nothing briefly
  if (profile === null) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-urgency/30 border-t-urgency rounded-full animate-spin" />
      </div>
    )
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

        <Route
          path="/*"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <ProtectedLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/browse" replace />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/match/:id" element={<MatchDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/browse" replace />} />
                  </Routes>
                </ProtectedLayout>
              </RequireOnboarding>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
