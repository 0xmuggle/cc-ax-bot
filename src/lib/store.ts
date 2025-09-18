import { create } from "zustand";
import { persist } from "zustand/middleware";
import { idbStorage } from "./idb-storage";
import {
  Token,
  Strategy,
  BotConfig,
  HistoryLog,
  FilterState,
  SingalItem,
} from "./types";
import {
  applyFiltersToToken,
  calculateMore,
  formatNumber,
} from "./filterUtils";
import { sendToTelegram } from "./telegram";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { calculateSellPrice, formatFilter } from "./utils";

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
  handleBuy: (token: string) => void;
  handleSell: (token: string, onlySell?: boolean) => boolean;

  singalMap: Record<string, SingalItem[]>;
  addSingal: (singal: SingalItem) => void;

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

  handleStrategyMatch: (
    token: Token,
    matchStrategy: Strategy,
    bot: BotConfig,
    solPrice: number,
    internalBuyMc?: number
  ) => boolean;
}

const initialFilterState: FilterState = {
  ticker: "",
  marketCapMin: undefined,
  marketCapMax: undefined,
  highMultiple: 3, // Default 3
  priceChange: undefined,
  volumeKMin: undefined,
  volumeKMax: undefined,
  totalTxMin: undefined,
  totalTxMax: undefined,
  platform: "pump",
  bundledMin: undefined,
  bundledMax: 45,
  social: "",
  top10: 45,
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
  if (proto.endsWith("777")) return "Heaven";
  return proto;
};
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      solPrice: 0,
      setSolPrice: (price) => set({ solPrice: price }),

      singalMap: {},
      addSingal: (singal: SingalItem) => {
        const { singalMap } = get();
        const nextSingal = { ...singalMap };
        if (!nextSingal[singal.tokenAddress]) {
          nextSingal[singal.tokenAddress] = [];
        }
        nextSingal[singal.tokenAddress].push(singal);
        console.log(nextSingal);
        set({
          singalMap: nextSingal,
        });
      },

      tokens: [],
      handleBuy: (tokenAddress) => {
        const { bots, strategies, handleStrategyMatch, tokens, solPrice } = get();
        const matchStrategy = strategies.find((s: any) => s.name === "手动买卖" && s.enabled);
        if (!matchStrategy) {
          toast({
            description: "需配置一个【手动买卖】策略",
          });
          return;
        }
        const bot = bots.find((b) => b.id === matchStrategy.botId);
        const nextTokens = [...tokens];
        let existingIndex = nextTokens.findIndex((t) => t.surgeData.tokenAddress === tokenAddress);
        if (bot && existingIndex > -1) {
          const res = handleStrategyMatch(
            nextTokens[existingIndex],
            matchStrategy,
            bot,
            solPrice
          );
          if (res) {
            nextTokens[existingIndex].buyPrice = nextTokens[existingIndex].surgePrice.currentPriceSol;
            nextTokens[existingIndex].position = 100;
            nextTokens[existingIndex].botId = bot.id;
            nextTokens[existingIndex].buyAt = new Date().toLocaleString();
          } else {
            nextTokens[existingIndex].botId = bot.id;
          }
          set({
            tokens: nextTokens,
          });
        }
      },
      handleSell: (tokenAddress, onlySell = false) => {
        const { bots, tokens, solPrice } = get();
        const nextTokens = [...tokens];
        let existingIndex = nextTokens.findIndex((t) => t.surgeData.tokenAddress === tokenAddress);
        if(existingIndex > -1 && nextTokens[existingIndex].position > 0) {
          const { surgePrice, surgeData, botId, buyPrice, buyAt, afterBuyMaxPrice } = nextTokens[existingIndex];
          const bot = bots.find((b) => b.id === botId);
          if(!bot) {
            toast({
              title: "卖出失败",
              description: "BOT 不存在",
            });
            return false;
          };
          
          // 持仓时长
          const diff = (new Date().getTime() - new Date(buyAt || surgeData.detectedAt).getTime()) / 1000 / 60;
          // 买入涨幅
          const buyGain = surgePrice.currentPriceSol / buyPrice;
          // 当前市值 | 买入市值 | 买后最大市值
          const curMc = surgePrice.currentPriceSol * surgeData.supply * solPrice;
          const buyMc = buyPrice * surgeData.supply * solPrice;
          const maxMc = afterBuyMaxPrice * surgeData.supply * solPrice;
          const log: any = {
            id: uuidv4(), // Use uuidv4
            timestamp: new Date().toLocaleString(),
            tokenAddress: surgeData.tokenAddress,
            tokenTicker: surgeData.tokenTicker,
            marketCapAtTrigger: curMc, // Use raw mc for log
            estimateAtTrigger: curMc,
            strategyName: bot.name,
            amount: buyGain,
            description: `卖出${surgeData.tokenTicker} ${buyGain.toFixed(2)}x 买入:${formatNumber(buyMc)} 当前:${formatNumber(curMc)} 最大:${formatNumber(maxMc)}`
          };
          if(onlySell) {
            log.description = "手动" + log.description;
            log.status = 'sell';
          } else if(buyGain < 0.7) { // 跌70%
            log.description = "止损" + log.description;
            log.status = 'sell';
          } else if(diff > 30 ) { // 超时
            log.description = "超时" + log.description;
            log.status = 'sell';
          } else if(surgePrice.currentPriceSol / afterBuyMaxPrice > 0.5) { // 最大价格回撤 50%
            log.description = "回撤" + log.description;
            log.status = 'sell';
          } else if(buyGain > 1.4) {
            log.description = "止盈" + log.description;
            log.status = 'sell';
          }
          get().addHistoryLog(log);
          if (log.status === 'sell') {
            const [_, command = ""] = bot.name.split("-");
            toast({
              title: "🎉卖出",
              description: log.description,
            });
            sendToTelegram(`${surgeData.tokenAddress}--ON--0--${command}sell--100`, bot.apiKey, bot.chatId);
            if(onlySell) {
              nextTokens[existingIndex].position = 0;
              set({
                tokens: nextTokens,
              })
            }
            return true;
          }
        }
        return false;
      },
      delTokenOne: (token) => {
        const { tokens } = get();
        set({
          tokens: tokens.filter(
            (item) => item.surgeData.tokenAddress !== token
          ),
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
        const nextTokens: Token[] = tokens.map((item) => {
          const surges = item.surges.map((t) => ({
            ...t,
            maxPrice: t.surgePrice.maxSurgedPrice,
          }));
          return {
            ...item,
            surges,
            maxPrice: item.surgePrice.maxSurgedPrice,
          };
        });
        set({
          tokens: nextTokens,
        });
      },
      updateToken: (token: Token, update: Token) => {
        let nextToken: any = { ...token };
        const {
          priceAt1M,
          priceAt2M,
          priceAt5M,
          priceAt10M,
          priceAt15M,
          priceAt30M,
          priceAt3M,
        } = token;
        // 检查是否更新5分钟市值
        const diff =
          (Date.now() - new Date(update.surgeData.detectedAt).getTime()) /
          1000 /
          60;
        if (diff < 2 && diff > 1 && !priceAt1M) {
          nextToken.priceAt1M = update.surgePrice.currentPriceSol;
        } else if (diff < 3 && diff > 2 && !priceAt2M) {
          nextToken.priceAt2M = update.surgePrice.currentPriceSol;
        } else if (diff < 5 && diff > 3 && !priceAt3M) {
          nextToken.priceAt3M = update.surgePrice.currentPriceSol;
        } else if (diff < 10 && diff > 5 && !priceAt5M) {
          nextToken.priceAt5M = update.surgePrice.currentPriceSol;
        } else if (diff < 15 && diff > 10 && !priceAt10M) {
          nextToken.priceAt10M = update.surgePrice.currentPriceSol;
        } else if (diff < 30 && diff > 15 && !priceAt15M) {
          nextToken.priceAt15M = update.surgePrice.currentPriceSol;
        } else if (diff > 30 && !priceAt30M) {
          nextToken.priceAt30M = update.surgePrice.currentPriceSol;
        }
        return {
          ...nextToken,
          ...update,
          maxPrice: Math.max(
            nextToken.maxPrice,
            update.surgePrice.currentPriceSol
          ),
        };
      },
      addOrUpdateTokens: (updates: Token[]) => {
        let {
          tokens,
          strategies: baseStrategies,
          solPrice,
          bots,
          handleSell,
          handleStrategyMatch,
          updateToken,
        } = get();
        let nextTokens = [...tokens];
        const strategies = baseStrategies.filter((item) => item.enabled === true && item.name !== "手动买卖").sort((a, b) => b.priority - a.priority);
        updates.forEach((update: Token) => {
          // Destructure to omit protocolDetails and signature
          const {
            protocolDetails,
            signature,
            tokenUri,
            pairAddress,
            tokenImage,
            pairSolAccount,
            pairTokenAccount,
            ...restOfTokenUpdate
          }: any = update;

          // Use tokenAddress AND detectedAt for uniqueness
          let existingIndex = nextTokens.findIndex((t) => t.surgeData.tokenAddress === restOfTokenUpdate.surgeData.tokenAddress);
          if (existingIndex > -1) {
            const { surges = [], ...token } = nextTokens[existingIndex];
            if (token.surgeData.detectedAt === restOfTokenUpdate.surgeData.detectedAt) {
              // 更新数据
              nextTokens[existingIndex] = updateToken(
                nextTokens[existingIndex],
                update
              );
            } else {
              const innerIndex = surges.findIndex((t) => t.surgeData.detectedAt === restOfTokenUpdate.surgeData.detectedAt);
              if (innerIndex > -1) {
                // 更新数据
                nextTokens[existingIndex].surges[innerIndex] = updateToken(nextTokens[existingIndex].surges[innerIndex], update);
              } else {
                // 追加新数据
                nextTokens[existingIndex].surges.unshift({ ...restOfTokenUpdate, maxPrice: restOfTokenUpdate.surgePrice.currentPriceSol });
              }
            }
          } else {
            nextTokens.unshift({ ...restOfTokenUpdate, maxPrice: restOfTokenUpdate.surgePrice.currentPriceSol, surges: [] });
            existingIndex = 0;
          }
          // 检查是否命中策略
          if (!nextTokens[existingIndex].botId && strategies.length > 0) {
            let matchStrategy: Strategy | null = null;
            // Find the highest priority matching strategy that hasn't sent a notification for this token
            for (const strategy of strategies) {
              // Apply strategy filters including the new time-based condition
              const isMatch = applyFiltersToToken(
                nextTokens[existingIndex],
                formatFilter(strategy.filters),
                solPrice,
                true
              );
              if (isMatch) {
                matchStrategy = strategy;
                // Since strategies are sorted by priority, the first match is the best
                break;
              }
            }
            if (matchStrategy) {
              const bot = bots.find((b) => b.id === matchStrategy.botId);
              if (bot) {
                const { internalBuyMc } = calculateMore(nextTokens[existingIndex], matchStrategy.filters, solPrice);
                const res = handleStrategyMatch(
                  nextTokens[existingIndex],
                  matchStrategy,
                  bot,
                  solPrice,
                  internalBuyMc
                );
                if (res) {
                  nextTokens[existingIndex].buyPrice = nextTokens[existingIndex].surgePrice.currentPriceSol;
                  nextTokens[existingIndex].position = 100;
                  nextTokens[existingIndex].botId = bot.id;
                  nextTokens[existingIndex].buyAt = new Date().toLocaleString();
                  nextTokens[existingIndex].afterBuyMaxPrice = nextTokens[existingIndex].surgePrice.currentPriceSol;
                } else {
                  nextTokens[existingIndex].botId = bot.id;
                }
              }
            }
          } else if (nextTokens[existingIndex].botId) {
            nextTokens[existingIndex].afterBuyMaxPrice = Math.max(nextTokens[existingIndex].afterBuyMaxPrice, nextTokens[existingIndex].surgePrice.currentPriceSol);
            const res = handleSell(nextTokens[existingIndex].surgeData.tokenAddress);
            if(res) {
              nextTokens[existingIndex].position = 0;
            }
          }
        });

        // Enforce max length
        // Enforce max length
        if (nextTokens.length >= MAX_TOKENS) {
          nextTokens = nextTokens.slice(0, MAX_TOKENS * 0.8);
        }

        set({
          tokens: nextTokens.sort(
            (a: any, b: any) =>
              new Date(b.surgeData.detectedAt).getTime() -
              new Date(a.surgeData.detectedAt).getTime()
          ),
        });
      },
      clearTokens: () => set({ tokens: [] }),

      // Helper function to handle strategy match logic
      handleStrategyMatch: (
        token: Token,
        matchStrategy: Strategy,
        bot: BotConfig,
        solPrice: number,
        internalBuyMc: number = 0,
      ) => {
        const { surgeData, surgePrice, maxPrice } = token;
        const mc = surgePrice.currentPriceSol * surgeData.supply * solPrice;
        const buyMc = internalBuyMc ? internalBuyMc : mc;
        const maxMc = maxPrice * surgeData.supply * solPrice;

        const log: any = {
          id: uuidv4(),
          timestamp: new Date().toLocaleString(),
          tokenAddress: surgeData.tokenAddress,
          tokenTicker: surgeData.tokenTicker,
          marketCapAtTrigger: mc,
          estimateAtTrigger: buyMc,
          amount: matchStrategy.amount,
          strategyName: matchStrategy.name,
          status: 'buy',
        };
        if(mc < 12_000) {
          log.description = `命中策略【${matchStrategy.name}】未买入 买入市值(${formatNumber(mc)})低于12K`;
          log.status = 'no';
        } else if(buyMc * 1.32 < mc) {
          log.description = `命中策略【${matchStrategy.name}】未买入 买入市值(${formatNumber(mc)})大于预估市值${formatNumber(buyMc*1.32)}`;
          log.status = 'no';
        } else if(maxMc / mc > 1.81) { // 从最高点回落的不买
          log.description = `命中策略【${matchStrategy.name}】未买入 最大市值${formatNumber(maxMc)}大于买入市值(${formatNumber(mc)}) ${(maxMc / mc).toFixed(2)}x`
          log.status = 'no';
        }
        if(log.status === 'no') {
          get().addHistoryLog(log);
          toast({
            title: "😭未买入",
            description: log.description,
          });
          return false;
        }
        log.description = `命中策略【${matchStrategy.name}】买入${surgeData.tokenTicker} ${matchStrategy.amount}SOL`;
        toast({
          title: "🎉买入",
          description: log.description,
        });
        const [_, command = ""] = matchStrategy.name.split("-");
        sendToTelegram(
          `${surgeData.tokenAddress}--ON--${((buyMc * 1.15) /1000).toFixed(2)}--${command}buy--${matchStrategy.amount}`,
          bot.apiKey,
          bot.chatId
        ).then(() => {
          get().addHistoryLog(log);
        }).catch((error) => {
          console.error(`Failed to send Telegram notification for ${surgeData.tokenTicker}:`,error);
        })
        return true;
      },

      strategies: [],
      addStrategy: (strategy) =>
        set((state) => ({ strategies: [...state.strategies, strategy] })),
      updateStrategy: (strategyUpdate) =>
        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === strategyUpdate.id ? strategyUpdate : s
          ),
        })),
      deleteStrategy: (strategyId) =>
        set((state) => ({
          strategies: state.strategies.filter((s) => s.id !== strategyId),
        })),

      bots: [],
      addBot: (bot) => set((state) => ({ bots: [...state.bots, bot] })),
      updateBot: (botUpdate) =>
        set((state) => ({
          bots: state.bots.map((b) => (b.id === botUpdate.id ? botUpdate : b)),
        })),
      deleteBot: (botId) =>
        set((state) => ({
          bots: state.bots.filter((b) => b.id !== botId),
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
      name: "axiom-trader-storage",
      storage: idbStorage,
      partialize: (state) => ({
        solPrice: state.solPrice,
        strategies: state.strategies,
        bots: state.bots,
        history: state.history,
        filters: state.filters,
        tokens: state.tokens,
        singalMap: state.singalMap,
      }),
    }
  )
);
