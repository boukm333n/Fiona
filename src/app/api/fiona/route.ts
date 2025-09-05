import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPTS } from '@/lib/ai/config'
import { z } from 'zod'

export const runtime = 'nodejs'

// Simple in-memory rate limiter per IP
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
const rateMap = new Map<string, { count: number; windowStart: number }>()

// Fallback models if primary model is unavailable
const FALLBACK_MODELS = ['gpt-4o-mini', 'gpt-4o'] as const

// Request validation
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(5000),
})

const RequestSchema = z
  .object({
    messages: z.array(MessageSchema).optional(),
    prompt: z.string().min(1).max(5000).optional(),
    context: z.string().max(5000).optional(),
  })
  .refine(
    (d) => (Array.isArray(d.messages) && d.messages.length > 0) || (typeof d.prompt === 'string' && d.prompt.trim().length > 0),
    { message: 'Provide either messages[] or prompt' }
  )

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const entry = rateMap.get(ip) || { count: 0, windowStart: now }
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      entry.count = 0
      entry.windowStart = now
    }
    entry.count += 1
    rateMap.set(ip, entry)
    if (entry.count > RATE_LIMIT_MAX) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Validate body
    const raw = await req.json()
    const parsed = RequestSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', detail: parsed.error.flatten() }, { status: 400 })
    }
    const body = parsed.data
    // Accepts either a single prompt or chat-style messages
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = Array.isArray(body?.messages) ? body.messages : []
    let lastUser = typeof body?.prompt === 'string' ? body.prompt : ''
    if (!lastUser && messages.length) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.role === 'user' && typeof messages[i]?.content === 'string') {
          lastUser = messages[i].content
          break
        }
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5-mini'
    const payload = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.fionaCoach },
        ...(body?.context ? [{ role: 'system', content: `Context:\n${body.context}` as const }] : []),
        { role: 'user', content: lastUser || 'Say hello as Fiona to begin a short CBT check-in.' },
      ],
      temperature: 0.5,
    }

    let resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      // Try graceful fallback if the error likely relates to model availability
      const shouldFallback = resp.status === 400 || resp.status === 404 || /model|not\s*found|invalid/i.test(errText)
      if (shouldFallback) {
        for (const fb of FALLBACK_MODELS) {
          if (fb === model) continue
          const fbPayload = { ...payload, model: fb }
          resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify(fbPayload),
          })
          if (resp.ok) break
        }
      }
      if (!resp.ok) {
        const detail = await resp.text()
        return NextResponse.json({ error: 'OpenAI error', detail }, { status: 500 })
      }
    }

    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content?.trim?.() || ''

    return NextResponse.json({ reply: content })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error', detail: e?.message || String(e) }, { status: 500 })
  }
}
