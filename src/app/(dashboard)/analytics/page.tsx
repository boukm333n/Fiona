'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp,
  TrendingDown,
  Calendar,
  Brain,
  Target,
  Activity,
  PieChart,
  BarChart3
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  PieChart as RePieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts'
import { formatCurrency, formatPercentage, calculateTradePerformance, cn } from '@/lib/utils'
import { useTradeStore, Trade } from '@/store/trades'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, History as HistoryIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { format, startOfMonth, subMonths } from 'date-fns'

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function AnalyticsPage() {
  const trades = useTradeStore((state) => state.trades)
  const [timePeriod, setTimePeriod] = useState('all');

  const analyticsData = useMemo(() => {
    const completedTrades = trades.filter(t => t.status === 'completed');

    if (completedTrades.length === 0) {
      return null;
    }

    // Filter trades based on time period
    const now = new Date();
    const monthsToSubtract = {
      '1m': 1, '3m': 3, '6m': 6, '1y': 12
    }[timePeriod] || 999; // 'all' time

    const startDate = subMonths(now, monthsToSubtract);
    const filteredTrades = timePeriod === 'all' ? completedTrades : completedTrades.filter(t => new Date(t.updatedAt || 0) >= startDate);

    if (filteredTrades.length === 0) {
        return {
            performanceData: [],
            marketCapData: [],
            psychologyData: [],
            timeOfDayData: [],
            hasData: false,
        }
    }

    // Performance Overview Data
    const monthlyPerformance = filteredTrades.reduce((acc, trade) => {
      const month = format(startOfMonth(new Date(trade.updatedAt)), 'MMM yyyy');
      if (!acc[month]) {
        acc[month] = { trades: [], profit: 0 };
      }
      acc[month].trades.push(trade);
      acc[month].profit += calculateTradePerformance(trade).realizedPnL || 0;
      return acc;
    }, {} as Record<string, { trades: Trade[], profit: number }>);

    const performanceData = Object.entries(monthlyPerformance).map(([month, data]) => ({
      month,
      profit: data.profit,
      winRate: (data.trades.filter(t => (calculateTradePerformance(t).realizedPnL || 0) > 0).length / data.trades.length) * 100,
      trades: data.trades.length
    })).reverse();

    // Market Cap Analysis Data
    const mcRanges = {
      '<100K': (mc: number) => mc < 100000,
      '100K-500K': (mc: number) => mc >= 100000 && mc < 500000,
      '500K-1M': (mc: number) => mc >= 500000 && mc < 1000000,
      '>1M': (mc: number) => mc >= 1000000,
    };
    const marketCapData = Object.keys(mcRanges).map(range => {
      const tradesInBucket = filteredTrades.filter(t => mcRanges[range as keyof typeof mcRanges](t.entryMarketCap));
      if (tradesInBucket.length === 0) return null;
      const totalROI = tradesInBucket.reduce((sum, t) => sum + (calculateTradePerformance(t).roi || 0), 0);
      const winCount = tradesInBucket.filter(t => (calculateTradePerformance(t).realizedPnL || 0) > 0).length;
      return {
        range,
        trades: tradesInBucket.length,
        avgROI: totalROI / tradesInBucket.length,
        winRate: (winCount / tradesInBucket.length) * 100
      };
    }).filter(Boolean);

    // Psychology Impact Data
    const psychologyFactors = filteredTrades.reduce((acc, trade) => {
      const state = trade.behavioral?.stateOfMind || 'Unknown';
      if (!acc[state]) {
        acc[state] = { trades: [], totalROI: 0 };
      }
      acc[state].trades.push(trade);
      acc[state].totalROI += calculateTradePerformance(trade).roi || 0;
      return acc;
    }, {} as Record<string, { trades: Trade[], totalROI: number }>);
    
    const psychologyData = Object.entries(psychologyFactors).map(([factor, data]) => ({
      factor,
      value: data.trades.length,
      avgROI: data.totalROI / data.trades.length
    }));

    // Time of Day Analysis
    const timeOfDayDistribution = filteredTrades.reduce((acc, trade) => {
      const sells = Array.isArray(trade.partialSells) ? trade.partialSells : [];
      const entryMc = trade.entryMarketCap || 0;
      const initialSol = parseFloat(trade.solInvestment) || 0;
      sells.forEach(sell => {
        const time = sell.timeOfDay || 'Unknown';
        if (!acc[time]) {
          acc[time] = { count: 0, totalPnl: 0 };
        }
        // Per-sell PnL portion based on entry MC and sold amount percentage
        const pct = (sell.amountPercentage || 0) / 100;
        const cogsPortion = initialSol * pct;
        const valueAtSale = entryMc > 0 ? cogsPortion * ((sell.soldAtMarketCap || 0) / entryMc) : 0;
        const pnlPortion = valueAtSale - cogsPortion;
        acc[time].count += 1;
        acc[time].totalPnl += pnlPortion;
      });
      return acc;
    }, {} as Record<string, { count: number, totalPnl: number }>);

    const timeOfDayData = Object.entries(timeOfDayDistribution).map(([name, data], index) => ({
      name,
      value: data.count,
      pnl: data.totalPnl,
      color: COLORS[index % COLORS.length]
    }));

    return { performanceData, marketCapData, psychologyData, timeOfDayData, hasData: true };

  }, [trades, timePeriod]);

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-white border border-stone-200/60 shadow-sm h-full min-h-[60vh]">
        <div className="p-4 bg-blue-100/50 rounded-full mb-5">
          <BarChart3 className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-stone-800">Unlock Your Trading Analytics</h2>
        <p className="max-w-md mt-2 text-stone-500">
          Log your completed trades to generate deep insights into your performance, psychological patterns, and more.
        </p>
        <Button asChild size="lg" className="mt-6 bg-stone-800 text-white hover:bg-stone-700 shadow-lg shadow-stone-800/10">
          <Link href="/trades/new">
            <Plus className="w-5 h-5 mr-2" />
            Log a Trade
          </Link>
        </Button>
      </div>
    )
  }

  const { performanceData, marketCapData, psychologyData, timeOfDayData, hasData } = analyticsData;

  if (!hasData) {
     return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold font-serif text-stone-800">Analytics</h1>
                <p className="text-sm text-stone-600 mt-1">
                Deep insights into your trading performance and patterns.
                </p>
            </header>
            <div className="flex justify-end">
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-[180px] bg-white shadow-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1m">Last Month</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-white border border-stone-200/60 shadow-sm h-full min-h-[40vh]">
                <div className="p-4 bg-gray-100/50 rounded-full mb-5">
                    <HistoryIcon className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className="text-xl font-bold font-serif text-stone-800">No Data for this Period</h2>
                <p className="max-w-md mt-2 text-stone-500">
                    There are no completed trades in the selected time range. Try a different one or log new trades.
                </p>
            </div>
        </div>
     )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-serif text-stone-800">Analytics</h1>
        <p className="text-sm text-stone-600 mt-1">
          Deep insights into your trading performance and patterns.
        </p>
      </header>

      {/* Time Period Selector */}
      <div className="flex justify-end">
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px] bg-white shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-stone-600" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Monthly profit and trading activity over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200/60" />
              <XAxis dataKey="month" className="text-xs text-stone-500" />
              <YAxis yAxisId="left" className="text-xs text-stone-500" unit=" SOL" />
              <YAxis yAxisId="right" orientation="right" className="text-xs text-stone-500" unit="%" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-md)',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                name="Profit (SOL)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="winRate" 
                stroke="#3b82f6" 
                name="Win Rate"
                strokeWidth={2}
                unit="%"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Market Cap Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-stone-600" />
              Market Cap Analysis
            </CardTitle>
            <CardDescription>
              Performance by entry market cap.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marketCapData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200/60" />
                <XAxis dataKey="range" className="text-xs text-stone-500" />
                <YAxis className="text-xs text-stone-500" unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Bar dataKey="avgROI" fill="#10b981" name="Avg ROI" unit="%" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {marketCapData.map((item) => (
                item && (
                  <div key={item.range} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600 font-medium">{item.range}</span>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-stone-100/80">{item.trades} trades</Badge>
                      <span className={cn('font-semibold', item.winRate >= 50 ? 'text-emerald-600' : 'text-rose-600')}>
                        {item.winRate.toFixed(1)}% win
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time of Day Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-stone-600" />
              Time of Day Analysis
            </CardTitle>
            <CardDescription>
              Trading activity by time of day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={timeOfDayData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {timeOfDayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} trades`, `PnL: ${props.payload.pnl.toFixed(2)} SOL`]} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Psychology Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-stone-600" />
            Psychology Impact Analysis
          </CardTitle>
          <CardDescription>
            How your mental state affects trading performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {psychologyData.map((item) => (
              <div key={item.factor} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-800">{item.factor}</span>
                    <Badge variant="outline" className="bg-stone-100/80">{item.value} trades</Badge>
                  </div>
                  <span className={cn('font-semibold', 
                    item.avgROI >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {item.avgROI >= 0 ? '+' : ''}{item.avgROI.toFixed(1)}% avg ROI
                  </span>
                </div>
                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className={cn('h-full', 
                      item.avgROI >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    )}
                    style={{ width: `${Math.min(Math.abs(item.avgROI), 100)}%` }} // Capped at 100% for visual sanity
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-stone-600" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-stone-50/50 border border-stone-200/60 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Strengths
              </h4>
              <ul className="space-y-1 text-sm text-stone-600">
                <li>• Excellent performance on sub-500K market cap entries</li>
                <li>• Strong win rate when patient (35 trades, 78% win)</li>
                <li>• Good risk management with stop losses</li>
              </ul>
            </div>
            <div className="p-4 bg-stone-50/50 border border-stone-200/60 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                Areas to Improve
              </h4>
              <ul className="space-y-1 text-sm text-stone-600">
                <li>• Reduce position size when fear level {'>'} 7</li>
                <li>• Avoid trading when FOMO is high</li>
                <li>• Consider longer hold times for winners</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
