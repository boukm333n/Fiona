'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTradeStore, Trade, PartialSell } from '@/store/trades';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddPartialSellDialogProps {
  trade: Trade;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddPartialSellDialog({ trade, isOpen, onOpenChange }: AddPartialSellDialogProps) {
  const [soldAtMarketCap, setSoldAtMarketCap] = useState('');
  const [amountPercentage, setAmountPercentage] = useState(10);
  const [solAmount, setSolAmount] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>('Afternoon');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addPartialSell = useTradeStore((state) => state.addPartialSell);
  const router = useRouter();

  const remainingPercentage = 100 - trade.percentageSold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!soldAtMarketCap || parseFloat(soldAtMarketCap) <= 0) {
      toast.error('Please enter a valid exit market cap.');
      return;
    }
    if (solAmount && parseFloat(solAmount) < 0) {
      toast.error('Please enter a valid SOL amount received.');
      return;
    }
    if (amountPercentage <= 0 || amountPercentage > remainingPercentage) {
      toast.error(`Please enter a percentage between 0 and ${remainingPercentage.toFixed(2)}%.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const sellData: Omit<PartialSell, 'id' | 'date'> = {
        soldAtMarketCap: parseFloat(soldAtMarketCap),
        amountPercentage,
        solAmount: parseFloat(solAmount || '0'),
        timeOfDay,
      };

            addPartialSell(trade.id, sellData);
      toast.success('Partial sell logged successfully!');

      const newTotalSold = trade.percentageSold + amountPercentage;
      if (newTotalSold >= 100) {
        router.push(`/trades/reflect?tradeId=${trade.id}`);
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('Failed to log partial sell. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!trade || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-stone-800">Log Partial Sell</DialogTitle>
          <DialogDescription className="text-stone-600">
            Record a partial sale for your position in {trade.ticker}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="marketCap" className="text-right text-stone-600">
                Exit Market Cap
              </Label>
              <Input
                id="marketCap"
                value={soldAtMarketCap}
                onChange={(e) => setSoldAtMarketCap(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 1500000 for $1.5M"
                type="number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="solAmount" className="text-right text-stone-600">
                SOL Received
              </Label>
              <Input
                id="solAmount"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 10.5"
                type="number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeOfDay" className="text-right text-stone-600">
                Time of Day
              </Label>
              <Select value={timeOfDay} onValueChange={setTimeOfDay as any}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Morning">Morning</SelectItem>
                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                  <SelectItem value="Evening">Evening</SelectItem>
                  <SelectItem value="Night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2 text-stone-600">
                % of Bag
              </Label>
              <div className="col-span-3">
                <Slider
                  value={[amountPercentage]}
                  onValueChange={(value) => setAmountPercentage(value[0])}
                  max={remainingPercentage}
                  step={1}
                />
                <div className="text-center mt-2 font-medium text-stone-800">
                  {amountPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-stone-800 text-white hover:bg-stone-700">
              {isSubmitting ? 'Saving...' : 'Save Sell'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
