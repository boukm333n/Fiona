'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DojoProfilePage() {
  return (
    <div className="space-y-6 bg-stone-50/50 p-4 sm:p-6 rounded-lg">
      <header>
        <h2 className="text-2xl font-serif text-stone-800">Dojo Profile</h2>
        <p className="text-sm text-stone-500 mt-1">
          One-time psychological profile to personalize Fiona and your CBT journey. (Wizard coming next.)
        </p>
      </header>

      <Card className="bg-white/80 border-stone-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-stone-600">
            We will collect life context, financial context, wellbeing, risk & personality snapshot, trading profile, and values. You can export/delete any time.
          </p>
          <Button asChild variant="outline" className="bg-white">
            <Link href="/dojo">Back to Dojo</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
