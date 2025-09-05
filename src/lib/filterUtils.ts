import { formatProto } from './store';
import { Token, FilterState } from './types';

export const calculateMore = (tokenInfo: Token, filters:FilterState, solPrice: number) => {
  let { surges, ...token } = tokenInfo;
  const currentMarketCapUSD =
    tokenInfo.surgePrice.currentPriceSol * tokenInfo.surgeData.supply * solPrice;
  const surgedMarketCapUSD =
    tokenInfo.surgeData.surgedPrice * tokenInfo.surgeData.supply * solPrice;

  if(filters.singal && surges.length > 0) {
    token = {...surges[surges.length - 1]};
  }
  const {
    surgeData,
    surgePrice,
    priceAt1M,
    priceAt2M,
    priceAt5M,
    priceAt10M,
    priceAt15M,
    priceAt30M,
    priceAt3M,
  }: any = token;

  const baseMc = surgeData.surgedPrice * surgeData.supply * solPrice;
  const priceAt1mMc = priceAt1M
    ? priceAt1M * surgeData.supply * solPrice
    : 0;
  const priceAt2mMc = priceAt2M
    ? priceAt2M * surgeData.supply * solPrice
    : 0;
  const priceAt3mMc = priceAt3M
    ? priceAt3M * surgeData.supply * solPrice
    : 0;
  const priceAt5mMc = priceAt5M
    ? priceAt5M * surgeData.supply * solPrice
    : 0;
  const priceAt10mMc = priceAt10M
    ? priceAt10M * surgeData.supply * solPrice
    : 0;
  const priceAt15mMc = priceAt15M
    ? priceAt15M * surgeData.supply * solPrice
    : 0;
  const priceAt30mMc = priceAt30M
    ? priceAt30M * surgeData.supply * solPrice
    : 0;
  let mc = 0;
  let buyMc = 0;
  let pChange = 0;
  let internal = filters.priceChange;
  if(filters.singal) {
     buyMc = baseMc;
     pChange = surgePrice.maxSurgedPrice * surgeData.supply * solPrice / buyMc;
  } else {
    mc = baseMc;
    if(filters.marketCap15MMax) mc = priceAt15mMc;
    if(filters.marketCap10MMax) mc = priceAt10mMc;
    if(filters.marketCap5MMax) mc = priceAt5mMc;
    if(filters.marketCap3MMax) mc = priceAt3mMc;
    if(filters.marketCap2MMax) mc = priceAt2mMc;
    if(filters.marketCap1MMax) mc = priceAt1mMc;
    if(!internal) internal = 1;
    buyMc = Math.max(baseMc * internal, mc || baseMc);
    pChange = surgePrice.maxSurgedPrice * surgeData.supply * solPrice / buyMc;
  }

  return {
    buyMc,
    pChange,
    priceAt1mMc,
    priceAt2mMc,
    priceAt3mMc,
    priceAt5mMc,
    priceAt10mMc,
    priceAt15mMc,
    priceAt30mMc,
    currentMarketCapUSD,
    surgedMarketCapUSD
  }
}

export const applyFiltersToToken = (token: Token, filters: FilterState, solPrice: number, isCheckTime: boolean = false): boolean => {
  const { surgeData, surgePrice } = token;
  if(isCheckTime) {
    // New Time-based Condition
    const currentTime = Date.now();
    const detectedAtTime = new Date(surgeData.detectedAt).getTime();
    const diff = (currentTime - detectedAtTime) / 60  /  1000;
    // If useHistoricalData is false, detectedAt must be within the last 5 seconds
    if (diff > 15 * 60 * 1000) {
      return false;
    }
    if (diff < 2 * 60 * 1000) {
      return false;
    }
  }

  // Ticker filter
  if (filters.ticker && surgeData.tokenTicker.toLowerCase() !== filters.ticker.toLowerCase()) {
    return false;
  }

  // Market Cap filter
  const marketCapUSD = surgeData.marketCapSol * solPrice;
  if (filters.marketCapMin && marketCapUSD < filters.marketCapMin) return false;
  if (filters.marketCapMax && marketCapUSD > filters.marketCapMax) return false;
  
  // New Market Cap filters for different time points
  const mcAt1m = token.priceAt1M ? token.priceAt1M * surgeData.supply * solPrice : 0;
  if (filters.marketCap1MMin && (token.priceAt1M && mcAt1m < filters.marketCap1MMin || !mcAt1m)) return false;
  if (filters.marketCap1MMax && (token.priceAt1M && mcAt1m > filters.marketCap1MMax || !mcAt1m)) return false;

  const mcAt2m = token.priceAt2M ? token.priceAt2M * surgeData.supply * solPrice : 0;
  if (filters.marketCap2MMin && (token.priceAt2M && mcAt2m < filters.marketCap2MMin || !mcAt2m)) return false;
  if (filters.marketCap2MMax && (token.priceAt2M && mcAt2m > filters.marketCap2MMax || !mcAt2m)) return false;

  const mcAt3m = token.priceAt3M ? token.priceAt3M * surgeData.supply * solPrice : 0;
  if (filters.marketCap3MMin && (token.priceAt3M && mcAt3m < filters.marketCap3MMin || !mcAt3m)) return false;
  if (filters.marketCap3MMax && (token.priceAt3M && mcAt3m > filters.marketCap3MMax || !mcAt3m)) return false;
  if(filters.marketCap3MMax && token.priceAt2M  && token.priceAt1M && token.priceAt3M && (Math.max(token.priceAt3M, token.priceAt2M, token.priceAt1M, surgeData.surgedPrice) !== token.priceAt3M || Math.min(token.priceAt3M, token.priceAt2M, token.priceAt1M, surgeData.surgedPrice) !== surgeData.surgedPrice)) return false;

  const mcAt5m = token.priceAt5M ? token.priceAt5M * surgeData.supply * solPrice : 0;
  if (filters.marketCap5MMin && (token.priceAt5M && mcAt5m < filters.marketCap5MMin || !mcAt5m)) return false;
  if (filters.marketCap5MMax && (token.priceAt5M && mcAt5m > filters.marketCap5MMax || !mcAt5m)) return false;

  const mcAt10m = token.priceAt10M ? token.priceAt10M * surgeData.supply * solPrice : 0;
  if (filters.marketCap10MMin && (token.priceAt10M && mcAt10m < filters.marketCap10MMin || !mcAt10m)) return false;
  if (filters.marketCap10MMax && (token.priceAt10M && mcAt10m > filters.marketCap10MMax || !mcAt10m)) return false;

  const mcAt15m = token.priceAt15M ? token.priceAt15M * surgeData.supply * solPrice : 0;
  if (filters.marketCap15MMin && (token.priceAt15M && mcAt15m < filters.marketCap15MMin || !mcAt15m)) return false;
  if (filters.marketCap15MMax && (token.priceAt15M && mcAt15m > filters.marketCap15MMax || !mcAt15m)) return false;

  const mcAt30m = token.priceAt30M ? token.priceAt30M * surgeData.supply * solPrice : 0;
  if (filters.marketCap30MMin && (token.priceAt30M && mcAt30m < filters.marketCap30MMin || !mcAt30m)) return false;
  if (filters.marketCap30MMax && (token.priceAt30M && mcAt30m > filters.marketCap30MMax || !mcAt30m)) return false;

  // Top 10 Holders filter
  if (filters.top10 && surgeData.top10HoldersPercent > Number(filters.top10)) return false;

  // Dev Holding filter
  if (filters.devHolding && surgeData.devHoldsPercent > Number(filters.devHolding)) return false;

  // Price Change (涨幅) filter
  // Note: priceChange is calculated in useFilteredTokens, ensure it's available on the token
  const priceChange = surgePrice.maxSurgedPrice / surgeData.surgedPrice;
  if (filters.priceChange && (priceChange ?? 0) < filters.priceChange) return false;

  // Volume (K) filter (converted to USD)
  const volumeUSD = surgeData.volumeSol * solPrice;
  if (filters.volumeKMin && volumeUSD < (filters.volumeKMin * 1000)) return false; // K means * 1000
  if (filters.volumeKMax && volumeUSD > (filters.volumeKMax * 1000)) return false;

  // Total Transactions filter
  if (filters.totalTxMin && surgeData.transactionCount < filters.totalTxMin) return false;
  if (filters.totalTxMax && surgeData.transactionCount > filters.totalTxMax) return false;

  // Platform filter (comma-separated, AND logic)
  if (filters.platform) {
    const platforms = filters.platform.toLowerCase().split(',').map(p => p.trim());
    const tokenProtocol = formatProto(surgeData.tokenAddress) + surgeData.protocol.toLowerCase(); // surgeData.protocol.toLowerCase();
    if (!platforms.every(p => tokenProtocol.includes(p))) return false;
  }

  // Bundled filter
  if (filters.bundledMin && surgeData.bundlersHoldPercent < filters.bundledMin) return false;
  if (filters.bundledMax && surgeData.bundlersHoldPercent > filters.bundledMax) return false;

  // Social filter (comma-separated, AND logic)
  if (filters.social) {
    const socialTerms = filters.social.toLowerCase().split(',').map(s => s.trim());
    const tokenSocials = [
      surgeData.website,
      surgeData.twitter,
      surgeData.telegram,
      surgeData.discord,
    ].filter(Boolean).map(s => s?.toLowerCase());

    if (!socialTerms.every((term: string) => tokenSocials.some(ts => ts?.includes(term)))) return false;
  }
  const len = token.surges?.length || 0;
  if(filters.singal && (len < filters.singal - 1)) return false;

  // 时间间隔
  /* eslint-disable no-unused-vars */
  // @ts-ignore
  if(filters.singal && !window.check) {
    let interval = 0;
    if(filters.marketCap1MMax) interval = 1;
    if(filters.marketCap2MMax) interval = 2;
    if(filters.marketCap3MMax) interval = 3;
    if(filters.marketCap5MMax) interval = 5;
    if(filters.marketCap10MMax) interval = 10;
    if(filters.marketCap15MMax) interval = 15;
    if(filters.marketCap30MMax) interval = 30;
    if(interval > 0) {
      let res = false;
      const surges = [...token.surges, token].sort((a: any, b: any) => new Date(b.surgeData.detectedAt).getTime() - new Date(a.surgeData.detectedAt).getTime());
      for(let i = 0; i < surges.length - 1; i++) {
        const next = surges[i + 1];
        const cur = surges[0]
        const diff = (new Date(cur.surgeData.detectedAt).getTime() - new Date(next.surgeData.detectedAt).getTime()) / 60 / 1000;
        if(diff >= interval) {
          res = true;
          break;
        }
      }
      if(!res) return false;
    }
  }
  /* eslint-enable no-unused-vars */
  return true;
};

export const formatNumber = (num: number) => {
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num ? `${(num / 1_000).toFixed(2)}K` : 'N/A';
};