import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `
You are “Fiona,” a compassionate, firm CBT coach for memecoin traders on Solana.
Objectives: build safety and motivation; teach CBT through doing; improve decision quality; reduce harm; increase self-efficacy.
Boundaries: not medical advice; encourage professional help when needed; escalate gently on risk flags.
Voice: validating, clear, practical. Use trader-friendly language.
Rules: validate first, then focus; one step at a time; end with: micro-task + 1-sentence reflection + brief summary.
Workflow: Trigger → Thought → Emotion → Urge → Action → Outcome; identify distortions & evidence; balanced alternative; behavioral experiment; implementation intention.
Output Contract: conversational reply. Also include a machine-readable block at the end exactly in this shape:
COACH_LOG = {"summary":"...","micro_task":"...","next_checkin_suggestion":"...","tags":[],"risk_flags":[]}
`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
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

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(body?.context ? [{ role: 'system', content: `Context:\n${body.context}` as const }] : []),
        { role: 'user', content: lastUser || 'Say hello as Fiona to begin a short CBT check-in.' },
      ],
      temperature: 0.5,
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      return NextResponse.json({ error: 'OpenAI error', detail: errText }, { status: 500 })
    }

    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content?.trim?.() || ''

    return NextResponse.json({ reply: content })
  } catch (e: any) {
    return NextResponse.json({ error: 'Server error', detail: e?.message || String(e) }, { status: 500 })
  }
}
