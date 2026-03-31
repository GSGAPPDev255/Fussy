import { useState, useEffect, useRef } from 'react'

/**
 * Returns { hours, minutes, seconds, total, isUrgent, isExpired }
 * isUrgent = under 12 hours remaining
 */
export function useCountdown(expiresAt) {
  const calcRemaining = () => {
    const now = Date.now()
    const end = new Date(expiresAt).getTime()
    return Math.max(0, Math.floor((end - now) / 1000))
  }

  const [remaining, setRemaining] = useState(calcRemaining)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!expiresAt) return

    setRemaining(calcRemaining())

    intervalRef.current = setInterval(() => {
      const r = calcRemaining()
      setRemaining(r)
      if (r <= 0) clearInterval(intervalRef.current)
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [expiresAt])

  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = remaining % 60

  return {
    hours,
    minutes,
    seconds,
    total: remaining,
    isUrgent: remaining < 43200, // < 12h
    isCritical: remaining < 3600, // < 1h
    isExpired: remaining <= 0,
    display: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  }
}
