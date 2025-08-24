'use client'

import { useMemo } from 'react'
import { useTradeStore, Trade } from '@/store/trades'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import { calculateTradePerformance, formatMarketCap, formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function ActivePositions() {
  const trades = useTradeStore((state) => state.trades)
  const activeTrades = useMemo(() => trades.filter(t => t.status === 'active'), [trades])

  // Use unified realized PnL from utils (from partial sells only)
  const getRealizedPerformance = (trade: Trade) => {
    const perf = calculateTradePerformance(trade);
    const pnl = typeof perf.realizedPnL === 'number' ? perf.realizedPnL : 0;
    const roi = typeof perf.roi === 'number' ? perf.roi : 0;
    return { pnl, roi };
  };

  return (
    <Card className="bg-stone-50/50 border-stone-200/60 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-stone-800">Active Positions</CardTitle>
        <CardDescription className="text-stone-500">Your currently open trades.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul role="list" className="-my-4 divide-y divide-stone-200/60">
            {activeTrades.length === 0 ? (
              <li className="py-12">
                <p className="text-center text-stone-500">
                  No active positions. Start a new trade!
                </p>
              </li>
            ) : (
              activeTrades.map((trade) => {
                const { pnl, roi } = getRealizedPerformance(trade);
                return (
                  <li key={trade.id} className="flex items-center py-4 space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-800 truncate">{trade.tokenName}</p>
                        <Badge variant="outline" className="text-xs font-mono">{trade.ticker}</Badge>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {`Invested: ${parseFloat(trade.solInvestment).toFixed(2)} SOL at ${formatMarketCap(trade.entryMarketCap)}`}
                      </p>
                    </div>
                    <div className="inline-flex items-center text-right">
                      <div className="flex-col">
                        <p className="text-sm font-semibold text-stone-800">
                          {`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SOL`}
                        </p>
                        <p className={cn(
                          "text-xs flex items-center justify-end gap-1",
                          pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        )}>
                          {pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {formatPercentage(roi)}
                        </p>
                      </div>
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
