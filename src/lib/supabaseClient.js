import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUpWithEmail = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signOut = () => supabase.auth.signOut()

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

export const getProfile = (userId) =>
  supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

export const upsertProfile = (profile) =>
  supabase.from('profiles').upsert(profile, { onConflict: 'id' }).select().maybeSingle()

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

/**
 * Fetch browse candidates.
 * @param {string} userId
 * @param {boolean} lessFussy  When true, skips the reverse-filter check so more people appear.
 */
export const getCandidates = (userId, lessFussy = false) =>
  supabase.rpc('get_fussy_candidates', {
    requesting_user_id: userId,
    p_less_fussy: lessFussy,
  })

export const createMatch = async (userId, candidateId) => {
  // Enforce ordered constraint: smaller UUID goes in user_1
  const [user_1, user_2] = [userId, candidateId].sort()
  return supabase.from('matches').insert({ user_1, user_2 }).select().single()
}

export const getActiveMatches = (userId) =>
  supabase
    .from('matches')
    .select(`
      *,
      profile_1:profiles!matches_user_1_fkey(id, display_name, avatar_url, attributes, soft_prefs),
      profile_2:profiles!matches_user_2_fkey(id, display_name, avatar_url, attributes, soft_prefs)
    `)
    .or(`user_1.eq.${userId},user_2.eq.${userId}`)
    .eq('status', 'active')
    .order('expires_at', { ascending: true })

export const getMatch = (matchId) =>
  supabase
    .from('matches')
    .select(`
      *,
      profile_1:profiles!matches_user_1_fkey(id, display_name, avatar_url, attributes, soft_prefs),
      profile_2:profiles!matches_user_2_fkey(id, display_name, avatar_url, attributes, soft_prefs)
    `)
    .eq('id', matchId)
    .single()

export const requestExtension = (matchId, userId, reason) =>
  supabase
    .from('matches')
    .update({ extension_requested_by: userId, extension_reason: reason })
    .eq('id', matchId)
    .eq('status', 'active')
    .is('extension_requested_by', null) // one-time only

export const approveExtension = (matchId, userId) =>
  supabase.rpc('approve_match_extension', { p_match_id: matchId, p_user_id: userId })

export const setDateBooked = (matchId) =>
  supabase
    .from('matches')
    .update({ status: 'date_set', date_set_at: new Date().toISOString() })
    .eq('id', matchId)

// ---------------------------------------------------------------------------
// Photo / Avatar helpers
// ---------------------------------------------------------------------------

/**
 * Upload a profile photo to Supabase Storage.
 * Bucket 'avatars' must exist and be public.
 */
export const uploadAvatar = async (userId, file) => {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  return { data, error, path }
}

/** Get a public URL for an avatar at the given storage path. */
export const getAvatarUrl = (path) =>
  supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl


// ---------------------------------------------------------------------------
// Realtime subscriptions
// ---------------------------------------------------------------------------

export const subscribeToMatch = (matchId, callback) =>
  supabase
    .channel(`match:${matchId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'matches',
      filter: `id=eq.${matchId}`,
    }, callback)
    .subscribe()

export const subscribeToUserMatches = (userId, callback) =>
  supabase
    .channel(`user_matches:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'matches',
      filter: `user_1=eq.${userId}`,
    }, callback)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'matches',
      filter: `user_2=eq.${userId}`,
    }, callback)
    .subscribe()
