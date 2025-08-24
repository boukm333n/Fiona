'use client'

import { useParams, useRouter } from 'next/navigation'
import { useTradeStore } from '@/store/trades'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Tag, BrainCircuit, Wind } from 'lucide-react'
import { format } from 'date-fns'
import { formatMarketCap, formatPercentage, calculateTradePerformance } from '@/lib/utils'
import { PartialSellTimeline } from '@/components/trade/partial-sell-timeline'

const TagList = ({ title, tags, icon: Icon }: { title: string, tags: string[], icon: React.ElementType }) => (
  <div>
    <h4 className="text-sm font-semibold mb-2 flex items-center">
      <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
      {title}
    </h4>
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
    </div>
  </div>
);

export default function ReflectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tradeId = params.tradeId as string;

  const { trade, reflection } = useTradeStore(state => ({
    trade: state.getTrade(tradeId),
    reflection: state.getReflectionByTradeId(tradeId),
  }));

  if (!trade || !reflection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Trade Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested trade or reflection does not exist.</p>
        <Button onClick={() => router.push('/history')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>
      </div>
    );
  }

  const perf = calculateTradePerformance(trade);
  const profit = typeof perf.realizedPnL === 'number' ? perf.realizedPnL : 0;
  const sells = Array.isArray(trade.partialSells) ? trade.partialSells : [];
  const lastSell = sells.length > 0 ? sells[sells.length - 1] : null;
  const exitMarketCap = lastSell ? Number((lastSell as any).soldAtMarketCap) : trade.entryMarketCap;
  const entryDate = new Date(trade.entryDate);
  const lastDate = lastSell ? new Date(lastSell.date) : new Date(trade.updatedAt);
  const ms = lastDate.getTime() - entryDate.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  let holdTime = `${days} days`;
  if (days < 1) {
    const hours = Math.round(ms / (1000 * 60 * 60));
    holdTime = `${hours} hours`;
  }
  const isWin = profit > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/history')} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {trade.tokenName} <span className="text-xl text-muted-foreground">({trade.ticker})</span>
          </h2>
          <p className="text-muted-foreground">
            Reflection for trade completed on {format(new Date(trade.updatedAt), 'MMM d, yyyy')}
          </p>
        </div>
        <Badge variant={isWin ? 'default' : 'destructive'} className="text-lg px-4 py-2">
          {isWin ? 'WIN' : 'LOSS'}
        </Badge>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Performance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
                <p className="text-sm text-muted-foreground">Profit/Loss</p>
                <p className={`text-xl font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                    {profit.toFixed(2)} SOL
                </p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Return (ROI)</p>
                <p className={`text-xl font-bold ${isWin ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(perf.roi)}
                </p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Entry → Exit MC</p>
                <p className="text-xl font-bold">
                    {formatMarketCap(trade.entryMarketCap)} → {formatMarketCap(exitMarketCap)}
                </p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Hold Time</p>
                <p className="text-xl font-bold flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5"/> {holdTime}
                </p>
            </div>
        </CardContent>
      </Card>

      {/* Post-Trade Reflection */}
      <Card>
        <CardHeader>
          <CardTitle>Post-Trade Reflection</CardTitle>
          <CardDescription>Decision Quality Score: <span className="font-bold text-primary">{reflection.decisionQuality}/10</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">What went well?</h4>
              <p className="text-muted-foreground p-4 bg-muted/50 rounded-md">{reflection.whatWentWell}</p>
              <h4 className="font-semibold">What could be improved?</h4>
              <p className="text-muted-foreground p-4 bg-muted/50 rounded-md">{reflection.whatCouldBeImproved}</p>
              <h4 className="font-semibold">Key Lessons Learned</h4>
              <p className="text-muted-foreground p-4 bg-muted/50 rounded-md">{reflection.lessonsLearned}</p>
            </div>
            <div className="space-y-4">
              <TagList title="Key Mistakes" tags={reflection.keyMistakes} icon={TrendingDown} />
              <TagList title="Emotional State" tags={reflection.emotionalStateTags} icon={BrainCircuit} />
              <TagList title="Market Conditions" tags={reflection.marketConditionTags} icon={Wind} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partial Sells Timeline */}
      <PartialSellTimeline sells={trade.partialSells} initialInvestment={parseFloat(trade.solInvestment)} entryMarketCap={trade.entryMarketCap} />
    </div>
  )
}
