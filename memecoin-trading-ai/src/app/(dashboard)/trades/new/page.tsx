'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import { useTradeStore, TradeData, BehaviorData } from '@/store/trades'

// Local form data aligned with store TradeData, but using strings for numeric inputs
interface LocalTradeData {
  tokenName: string;
  ticker: string;
  tokenAddress: string;
  entryMarketCap: string; // USD, numeric string
  solInvestment: string;  // SOL, numeric string
  tokenQuantity: string;  // computed, numeric string
  totalSupply: string;    // numeric string
  solPrice: string;       // USD, numeric string
}

// Local state includes additional fields for calculation only

export default function NewTradePage() {
  const router = useRouter()
  const addTrade = useTradeStore((state) => state.addTrade)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  const [percentageOfSupply, setPercentageOfSupply] = useState(0);

  const [tradeData, setTradeData] = useState<LocalTradeData>({
    tokenName: '',
    ticker: '',
    tokenAddress: '',
    entryMarketCap: '',
    tokenQuantity: '',
    solInvestment: '',
    totalSupply: '1000000000', // Default to 1B
    solPrice: '',
  })

  const [behaviorData, setBehaviorData] = useState<BehaviorData>({
    entrySentiment: 5,
    fearLevel: 5,
    confidenceLevel: 5,
    patienceLevel: 5,
    stateOfMind: '',
    researchTime: 0,
    investmentThesis: '',
    groupthinkInfluence: false,
    groupSentiment: '',
    sleepQuality: 5,
    distractions: '',
  })

  const handleTradeDataChange = (field: keyof LocalTradeData, value: string) => {
    setTradeData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleBehaviorDataChange = (field: keyof BehaviorData, value: any) => {
    setBehaviorData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const { solInvestment, entryMarketCap, totalSupply, solPrice } = tradeData;
    if (solInvestment && entryMarketCap && totalSupply && solPrice) {
      const solInvestmentNum = parseFloat(solInvestment);
      const marketCapNum = parseFloat(entryMarketCap);
      const totalSupplyNum = parseFloat(totalSupply);
      const solPriceNum = parseFloat(solPrice);

      if (!isNaN(solInvestmentNum) && !isNaN(marketCapNum) && !isNaN(totalSupplyNum) && marketCapNum > 0 && solPriceNum > 0) {
        const tokenPriceInSol = (marketCapNum / solPriceNum) / totalSupplyNum;
        const tokensPurchased = solInvestmentNum / tokenPriceInSol;
        const ownershipPercentage = (tokensPurchased / totalSupplyNum) * 100;
        
        handleTradeDataChange('tokenQuantity', tokensPurchased.toFixed(2));
        setPercentageOfSupply(ownershipPercentage);
      }
    } else {
      handleTradeDataChange('tokenQuantity', '');
      setPercentageOfSupply(0);
    }
  }, [tradeData.solInvestment, tradeData.entryMarketCap, tradeData.totalSupply, tradeData.solPrice]);

  const handleSubmit = () => {
    try {
      // Prepare data for the store
      const tradeDataForStore: TradeData = {
        tokenName: tradeData.tokenName.trim(),
        ticker: tradeData.ticker.trim(),
        tokenAddress: tradeData.tokenAddress.trim(),
        solInvestment: tradeData.solInvestment,
        tokenQuantity: parseFloat(tradeData.tokenQuantity || '0'),
        entryMarketCap: parseFloat(tradeData.entryMarketCap || '0'),
        totalSupply: parseFloat(tradeData.totalSupply || '0'),
      }
      addTrade(tradeDataForStore, behaviorData);
      router.push('/trades/active');
    } catch (error) {
      console.error('Error saving trade:', error);
      alert('Failed to save trade. Please check console for details.');
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <Step1_TradeDetails data={tradeData} handleDataChange={handleTradeDataChange} percentageOfSupply={percentageOfSupply} />
      case 2: return <Step2_Psychology data={behaviorData} handleDataChange={handleBehaviorDataChange} />
      case 3: return <Step3_Context data={behaviorData} handleDataChange={handleBehaviorDataChange} />
      case 4: return <Step4_Review tradeData={tradeData} behaviorData={behaviorData} percentageOfSupply={percentageOfSupply} />
      default: return null
    }
  }

  const stepTitles = ["Trade Details", "Psychology & Behavior", "Context & Environment", "Review & Submit"]

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-serif bg-stone-50/50 min-h-screen">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Log a New Trade</h1>
      <p className="text-stone-500 mb-6">Capture every detail to refine your edge.</p>

      <Card className="bg-white border-stone-200/60 shadow-sm w-full max-w-3xl mx-auto">
        <CardHeader className="border-b border-stone-200/60 p-6">
          <h3 className="text-lg font-semibold text-stone-700">Step {currentStep}: {stepTitles[currentStep - 1]}</h3>
          <Progress value={(currentStep / totalSteps) * 100} className="w-full h-1.5 mt-2" />
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {renderStepContent()}
        </CardContent>
        <CardFooter className="bg-stone-50/70 p-6 border-t border-stone-200/60 flex justify-between items-center">
          <Button onClick={prevStep} variant="ghost" className="text-stone-600" disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          {currentStep < totalSteps ? (
            <Button onClick={nextStep} className="bg-stone-800 hover:bg-stone-900 text-white">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Trade
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

const FormItem = ({ id, label, children, description }: { id: string, label: string, children: React.ReactNode, description?: string }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-medium text-stone-600">{label}</Label>
    {children}
    {description && <p className="text-xs text-stone-500">{description}</p>}
  </div>
);

// --- Step 1: Trade Details Component ---
const Step1_TradeDetails = ({ data, handleDataChange, percentageOfSupply }: { data: LocalTradeData, handleDataChange: (field: keyof LocalTradeData, value: string) => void, percentageOfSupply: number }) => {
  const usdValue = (() => {
    const s = parseFloat(data.solInvestment)
    const p = parseFloat(data.solPrice)
    return !isNaN(s) && !isNaN(p) ? (s * p).toFixed(2) : ''
  })()
  return (
    <div className="space-y-6 text-stone-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormItem label="Token Name" id="tokenName">
          <Input id="tokenName" placeholder="e.g., Mother Iggy" value={data.tokenName} onChange={(e) => handleDataChange('tokenName', e.target.value)} />
        </FormItem>
        <FormItem label="Ticker" id="ticker">
          <Input id="ticker" placeholder="e.g., IGGY" value={data.ticker} onChange={(e) => handleDataChange('ticker', e.target.value)} />
        </FormItem>
      </div>
      <FormItem label="Token Address" id="tokenAddress">
        <Input id="tokenAddress" placeholder="e.g., 9x..." value={data.tokenAddress} onChange={(e) => handleDataChange('tokenAddress', e.target.value)} />
      </FormItem>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormItem label="Total Supply" id="totalSupply">
          <Select value={data.totalSupply} onValueChange={(value) => handleDataChange('totalSupply', value)}>
              <SelectTrigger><SelectValue placeholder="Select total supply" /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="1000000000">1 Billion</SelectItem>
                  <SelectItem value="100000000">100 Million</SelectItem>
              </SelectContent>
          </Select>
        </FormItem>
        <FormItem label="Entry Market Cap (USD)" id="entryMarketCap">
          <Input id="entryMarketCap" type="number" placeholder="e.g., 15000" value={data.entryMarketCap} onChange={(e) => handleDataChange('entryMarketCap', e.target.value)} />
        </FormItem>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormItem label="SOL Invested" id="solInvestment">
              <Input id="solInvestment" type="number" placeholder="e.g., 10.5" value={data.solInvestment} onChange={(e) => handleDataChange('solInvestment', e.target.value)} />
          </FormItem>
          <FormItem label="Current SOL Price (USD)" id="solPrice">
              <Input id="solPrice" type="number" placeholder="e.g., 165.50" value={data.solPrice} onChange={(e) => handleDataChange('solPrice', e.target.value)} />
          </FormItem>
      </div>
      <div className="p-4 bg-stone-100/70 rounded-lg border border-stone-200/60">
          <h4 className="font-semibold text-stone-700 mb-2">Your Position</h4>
          <p className="text-sm text-stone-600">USD Value: <span className="font-mono font-medium text-stone-800">${usdValue || '...'}</span></p>
          <p className="text-sm text-stone-600">Tokens Purchased: <span className="font-mono font-medium text-stone-800">{data.tokenQuantity ? new Intl.NumberFormat('en-US').format(Number(data.tokenQuantity)) : '...'}</span></p>
          <p className="text-sm text-stone-600">Ownership: <span className="font-mono font-medium text-stone-800">{percentageOfSupply.toFixed(6)}%</span> of total supply</p>
      </div>
    </div>
  )
};

// --- Step 2: Psychology & Behavior Component ---
const Step2_Psychology = ({ data, handleDataChange }: { data: BehaviorData, handleDataChange: (field: keyof BehaviorData, value: any) => void }) => (
  <div className="space-y-6">
    <SliderItem label="Entry Sentiment" value={data.entrySentiment} onValueChange={(v) => handleDataChange('entrySentiment', v[0])} minLabel="Very Bearish" maxLabel="Very Bullish" />
    <SliderItem label="Fear Level" value={data.fearLevel} onValueChange={(v) => handleDataChange('fearLevel', v[0])} minLabel="No Fear" maxLabel="Extreme Fear" />
    <SliderItem label="Confidence Level" value={data.confidenceLevel} onValueChange={(v) => handleDataChange('confidenceLevel', v[0])} minLabel="No Confidence" maxLabel="Very Confident" />
    
    <FormItem label="State of Mind" id="stateOfMind">
      <Select value={data.stateOfMind} onValueChange={(value) => handleDataChange('stateOfMind', value)}>
        <SelectTrigger><SelectValue placeholder="Select your state of mind" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="Focused / In the Zone">🧠 Focused / In the Zone</SelectItem>
          <SelectItem value="Calm / Patient">🧘 Calm / Patient</SelectItem>
          <SelectItem value="Alert / Opportunistic">⚡️ Alert / Opportunistic</SelectItem>
          <SelectItem value="Anxious / Stressed">😬 Anxious / Stressed</SelectItem>
          <SelectItem value="Tired / Fatigued">🥱 Tired / Fatigued</SelectItem>
          <SelectItem value="Distracted / Unfocused">🤯 Distracted / Unfocused</SelectItem>
          <SelectItem value="Greedy / Euphoric">🤑 Greedy / Euphoric</SelectItem>
          <SelectItem value="Fearful / Panicked">😨 Fearful / Panicked</SelectItem>
        </SelectContent>
      </Select>
    </FormItem>

    <FormItem label="Investment Thesis" id="thesis">
      <Textarea id="thesis" rows={4} className="w-full p-2 border rounded-md shadow-sm font-sans text-sm bg-stone-50/80 border-stone-200/70 focus:ring-stone-500 focus:border-stone-500" placeholder="Briefly, why did you enter this trade? What was your edge?" value={data.investmentThesis} onChange={(e) => handleDataChange('investmentThesis', e.target.value)} />
    </FormItem>
  </div>
);

// --- Step 3: Context & Environment Component ---
const Step3_Context = ({ data, handleDataChange }: { data: BehaviorData, handleDataChange: (field: keyof BehaviorData, value: any) => void }) => (
  <div className="space-y-6">
     <FormItem label="Research Time (Hours)" id="researchTime">
        <Input id="researchTime" type="number" placeholder="e.g., 2.5" value={String(data.researchTime)} onChange={(e) => handleDataChange('researchTime', parseFloat(e.target.value) || 0)} />
    </FormItem>

    <div className="p-4 border border-stone-200/60 rounded-lg space-y-4">
        <div className="flex items-center space-x-3">
            <Checkbox id="groupthink" checked={data.groupthinkInfluence} onCheckedChange={(checked) => handleDataChange('groupthinkInfluence', !!checked)} />
            <Label htmlFor="groupthink" className="text-sm font-medium text-stone-700">Was your decision influenced by groupthink/social proof?</Label>
        </div>
        {data.groupthinkInfluence && (
            <div className="space-y-4 pl-2 border-l-2 border-stone-200 ml-2 mt-2">
                <FormItem label="Group Sentiment" id="groupSentiment">
                    <Select value={data.groupSentiment} onValueChange={(value) => handleDataChange('groupSentiment', value)}>
                        <SelectTrigger><SelectValue placeholder="Select group sentiment" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Bullish">Bullish</SelectItem>
                            <SelectItem value="Bearish">Bearish</SelectItem>
                            <SelectItem value="Neutral">Neutral</SelectItem>
                            <SelectItem value="Mixed">Mixed</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
            </div>
        )}
    </div>

    <SliderItem label="Patience During Trade" value={data.patienceLevel} onValueChange={(v) => handleDataChange('patienceLevel', v[0])} minLabel="Impulsive" maxLabel="Patient" />
    <SliderItem label="Sleep Quality Night Before" value={data.sleepQuality} onValueChange={(v) => handleDataChange('sleepQuality', v[0])} minLabel="Poor" maxLabel="Excellent" />
    
    <FormItem label="Other Distractions or Stressors" id="distractions">
        <Input id="distractions" placeholder="e.g., Work, family, etc." value={data.distractions} onChange={(e) => handleDataChange('distractions', e.target.value)} />
    </FormItem>
  </div>
);

// --- Step 4: Review Component ---
const Step4_Review = ({ tradeData, behaviorData, percentageOfSupply }: { tradeData: LocalTradeData, behaviorData: BehaviorData, percentageOfSupply: number }) => {
  const usdValue = (() => {
    const s = parseFloat(tradeData.solInvestment)
    const p = parseFloat(tradeData.solPrice)
    return !isNaN(s) && !isNaN(p) ? (s * p).toFixed(2) : '0'
  })()
  return (
    <div className="space-y-6">
      <ReviewSection title="Trade Details">
        <ReviewItem label="Token" value={`${tradeData.tokenName} ($${tradeData.ticker})`} />
        <ReviewItem label="Token Address" value={tradeData.tokenAddress} />
        <ReviewItem label="Entry Market Cap" value={`$${new Intl.NumberFormat('en-US').format(Number(tradeData.entryMarketCap || '0'))}`} />
        <ReviewItem label="SOL Invested" value={`${tradeData.solInvestment} SOL`} />
        <ReviewItem label="USD Value" value={`$${usdValue}`} />
        <ReviewItem label="Tokens Purchased" value={`${new Intl.NumberFormat('en-US').format(Number(tradeData.tokenQuantity || '0'))}`} />
        <ReviewItem label="Your Ownership" value={`${percentageOfSupply.toFixed(6)}%`} />
      </ReviewSection>
      <ReviewSection title="Psychology & Behavior">
        <ReviewItem label="Entry Sentiment" value={`${behaviorData.entrySentiment}/10`} />
        <ReviewItem label="Fear Level" value={`${behaviorData.fearLevel}/10`} />
        <ReviewItem label="Confidence Level" value={`${behaviorData.confidenceLevel}/10`} />
        <ReviewItem label="State of Mind" value={behaviorData.stateOfMind} />
        <ReviewItem label="Investment Thesis" value={behaviorData.investmentThesis} />
      </ReviewSection>
      <ReviewSection title="Context & Environment">
        <ReviewItem label="Research Time" value={`${behaviorData.researchTime} hours`} />
        <ReviewItem label="Groupthink Influence" value={behaviorData.groupthinkInfluence ? 'Yes' : 'No'} />
        {behaviorData.groupthinkInfluence && <ReviewItem label="Group Sentiment" value={behaviorData.groupSentiment} />}
        <ReviewItem label="Patience Level" value={`${behaviorData.patienceLevel}/10`} />
        <ReviewItem label="Sleep Quality" value={`${behaviorData.sleepQuality}/10`} />
        <ReviewItem label="Distractions" value={behaviorData.distractions} />
      </ReviewSection>
    </div>
  )
};

const SliderItem = ({ label, value, onValueChange, minLabel, maxLabel }: { label: string, value: number, onValueChange: (value: [number]) => void, minLabel: string, maxLabel: string }) => (
  <FormItem label={label} id={label.toLowerCase().replace(/\s+/g, '-')}>
    <div className="px-1">
      <Slider value={[value]} onValueChange={onValueChange} max={10} min={1} step={1} />
      <div className="flex justify-between text-xs text-stone-500 mt-1.5">
        <span>{minLabel}</span>
        <span className="font-semibold text-stone-700">{value}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  </FormItem>
);

const ReviewSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div>
    <h3 className="text-lg font-semibold text-stone-700 mb-3 border-b pb-2">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const ReviewItem = ({ label, value }: { label: string, value: string | number | undefined }) => (
  <div className="flex justify-between items-center text-sm py-1.5">
    <p className="text-stone-600">{label}</p>
    <p className="text-stone-800 font-medium text-right">{value || 'Not provided'}</p>
  </div>
);
