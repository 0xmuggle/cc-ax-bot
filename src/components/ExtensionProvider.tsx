'use client';

import React, { useEffect, useRef, useCallback, createContext, useContext, useState } from 'react';
import { useStore } from '@/lib/store';
import { throttle } from '@/lib/utils';
import { usePathname } from 'next/navigation';

// Define the structure of the message from the content script
interface AxiomMessage {
  type: 'FROM_AXIOM_EXTENSION' | 'FROM_FM_EXTENSION';
  payload: any;
}

// Create a context to expose the open function
interface ExtensionContextType {
  openAxiomTab: () => void;
  isAxiomTabOpen: boolean;
}

const ExtensionContext = createContext<ExtensionContextType | null>(null);

export function ExtensionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { addOrUpdateTokens, setSolPrice, addSingal } = useStore();
  const axiomTabRef = useRef<Window | null>(null);
  const fmTabRef = useRef<Window | null>(null);
  const [isAxiomTabOpen, setIsAxiomTabOpen] = useState(false);
  const AXIOM_WINDOW_NAME = 'AXIOM_TRADER_WINDOW';
  const FM_WINDOW_NAME = 'FM_TRADER_WINDOW';
  const openAxiomTab = useCallback(() => {
    if (fmTabRef.current && !fmTabRef.current.closed) {
      return;
    }

    if (axiomTabRef.current && !axiomTabRef.current.closed) {
      return;
    }
    const newTab = window.open('https://axiom.trade/discover', AXIOM_WINDOW_NAME, 'width=40,height=40,popup=yes');
    axiomTabRef.current = newTab;

    const newTab2 = window.open('https://chain.fm/home?b=CJLbo0LmHWN3', FM_WINDOW_NAME, 'width=40,height=40,popup=yes');
    fmTabRef.current = newTab2;

    setIsAxiomTabOpen(true);
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent<AxiomMessage>) => {
      // IMPORTANT: Check the origin for security if you deploy this publicly!
      // if (event.origin !== 'https://axiom.trade') return;
      
      if(event.data.type === 'FROM_FM_EXTENSION') {
        addSingal(event.data.payload);
        return;
      }

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
          addOrUpdateTokens(payload.content.updates);
        }
      }
    },
    [addOrUpdateTokens, setSolPrice]
  );

  const throttledHandleMessage = useRef(throttle(handleMessage, 50)).current;

  useEffect(() => {
    window.addEventListener('message', throttledHandleMessage);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('message', throttledHandleMessage);
    };
  }, [throttledHandleMessage]); // Dependency on throttledHandleMessage to ensure latest version is used

  useEffect(() => {
    if(pathname !== '/') return;
    // Auto-open Axiom tab on component mount
    openAxiomTab();

    // Monitor the opened tab to update the UI and auto-reopen
    const interval = setInterval(() => {
      if (fmTabRef.current && fmTabRef.current.closed || axiomTabRef.current && axiomTabRef.current.closed) {
        setIsAxiomTabOpen(false);
        fmTabRef.current = null;
        axiomTabRef.current = null;
        openAxiomTab(); // Auto-reopen
      }
    }, 1000);

    // Cleanup on component unmount
    return () => {
      clearInterval(interval);
      // Removed axiomTabRef.current.close(); - plugin will handle this
    };
  }, [openAxiomTab]); // Dependency on openAxiomTab for auto-open and auto-reopen

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