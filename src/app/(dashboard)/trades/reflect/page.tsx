'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Brain, CheckCircle, TrendingUp, TrendingDown, Scale, Smile, Frown, Sparkles, BookOpen } from 'lucide-react'
import { useTradeStore, Trade, TradeReflection } from '@/store/trades';
import { calculateTradePerformance, formatCurrency, formatMarketCap } from '@/lib/utils'
import { format } from 'date-fns'

// --- Data Structures & Options ---
type ReflectionState = Omit<TradeReflection, 'id' | 'reflectionDate'> & {
  emotionalStateTags: string[];
  marketConditionTags: string[];
};

const mistakeOptions = ['Early entry', 'Late exit', 'Poor research', 'Emotional decision', 'Ignored red flags', 'Over-invested', 'Under-invested', 'FOMO driven', 'Panic sold', 'Revenge traded', 'Didn\'t take profits', 'Held too long'];
const emotionOptions = ['Greedy', 'Fearful', 'Anxious', 'Euphoric', 'Patient', 'Confident', 'Stressed', 'Hopeful', 'Regretful', 'Disciplined'];
const marketOptions = ['Bullish', 'Bearish', 'Choppy', 'High Volatility', 'Low Volatility', 'Strong Narrative'];

// --- Main Component ---
export default function PostTradeReflectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tradeId = searchParams.get('tradeId');

  const store = useTradeStore();
  const { getTrade, addReflection, updateTrade } = store;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reflectionData, setReflectionData] = useState<ReflectionState>({
    tradeId: tradeId || '',
    whatWentWell: '',
    whatCouldBeImproved: '',
    keyMistakes: [],
    lessonsLearned: '',
    wouldRepeatTrade: 'Maybe',
    alternativeActions: '',
    decisionQuality: 5,
    emotionalStateTags: [],
    marketConditionTags: [],
  });

  useEffect(() => {
    if (tradeId) {
      const foundTrade = getTrade(tradeId);
      if (foundTrade) {
        setTrade(foundTrade);
        setReflectionData(prev => ({ ...prev, tradeId }));
      } else {
        router.push('/history'); // Redirect if trade not found
      }
    }
  }, [tradeId, getTrade, router]);

  const handleMultiSelectToggle = (field: 'keyMistakes' | 'emotionalStateTags' | 'marketConditionTags', value: string) => {
    setReflectionData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    if (!tradeId) return;
    setIsSubmitting(true);
    try {
      addReflection({
        ...reflectionData,
      });
      updateTrade(tradeId, { status: 'completed', decisionQuality: reflectionData.decisionQuality });
      router.push('/history');
    } catch (error) {
      console.error('Error saving reflection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagToggle = (tag: string, field: 'emotionalStateTags' | 'marketConditionTags') => {
    setReflectionData(prev => {
      const currentTags = prev[field];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      return { ...prev, [field]: newTags };
    });
  };

  if (!trade) {
    return <div className="flex items-center justify-center min-h-screen font-serif text-stone-500">Loading trade details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-serif bg-stone-50/50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Post-Trade Reflection</h1>
        <p className="text-stone-500 mt-1">Dissect your decisions to sharpen your edge for next time.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ReflectionCard icon={Sparkles} title="Performance Analysis">
            <TextareaGroup id="wentWell" label="What were your successful decisions?" placeholder="e.g., 'My entry timing was precise based on my thesis.'" value={reflectionData.whatWentWell} onChange={e => setReflectionData({...reflectionData, whatWentWell: e.target.value})} />
            <TextareaGroup id="couldImprove" label="Where is your biggest opportunity for improvement?" placeholder="e.g., 'I could have taken partial profits at my initial target.'" value={reflectionData.whatCouldBeImproved} onChange={e => setReflectionData({...reflectionData, whatCouldBeImproved: e.target.value})} />
            <MultiSelectGroup label="Identify Key Mistakes" options={mistakeOptions} selected={reflectionData.keyMistakes} onToggle={(val) => handleMultiSelectToggle('keyMistakes', val)} />
          </ReflectionCard>

          <ReflectionCard icon={Brain} title="Psychological & Emotional Review">
            <div className="space-y-2">
              <Label>Describe your emotional state (select all that apply)</Label>
              <div className="flex flex-wrap gap-2 pt-2">
                {emotionOptions.map(tag => (
                  <button key={tag} type="button" onClick={() => handleTagToggle(tag, 'emotionalStateTags')} className={`px-3 py-1 text-sm rounded-full border transition-colors ${(reflectionData.emotionalStateTags || []).includes(tag) ? 'bg-peach-500 text-white border-peach-500' : 'bg-stone-100/80 border-stone-200/90 hover:bg-stone-200/70'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Describe the market conditions (select all that apply)</Label>
              <div className="flex flex-wrap gap-2 pt-2">
                {marketOptions.map(tag => (
                  <button key={tag} type="button" onClick={() => handleTagToggle(tag, 'marketConditionTags')} className={`px-3 py-1 text-sm rounded-full border transition-colors ${(reflectionData.marketConditionTags || []).includes(tag) ? 'bg-peach-500 text-white border-peach-500' : 'bg-stone-100/80 border-stone-200/90 hover:bg-stone-200/70'}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </ReflectionCard>

          <ReflectionCard icon={BookOpen} title="Strategic Lessons & Future Actions">
            <TextareaGroup id="lessonsLearned" label="What is the single most important lesson from this trade?" placeholder="e.g., 'Never underestimate the impact of a major narrative shift.'" value={reflectionData.lessonsLearned} onChange={e => setReflectionData({...reflectionData, lessonsLearned: e.target.value})} />
            <FormItem id="repeatTrade" label="Would you take this trade again?">
              <Select value={reflectionData.wouldRepeatTrade} onValueChange={(val) => setReflectionData({...reflectionData, wouldRepeatTrade: val as 'Yes' | 'No' | 'Maybe'})}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes, exactly the same</SelectItem>
                  <SelectItem value="Maybe">Maybe, with modifications</SelectItem>
                  <SelectItem value="No">No, I would avoid it</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            <TextareaGroup id="alternativeActions" label="What could you have done differently?" placeholder="Consider alternative entries, exits, or position sizes."
              value={reflectionData.alternativeActions} onChange={e => setReflectionData({...reflectionData, alternativeActions: e.target.value})} />
          </ReflectionCard>
        </div>

        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
          <TradeSummaryCard trade={trade} />
          <Card className="bg-white border-stone-200/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Scale className="w-5 h-5 text-stone-500"/>Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <SliderItem label="Decision Quality" value={reflectionData.decisionQuality} onValueChange={(val) => setReflectionData({...reflectionData, decisionQuality: val})} minLabel="Flawed" maxLabel="Optimal" />
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-stone-800 hover:bg-stone-900 text-white">
                <CheckCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Complete Reflection'}
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// --- Reusable Components ---
const FormItem = ({ id, label, children }: { id: string, label: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-stone-600">{label}</Label>
    {children}
  </div>
);

const TextareaGroup = ({ id, label, placeholder, value, onChange }: { id: string, label: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }) => (
  <FormItem id={id} label={label}>
    <Textarea id={id} placeholder={placeholder} value={value} onChange={onChange} rows={3} className="w-full p-2 border rounded-md shadow-sm font-sans text-sm bg-stone-50/80 border-stone-200/70 focus:ring-stone-500 focus:border-stone-500" />
  </FormItem>
);

const MultiSelectGroup = ({ label, options, selected, onToggle }: { label: string, options: string[], selected: string[], onToggle: (option: string) => void }) => (
  <div className="space-y-3">
    <Label className="text-sm font-medium text-stone-600">{label}</Label>
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button key={option} onClick={() => onToggle(option)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${selected.includes(option) ? 'bg-stone-800 text-white border-stone-800' : 'bg-white hover:bg-stone-100 border-stone-300'}`}>
          {option}
        </button>
      ))}
    </div>
  </div>
);

const SliderItem = ({ label, value, onValueChange, minLabel, maxLabel }: { label: string, value: number, onValueChange: (value: number) => void, minLabel: string, maxLabel: string }) => (
  <FormItem id={label.toLowerCase().replace(/\s+/g, '-')} label={label}>
    <div className="px-1 pt-1">
      <Slider value={[value]} onValueChange={(v) => onValueChange(v[0])} max={10} min={1} step={1} />
      <div className="flex justify-between text-xs text-stone-500 mt-1.5">
        <span>{minLabel}</span>
        <span className="font-semibold text-stone-700">{value}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  </FormItem>
);

const ReflectionCard = ({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => (
  <Card className="bg-white border-stone-200/60 shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-stone-500"/>{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-6 pt-2">
      {children}
    </CardContent>
  </Card>
);

const TradeSummaryCard = ({ trade }: { trade: Trade }) => {
  const performance = useMemo(() => calculateTradePerformance(trade), [trade]);
  const pnlColor = performance.realizedPnL >= 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <Card className="bg-white border-stone-200/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{trade.tokenName} <span className="font-mono text-base text-stone-500">${trade.ticker}</span></CardTitle>
        <CardDescription>Last updated on {format(new Date(trade.updatedAt), 'MMM dd, yyyy')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <SummaryItem label="Realized P&L (SOL)" value={performance.realizedPnL.toFixed(3)} color={pnlColor} />
        <SummaryItem label="Avg. Sell Multiplier" value={`${performance.averageSellMultiplier.toFixed(2)}x`} color={pnlColor} />
        <SummaryItem label="Initial Investment" value={`${trade.solInvestment} SOL`} />
        <SummaryItem label="Entry Market Cap" value={formatMarketCap(trade.entryMarketCap)} />
        <SummaryItem label="Entry Date" value={format(new Date(trade.entryDate), 'MMM dd, yyyy')} />
      </CardContent>
    </Card>
  );
};

const SummaryItem = ({ label, value, color }: { label: string, value: string, color?: string }) => (
  <div className="flex justify-between items-center">
    <p className="text-stone-600">{label}</p>
    <p className={`font-semibold text-stone-800 ${color}`}>{value}</p>
  </div>
);
