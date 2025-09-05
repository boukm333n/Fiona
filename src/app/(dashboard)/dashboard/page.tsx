import { StatsCard } from '@/components/stats-card'
import { ActivePositions } from '@/components/active-positions'
import { RecentTrades } from '@/components/recent-trades'
import { AIInsights } from '@/components/ai-insights'
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Brain 
} from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="border-b border-peach-100 pb-6">
        <h1 className="text-4xl font-serif font-semibold text-charcoal-800 mb-2">Dashboard</h1>
        <p className="text-charcoal-600 font-light">
          Your trading psychology and performance dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total P&L"
          value="+$48,232"
          description="+22.5% from last month"
          trend="↑ 22.5%"
          trendUp={true}
          icon={DollarSign}
        />
        <StatsCard
          title="Win Rate"
          value="68.4%"
          description="26 wins / 38 trades"
          trend="↑ 5.2%"
          trendUp={true}
          icon={TrendingUp}
        />
        <StatsCard
          title="Active Positions"
          value="5"
          description="$8,420 invested"
          icon={Activity}
        />
        <StatsCard
          title="Psychology Score"
          value="8.2/10"
          description="Discipline improving"
          trend="↑ 0.4"
          trendUp={true}
          icon={Brain}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivePositions />
        <RecentTrades />
      </div>

      {/* AI Insights */}
      <AIInsights />
    </div>
  )
}
