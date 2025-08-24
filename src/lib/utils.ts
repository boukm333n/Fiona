import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(2)}B`
  } else if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(2)}M`
  } else if (marketCap >= 1_000) {
    return `$${(marketCap / 1_000).toFixed(2)}K`
  }
  return `$${marketCap.toFixed(2)}`
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function calculateROI(entry: number, exit: number): number {
  return ((exit - entry) / entry) * 100
}

export function calculatePnL(investment: number, currentValue: number): number {
  return currentValue - investment
}

import { Trade } from '@/store/trades';

export function calculateTradePerformance(trade: Trade) {
  const initialInvestment = parseFloat(trade.solInvestment);
  const entryMarketCap = Number(trade.entryMarketCap);

  // Safely handle trades that don't have partialSells array or have empty array
  const partialSells = Array.isArray(trade.partialSells) ? trade.partialSells : [];

  if (isNaN(initialInvestment) || isNaN(entryMarketCap) || entryMarketCap === 0 || partialSells.length === 0) {
    return {
      realizedPnL: 0,
      totalValueFromSells: 0,
      costOfGoodsSold: 0,
      averageSellMultiplier: 0,
      roi: 0,
    };
  }

  let totalValueFromSells = 0;
  let costOfGoodsSold = 0;

  for (const sell of partialSells) {
    const sellMarketCap = Number((sell as any).soldAtMarketCap);
    const percentageOfBag = (sell.amountPercentage || 0) / 100;

    if (isNaN(sellMarketCap) || percentageOfBag <= 0) continue;

    const costOfThisPortion = initialInvestment * percentageOfBag;
    const valueOfThisPortionAtSale = costOfThisPortion * (sellMarketCap / entryMarketCap);

    totalValueFromSells += valueOfThisPortionAtSale;
    costOfGoodsSold += costOfThisPortion;
  }

  const realizedPnL = totalValueFromSells - costOfGoodsSold;
  const averageSellMultiplier = costOfGoodsSold > 0 ? totalValueFromSells / costOfGoodsSold : 0;
  const roi = costOfGoodsSold > 0 ? (realizedPnL / costOfGoodsSold) * 100 : 0;

  return {
    realizedPnL,
    totalValueFromSells,
    costOfGoodsSold,
    averageSellMultiplier,
    roi,
  };
}
