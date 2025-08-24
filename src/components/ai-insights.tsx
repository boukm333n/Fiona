'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, TrendingUp, AlertTriangle, Target } from 'lucide-react'
import Link from 'next/link'

// Mock data representing AI-generated insights. Replace with real data later.
const mockInsights = [
  {
    id: 1,
    icon: TrendingUp,
    color: 'text-emerald-600',
    title: 'Positive Pattern Detected',
    description: 'Your trades held for >3 days have a 25% higher average ROI.',
  },
  {
    id: 2,
    icon: AlertTriangle,
    color: 'text-amber-600',
    title: 'Behavioral Quirk',
    description: 'You tend to enter trades with high confidence after a significant loss. Consider a cooling-off period.',
  },
  {
    id: 3,
    icon: Target,
    color: 'text-sky-600',
    title: 'Opportunity',
    description: 'Trades made during morning hours show better performance. You might be more focused.',
  },
]

export function AIInsights() {
  return (
    <Card className="bg-stone-50/50 border-stone-200/60 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="font-serif text-stone-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-stone-600" />
          AI Insights
        </CardTitle>
        <CardDescription className="text-stone-500">Behavioral patterns from your trading history.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul role="list" className="-my-4 divide-y divide-stone-200/60">
            {mockInsights.length === 0 ? (
              <li className="py-12">
                <p className="text-center text-stone-500">
                  Not enough data for insights. Keep trading!
                </p>
              </li>
            ) : (
              mockInsights.map((insight) => {
                const Icon = insight.icon
                return (
                  <li key={insight.id} className="flex items-center py-4 space-x-3">
                    <div>
                      <Icon className={`w-5 h-5 ${insight.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{insight.title}</p>
                      <p className="text-xs text-stone-500 mt-1">{insight.description}</p>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
