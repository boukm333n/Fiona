'use client'

import { useState, useMemo } from 'react'
import { useTradeStore, Trade } from '@/store/trades'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendingUp, 
  TrendingDown, 
  Search,
  Download,
  ChevronRight,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { formatMarketCap, formatPercentage, calculateTradePerformance } from '@/lib/utils'
import { format, subDays, isAfter } from 'date-fns'
import Link from 'next/link'
// Using the unified utils.calculateTradePerformance for consistent metrics

export default function TradeHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [filterResult, setFilterResult] = useState('all')
  const [timeRange, setTimeRange] = useState('all')

  const completedTrades = useTradeStore((state) => state.getCompletedTrades());

  const tradeHistory = useMemo(() => {
    let filteredTrades = completedTrades.map(trade => {
      const perf = calculateTradePerformance(trade);
      const sells = Array.isArray(trade.partialSells) ? trade.partialSells : [];
      const lastSell = sells.length > 0 ? sells[sells.length - 1] : null;
      const exitMarketCap = lastSell ? Number((lastSell as any).soldAtMarketCap) : trade.entryMarketCap;
      const lastDate = lastSell ? new Date(lastSell.date) : new Date(trade.updatedAt);
      const entryDate = new Date(trade.entryDate);
      const ms = lastDate.getTime() - entryDate.getTime();
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      let holdTime = `${days} days`;
      if (days < 1) {
        const hours = Math.round(ms / (1000 * 60 * 60));
        holdTime = `${hours} hours`;
      }

      return {
        ...trade,
        ...perf,
        profit: perf.realizedPnL,
        exitMarketCap,
        holdTime,
      } as any;
    });

    // 1. Search filter
    if (searchTerm) {
      filteredTrades = filteredTrades.filter(trade =>
        trade.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.ticker.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Result type filter
    if (filterResult === 'wins') {
      filteredTrades = filteredTrades.filter(trade => trade.roi > 0);
    } else if (filterResult === 'losses') {
      filteredTrades = filteredTrades.filter(trade => trade.roi <= 0);
    }

    // 3. Time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const days = parseInt(timeRange.replace('d', ''));
      const cutoffDate = subDays(now, days);
      filteredTrades = filteredTrades.filter(trade => 
        isAfter(new Date(trade.updatedAt), cutoffDate)
      );
    }

    // 4. Sorting
    filteredTrades.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'date-asc':
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'roi-desc':
          return b.roi - a.roi;
        case 'roi-asc':
          return a.roi - b.roi;
        case 'profit-desc':
          return b.profit - a.profit;
        default:
          return 0;
      }
    });

    return filteredTrades;
  }, [completedTrades, searchTerm, sortBy, filterResult, timeRange]);

  // Calculate summary statistics
  const totalTrades = tradeHistory.length
  const winningTrades = tradeHistory.filter((t) => t.roi > 0).length
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
  const totalProfit = tradeHistory.reduce((sum, t) => sum + t.profit, 0)
  const avgROI = totalTrades > 0 ? tradeHistory.reduce((sum, t) => sum + t.roi, 0) / totalTrades : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trade History</h2>
          <p className="text-muted-foreground">
            Review and analyze your past trades
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            {winRate >= 50 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {winningTrades} wins / {totalTrades - winningTrades} losses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit (SOL)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} SOL
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercentage(avgROI)}
            </div>
            <p className="text-xs text-muted-foreground">Per trade</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Trades</CardTitle>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResult} onValueChange={setFilterResult}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="wins">Wins Only</SelectItem>
                  <SelectItem value="losses">Losses Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="roi-desc">ROI (High)</SelectItem>
                  <SelectItem value="roi-asc">ROI (Low)</SelectItem>
                  <SelectItem value="profit-desc">Profit (High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tradeHistory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-charcoal-500 mb-4">No completed trades yet.</p>
                <p className="text-sm text-muted-foreground mb-4">Complete an active trade to see it here.</p>
                <Button asChild>
                  <Link href="/trades/active">View Active Trades</Link>
                </Button>
              </div>
            ) : (
              tradeHistory.map((trade) => (
              <Link key={trade.id} href={`/history/${trade.id}`} passHref>
                <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{trade.tokenName}</h4>
                        <Badge variant="outline">{trade.ticker}</Badge>
                        <Badge variant="secondary">SOL</Badge>
                        <Badge variant={trade.roi >= 0 ? 'default' : 'destructive'}>
                          {trade.roi >= 0 ? 'WIN' : 'LOSS'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Entry → Exit MC</p>
                          <p className="font-medium">
                            {formatMarketCap(trade.entryMarketCap)} → {formatMarketCap(trade.exitMarketCap)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Hold Time</p>
                          <p className="font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {trade.holdTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Decision Quality</p>
                          <p className="font-medium">{trade.decisionQuality}/10</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Behavioral</p>
                          <p className="font-medium text-xs">
                            F:{trade.behavioral.fearLevel} C:{trade.behavioral.confidenceLevel} P:{trade.behavioral.patienceLevel}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p className="font-medium">{format(new Date(trade.updatedAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 ml-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${trade.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatPercentage(trade.roi)}
                        </div>
                        <div className={`text-sm font-medium ${trade.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)} SOL
                        </div>
                        <div className="text-xs text-muted-foreground">
                          from {parseFloat(trade.solInvestment).toFixed(2)} SOL
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground mt-3" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
