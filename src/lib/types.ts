
export interface SurgeData {
  dexPaid: boolean;
  pairAddress: string;
  signature: string;
  tokenAddress: string;
  tokenName: string;
  tokenTicker: string;
  tokenImage: string;
  tokenUri: string;
  tokenDecimals: number;
  pairSolAccount: string;
  pairTokenAccount: string;
  protocol: string;
  protocolDetails: any; // Keeping this generic for now
  createdAt: string;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
  mintAuthority: string | null;
  openTrading: string;
  deployerAddress: string;
  supply: number;
  initialLiquiditySol: number;
  initialLiquidityToken: number;
  top10Holders: number;
  lpBurned: number;
  updatedAt: string;
  freezeAuthority: string | null;
  extra: any | null;
  slot: number;
  transactionCount: number;
  volumeSol: number;
  marketCapSol: number;
  buyCount: number;
  sellCount: number;
  liquiditySol: number;
  liquidityToken: number;
  priceSol: number;
  bondingCurvePercent: number;
  top10HoldersPercent: number;
  devHoldsPercent: number;
  snipersHoldPercent: number;
  insidersHoldPercent: number;
  bundlersHoldPercent: number;
  numHolders: number;
  numBotUsers: number;
  currentRank: number;
  previousRank: number;
  rankJump: number;
  timeTakenSeconds: number;
  detectedAt: string;
  surgedPrice: number;
  // New fields for table display
  priceChange?: number; // 涨幅
  socialLinks?: string[]; // 社交
}

export interface SurgePrice {
  currentPriceSol: number;
  maxSurgedPrice: number;
}

export interface Token {
  surgeData: SurgeData;
  surgePrice: SurgePrice;
  // Info added by our app
  purchaseInfo?: {
    purchased: boolean;
    marketCap: number;
  };
  // For highlighting
  isHighMultiple?: boolean;
}

export interface Strategy {
  id: string;
  name:string;
  priority: number; // 1-5
  botId: string;
  botName?: string; // bot名称
  enabled: boolean;
  amount: number; // 金额
  filters: FilterState;
}

export interface BotConfig {
  id: string;
  name: string;
  apiKey: string;
  chatId: string;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  tokenAddress: string;
  tokenTicker: string;
  strategyName: string;
  marketCapAtTrigger: number;
  content: string;
}

// Represents the state of the main filter form
export interface FilterState {
  ticker?: string;
  marketCapMin?: number;
  marketCapMax?: number;
  highMultiple?: number; // 高倍 (for highlighting)
  priceChange?: number; // 涨幅
  volumeKMin?: number; // 交易量(K)
  volumeKMax?: number;
  totalTxMin?: number; // 交易总数
  totalTxMax?: number;
  platform?: string; // 平台
  bundledMin?: number; // 捆绑
  bundledMax?: number;
  social?: string; // 社交
  useHistoricalData?: boolean; // 使用历史数据
}
