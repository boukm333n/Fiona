'use client'

import { PartialSell } from '@/store/trades'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { formatMarketCap } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PartialSellTimelineProps {
  sells: PartialSell[];
  initialInvestment: number;
  entryMarketCap: number;
}

export function PartialSellTimeline({ sells, initialInvestment, entryMarketCap }: PartialSellTimelineProps) {
  if (!sells || sells.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partial Sell History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          {/* Timeline Line */}
          <div className="absolute left-[29px] top-0 h-full w-0.5 bg-muted" />

          {sells.map((sell, index) => {
            const costOfThisPortion = initialInvestment * (sell.amountPercentage / 100);
            const ratio = entryMarketCap > 0 ? (sell.soldAtMarketCap / entryMarketCap) : 0;
            const valueAtSale = costOfThisPortion * ratio;
            const profit = valueAtSale - costOfThisPortion;
            const isWin = profit > 0;
            const isLoss = profit < 0;

            return (
              <div key={index} className="relative flex items-start pb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background border z-10">
                  {isWin ? (
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  ) : isLoss ? (
                    <TrendingDown className="h-6 w-6 text-red-500" />
                  ) : (
                    <Minus className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="ml-6 flex-1">
                  <p className="font-semibold">
                    Sold {sell.amountPercentage}% of initial tokens
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(sell.date), 'MMM d, yyyy, h:mm a')}
                  </p>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                     <div>
                        <p className="text-muted-foreground">Value Realized (SOL)</p>
                        <p className="font-mono">{valueAtSale.toFixed(4)} SOL</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Market Cap</p>
                        <p className="font-mono">{formatMarketCap(sell.soldAtMarketCap)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Profit/Loss</p>
                        <p className={`font-mono ${isWin ? 'text-green-500' : isLoss ? 'text-red-500' : ''}`}>
                          {profit.toFixed(4)} SOL
                        </p>
                      </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
