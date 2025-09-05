import { Token, FilterState } from './types';

export const applyFiltersToToken = (token: Token, filters: FilterState, solPrice: number, isCheckTime: boolean = false): boolean => {
  const { surgeData, surgePrice } = token;
  if(isCheckTime) {
    // New Time-based Condition
    const currentTime = Date.now();
    const detectedAtTime = new Date(surgeData.detectedAt).getTime();

    // If useHistoricalData is false, detectedAt must be within the last 5 seconds
    if ((currentTime - detectedAtTime) > 60 * 60 * 1000) {
      return false;
    }
  }

  // Ticker filter
  if (filters.ticker && !surgeData.tokenTicker.toLowerCase().includes(filters.ticker.toLowerCase())) {
    return false;
  }

  // Market Cap filter
  const marketCapUSD = surgeData.marketCapSol * solPrice;
  if (filters.marketCapMin && marketCapUSD < filters.marketCapMin) return false;
  if (filters.marketCapMax && marketCapUSD > filters.marketCapMax) return false;

  // New Market Cap filters for different time points
  const mcAt3m = token.priceAt3M ? token.priceAt3M * surgeData.supply * solPrice : 0;
  if (filters.marketCap3MMin && (token.priceAt3M && mcAt3m < filters.marketCap3MMin || !mcAt3m)) return false;
  if (filters.marketCap3MMax && (token.priceAt3M && mcAt3m > filters.marketCap3MMax || !mcAt3m)) return false;

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
  if (filters.top10 && surgeData.top10HoldersPercent > filters.top10) return false;

  // Dev Holding filter
  if (filters.devHolding && surgeData.devHoldsPercent > filters.devHolding) return false;

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
    const tokenProtocol = surgeData.protocol.toLowerCase();
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