import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbStorage } from './idb-storage';
import { Token, Strategy, BotConfig, HistoryLog, FilterState } from './types';
import { applyFiltersToToken, calculateMore, formatNumber } from './filterUtils';
import { sendToTelegram } from './telegram';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { calculateSellPrice, formatFilter } from './utils';

const MAX_TOKENS = 10000;
const MAX_HISTORY = 5000;

interface AppState {
  clearTokens(): void;
  solPrice: number;
  setSolPrice: (price: number) => void;

  tokens: Token[];
  delTokenOne: (adress: string) => void;
  addOrUpdateTokens: (tokens: Token[]) => void;
  updateData: () => void;
  updateToken: (token: Token, update: Token) => Token;

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

  handleStrategyMatch: (token: Token, matchStrategy: Strategy, bot: BotConfig, solPrice: number) => boolean;
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
  platform: 'pump',
  bundledMin: undefined,
  bundledMax: 40,
  social: '',
  top10: 40,
  devHolding: 10,
  onlyRise: false,
  marketCap1MMin: undefined,
  marketCap1MMax: undefined,
  marketCap2MMin: undefined,
  marketCap2MMax: undefined,
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
};
export const formatProto = (token: string) => {
  const proto = token.slice(token.length - 4).toLowerCase();
  if(proto.endsWith('777')) return 'Heaven';
  return proto;
  if(['pump', 'bags', 'bonk', 'moon'].includes(proto)) return proto;
  return '未知';
}
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      solPrice: 0,
      setSolPrice: (price) => set({ solPrice: price }),

      tokens: [],
      delTokenOne: (token) => {
        const { tokens } = get();
        set({ 
          tokens: tokens.filter(item => item.surgeData.tokenAddress !== token)
        });
      },
      updateData: () => {
        const { tokens } = get();
        // tokens.reverse().forEach(item => {
        //   const index = nextTokens.findIndex(t => t.surgeData.tokenAddress === item.surgeData.tokenAddress);
        //   if(index > -1) {
        //     const innerIndex = nextTokens[index].surges.findIndex(t => t.surgeData.detectedAt === item.surgeData.detectedAt);
        //     if(innerIndex === -1) {
        //       nextTokens[index].surges.unshift(item);
        //     }
        //   } else {
        //     nextTokens.push({
        //       ...item,
        //       surges: [],
        //     })
        //   }
        // });
        const nextTokens: Token[] = tokens.map(item => {
          const surges = item.surges.map((t => ({
            ...t,
            maxPrice: t.surgePrice.maxSurgedPrice,
          })));
          return {
            ...item,
            surges,
            maxPrice: item.surgePrice.maxSurgedPrice,
          }
        })
        set({ 
          tokens: nextTokens
        });
      },
      updateToken: (token: Token, update: Token) => {
        let nextToken: any = { ...token };
        const { priceAt1M, priceAt2M, priceAt5M, priceAt10M, priceAt15M, priceAt30M, priceAt3M } = token;
        // 检查是否更新5分钟市值
        const diff = (Date.now() - new Date(update.surgeData.detectedAt).getTime()) / 1000 / 60;
        if(diff < 2 && diff > 1 && !priceAt1M) {
          nextToken.priceAt1M = update.surgePrice.currentPriceSol;
        } else if(diff < 3 && diff > 2 && !priceAt2M) {
          nextToken.priceAt2M = update.surgePrice.currentPriceSol;
        } else if(diff < 5 && diff > 3 && !priceAt3M) {
          nextToken.priceAt3M = update.surgePrice.currentPriceSol;
        } else if(diff < 10 && diff > 5 && !priceAt5M) {
          nextToken.priceAt5M = update.surgePrice.currentPriceSol;
        } else if(diff < 15 && diff > 10 && !priceAt10M) {
          nextToken.priceAt10M = update.surgePrice.currentPriceSol;
        } else if(diff < 30 && diff > 15 && !priceAt15M) {
          nextToken.priceAt15M = update.surgePrice.currentPriceSol;
        }else if(diff > 30 && !priceAt30M) {
          nextToken.priceAt30M = update.surgePrice.currentPriceSol;
        } 
        return {
          ...nextToken,
          ...update,
          maxPrice: Math.max(nextToken.maxPrice, update.surgePrice.currentPriceSol),
        };
      },
      addOrUpdateTokens: (updates: Token[]) => {
        let { tokens, strategies: baseStrategies, solPrice, bots, addHistoryLog, handleStrategyMatch, updateToken } = get();
        let nextTokens = [...tokens];
        const strategies = baseStrategies.filter(item => item.enabled === true).sort((a, b) => b.priority - a.priority);
        updates.forEach((update: Token) => {
          // Destructure to omit protocolDetails and signature
          const { protocolDetails, signature, tokenUri, pairAddress, tokenImage, pairSolAccount, pairTokenAccount, ...restOfTokenUpdate }: any = update;
          
          // Use tokenAddress AND detectedAt for uniqueness
          let existingIndex = nextTokens.findIndex(t => t.surgeData.tokenAddress === restOfTokenUpdate.surgeData.tokenAddress);
          if (existingIndex > -1) {
            const { surges = [], ...token} = nextTokens[existingIndex];
            if(token.surgeData.detectedAt === restOfTokenUpdate.surgeData.detectedAt) {
              // 更新数据
              nextTokens[existingIndex] = updateToken(nextTokens[existingIndex], update);
            } else {
              const innerIndex = surges.findIndex(t => t.surgeData.detectedAt === restOfTokenUpdate.surgeData.detectedAt);
              if(innerIndex > -1) {
                // 更新数据
                nextTokens[existingIndex].surges[innerIndex] = updateToken(nextTokens[existingIndex].surges[innerIndex], update);
              } else {
                // 追加新数据
                nextTokens[existingIndex].surges.unshift({
                  ...restOfTokenUpdate,
                  maxPrice: restOfTokenUpdate.surgePrice.currentPriceSol,
                });
              }
            }
          } else {
            nextTokens.unshift({
              ...restOfTokenUpdate,
              maxPrice: restOfTokenUpdate.surgePrice.currentPriceSol,
              surges: [],
            });
            existingIndex = 0;
          }
          // 检查是否命中策略
          if(!nextTokens[existingIndex].botId && strategies.length > 0) {
            let matchStrategy: Strategy | null = null;
            // Find the highest priority matching strategy that hasn't sent a notification for this token
            for (const strategy of strategies) {
              // Apply strategy filters including the new time-based condition
              const isMatch = applyFiltersToToken(nextTokens[existingIndex], formatFilter(strategy.filters), solPrice, true);
              if (isMatch) {
                matchStrategy = strategy;
                // Since strategies are sorted by priority, the first match is the best
                break;
              }
            }
            if (matchStrategy) {
               const bot = bots.find(b => b.id === matchStrategy.botId);
               if(bot) {
                const res = handleStrategyMatch(nextTokens[existingIndex], matchStrategy, bot, solPrice);
                if(res) {
                  nextTokens[existingIndex].buyPrice = nextTokens[existingIndex].surgePrice.currentPriceSol;
                  nextTokens[existingIndex].position = 100;
                  nextTokens[existingIndex].botId = bot.id;
                  nextTokens[existingIndex].buyAt = new Date().toLocaleString();
                } else {
                  nextTokens[existingIndex].botId = bot.id;
                }
               }
            }
          } else if(nextTokens[existingIndex].position > 0) {
            const { surgePrice, surgeData, botId, buyPrice, buyAt, maxPrice } = nextTokens[existingIndex];
            const buyGain = surgePrice.currentPriceSol / buyPrice;
            const diff = (new Date().getTime() - new Date(buyAt || surgeData.detectedAt).getTime()) / 1000 / 60; 
            const maxMc = maxPrice * surgeData.supply * solPrice;
            const curMc = surgePrice.currentPriceSol * surgeData.supply * solPrice;
            const buyMc = buyPrice * surgeData.supply * solPrice;
            const sellMc = calculateSellPrice(maxMc);
            const bot = bots.find(b => b.id === botId);
            const [_, command = ''] = (bot?.name || '').split('-');
            console.log(curMc, sellMc);
            // 回撤
            let description = '';
            if(diff > 30 && buyGain < 3) {
              description = `卖出${surgeData.tokenTicker} ${buyGain.toFixed(2)}x 持仓时间大于30分钟  买入:${formatNumber(buyMc)} 当前:${formatNumber(curMc)} 最大:${formatNumber(maxMc)}`;
            } else if(buyGain < 0.65) {
              description = `卖出${surgeData.tokenTicker} ${buyGain.toFixed(2)}x 止损 买入:${formatNumber(buyMc)} 当前:${formatNumber(curMc)} 最大:${formatNumber(maxMc)}`;
            } else if(curMc <= sellMc && buyGain > 0.7) {
              description = `卖出${surgeData.tokenTicker} ${buyGain.toFixed(2)}x 回撤 买入:${formatNumber(buyMc)} 当前:${formatNumber(curMc)} 最大:${formatNumber(maxMc)}`;
            }
            if(description) {
               if(bot) {
                toast({
                  title: "🎉卖出",
                  description,
                })
                sendToTelegram(`${surgeData.tokenAddress}--ON--0--${command}sell--100`, bot.apiKey, bot.chatId)
                .then(() => {
                  const log = {
                    id: uuidv4(), // Use uuidv4
                    timestamp: new Date().toLocaleString(),
                    tokenAddress: surgeData.tokenAddress,
                    tokenTicker: surgeData.tokenTicker,
                    marketCapAtTrigger: curMc, // Use raw mc for log
                    estimateAtTrigger: curMc,
                    strategyName: "回撤",
                    description,
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
        // Enforce max length
        if (nextTokens.length >= MAX_TOKENS) {
          nextTokens = nextTokens.slice(0, MAX_TOKENS * 0.8);
        }
        
        set({ 
          tokens: nextTokens.sort((a: any, b: any) => new Date(b.surgeData.detectedAt).getTime() - new Date(a.surgeData.detectedAt).getTime()),
        });
      },
      clearTokens: () => set({ tokens: [] }),

      // Helper function to handle strategy match logic
      handleStrategyMatch: (token: Token, matchStrategy: Strategy, bot: BotConfig, solPrice: number) => {
        const { surgePrice, surgeData, maxPrice } = token;
        let { internalBuyMc } = calculateMore(token, matchStrategy.filters, solPrice);
        const mc = surgePrice.currentPriceSol * surgeData.supply * solPrice;
        const maxMc = maxPrice * surgeData.supply * solPrice;
        if(internalBuyMc * 1.2 < mc) {
          const description = `命中策略【${matchStrategy.name}】未买入 买入市值(${formatNumber(mc)})大于预估市值${formatNumber(internalBuyMc*1.2)}`
          const log = {
            id: uuidv4(),
            timestamp: new Date().toLocaleString(),
            tokenAddress: surgeData.tokenAddress,
            tokenTicker: surgeData.tokenTicker,
            marketCapAtTrigger: mc,
            estimateAtTrigger: internalBuyMc,
            strategyName: matchStrategy.name,
            description: description
          };
          get().addHistoryLog(log);
          toast({
            title: "😭未买入",
            description: description,
          });
          return false;
        }
        if(maxMc / mc > 1.694) {
          const description = `命中策略【${matchStrategy.name}】未买入 最大市值${formatNumber(maxMc)}大于买入市值(${formatNumber(mc)}) ${(maxMc / mc).toFixed(2)}x`
          const log = {
            id: uuidv4(),
            timestamp: new Date().toLocaleString(),
            tokenAddress: surgeData.tokenAddress,
            tokenTicker: surgeData.tokenTicker,
            marketCapAtTrigger: mc,
            estimateAtTrigger: internalBuyMc,
            strategyName: matchStrategy.name,
            description: description
          };
          get().addHistoryLog(log);
          toast({
            title: "😭未买入",
            description: description,
          });
          return false;
        }
        const description = `命中策略【${matchStrategy.name}】买入${surgeData.tokenTicker} ${matchStrategy.amount}SOL`;
        toast({
          title: "🎉买入",
          description: description,
        });
        const [_,command = ''] = matchStrategy.name.split('-');
        sendToTelegram(`${surgeData.tokenAddress}--ON--${(internalBuyMc * 1.2 / 1000).toFixed(2)}--${command}buy--${matchStrategy.amount}`, bot.apiKey, bot.chatId)
          .then(() => {
            const log = {
              id: uuidv4(),
              timestamp: new Date().toLocaleString(),
              tokenAddress: surgeData.tokenAddress,
              tokenTicker: surgeData.tokenTicker,
              marketCapAtTrigger: mc,
              estimateAtTrigger: internalBuyMc,
              strategyName: matchStrategy.name,
              description,
            };
            get().addHistoryLog(log);
          })
          .catch(error => {
            console.error(`Failed to send Telegram notification for ${surgeData.tokenTicker}:`, error);
          });
        return true;
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