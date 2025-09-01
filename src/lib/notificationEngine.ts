'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Token, Strategy } from '@/lib/types';

import { v4 as uuidv4 } from 'uuid';

async function sendToTelegram(content: string, apiKey: string, chatId: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${apiKey}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: content,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    const data = await response.json();
    console.log('Sent to Telegram:', data);
    return data.ok === true;
  } catch (error) {
    console.error('Failed to send message to Telegram:', error);
    return false;
  }
}

const checkStrategy = (token: Token, strategy: Strategy, solPrice: number): boolean => {
  const { surgeData, surgePrice } = token;
  const { ticker, priceChange, marketCapMin, marketCapMax, volumeKMin, volumeKMax, totalTxMin, totalTxMax, platform, bundledMin, bundledMax, social, useHistoricalData } = strategy.filters;

  // Ticker filter
  if (ticker && !surgeData.tokenTicker.toLowerCase().includes(ticker.toLowerCase())) {
    return false;
  }

  // Price Change (涨幅) filter
  if (priceChange) {
    const currentPriceChange = ((surgePrice.currentPriceSol / surgeData.priceSol) - 1) * 100;
    if (currentPriceChange < priceChange) {
      return false;
    }
  }

  // Market Cap filter
  const marketCapUSD = surgeData.marketCapSol * solPrice;
  if (marketCapMin && marketCapUSD < marketCapMin) return false;
  if (marketCapMax && marketCapUSD > marketCapMax) return false;

  // Volume (K) filter (converted to USD)
  const volumeUSD = surgeData.volumeSol * solPrice;
  if (volumeKMin && volumeUSD < (volumeKMin * 1000)) return false; // K means * 1000
  if (volumeKMax && volumeUSD > (volumeKMax * 1000)) return false;

  // Total Transactions filter
  if (totalTxMin && surgeData.transactionCount < totalTxMin) return false;
  if (totalTxMax && surgeData.transactionCount > totalTxMax) return false;

  // Platform filter (comma-separated, AND logic)
  if (platform) {
    const platforms = platform.toLowerCase().split(',').map(p => p.trim());
    const tokenProtocol = surgeData.protocol.toLowerCase();
    if (!platforms.every(p => tokenProtocol.includes(p))) return false;
  }

  // Bundled filter
  if (bundledMin && (surgeData.bundlersHoldPercent * 100) < bundledMin) return false;
  if (bundledMax && (surgeData.bundlersHoldPercent * 100) > bundledMax) return false;

  // Social filter (comma-separated, AND logic)
  if (social) {
    const socialTerms = social.toLowerCase().split(',').map(s => s.trim());
    const tokenSocials = [
      surgeData.website,
      surgeData.twitter,
      surgeData.telegram,
      surgeData.discord,
    ].filter(Boolean).map(s => s?.toLowerCase());

    if (!socialTerms.every(term => tokenSocials.some(ts => ts?.includes(term)))) return false;
  }

  // Use Historical Data filter
  if (useHistoricalData && !(surgeData.timeTakenSeconds > 0 || surgeData.previousRank !== undefined)) {
    return false;
  }

  return true;
};

export const useNotificationEngine = () => {
  const { tokens, strategies, bots, sentNotifications, addSentNotification, addHistoryLog, addOrUpdateToken, solPrice } = useStore();

  useEffect(() => {
    if (tokens.length === 0 || strategies.length === 0) {
      return;
    }

    const enabledStrategies = strategies.filter(s => s.enabled);
    if (enabledStrategies.length === 0) {
      return;
    }

    // Check the most recent token(s) for performance
    const tokenToCheck = tokens[0];

    for (const strategy of enabledStrategies) {
      const hasBeenSent = sentNotifications[tokenToCheck.surgeData.tokenAddress]?.includes(strategy.id);

      if (!hasBeenSent && checkStrategy(tokenToCheck, strategy, solPrice)) {
        console.log(`Token ${tokenToCheck.surgeData.tokenTicker} matched strategy ${strategy.name}!`);
        
        const bot = bots.find(b => b.id === strategy.botId);
        if (bot) {
          const content = `${tokenToCheck.surgeData.tokenAddress}--ON--${tokenToCheck.surgeData.surgedPrice * 1.2}`;
          sendToTelegram(content, bot.apiKey, bot.chatId).then(ok => {
            if (ok) {
              // Mark as sent to prevent re-sending
              addSentNotification(tokenToCheck.surgeData.tokenAddress, strategy.id);

              // Mark token as purchased in the main list
              const updatedToken: Token = {
                ...tokenToCheck,
                purchaseInfo: {
                  purchased: true,
                  marketCap: tokenToCheck.surgeData.marketCapSol,
                },
              };
              addOrUpdateToken(updatedToken);

              // Add a log entry to the history
              addHistoryLog({
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                tokenAddress: tokenToCheck.surgeData.tokenAddress,
                tokenTicker: tokenToCheck.surgeData.tokenTicker,
                strategyName: strategy.name,
                marketCapAtTrigger: tokenToCheck.surgeData.marketCapSol * solPrice,
                content: content,
              });
            }
          });
        } else {
            console.warn(`Bot with ID ${strategy.botId} not found for strategy ${strategy.name}`);
        }
      }
    }
  }, [tokens, strategies, bots, sentNotifications, addSentNotification, addHistoryLog, addOrUpdateToken, solPrice]);
};