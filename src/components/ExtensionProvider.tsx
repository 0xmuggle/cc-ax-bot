'use client';

import React, { useEffect, useRef, useCallback, createContext, useContext, useState } from 'react';
import { useStore } from '@/lib/store';
import { Token } from '@/lib/types';

// Define the structure of the message from the content script
interface AxiomMessage {
  type: 'FROM_AXIOM_EXTENSION';
  payload: any;
}

// Create a context to expose the open function
interface ExtensionContextType {
  openAxiomTab: () => void;
  isAxiomTabOpen: boolean;
}

const ExtensionContext = createContext<ExtensionContextType | null>(null);

import { useNotificationEngine } from '@/lib/notificationEngine';

// Add a throttle utility function
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;

  return function(this: any, ...args: any[]) {
    lastArgs = args;
    lastThis = this;

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        func.apply(lastThis, lastArgs);
        timeoutId = null;
        lastArgs = null;
        lastThis = null;
      }, delay);
    }
  };
};

export function ExtensionProvider({ children }: { children: React.ReactNode }) {
  const { addOrUpdateToken, setSolPrice } = useStore();
  const axiomTabRef = useRef<Window | null>(null);
  const [isAxiomTabOpen, setIsAxiomTabOpen] = useState(false);

  // Activate the notification engine
  useNotificationEngine();

  const openAxiomTab = useCallback(() => {
    if (axiomTabRef.current && !axiomTabRef.current.closed) {
      axiomTabRef.current.focus();
      return;
    }
    const newTab = window.open('https://axiom.trade/discover', '_blank');
    axiomTabRef.current = newTab;
    setIsAxiomTabOpen(true);
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent<AxiomMessage>) => {
      // IMPORTANT: Check the origin for security if you deploy this publicly!
      // if (event.origin !== 'https://axiom.trade') return;

      if (event.data.type !== 'FROM_AXIOM_EXTENSION') {
        return;
      }
      const { payload } = event.data;
      if (!payload || !payload.room) {
        return;
      }
      const room = payload.room;
      if (room === 'sol_price') {
        if (typeof payload.content === 'number') {
          setSolPrice(payload.content);
        }
      }
      else if (room === 'surge-updates') {
        if (payload.content && Array.isArray(payload.content.updates)) {
          payload.content.updates.forEach((update: any) => {
            const token: Token = update;
            addOrUpdateToken(token);
          });
        }
      }
    },
    [addOrUpdateToken, setSolPrice]
  );

  const throttledHandleMessage = useRef(throttle(handleMessage, 400)).current;

  useEffect(() => {
    window.addEventListener('message', throttledHandleMessage);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('message', throttledHandleMessage);
    };
  }, [throttledHandleMessage]); // Dependency on throttledHandleMessage to ensure latest version is used

  useEffect(() => {
    // Monitor the opened tab to update the UI
    const interval = setInterval(() => {
      if (axiomTabRef.current && axiomTabRef.current.closed) {
        setIsAxiomTabOpen(false);
        axiomTabRef.current = null;
      }
    }, 1000);

    // Auto-refresh every 30 minutes
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 30 * 60 * 1000);

    // Cleanup on component unmount
    return () => {
      clearInterval(interval);
      clearInterval(refreshInterval);
      if (axiomTabRef.current && !axiomTabRef.current.closed) {
        axiomTabRef.current.close();
      }
    };
  }, []); // Empty dependency array to run only once

  return (
    <ExtensionContext.Provider value={{ openAxiomTab, isAxiomTabOpen }}>
      {children}
    </ExtensionContext.Provider>
  );
}

// Custom hook to easily access the context
export const useExtension = () => {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error('useExtension must be used within an ExtensionProvider');
  }
  return context;
};