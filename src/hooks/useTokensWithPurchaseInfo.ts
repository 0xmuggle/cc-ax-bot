import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Token, HistoryLog } from '@/lib/types';

// Define an enriched token type for display
export interface EnrichedToken extends Token {
  // Now, purchase info is just the marketCapAtPurchase
  marketCapAtPurchase?: number;
}

export const useTokensWithPurchaseInfo = (tokens: Token[]): EnrichedToken[] => {
  const history = useStore(state => state.history);

  const enrichedTokens = useMemo(() => {
    // Create a map of marketCapAtPurchase from history for quick lookup
    const marketCapAtPurchaseMap = new Map<string, number>();
    history.forEach(log => {
      // Assuming marketCapAtTrigger is the marketCap at purchase
      // And we only care about the latest one for display
      marketCapAtPurchaseMap.set(log.tokenAddress, log.marketCapAtTrigger);
    });

    // Enrich the tokens with marketCapAtPurchase
    return tokens.map(token => {
      const marketCapAtPurchase = marketCapAtPurchaseMap.get(token.surgeData.tokenAddress);
      if (marketCapAtPurchase !== undefined) { // Check for undefined as 0 is a valid marketCap
        return {
          ...token,
          marketCapAtPurchase: marketCapAtPurchase,
        };
      }
      return token;
    });
  }, [tokens, history]); // Recalculate when tokens or history changes

  return enrichedTokens;
};