'use client';

import { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

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
      const { surgeData } = token;

      // Ticker filter
      if (filters.ticker && !surgeData.tokenTicker.toLowerCase().includes(filters.ticker.toLowerCase())) {
        return false;
      }

      // Market Cap filter
      const marketCapUSD = surgeData.marketCapSol * debouncedSolPrice; // Use debouncedSolPrice
      if (filters.marketCapMin && marketCapUSD < filters.marketCapMin) return false;
      if (filters.marketCapMax && marketCapUSD > filters.marketCapMax) return false;

      // Price Change (涨幅) filter
      if (filters.priceChange && token.surgeData.priceChange < filters.priceChange) return false;

      // Volume (K) filter (converted to USD)
      const volumeUSD = surgeData.volumeSol * debouncedSolPrice; // Use debouncedSolPrice
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

      return true;
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