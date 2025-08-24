'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTradeStore, Trade } from '@/store/trades'
import { AddPartialSellDialog } from '@/components/trades/add-partial-sell-dialog'
import { AddConsecutiveBuyDialog } from '@/components/trades/add-consecutive-buy-dialog'
import { formatMarketCap, formatPercentage, calculateTradePerformance } from '@/lib/utils'
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Brain,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

// Loading component
const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      <p className="text-stone-500 font-serif">Loading your active trades...</p>
    </div>
  </div>
)

// Use utils.calculateTradePerformance for consistent realized PnL
const getRealizedFromUtils = (trade: Trade): number => {
  const perf = calculateTradePerformance(trade);
  return typeof perf.realizedPnL === 'number' ? perf.realizedPnL : 0;
}

// We don't track live pricing for unrealized PnL; focus on realized only for active trades.

export default function ActiveTradesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'time-desc' | 'time-asc' | 'pnl-desc' | 'pnl-asc'>('time-desc')
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const [selectedTradeForBuy, setSelectedTradeForBuy] = useState<Trade | null>(null)

  // Client-only render guard to mitigate hydration mismatches
  const [isClient, setIsClient] = useState(false)
  useEffect(() => setIsClient(true), [])

  // Get data from store in a simple way
  const trades = useTradeStore((state) => state.trades)
  const deleteTrade = useTradeStore((state) => state.deleteTrade)

  const activeTrades = useMemo(() => {
    if (!Array.isArray(trades)) return []
    
    const filtered = trades
      .filter((trade: Trade) => {
        return trade && 
               typeof trade === 'object' && 
               trade.status === 'active' &&
               trade.tokenName &&
               trade.ticker
      })
      .map((trade: any) => ({
        ...trade,
        partialSells: Array.isArray(trade.partialSells) ? trade.partialSells : [],
        consecutiveBuys: Array.isArray(trade.consecutiveBuys) ? trade.consecutiveBuys : [],
        percentageSold: trade.percentageSold || 0,
        tokenName: trade.tokenName || '',
        ticker: trade.ticker || '',
      }))
      .filter((trade: Trade) => {
        if (!searchTerm) return true
        const searchLower = searchTerm.toLowerCase()
        return (
          (trade.tokenName || '').toLowerCase().includes(searchLower) ||
          (trade.ticker || '').toLowerCase().includes(searchLower)
        )
      })
      .sort((a: Trade, b: Trade) => {
        switch (sortBy) {
          case 'time-asc':
            return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
          case 'pnl-desc':
            return getRealizedFromUtils(b) - getRealizedFromUtils(a)
          case 'pnl-asc':
            return getRealizedFromUtils(a) - getRealizedFromUtils(b)
          default:
            return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        }
      });

    return filtered;

  }, [trades, searchTerm, sortBy])

  // Show loading state while hydrating on client or if store not ready
  if (!isClient || !trades) {
    return <LoadingState />
  }

  const totalInvested = activeTrades.reduce((sum: number, trade: any) => sum + parseFloat(trade.solInvestment), 0)
  const totalRealizedPnL = activeTrades.reduce((sum: number, trade: any) => sum + getRealizedFromUtils(trade), 0)
  const winningTrades = activeTrades.reduce((acc: number, t: any) => acc + (getRealizedFromUtils(t) > 0 ? 1 : 0), 0)

  return (
    <div suppressHydrationWarning className="space-y-6 bg-stone-50/50 p-4 sm:p-6 rounded-lg">
      {selectedTrade && (
        <AddPartialSellDialog
          trade={selectedTrade!}
          isOpen={!!selectedTrade}
          onOpenChange={(isOpen) => !isOpen && setSelectedTrade(null)}
        />
      )}

      {selectedTradeForBuy && (
        <AddConsecutiveBuyDialog
          trade={selectedTradeForBuy}
          isOpen={!!selectedTradeForBuy}
          onOpenChange={(isOpen) => !isOpen && setSelectedTradeForBuy(null)}
        />
      )}

      <header>
        <h2 className="text-2xl font-serif text-stone-800">Active Positions</h2>
        <p className="text-sm text-stone-500 mt-1">
          Monitor and manage your current SOL trades.
        </p>
      </header>

      {/* Portfolio Summary */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Invested (SOL)" value={`${totalInvested.toFixed(2)} SOL`} icon={DollarSign} />
        <StatCard title="Active Trades" value={activeTrades.length} icon={TrendingUp} />
        <StatCard title="Realized P&L (SOL)" value={`${totalRealizedPnL.toFixed(2)} SOL`} icon={totalRealizedPnL >= 0 ? TrendingUp : TrendingDown} color={totalRealizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        <StatCard title="Avg. Confidence" value={`${activeTrades.length > 0 ? (activeTrades.reduce((acc: number, t: Trade) => acc + t.behavioral.confidenceLevel, 0) / activeTrades.length).toFixed(1) : 'N/A'}/10`} icon={Brain} />
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-2 pt-4 border-t border-stone-200/60">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search by token or ticker..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white shadow-sm w-full max-w-xs"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'time-desc' | 'time-asc' | 'pnl-desc' | 'pnl-asc')}>
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
          {activeTrades.length === 0 ? (
            <li className="text-center py-16">
              <p className="text-stone-500 mb-4">No active trades match your search.</p>
              <Button asChild variant="outline" className="bg-white">
                <Link href="/trades/new">
                  Add Your First Trade
                </Link>
              </Button>
            </li>
          ) : (
            activeTrades.map((trade: any) => (
              <TradeListItem
                key={trade.id}
                trade={trade}
                onUpdateSell={setSelectedTrade}
                onDelete={deleteTrade}
                onAddBuy={setSelectedTradeForBuy}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

// Extracted StatCard component for reusability and cleanliness
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

// Extracted TradeListItem for clarity
function TradeListItem({ trade, onUpdateSell, onDelete, onAddBuy }: { trade: Trade, onUpdateSell: (trade: Trade) => void, onDelete: (id: string) => void, onAddBuy: (trade: Trade) => void }) {
  // Calculate performance safely
  const performance = useMemo(() => calculateTradePerformance(trade), [trade]);
  const realizedPnl = useMemo(() => performance.realizedPnL || 0, [performance.realizedPnL]);

  return (
    <li className="py-6">
      <div className="flex items-center justify-between gap-x-6">
        <div className="flex min-w-0 gap-x-4">
          <div className="min-w-0 flex-auto">
            <p className="text-sm font-semibold leading-6 text-stone-900">
              ${trade.ticker}
            </p>
            <p className="mt-1 truncate text-xs leading-5 text-stone-500">
              {trade.tokenName}
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
          <p className="text-sm leading-6 text-stone-900">
            {trade.solInvestment} SOL
          </p>
          <p className={`mt-1 text-xs leading-5 ${
            realizedPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
          }`}>
            {realizedPnl >= 0 ? '+' : ''}{realizedPnl.toFixed(3)} SOL
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddBuy(trade)}
            disabled={trade.status === 'completed'}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Buy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateSell(trade)}
            disabled={trade.status === 'completed'}
          >
            <TrendingDown className="h-4 w-4 mr-1" />
            Sell
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(trade.id)}
            className="text-rose-600 hover:text-rose-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  )
}
