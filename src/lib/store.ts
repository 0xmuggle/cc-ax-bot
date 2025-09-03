import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import { Token, Strategy, BotConfig, HistoryLog, FilterState } from './types';
import { applyFiltersToToken } from './filterUtils';
import { sendToTelegram } from './telegram';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const MAX_TOKENS = 100000;
const MAX_HISTORY = 5000;

interface AppState {
  clearTokens(): void;
  solPrice: number;
  setSolPrice: (price: number) => void;

  tokens: Token[];
  addOrUpdateTokens: (tokens: Token[]) => void;

  strategies: Strategy[];
  addStrategy: (strategy: Strategy) => void;
  updateStrategy: (strategy: Strategy) => void;
  deleteStrategy: (strategyId: string) => void;

  bots: BotConfig[];
  addBot: (bot: BotConfig) => void;
  updateBot: (bot: BotConfig) => void;
  deleteBot: (botId: string) => void;

  history: HistoryLog[];
  addHistoryLog: (log: HistoryLog) => void;

  // Main filter state
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;

  handleStrategyMatch: (token: Token, matchStrategy: Strategy, bot: BotConfig, solPrice: number) => void;
}

const initialFilterState: FilterState = {
  ticker: '',
  marketCapMin: undefined,
  marketCapMax: undefined,
  highMultiple: 3, // Default 3
  priceChange: undefined,
  volumeKMin: undefined,
  volumeKMax: undefined,
  totalTxMin: undefined,
  totalTxMax: undefined,
  platform: '',
  bundledMin: undefined,
  bundledMax: undefined,
  social: '',
  useHistoricalData: false, // Default false
  marketCap3MMin: undefined,
  marketCap3MMax: undefined,
  marketCap5MMin: undefined,
  marketCap5MMax: undefined,
  marketCap10MMin: undefined,
  marketCap10MMax: undefined,
  marketCap15MMin: undefined,
  marketCap15MMax: undefined,
  marketCap30MMin: undefined,
  marketCap30MMax: undefined,
  dexPaid: undefined,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      solPrice: 0,
      setSolPrice: (price) => set({ solPrice: price }),

      tokens: [],
      addOrUpdateTokens: (updates: Token[]) => {
        let { tokens, strategies: baseStrategies, solPrice, bots, addHistoryLog, handleStrategyMatch } = get();
        let nextTokens = [...tokens];
        const strategies = baseStrategies.filter(item => item.enabled === true).sort((a, b) => b.priority - a.priority);
        updates.forEach((update: Token) => {
          // Destructure to omit protocolDetails and signature
          const { protocolDetails, signature, tokenUri, pairAddress, tokenImage, pairSolAccount, pairTokenAccount, ...restOfTokenUpdate }: any = update;
          
          // Use tokenAddress AND detectedAt for uniqueness
          let existingIndex = nextTokens.findIndex(
            t => t.surgeData.tokenAddress === restOfTokenUpdate.surgeData.tokenAddress &&
                t.surgeData.detectedAt === restOfTokenUpdate.surgeData.detectedAt
          );
          if (existingIndex > -1) {
            let update: any = {};
            const { priceAt5M, priceAt10M, priceAt15M, priceAt30M, priceAt3M } = nextTokens[existingIndex];
            
            // 检查是否更新5分钟市值
            const diff = (Date.now() - new Date(restOfTokenUpdate.surgeData.detectedAt).getTime()) / 1000 / 60;
            if(diff < 5 && diff > 3 && !priceAt3M) {
              update.priceAt3M = restOfTokenUpdate.surgePrice.currentPriceSol;
            } else if(diff < 10 && diff > 5 && !priceAt5M) {
              update.priceAt5M = restOfTokenUpdate.surgePrice.currentPriceSol;
            } else if(diff < 15 && diff > 10 && !priceAt10M) {
              update.priceAt10M = restOfTokenUpdate.surgePrice.currentPriceSol;
            } else if(diff < 30 && diff > 15 && !priceAt15M) {
              update.priceAt15M = restOfTokenUpdate.surgePrice.currentPriceSol;
            }else if(diff > 30 && !priceAt30M) {
              update.priceAt30M = restOfTokenUpdate.surgePrice.currentPriceSol;
            } 
            nextTokens[existingIndex] = {
              ...update,
              ...nextTokens[existingIndex],
              ...restOfTokenUpdate,
            };
          } else {
            nextTokens.unshift(restOfTokenUpdate);
            existingIndex = 0;
          }
          // 检查是否命中策略
          if(!nextTokens[existingIndex].buyPrice && strategies.length > 0) {
            let matchStrategy: Strategy | null = null;
            // Find the highest priority matching strategy that hasn't sent a notification for this token
            for (const strategy of strategies) {
              // Apply strategy filters including the new time-based condition
              const isMatch = applyFiltersToToken(nextTokens[existingIndex], strategy.filters, solPrice, true);

              if (isMatch) {
                matchStrategy = strategy;
                // Since strategies are sorted by priority, the first match is the best
                break;
              }
            }
            if (matchStrategy) {
               const bot = bots.find(b => b.id === matchStrategy.botId);
               if(bot) {
                handleStrategyMatch(nextTokens[existingIndex], matchStrategy, bot, solPrice);
                nextTokens[existingIndex].buyPrice = nextTokens[existingIndex].surgePrice.currentPriceSol;
                nextTokens[existingIndex].position = 100;
                nextTokens[existingIndex].botId = bot.id;
               }
            }
          } else if(nextTokens[existingIndex].position > 0) {
            const { surgePrice, surgeData, buyPrice, botId } = nextTokens[existingIndex];
            const buyGain = surgePrice.currentPriceSol / buyPrice;
            const maxGain = surgePrice.maxSurgedPrice / buyPrice;
            // 回撤
            if(maxGain > 2 && buyGain < 1.8) {
               const bot = bots.find(b => b.id === botId);
               if(bot) {
                // Toast 通知
                const description = `价格回撤卖出${surgeData.tokenTicker}`;
                toast({
                  title: "🎉卖出",
                  description,
                })
                const mc = surgePrice.currentPriceSol * surgeData.supply * solPrice;
                sendToTelegram(`${surgeData.tokenAddress}--ON--0--sell--100`, bot.apiKey, bot.chatId)
                .then(() => {
                  const log = {
                    id: uuidv4(), // Use uuidv4
                    timestamp: new Date().toLocaleString(),
                    tokenAddress: surgeData.tokenAddress,
                    tokenTicker: surgeData.tokenTicker,
                    marketCapAtTrigger: mc, // Use raw mc for log
                    strategyName: "回撤"
                  }
                  addHistoryLog(log); // Add to history
                })
                .catch(error => {
                  console.error(`Failed to send Telegram notification for ${surgeData.tokenTicker}:`, error);
                });
                nextTokens[existingIndex].position = 0;
               }
            }
          }
        });

        // Enforce max length
        if (nextTokens.length >= MAX_TOKENS) {
          nextTokens = nextTokens.slice(0, MAX_TOKENS * 0.8);
        }
        
        set({ 
          tokens: nextTokens.sort((a: any, b: any) => new Date(b.surgeData.detectedAt).getTime() - new Date(a.surgeData.detectedAt).getTime())
        });
      },
      clearTokens: () => set({ tokens: [] }),

      // Helper function to handle strategy match logic
      handleStrategyMatch: (token: Token, matchStrategy: Strategy, bot: BotConfig, solPrice: number) => {
        const { surgePrice, surgeData } = token;
        const mc = surgePrice.currentPriceSol * surgeData.supply * solPrice;
        const description = `命中策略【${matchStrategy.name}】买入${surgeData.tokenTicker} ${matchStrategy.amount}SOL`;

        toast({
          title: "🎉买入",
          description: description,
        });

        sendToTelegram(`${surgeData.tokenAddress}--ON--${(mc * 1.2 / 1000).toFixed(2)}--buy--${matchStrategy.amount}`, bot.apiKey, bot.chatId)
          .then(() => {
            const log = {
              id: uuidv4(),
              timestamp: new Date().toLocaleString(),
              tokenAddress: surgeData.tokenAddress,
              tokenTicker: surgeData.tokenTicker,
              marketCapAtTrigger: mc,
              strategyName: matchStrategy.name,
            };
            get().addHistoryLog(log);
          })
          .catch(error => {
            console.error(`Failed to send Telegram notification for ${surgeData.tokenTicker}:`, error);
          });
      },

      strategies: [],
      addStrategy: (strategy) => set((state) => ({ strategies: [...state.strategies, strategy] })),
      updateStrategy: (strategyUpdate) => set((state) => ({
        strategies: state.strategies.map(s => s.id === strategyUpdate.id ? strategyUpdate : s)
      })),
      deleteStrategy: (strategyId) => set((state) => ({
        strategies: state.strategies.filter(s => s.id !== strategyId)
      })),

      bots: [],
      addBot: (bot) => set((state) => ({ bots: [...state.bots, bot] })),
      updateBot: (botUpdate) => set((state) => ({
        bots: state.bots.map(b => b.id === botUpdate.id ? botUpdate : b)
      })),
      deleteBot: (botId) => set((state) => ({
        bots: state.bots.filter(b => b.id !== botId)
      })),

      history: [],
      addHistoryLog: (log) => {
        const history = [log, ...get().history];
        // Enforce max length
        if (history.length > MAX_HISTORY) {
          history.pop();
        }
        set({ history });
      },

      filters: initialFilterState,
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: initialFilterState }),
    }),
    {
      name: 'axiom-trader-storage',
      storage: idbStorage,
      partialize: (state) => ({
        solPrice: state.solPrice,
        strategies: state.strategies,
        bots: state.bots,
        history: state.history,
        filters: state.filters,
        tokens: state.tokens,
      }),
    }
  )
);