import { NextRequest, NextResponse } from 'next/server'
import { analyzeTradeSetup } from '@/lib/ai/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trade, psychology } = body

    if (!trade || !psychology) {
      return NextResponse.json(
        { error: 'Missing trade or psychology data' },
        { status: 400 }
      )
    }

    const analysis = await analyzeTradeSetup(trade, psychology)
    
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze trade' },
      { status: 500 }
    )
  }
}
