'use client'

import { useMemo } from 'react'
import { useTradeStore, Trade } from '@/store/trades'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateTradePerformance, formatMarketCap } from '@/lib/utils'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function RecentTrades() {
  const trades = useTradeStore((state) => state.trades)

  const completedTrades = useMemo(() => 
    trades
      .filter(t => t.status === 'completed' && t.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [trades]
  )

  return (
    <Card className="bg-stone-50/50 border-stone-200/60 shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-stone-800">Recent Trades</CardTitle>
        <CardDescription className="text-stone-500">Your last few completed trades.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flow-root">
          <ul role="list" className="-my-4 divide-y divide-stone-200/60">
            {completedTrades.length === 0 ? (
              <li className="py-12">
                <p className="text-center text-stone-500">
                  No completed trades yet.
                </p>
              </li>
            ) : (
              completedTrades.slice(0, 5).map((trade) => {
                const performance = calculateTradePerformance(trade);
                const pnl = performance.realizedPnL || 0;
                const pnlPercentage = performance.costOfGoodsSold > 0 
                  ? (performance.realizedPnL / performance.costOfGoodsSold) * 100 
                  : 0;

                return (
                  <li key={trade.id} className="flex items-center py-4 space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-800 truncate">{trade.tokenName}</p>
                        <Badge variant="outline" className="text-xs font-mono">{trade.ticker}</Badge>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        {`Closed on ${format(new Date(trade.updatedAt), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                    <div className="inline-flex items-center text-right">
                      <div className="flex-col">
                        <p className={cn(
                          "text-sm font-semibold",
                          pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        )}>
                          {`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SOL`}
                        </p>
                        <p className="text-xs text-stone-500">
                          {`${pnlPercentage.toFixed(1)}%`}
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
