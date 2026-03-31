import { create } from 'zustand'
import { supabase, getProfile } from '../lib/supabaseClient'

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  setSession: (session) => {
    set({ session, user: session?.user ?? null })
  },

  fetchProfile: async (userId) => {
    const { data, error } = await getProfile(userId)
    if (!error && data) set({ profile: data })
    return { data, error }
  },

  setProfile: (profile) => set({ profile }),

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
        set({ profile: null })
      }
    })
  },
}))

export default useAuthStore
