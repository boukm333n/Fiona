'use client'

import React, { useMemo, useState } from 'react'
import { usePsychProfileStore, AgeRange, TriLevel } from '@/store/psychProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
      <Label className="text-sm text-stone-700 sm:col-span-2">{label}</Label>
      <div className="sm:col-span-3">{children}</div>
    </div>
  )
}

export default function ProfileWizard() {
  const { profile, update, setProfile } = usePsychProfileStore()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const steps = useMemo(
    () => [
      'Consent & Safety',
      'Life & Work',
      'Financial Context',
      'Wellbeing',
      'Risk & Personality',
      'Trading Profile & Review',
    ],
    []
  )

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function saveAll() {
    setSaving(true)
    try {
      // In MVP we just persist locally via Zustand persist
      if (profile && !profile.consent.accepted) {
        // Ensure consent is marked accepted when saving from final screen
        setProfile({ ...profile, consent: { accepted: true, lastUpdatedISO: new Date().toISOString() } })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif text-stone-800">{steps[step]}</h3>
          <p className="text-xs text-stone-500">Step {step + 1} of {steps.length}</p>
        </div>
        <div className="hidden sm:flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 w-10 rounded ${i <= step ? 'bg-stone-800' : 'bg-stone-300'}`} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <section className="space-y-4">
          <p className="text-sm text-stone-700">
            Welcome to the Dojo. Fiona uses this profile to personalize CBT coaching. This is not medical advice.
            If you’re in crisis, contact local emergency services or hotlines. You can export or delete your data any time.
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              id="consent"
              checked={profile?.consent.accepted ?? false}
              onCheckedChange={(v) => update({ consent: { accepted: Boolean(v) } as any })}
            />
            <Label htmlFor="consent" className="text-sm">I understand and consent to storing this profile for coaching.</Label>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <FieldRow label="Age Range">
            <Select
              value={(profile?.life.ageRange as AgeRange) || ''}
              onValueChange={(v) => update({ life: { ageRange: v as AgeRange } })}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['18-24','25-34','35-44','45-54','55-64','65+'] as AgeRange[]).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Time Zone">
            <Input
              placeholder="e.g., EST"
              value={profile?.life.timeZone || ''}
              onChange={(e) => update({ life: { timeZone: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Work Schedule">
            <Input
              placeholder="e.g., 9–5, shifts"
              value={profile?.life.workSchedule || ''}
              onChange={(e) => update({ life: { workSchedule: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Sleep Pattern">
            <Input
              placeholder="e.g., 6–7h, late sleeper"
              value={profile?.life.sleepPattern || ''}
              onChange={(e) => update({ life: { sleepPattern: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Social Support">
            <Textarea
              placeholder="Friends, family, community—anything that supports you"
              value={profile?.life.socialSupport || ''}
              onChange={(e) => update({ life: { socialSupport: e.target.value } })}
            />
          </FieldRow>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <FieldRow label="Income Stability">
            <Select
              value={profile?.financial.incomeStability || ''}
              onValueChange={(v) => update({ financial: { incomeStability: v as any } })}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="variable">Variable</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Runway (months)">
            <Input
              type="number"
              value={profile?.financial.runwayMonths ?? ''}
              onChange={(e) => update({ financial: { runwayMonths: e.target.value ? Number(e.target.value) : null } })}
            />
          </FieldRow>
          <FieldRow label="Debt Comfort">
            <Select
              value={(profile?.financial.debtComfort as TriLevel) || ''}
              onValueChange={(v) => update({ financial: { debtComfort: v as TriLevel } })}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['low','medium','high'] as TriLevel[]).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Loss Tolerance">
            <Select
              value={(profile?.financial.lossTolerance as TriLevel) || ''}
              onValueChange={(v) => update({ financial: { lossTolerance: v as TriLevel } })}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['low','medium','high'] as TriLevel[]).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Bank Segmentation">
            <Input
              placeholder="e.g., bills / savings / trading"
              value={profile?.financial.bankSegmentation || ''}
              onChange={(e) => update({ financial: { bankSegmentation: e.target.value } })}
            />
          </FieldRow>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <FieldRow label="Mood (1–10)">
            <Slider
              defaultValue={[profile?.wellbeing.mood ?? 5]}
              min={1}
              max={10}
              step={1}
              onValueChange={([v]) => update({ wellbeing: { mood: v } })}
            />
          </FieldRow>
          <FieldRow label="Anxiety (1–10)">
            <Slider
              defaultValue={[profile?.wellbeing.anxiety ?? 5]}
              min={1}
              max={10}
              step={1}
              onValueChange={([v]) => update({ wellbeing: { anxiety: v } })}
            />
          </FieldRow>
          <FieldRow label="Current Stressors">
            <Textarea
              value={profile?.wellbeing.currentStressors || ''}
              onChange={(e) => update({ wellbeing: { currentStressors: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Triggers">
            <Textarea
              value={profile?.wellbeing.triggers || ''}
              onChange={(e) => update({ wellbeing: { triggers: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Coping Strategies">
            <Textarea
              value={profile?.wellbeing.copingStrategies || ''}
              onChange={(e) => update({ wellbeing: { copingStrategies: e.target.value } })}
            />
          </FieldRow>
          <div className="flex items-center gap-2">
            <Checkbox
              id="crisis"
              checked={profile?.wellbeing.crisisPlanAccepted ?? false}
              onCheckedChange={(v) => update({ wellbeing: { crisisPlanAccepted: Boolean(v) } as any })}
            />
            <Label htmlFor="crisis" className="text-sm">I understand this is not medical advice and have a plan for emergencies.</Label>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <FieldRow label="Risk Preference">
            <Select
              value={(profile?.personality.riskPreference as TriLevel) || ''}
              onValueChange={(v) => update({ personality: { riskPreference: v as TriLevel } })}
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {(['low','medium','high'] as TriLevel[]).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Impulsivity (1–10)">
            <Slider defaultValue={[profile?.personality.impulsivity ?? 5]} min={1} max={10} step={1}
              onValueChange={([v]) => update({ personality: { impulsivity: v } })}
            />
          </FieldRow>
          <FieldRow label="Need for Control (1–10)">
            <Slider defaultValue={[profile?.personality.needForControl ?? 5]} min={1} max={10} step={1}
              onValueChange={([v]) => update({ personality: { needForControl: v } })}
            />
          </FieldRow>
          <FieldRow label="Conscientiousness (1–10)">
            <Slider defaultValue={[profile?.personality.conscientiousness ?? 5]} min={1} max={10} step={1}
              onValueChange={([v]) => update({ personality: { conscientiousness: v } })}
            />
          </FieldRow>
          <FieldRow label="Emotional Reactivity (1–10)">
            <Slider defaultValue={[profile?.personality.emotionalReactivity ?? 5]} min={1} max={10} step={1}
              onValueChange={([v]) => update({ personality: { emotionalReactivity: v } })}
            />
          </FieldRow>
          <FieldRow label="Resilience (1–10)">
            <Slider defaultValue={[profile?.personality.resilience ?? 5]} min={1} max={10} step={1}
              onValueChange={([v]) => update({ personality: { resilience: v } })}
            />
          </FieldRow>
          <FieldRow label="Values">
            <Textarea
              placeholder="What matters most: security, mastery, freedom, community, creativity..."
              value={profile?.personality.values || ''}
              onChange={(e) => update({ personality: { values: e.target.value } })}
            />
          </FieldRow>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-4">
          <FieldRow label="Preferred Times">
            <Input
              placeholder="e.g., mornings, nights"
              value={profile?.trading.preferredTimes || ''}
              onChange={(e) => update({ trading: { preferredTimes: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Alpha Sources">
            <Textarea
              placeholder="e.g., Twitter lists, Discord, friends, scanners"
              value={profile?.trading.alphaSources || ''}
              onChange={(e) => update({ trading: { alphaSources: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Common Patterns/Triggers">
            <Textarea
              placeholder="e.g., chase green candles, hold losers, overtrade after loss"
              value={profile?.trading.commonPatterns || ''}
              onChange={(e) => update({ trading: { commonPatterns: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Holding Horizon">
            <Input
              placeholder="minutes, hours, days"
              value={profile?.trading.holdingHorizon || ''}
              onChange={(e) => update({ trading: { holdingHorizon: e.target.value } })}
            />
          </FieldRow>
          <FieldRow label="Decision Checklist Maturity (1–10)">
            <Slider defaultValue={[profile?.trading.checklistMaturity ?? 3]} min={1} max={10} step={1}
              onValueChange={([v]) => update({ trading: { checklistMaturity: v } })}
            />
          </FieldRow>

          <div className="rounded-md border p-3 bg-stone-50 text-xs text-stone-600">
            Review your entries. You can edit anytime in Dojo Settings. Click Save Profile to finish.
          </div>
        </section>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
        {step < steps.length - 1 ? (
          <Button onClick={next}>Continue</Button>
        ) : (
          <Button onClick={saveAll} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</Button>
        )}
      </div>
    </div>
  )
}
