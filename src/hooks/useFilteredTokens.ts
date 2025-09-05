'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { applyFiltersToToken, calculateMore } from "@/lib/filterUtils";
import { Token } from '@/lib/types';

export const useFilteredTokens = () => {
  const { tokens, solPrice, filters } = useStore();

  const { filteredTokens, highMultiplierCount } = useMemo(() => {
    const filtereds: Token[] = [];
    tokens.forEach(token => {
      const filtered = applyFiltersToToken(token, filters, solPrice);
      if(filtered) {
        // Calculate priceChange (涨幅) as multiplier
        const info = calculateMore(token, filters, solPrice);
        const { surgeData, surgePrice } = token;
        const priceChange = (surgePrice.maxSurgedPrice / surgeData.surgedPrice);
        filtereds.push({
          ...token,
          surgeData: {
            ...surgeData,
            priceChange,
          },
          moreInfo: info,
          isHighMultiple: (filters.highMultiple && filters.highMultiple > 0) ? (info.pChange || priceChange) >= filters.highMultiple : false
        })
      }
    });

    const highMultiplierCount = filtereds.filter(token => token.isHighMultiple).length;

    return { filteredTokens: filtereds, highMultiplierCount };
  }, [tokens, solPrice, filters]);

  return { filteredTokens, highMultiplierCount };
};