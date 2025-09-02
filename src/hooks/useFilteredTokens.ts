'use client';

import { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { applyFiltersToToken } from '@/lib/filterUtils';

export const useFilteredTokens = () => {
  const { tokens, solPrice, filters } = useStore();

  // --- Step 1: Debounce tokens and solPrice ---
  const [debouncedTokens, setDebouncedTokens] = useState(tokens);
  const [debouncedSolPrice, setDebouncedSolPrice] = useState(solPrice);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTokens(tokens);
    }, 200); // Debounce delay for tokens

    return () => {
      clearTimeout(handler);
    };
  }, [tokens]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSolPrice(solPrice);
    }, 200); // Debounce delay for solPrice

    return () => {
      clearTimeout(handler);
    };
  }, [solPrice]);
  // --- End Step 1 ---

  // --- Step 2: Modify useMemo dependencies ---
  const calculatedData = useMemo(() => {
    // Use debouncedTokens and debouncedSolPrice here
    const processedTokens = debouncedTokens.map(token => {
      const { surgeData, surgePrice } = token;

      // Calculate priceChange (涨幅) as multiplier
      const priceChange = (surgePrice.maxSurgedPrice / surgeData.surgedPrice);

      // Determine social links
      const socialLinks: string[] = [];
      if (surgeData.website) socialLinks.push('website');
      if (surgeData.twitter) socialLinks.push('twitter');
      if (surgeData.telegram) socialLinks.push('telegram');
      if (surgeData.discord) socialLinks.push('discord');

      // Determine if high multiple (高倍)
      // Ensure filters.highMultiple is a positive number for comparison
      const isHighMultiple = (filters.highMultiple && filters.highMultiple > 0) ? 
                             priceChange >= filters.highMultiple : 
                             false;

      return {
        ...token,
        surgeData: {
          ...surgeData,
          priceChange, // Add calculated priceChange to surgeData for display
          socialLinks, // Add socialLinks for display
        },
        isHighMultiple, // Add for highlighting in table
      };
    });

    const filtered = processedTokens.filter(token => {
      return applyFiltersToToken(token, filters, debouncedSolPrice);
    });

    const highMultiplierCount = filtered.filter(token => token.isHighMultiple).length;

    return { filteredTokens: filtered, highMultiplierCount };
  }, [debouncedTokens, debouncedSolPrice, filters]); // New dependencies

  // --- Existing throttling for rendering output ---
  const [throttledData, setThrottledData] = useState(calculatedData);

  useEffect(() => {
    const handler = setTimeout(() => {
      setThrottledData(calculatedData);
    }, 400); // 400ms throttle for rendering

    return () => {
      clearTimeout(handler);
    };
  }, [calculatedData]);

  return throttledData;
};