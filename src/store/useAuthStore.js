import { create } from 'zustand'
import { supabase, getProfile } from '../lib/supabaseClient'

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  profileFetched: false, // true once fetch has completed (data or no row)
  loading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null })
  },

  fetchProfile: async (userId) => {
    try {
      const { data, error } = await getProfile(userId)
      set({ profile: data ?? null, profileFetched: true })
      return { data, error }
    } catch (e) {
      // Never leave profileFetched as false — onboarding gate would spin forever
      set({ profile: null, profileFetched: true })
      return { data: null, error: e }
    }
  },

  setProfile: (profile) => set({ profile, profileFetched: true }),

  clearAuth: () => set({ session: null, user: null, profile: null }),

  setLoading: (loading) => set({ loading }),

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, loading: false })

    if (session?.user) {
      get().fetchProfile(session.user.id)
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null })
      if (event === 'SIGNED_IN' && session?.user) {
        get().fetchProfile(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        set({ profile: null, profileFetched: false })
      }
    })
  },
}))

export default useAuthStore
