import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- INTERFACES ---
export interface PartialSell {
  id: string;
  date: string;
  amountPercentage: number;
  soldAtMarketCap: number;
  solAmount: number;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
}

export interface ConsecutiveBuy {
  id: string;
  date: string;
  solAmount: number;
  tokenQuantity: number;
  marketCap: number;
}

export interface BehaviorData {
  entrySentiment: number;
  fearLevel: number;
  confidenceLevel: number;
  patienceLevel: number;
  stateOfMind: string;
  researchTime: number;
  investmentThesis: string;
  groupthinkInfluence: boolean;
  groupSentiment: string;
  sleepQuality: number;
  distractions: string;
}

export interface TradeData {
  tokenName: string;
  ticker: string;
  tokenAddress: string;
  solInvestment: string;
  tokenQuantity: number;
  entryMarketCap: number;
  athMarketCap?: number;
  athDate?: string;
  totalSupply: number;
}

export interface Trade extends TradeData {
  id: string;
  entryDate: string;
  status: 'active' | 'completed';
  behavioral: BehaviorData;
  consecutiveBuys: ConsecutiveBuy[];
  partialSells: PartialSell[];
  percentageSold: number;
  remainingSolInvestment: string;
  decisionQuality: number;
  createdAt: string;
  updatedAt: string;
}

export interface TradeReflection {
  id: string;
  tradeId: string;
  reflectionDate: string;
  whatWentWell: string;
  whatCouldBeImproved: string;
  keyMistakes: string[];
  lessonsLearned: string;
  wouldRepeatTrade: 'Yes' | 'No' | 'Maybe';
  alternativeActions: string;
  emotionalStateTags: string[];
  marketConditionTags: string[];
  decisionQuality: number;
}

export interface TradeState {
  trades: Trade[];
  reflections: TradeReflection[];
  currencyPreference: 'USD' | 'SOL';
  setCurrencyPreference: (currency: 'USD' | 'SOL') => void;
  addTrade: (tradeData: TradeData, behaviorData: BehaviorData) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  getTrade: (id: string) => Trade | undefined;
  getActiveTrades: () => Trade[];
  getCompletedTrades: () => Trade[];
  addPartialSell: (tradeId: string, sellData: Omit<PartialSell, 'id' | 'date'>) => void;
  addConsecutiveBuy: (tradeId: string, buyData: Omit<ConsecutiveBuy, 'id' | 'date'>) => void;
  addReflection: (reflection: Omit<TradeReflection, 'id' | 'reflectionDate'>) => void;
  getReflectionByTradeId: (tradeId: string) => TradeReflection | undefined;
  resetStore: () => void;
}

// --- INITIAL STATE ---
const initialState: Pick<TradeState, 'trades' | 'reflections' | 'currencyPreference'> = {
  trades: [],
  reflections: [],
  currencyPreference: 'USD',
};

// --- ZUSTAND STORE ---
export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- ACTIONS ---
      setCurrencyPreference: (currency) => set({ currencyPreference: currency }),

      addTrade: (tradeData, behaviorData) => {
        const now = new Date().toISOString();
        const newTrade: Trade = {
          ...tradeData,
          id: `trade_${Date.now()}`,
          entryDate: now,
          consecutiveBuys: [{
            id: `buy_${Date.now()}`,
            date: now,
            solAmount: parseFloat(tradeData.solInvestment),
            tokenQuantity: tradeData.tokenQuantity,
            marketCap: tradeData.entryMarketCap,
          }],
          status: 'active',
          behavioral: behaviorData,
          partialSells: [],
          percentageSold: 0,
          remainingSolInvestment: tradeData.solInvestment,
          decisionQuality: 0, // Default value
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ trades: [...state.trades, newTrade] }));
      },

      addConsecutiveBuy: (tradeId, buyData) => {
        set((state) => ({
          trades: state.trades.map((trade) => {
            if (trade.id === tradeId) {
              const newBuy: ConsecutiveBuy = {
                ...buyData,
                id: `buy_${Date.now()}`,
                date: new Date().toISOString(),
              };

              const updatedBuys = [...trade.consecutiveBuys, newBuy];

              // Correctly recalculate totals and weighted average entry market cap
              const totalSolInvestment = updatedBuys.reduce((sum, buy) => sum + buy.solAmount, 0);
              const totalTokenQuantity = updatedBuys.reduce((sum, buy) => sum + buy.tokenQuantity, 0);
              
              // The weighted average must be based on token quantity, not SOL amount.
              const weightedMarketCapSum = updatedBuys.reduce((sum, buy) => sum + (buy.marketCap * buy.tokenQuantity), 0);
              const averageEntryMarketCap = totalTokenQuantity > 0 ? weightedMarketCapSum / totalTokenQuantity : 0;

              return {
                ...trade,
                consecutiveBuys: updatedBuys,
                solInvestment: totalSolInvestment.toString(),
                tokenQuantity: totalTokenQuantity,
                entryMarketCap: averageEntryMarketCap,
                updatedAt: new Date().toISOString(),
              };
            }
            return trade;
          }),
        }));
      },

      updateTrade: (id, updates) => {
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === id ? { ...trade, ...updates, updatedAt: new Date().toISOString() } : trade
          ),
        }));
      },

      deleteTrade: (id) => {
        set((state) => ({
          trades: state.trades.filter((trade) => trade.id !== id),
          reflections: state.reflections.filter((reflection) => reflection.tradeId !== id),
        }));
      },

      addPartialSell: (tradeId, sellData) => {
        set((state) => {
          const newTrades = state.trades.map((trade) => {
            if (trade.id === tradeId) {
              const newSell: PartialSell = {
                ...sellData,
                id: `sell-${Date.now()}`,
                date: new Date().toISOString(),
              };

              const updatedSells = [...trade.partialSells, newSell];
              const totalSoldPercentage = updatedSells.reduce((sum, s) => sum + s.amountPercentage, 0);
              const initialSol = parseFloat(trade.solInvestment) || 0;
              const remainingSol = ((100 - totalSoldPercentage) / 100) * initialSol;

              const updatedTrade: Trade = {
                ...trade,
                partialSells: updatedSells,
                percentageSold: totalSoldPercentage,
                remainingSolInvestment: remainingSol.toFixed(4),
                updatedAt: new Date().toISOString(),
              };

              if (totalSoldPercentage >= 100) {
                updatedTrade.status = 'completed';
              }

              return updatedTrade;
            }
            return trade;
          });
          return { ...state, trades: newTrades };
        });
      },

      addReflection: (reflectionData) => {
        const newReflection: TradeReflection = {
          ...reflectionData,
          id: `reflection_${Date.now()}`,
          reflectionDate: new Date().toISOString(),
        };

        set((state) => ({
          reflections: [...state.reflections, newReflection],
          trades: state.trades.map((t) =>
            t.id === reflectionData.tradeId
              ? { ...t, decisionQuality: reflectionData.decisionQuality }
              : t
          ),
        }));
      },

      resetStore: () => {
        set(initialState);
      },

      // --- SELECTORS ---
      getTrade: (id) => get().trades.find((trade) => trade.id === id),
      getActiveTrades: () => get().trades.filter((trade) => trade.status === 'active'),
      getCompletedTrades: () => get().trades.filter((trade) => trade.status === 'completed'),
      getReflectionByTradeId: (tradeId) => get().reflections.find((r) => r.tradeId === tradeId),
    }),
    {
      name: 'memecoin-trades-storage',
    }
  )
);
