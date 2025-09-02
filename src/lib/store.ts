import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Token, Strategy, BotConfig, HistoryLog, FilterState } from './types';

const MAX_TOKENS = 10000;
const MAX_HISTORY = 500;

interface AppState {
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
  
  // To track which tokens have triggered which strategies
  sentNotifications: Record<string, string[]>; // { [tokenId]: [strategyId1, strategyId2] }
  addSentNotification: (tokenId: string, strategyId: string) => void;

  // Main filter state
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;
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
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      solPrice: 0,
      setSolPrice: (price) => set({ solPrice: price }),

      tokens: [],
      addOrUpdateTokens: (updates: Token[]) => {
        let nextTokens = [...get().tokens];
        updates.forEach((update: Token) => {
          // Destructure to omit protocolDetails and signature
          const { protocolDetails, signature, tokenUri, pairAddress, tokenImage, pairSolAccount, pairTokenAccount, ...restOfTokenUpdate }: any = update;
          
          // Use tokenAddress AND detectedAt for uniqueness
          const existingIndex = nextTokens.findIndex(
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
          }
        });

        // Enforce max length
        if (nextTokens.length >= MAX_TOKENS) {
          nextTokens = nextTokens.slice(0, MAX_TOKENS * 0.8);
        }
        
        set({ tokens: nextTokens.sort((a: any, b: any) => new Date(b.surgeData.detectedAt).getTime() - new Date(a.surgeData.detectedAt).getTime()) });
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
      
      sentNotifications: {},
      addSentNotification: (tokenId, strategyId) => {
        const sent = { ...get().sentNotifications };
        if (!sent[tokenId]) {
          sent[tokenId] = [];
        }
        if (!sent[tokenId].includes(strategyId)) {
          sent[tokenId].push(strategyId);
        }
        set({ sentNotifications: sent });
      },

      filters: initialFilterState,
      setFilters: (filters) => set({ filters }),
      resetFilters: () => set({ filters: initialFilterState }),
    }),
    {
      name: 'axiom-trader-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // A patch to merge the persisted state with the initial state,
      // ensuring new fields are added and not overwritten by old persisted data.
      merge: (persistedState, currentState) => {
        const mergedState = { ...currentState, ...persistedState as Partial<AppState> };
        if (persistedState && typeof persistedState === 'object') {
          // Ensure nested objects like 'filters' are also merged correctly
          mergedState.filters = { ...currentState.filters, ...(persistedState as any).filters };
        }
        return mergedState;
      },
    }
  )
);