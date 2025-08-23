'use client'

import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { useTradeStore, Trade, ConsecutiveBuy } from '@/store/trades'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const formSchema = z.object({
  solAmount: z.coerce.number().positive({ message: 'Must be a positive number.' }),
  marketCap: z.coerce.number().positive({ message: 'Must be a positive number.' }),
});

type FormData = z.infer<typeof formSchema>;

interface AddConsecutiveBuyDialogProps {
  trade: Trade;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddConsecutiveBuyDialog({ trade, isOpen, onOpenChange }: AddConsecutiveBuyDialogProps) {
  const addConsecutiveBuy = useTradeStore((state) => state.addConsecutiveBuy);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Auto-calculate token quantity based on SOL invested and market cap
      const tokenQuantity = (data.solAmount / data.marketCap) * trade.totalSupply;

      const newBuy: Omit<ConsecutiveBuy, 'id' | 'date'> = {
        solAmount: data.solAmount,
        marketCap: data.marketCap,
        tokenQuantity: tokenQuantity,
      };

      addConsecutiveBuy(trade.id, newBuy);

      toast.success('Added new buy to your position.', {
        description: `Successfully logged a ${data.solAmount} SOL buy for ${trade.tokenName}.`,
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Failed to add consecutive buy:', error);
      toast.error('Failed to add buy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="font-serif">Add Consecutive Buy</DialogTitle>
          <DialogDescription>
            Log an additional buy for your <strong>{trade.tokenName}</strong> position.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="solAmount">SOL Amount</Label>
            <Input id="solAmount" type="number" step="any" {...register('solAmount')} />
            {errors.solAmount && <p className="text-xs text-rose-500">{errors.solAmount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="marketCap">Market Cap at Buy</Label>
            <Input id="marketCap" type="number" step="any" {...register('marketCap')} />
            {errors.marketCap && <p className="text-xs text-rose-500">{errors.marketCap.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Buy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
