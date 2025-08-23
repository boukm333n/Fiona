'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function FionaChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi, I’m Fiona. I’m here to help you build a calmer, sharper trading mind with CBT. What would you like to focus on today—FOMO, revenge trading, or a recent decision you want to unpack?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/fiona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      const reply: string = data?.reply || 'Sorry, I had trouble responding just now.'
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: "I’m having trouble connecting at the moment. Let’s try again in a bit.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="flex flex-col h-[520px]">
      <div className="text-xs text-stone-500 mb-2">
        Not medical advice. If you’re in crisis, contact local emergency services or hotlines.
      </div>
      <div className="flex-1 rounded-md border border-stone-200/70 bg-white/70 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={viewportRef as any} className="p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={
                    'max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ' +
                    (m.role === 'user'
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-100 text-stone-800 border border-stone-200')
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Tell Fiona what’s on your mind…"
        />
        <Button onClick={send} disabled={loading}>
          {loading ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
