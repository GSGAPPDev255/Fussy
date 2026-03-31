import { useState, useEffect, useCallback } from 'react'
import { getActiveMatches, subscribeToUserMatches } from '../lib/supabaseClient'
import useAuthStore from '../store/useAuthStore'

export function useMatches() {
  const user = useAuthStore((s) => s.user)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await getActiveMatches(user.id)
    if (error) setError(error.message)
    else setMatches(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user) return
    const channel = subscribeToUserMatches(user.id, () => load())
    return () => channel.unsubscribe()
  }, [user, load])

  return { matches, loading, error, reload: load }
}

// ---------------------------------------------------------------------------
// Fussy Score — soft preferences compatibility %
// ---------------------------------------------------------------------------
export function calcFussyScore(myPrefs, theirPrefs) {
  if (!myPrefs || !theirPrefs) return 0

  const checks = [
    () => {
      if (!myPrefs.education || !theirPrefs.education) return null
      return myPrefs.education === theirPrefs.education ? 1 : 0
    },
    () => {
      if (!myPrefs.religion || !theirPrefs.religion) return null
      return myPrefs.religion === theirPrefs.religion ? 1 : 0
    },
    () => {
      if (!myPrefs.drinking || !theirPrefs.drinking) return null
      return myPrefs.drinking === theirPrefs.drinking ? 1 : 0
    },
    () => {
      if (!myPrefs.smoking || !theirPrefs.smoking) return null
      return myPrefs.smoking === theirPrefs.smoking ? 1 : 0
    },
    () => {
      const a = myPrefs.interests ?? []
      const b = theirPrefs.interests ?? []
      if (!a.length || !b.length) return null
      const overlap = a.filter((i) => b.includes(i))
      return overlap.length / Math.max(a.length, b.length)
    },
    () => {
      if (!myPrefs.ethnicity || !theirPrefs.ethnicity) return null
      return myPrefs.ethnicity === theirPrefs.ethnicity ? 1 : 0.5
    },
  ]

  let score = 0
  let total = 0
  for (const check of checks) {
    const result = check()
    if (result !== null) { score += result; total++ }
  }

  return total > 0 ? Math.round((score / total) * 100) : 50
}
