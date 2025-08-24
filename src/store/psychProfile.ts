'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// MVP local-only profile. Future: server DB with field-level encryption.
export type AgeRange = '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+'
export type TriLevel = 'low' | 'medium' | 'high'

export interface PsychProfile {
  life: {
    ageRange?: AgeRange
    timeZone?: string
    workSchedule?: string
    sleepPattern?: string
    socialSupport?: string
  }
  financial: {
    incomeStability?: 'stable' | 'variable'
    runwayMonths?: number | null
    debtComfort?: TriLevel
    lossTolerance?: TriLevel
    bankSegmentation?: string
  }
  wellbeing: {
    mood?: number // 1-10
    anxiety?: number // 1-10
    currentStressors?: string
    triggers?: string
    copingStrategies?: string
    crisisPlanAccepted?: boolean
  }
  personality: {
    riskPreference?: TriLevel
    impulsivity?: number // 1-10
    needForControl?: number // 1-10
    conscientiousness?: number // 1-10
    emotionalReactivity?: number // 1-10
    resilience?: number // 1-10
    values?: string
  }
  trading: {
    preferredTimes?: string
    alphaSources?: string
    commonPatterns?: string
    holdingHorizon?: string
    checklistMaturity?: number // 1-10
  }
  consent: {
    accepted: boolean
    lastUpdatedISO: string
  }
}

interface PsychProfileState {
  profile: PsychProfile | null
  setProfile: (p: PsychProfile) => void
  update: (partial: Partial<PsychProfile>) => void
  reset: () => void
}

const initial: PsychProfile = {
  life: {},
  financial: {},
  wellbeing: {},
  personality: {},
  trading: {},
  consent: { accepted: false, lastUpdatedISO: new Date().toISOString() },
}

export const usePsychProfileStore = create<PsychProfileState>()(
  persist(
    (set, get) => ({
      profile: initial,
      setProfile: (p) => set({ profile: { ...p, consent: { ...p.consent, lastUpdatedISO: new Date().toISOString() } } }),
      update: (partial) => {
        const curr = get().profile ?? initial
        const merged: PsychProfile = {
          ...curr,
          life: { ...curr.life, ...partial.life },
          financial: { ...curr.financial, ...partial.financial },
          wellbeing: { ...curr.wellbeing, ...partial.wellbeing },
          personality: { ...curr.personality, ...partial.personality },
          trading: { ...curr.trading, ...partial.trading },
          consent: { ...curr.consent, ...(partial.consent ?? {}), lastUpdatedISO: new Date().toISOString() },
        }
        set({ profile: merged })
      },
      reset: () => set({ profile: initial }),
    }),
    { name: 'psych_profile_v1' }
  )
)
