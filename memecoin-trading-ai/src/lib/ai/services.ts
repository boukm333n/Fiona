import { SYSTEM_PROMPTS, AIResponse } from './config'
import { Trade, BehaviorData as TradePsychology } from '@/store/trades'
import { calculateTradePerformance } from '@/lib/utils'

// OpenAI chat helper (uses REST API to avoid extra deps)
async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  })

  if (!resp.ok) {
    const detail = await resp.text()
    throw new Error(`OpenAI error: ${detail}`)
  }

  const data = await resp.json()
  return data?.choices?.[0]?.message?.content || ''
}

export async function analyzeTradeSetup(
  trade: Partial<Trade>,
  psychology: Partial<TradePsychology>
): Promise<AIResponse> {
  try {
    const prompt = `
Analyze this memecoin trade setup:

Token: ${trade.tokenName} (${trade.ticker})
Entry Market Cap: $${new Intl.NumberFormat('en-US').format(Number(trade.entryMarketCap ?? 0))}
Investment: ${trade.solInvestment} SOL

Psychology Assessment:
- Fear: ${psychology.fearLevel}/10
- Confidence: ${psychology.confidenceLevel}/10
- Sentiment (entry): ${psychology.entrySentiment}/10
- Patience: ${psychology.patienceLevel}/10
- State of Mind: ${psychology.stateOfMind}
- Research Time (hrs): ${psychology.researchTime}

Provide:
1. Risk assessment (low/medium/high)
2. Recommended position size adjustment
3. Entry quality score (0-100)
4. Key warnings or concerns
5. Suggested exit strategy
`

    const content = await callOpenAI(
      SYSTEM_PROMPTS.tradeAnalysis,
      prompt,
      'gpt-4o-mini',
      1000
    )
    
    // Parse response for structured data
    const confidence = extractConfidence(content)
    const recommendations = extractRecommendations(content)
    const warnings = extractWarnings(content)

    return {
      content,
      confidence,
      recommendations,
      warnings,
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    throw new Error('Failed to analyze trade setup')
  }
}

export async function generateExitRecommendation(
  trade: Trade,
  currentMarketCap: number,
  currentPrice: number
): Promise<AIResponse> {
  try {
    const entryMc = trade.entryMarketCap || 0
    const mcMultiple = entryMc > 0 ? currentMarketCap / entryMc : 0
    const roi = entryMc > 0 ? (mcMultiple - 1) * 100 : 0

    const prompt = `
Analyze this active position and recommend exit strategy:

Token: ${trade.tokenName}
Entry Market Cap: $${new Intl.NumberFormat('en-US').format(Number(trade.entryMarketCap ?? 0))}
Current Market Cap: $${new Intl.NumberFormat('en-US').format(currentMarketCap)} (${mcMultiple.toFixed(2)}x)
ROI (MC-based): ${roi.toFixed(2)}%
Thesis: ${trade.behavioral?.investmentThesis || 'N/A'}

Provide specific exit recommendations.
`

    const content = await callOpenAI(
      SYSTEM_PROMPTS.exitStrategy,
      prompt,
      'gpt-4o-mini',
      500
    )
    
    return {
      content,
      confidence: 85,
      recommendations: extractRecommendations(content),
    }
  } catch (error) {
    console.error('Exit recommendation error:', error)
    throw new Error('Failed to generate exit recommendation')
  }
}

export async function analyzeTradeHistory(trades: Trade[]): Promise<AIResponse> {
  try {
    const summary = generateTradeSummary(trades)
    
    const prompt = `
Analyze this trading history and identify patterns:

${summary}

Provide:
1. Key winning patterns
2. Common mistakes
3. Optimal market cap entry range
4. Psychology patterns (fear, FOMO, etc.)
5. Specific recommendations for improvement
`

    const content = await callOpenAI(
      SYSTEM_PROMPTS.patternRecognition,
      prompt,
      'gpt-4o',
      1500
    )
    
    return {
      content,
      confidence: 90,
      recommendations: extractRecommendations(content),
      metrics: extractMetrics(trades),
    }
  } catch (error) {
    console.error('Pattern analysis error:', error)
    throw new Error('Failed to analyze trade history')
  }
}

export async function providePsychologyCoaching(
  question: string,
  context?: {
    recentTrades?: Trade[]
    currentPsychology?: TradePsychology
  }
): Promise<AIResponse> {
  try {
    let contextInfo = ''
    if (context?.recentTrades) {
      contextInfo += `\nRecent trading performance: ${generateTradeSummary(context.recentTrades)}`
    }
    if (context?.currentPsychology) {
      contextInfo += `\nCurrent state: Fear ${context.currentPsychology.fearLevel}/10, Confidence ${context.currentPsychology.confidenceLevel}/10`
    }

    const prompt = `
User question: ${question}
${contextInfo}

Provide personalized coaching advice.
`

    const content = await callOpenAI(
      SYSTEM_PROMPTS.coaching,
      prompt,
      'gpt-4o-mini',
      800
    )
    
    return {
      content,
      confidence: 88,
    }
  } catch (error) {
    console.error('Coaching error:', error)
    throw new Error('Failed to provide coaching')
  }
}

// Helper functions
function extractConfidence(content: string): number {
  const match = content.match(/confidence[:\s]+(\d+)/i)
  return match ? parseInt(match[1]) : 75
}

function extractRecommendations(content: string): string[] {
  const recommendations: string[] = []
  const lines = content.split('\n')
  
  lines.forEach(line => {
    if (line.match(/^[-•]\s*(?:recommend|suggest|consider)/i)) {
      recommendations.push(line.replace(/^[-•]\s*/, '').trim())
    }
  })
  
  return recommendations
}

function extractWarnings(content: string): string[] {
  const warnings: string[] = []
  const lines = content.split('\n')
  
  lines.forEach(line => {
    if (line.match(/^[-•]\s*(?:warning|caution|risk|concern)/i)) {
      warnings.push(line.replace(/^[-•]\s*/, '').trim())
    }
  })
  
  return warnings
}

function generateTradeSummary(trades: Trade[]): string {
  const totalTrades = trades.length
  const perfs = trades.map(t => calculateTradePerformance(t))
  const winning = perfs.filter(p => (p.realizedPnL || 0) > 0).length
  const avgROI = perfs.length > 0 ? perfs.reduce((s, p) => s + (p.roi || 0), 0) / perfs.length : 0
  const totalPnL = perfs.reduce((s, p) => s + (p.realizedPnL || 0), 0)
  
  return `
Total Trades: ${totalTrades}
Win Rate: ${((winning / Math.max(totalTrades, 1)) * 100).toFixed(1)}%
Average ROI (realized): ${avgROI.toFixed(2)}%
Total Realized PnL: ${totalPnL.toFixed(3)} SOL
`
}

function extractMetrics(trades: Trade[]): Record<string, any> {
  const perfs = trades.map(t => ({ t, p: calculateTradePerformance(t) }))
  const wins = perfs.filter(x => (x.p.realizedPnL || 0) > 0)
  const losses = perfs.filter(x => (x.p.realizedPnL || 0) < 0)

  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0
  const avgWinROI = wins.length > 0 ? wins.reduce((s, x) => s + (x.p.roi || 0), 0) / wins.length : 0
  const avgLossROI = losses.length > 0 ? losses.reduce((s, x) => s + (x.p.roi || 0), 0) / losses.length : 0
  const bestTrade = perfs.length > 0 ? Math.max(...perfs.map(x => x.p.roi || 0)) : 0
  const worstTrade = perfs.length > 0 ? Math.min(...perfs.map(x => x.p.roi || 0)) : 0

  return { totalTrades: trades.length, winRate, avgWinROI, avgLossROI, bestTrade, worstTrade }
}
