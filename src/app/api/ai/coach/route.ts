import { NextRequest, NextResponse } from 'next/server'
import { providePsychologyCoaching } from '@/lib/ai/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, context } = body

    if (!question) {
      return NextResponse.json(
        { error: 'Missing question' },
        { status: 400 }
      )
    }

    const response = await providePsychologyCoaching(question, context)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Coach API error:', error)
    return NextResponse.json(
      { error: 'Failed to provide coaching response' },
      { status: 500 }
    )
  }
}
