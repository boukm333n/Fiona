'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FionaChat from '@/components/dojo/FionaChat'

export default function DojoPage() {
  const [showChat, setShowChat] = useState(true)

  return (
    <div className="space-y-6 bg-stone-50/50 p-4 sm:p-6 rounded-lg">
      <header>
        <h2 className="text-2xl font-serif text-stone-800">Dojo</h2>
        <p className="text-sm text-stone-500 mt-1">
          A dedicated space for healing, reflection, and trader-first CBT with Fiona.
        </p>
      </header>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="bg-white/80 border-stone-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-stone-600">
              Complete your one-time psychological profile to personalize Fiona.
            </p>
            <Button asChild variant="outline" className="bg-white">
              <Link href="/dojo/profile">Open Profile Wizard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 border-stone-200/60 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif">Fiona — CBT Trading Coach</CardTitle>
          </CardHeader>
          <CardContent>
            <FionaChat />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
