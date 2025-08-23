'use client'

import { useMemo } from 'react'
import { useTradeStore, Trade } from '@/store/trades'
import { calculateTradePerformance } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { StatsCard } from '@/components/stats-card'
import { RecentTrades } from '@/components/recent-trades'
import { ActivePositions } from '@/components/active-positions'
import { AIInsights } from '@/components/ai-insights'
import { DollarSign, TrendingUp, Target, Activity, CircleDollarSign } from 'lucide-react'

export default function DashboardPage() {
  const trades = useTradeStore((state) => state.trades)

  const stats = useMemo(() => {
    const activeTrades = trades.filter(t => t.status === 'active');
    const completedTrades = trades.filter(t => t.status === 'completed');

    const totalSolInvested = trades.reduce((sum, t) => sum + parseFloat(t.solInvestment || '0'), 0);
    
    const totalRealizedPnl = trades.reduce((sum, t) => {
      const performance = calculateTradePerformance(t);
      return sum + (performance.realizedPnL || 0);
    }, 0);

    return {
      totalSolInvested,
      totalRealizedPnl,
      activeTradesCount: activeTrades.length,
      totalTradesCount: trades.length,
    }
  }, [trades]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-stone-800">Dashboard</h2>
        <p className="text-stone-500">
          Your memecoin trading performance at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total SOL Invested"
          value={`${stats.totalSolInvested.toFixed(2)} SOL`}
          icon={CircleDollarSign}
          description="Lifetime investment in SOL"
        />
        <StatsCard
          title="Realized PnL"
          value={`${stats.totalRealizedPnl.toFixed(2)} SOL`}
          icon={TrendingUp}
          description="Profit from completed trades"
          trendUp={stats.totalRealizedPnl >= 0}
        />
        <StatsCard
          title="Active Trades"
          value={stats.activeTradesCount.toString()}
          icon={Activity}
          description="Currently open positions"
        />
        <StatsCard
          title="Total Trades"
          value={stats.totalTradesCount.toString()}
          icon={Target}
          description="Lifetime trades logged"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ActivePositions />
          <RecentTrades />
        </div>
        <div>
          <AIInsights />
        </div>
      </div>
    </div>
  )
}
