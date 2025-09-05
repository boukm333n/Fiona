'use client'

import { useEffect } from 'react'

/**
 * One-time client-side migration of legacy localStorage keys to Fiona-branded keys.
 * - Psych Profile: psych_profile_v1 -> fiona-psych-profile-v1 (confirmed old key)
 * - Trades: best-effort discovery of any prior persisted trades key by inspecting JSON shape { state: { trades:[], reflections:[] } }
 */
export default function StorageMigration() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const FLAG = 'fiona-migration-2025-08-30'
      if (localStorage.getItem(FLAG)) return

      // Psych profile: known old key
      try {
        const NEW_PSYCH = 'fiona-psych-profile-v1'
        const OLD_PSYCH = 'psych_profile_v1'
        const hasNew = !!localStorage.getItem(NEW_PSYCH)
        const oldVal = localStorage.getItem(OLD_PSYCH)
        if (!hasNew && oldVal) {
          localStorage.setItem(NEW_PSYCH, oldVal)
          localStorage.removeItem(OLD_PSYCH)
        }
      } catch {}

      // Trades: best-effort discovery by content shape
      try {
        const NEW_TRADES = 'fiona-trades-storage'
        const hasNewTrades = !!localStorage.getItem(NEW_TRADES)
        if (!hasNewTrades) {
          let candidateKey: string | null = null
          let bestLen = -1
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key) continue
            if (key === NEW_TRADES || key === 'fiona-psych-profile-v1' || key === FLAG) continue
            const val = localStorage.getItem(key)
            if (!val) continue
            try {
              const parsed = JSON.parse(val)
              const state = parsed?.state ?? parsed
              const trades = state?.trades
              const reflections = state?.reflections
              if (Array.isArray(trades) && Array.isArray(reflections)) {
                const len = trades.length
                if (len > bestLen) {
                  bestLen = len
                  candidateKey = key
                }
              }
            } catch {}
          }
          if (candidateKey) {
            const v = localStorage.getItem(candidateKey)
            if (v) {
              localStorage.setItem(NEW_TRADES, v)
              localStorage.removeItem(candidateKey)
            }
          }
        }
      } catch {}

      localStorage.setItem(FLAG, new Date().toISOString())
    } catch {}
  }, [])

  return null
}
