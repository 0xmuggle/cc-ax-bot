'use client';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Token, Strategy, HistoryLog } from '@/lib/types';
import { sendToTelegram } from '@/lib/telegram'; // Imported
import { applyFiltersToToken } from '@/lib/filterUtils'; // Imported

import { v4 as uuidv4 } from 'uuid';

// Helper to generate a unique ID for history logs (already exists)
const generateUniqueId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const useNotificationEngine = () => {
  const {
    tokens,
    strategies,
    solPrice,
    addOrUpdateToken,
    addHistoryLog,
    sentNotifications,
    addSentNotification,
    bots, // Added bots
  } = useStore();

  // Main effect to monitor tokens and trigger notifications
  useEffect(() => {
    const enabledStrategies = strategies
      .filter(s => s.enabled)
      .sort((a, b) => b.priority - a.priority);

    if (enabledStrategies.length === 0) {
      return;
    }

    // Iterate through ALL tokens to find candidates for notification
    tokens.forEach(token => {
      const tokenAddress = token.surgeData.tokenAddress;

      // Skip if already marked as purchased (meaning notification was sent and acted upon)
      if (token.purchaseInfo?.purchased) {
        return;
      }

      let bestMatchingStrategy: Strategy | null = null;

      // Find the highest priority matching strategy that hasn't sent a notification for this token
      for (const strategy of enabledStrategies) {
        // Check if notification for this token and strategy has already been sent
        if (sentNotifications[tokenAddress]?.includes(strategy.id)) {
          continue; // Already sent for this strategy, skip
        }

        // Apply strategy filters including the new time-based condition
        const isMatch = applyFiltersToToken(token, strategy.filters, solPrice);

        if (isMatch) {
          bestMatchingStrategy = strategy;
          // Since strategies are sorted by priority, the first match is the best
          break;
        }
      }

      if (bestMatchingStrategy) {
        // Found a matching strategy that hasn't sent a notification yet
        const strategy = bestMatchingStrategy;

        // --- Action: Send Notification (UI & Telegram) ---
        const currentMarketCapUSD = token.surgePrice.currentPriceSol * token.surgeData.supply * solPrice;
        const notificationMessage = `🚀 Token Alert! 🚀\n\nTicker: ${token.surgeData.tokenTicker}\nAddress: ${tokenAddress.slice(0, 8)}...\nStrategy: ${strategy.name}\nMarket Cap: ${currentMarketCapUSD.toFixed(2)}\nPrice Change: ${token.surgeData.priceChange?.toFixed(2) ?? 'N/A'}x\n\nView: https://axiom.trade/t/${tokenAddress}`;

        // 1. UI Notification (Placeholder)
        console.log("UI Notification Triggered:", notificationMessage);
        // In a real app, you'd use a toast library or similar here
        // e.g., toast.success(notificationMessage);

        // 2. Send to Telegram
        const bot = bots.find(b => b.id === strategy.botId); // Bot lookup
        if (bot) {
          sendToTelegram(notificationMessage, bot.apiKey, bot.chatId)
            .then(() => {
              console.log(`Telegram notification sent for ${token.surgeData.tokenTicker} via ${strategy.name}`);

              // --- Action: Mark Token as Purchased & Record History ---
              // Mark token as purchased
              const updatedToken = {
                ...token,
                purchaseInfo: {
                  purchased: true,
                  marketCap: currentMarketCapUSD,
                },
              };
              addOrUpdateToken(updatedToken); // Update the token in the store

              // Record history log
              addHistoryLog({
                id: uuidv4(), // Use uuidv4
                timestamp: new Date().toISOString(),
                tokenAddress: tokenAddress,
                tokenTicker: token.surgeData.tokenTicker,
                strategyName: strategy.name,
                marketCapAtTrigger: currentMarketCapUSD, // Use currentMarketCapUSD
                content: notificationMessage, // Use notificationMessage
              });

              // --- Action: Update Send Lock ---
              addSentNotification(tokenAddress, strategy.id);
            })
            .catch(error => {
              console.error(`Failed to send Telegram notification for ${token.surgeData.tokenTicker}:`, error);
            });
        } else {
          console.warn(`Skipping Telegram notification for ${token.surgeData.tokenTicker}: Bot with ID ${strategy.botId} not found for strategy ${strategy.name}`);
        }
      }
    });
  }, [
    tokens,
    strategies,
    solPrice,
    addOrUpdateToken,
    addHistoryLog,
    sentNotifications,
    addSentNotification,
    bots, // Added bots to dependencies
  ]);
};