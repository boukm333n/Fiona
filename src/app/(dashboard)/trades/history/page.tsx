'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTradeStore, Trade } from '@/store/trades'
import { calculateTradePerformance, formatCurrency, formatMarketCap, formatPercentage } from '@/lib/utils'
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Brain,
  BookOpen,
  Archive
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function TradeHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const [sortBy, setSortBy] = useState('time-desc')

  const allTrades = useTradeStore((state) => state.trades)

  const completedTrades = useMemo(() => {
    if (!isClient) return []
    
    const filtered = allTrades
      .filter((trade) => trade.status === 'completed')
      .filter(trade => 
        (trade.tokenName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        trade.ticker.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time-asc':
          return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        case 'pnl-desc':
          return calculateTradePerformance(b).realizedPnL - calculateTradePerformance(a).realizedPnL;
        case 'pnl-asc':
          return calculateTradePerformance(a).realizedPnL - calculateTradePerformance(b).realizedPnL;
        case 'time-desc':
        default:
          return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
      }
    });

  }, [isClient, allTrades, searchTerm, sortBy])

  const totalRealizedPnL = completedTrades.reduce((sum, trade) => sum + calculateTradePerformance(trade).realizedPnL, 0)
  const winRate = completedTrades.length > 0 ? (completedTrades.filter(t => calculateTradePerformance(t).realizedPnL > 0).length / completedTrades.length) * 100 : 0;

  return (
    <div className="space-y-6 bg-stone-50/50 p-4 sm:p-6 rounded-lg">
      <header>
        <h2 className="text-2xl font-serif text-stone-800">Trade History</h2>
        <p className="text-sm text-stone-500 mt-1">
          Review and analyze your completed trades.
        </p>
      </header>

      {/* Portfolio Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Completed Trades" value={completedTrades.length} icon={Archive} />
        <StatCard title="Total Realized P&L" value={`${totalRealizedPnL.toFixed(2)} SOL`} icon={totalRealizedPnL >= 0 ? TrendingUp : TrendingDown} color={totalRealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        <StatCard title="Win Rate" value={`${winRate.toFixed(1)}%`} icon={TrendingUp} />
        <StatCard title="Avg. Decision Quality" value={`${completedTrades.length > 0 ? (completedTrades.reduce((acc, t) => acc + (t.decisionQuality ?? 5), 0) / completedTrades.length).toFixed(1) : 'N/A'}/10`} icon={Brain} />
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-2 pt-4 border-t border-stone-200/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search by token or ticker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white shadow-sm w-full max-w-xs"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px] bg-white shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="time-desc">Newest</SelectItem>
            <SelectItem value="time-asc">Oldest</SelectItem>
            <SelectItem value="pnl-desc">P&L (High)</SelectItem>
            <SelectItem value="pnl-asc">P&L (Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trades List */}
      <div className="flow-root">
        <ul role="list" className="-my-4 divide-y divide-stone-200/60">
          {completedTrades.length === 0 ? (
            <li className="text-center py-16">
              <p className="text-stone-500 mb-4">No completed trades found.</p>
              <Button asChild variant="outline" className="bg-white">
                <Link href="/trades/new">
                  Start a New Trade
                </Link>
              </Button>
            </li>
          ) : (
            completedTrades.map((trade) => <TradeHistoryItem key={trade.id} trade={trade} />)
          )}
        </ul>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color?: string }) {
  return (
    <Card className="bg-white/80 border-stone-200/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-stone-500 uppercase tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold text-stone-800 flex items-center gap-2 ${color}`}>
          <Icon className={`w-5 h-5 ${color || 'text-stone-400'}`} />
          {value}
        </div>
      </CardContent>
    </Card>
  )
}

function TradeHistoryItem({ trade }: { trade: Trade }) {
  const performance = calculateTradePerformance(trade);
  const roi = performance.costOfGoodsSold > 0 ? (performance.realizedPnL / performance.costOfGoodsSold) * 100 : 0;

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <div className="flex-auto">
          <div className="flex items-center gap-3">
            <h4 className="text-lg font-serif text-stone-900">{trade.tokenName}</h4>
            <Badge variant="outline" className="bg-stone-100 text-stone-600 font-mono">${trade.ticker}</Badge>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Updated on {format(new Date(trade.updatedAt), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" asChild variant="ghost">
            <Link href={`/trades/reflect?tradeId=${trade.id}`}>
              <BookOpen className="w-4 h-4 mr-2"/>
              View Reflection
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2 text-sm mt-4 border-t border-stone-200/60 pt-4">
        <Stat title="Total PnL" value={`${performance.realizedPnL.toFixed(2)} SOL`} color={performance.realizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        <Stat title="ROI" value={`${roi.toFixed(2)}%`} color={roi >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        <Stat title="Avg. Sell x" value={`${performance.averageSellMultiplier.toFixed(2)}x`} color={performance.averageSellMultiplier >= 1 ? 'text-emerald-600' : 'text-rose-600'} />
        <Stat title="Entry MC" value={formatMarketCap(trade.entryMarketCap)} />
      </div>

      <div className="mt-4 p-3 bg-stone-100/70 rounded-md">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-semibold text-stone-700">Behavioral Profile</span>
        </div>
        <p className="text-xs text-stone-600 mt-1">
          {trade.behavioral.stateOfMind} • Confidence: {trade.behavioral.confidenceLevel}/10 • Decision Quality: {trade.decisionQuality ?? 'N/A'}/10
        </p>
      </div>
    </li>
  )
}

function Stat({ title, value, color }: { title: string, value: string | number, color?: string }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{title}</p>
      <p className={`font-semibold text-stone-800 ${color}`}>{value}</p>
    </div>
  )
}
