import { Token, FilterState } from './types';

export const applyFiltersToToken = (token: Token, filters: FilterState, solPrice: number): boolean => {
  const { surgeData, surgePrice } = token;

  // New Time-based Condition
  const currentTime = Date.now();
  const detectedAtTime = new Date(surgeData.detectedAt).getTime();

  if (filters.useHistoricalData) {
    // If useHistoricalData is true, detectedAt must be within the last 30 minutes
    if ((currentTime - detectedAtTime) > 30 * 60 * 1000) {
      return false;
    }
  } else {
    // If useHistoricalData is false, detectedAt must be within the last 5 seconds
    if ((currentTime - detectedAtTime) > 5 * 1000) {
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

  // Price Change (涨幅) filter
  // Note: priceChange is calculated in useFilteredTokens, ensure it's available on the token
  if (filters.priceChange && (surgeData.priceChange ?? 0) < filters.priceChange) return false;

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

    if (!socialTerms.every(term => tokenSocials.some(ts => ts?.includes(term)))) return false;
  }

  // High Multiple filter (already calculated as isHighMultiple on token, but strategy filter needs to be applied)
  // This assumes filters.highMultiple is the threshold for the strategy
  if (filters.highMultiple && filters.highMultiple > 0) {
    const currentPriceChange = (surgePrice.maxSurgedPrice / surgePrice.currentPriceSol);
    if (currentPriceChange < filters.highMultiple) {
      return false;
    }
  }

  return true;
};