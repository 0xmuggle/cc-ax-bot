'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { formatNumber } from '@/lib/filterUtils';
import { Token } from '@/lib/types';

interface TokenHistoryHoverCardProps {
  surges: any[];
}

const TokenHistoryHoverCard: React.FC<TokenHistoryHoverCardProps> = ({ surges }) => {
  const { solPrice } = useStore();

  const calculateMarketCaps = (token: Token) => {
    const { surgeData, surgePrice, priceAt1M, priceAt2M, priceAt3M, priceAt5M, priceAt10M, priceAt15M, priceAt30M } = token;
    const supply = surgeData.supply;
    return {
      current: surgePrice.currentPriceSol * supply * solPrice,
      surged: surgeData.surgedPrice * supply * solPrice,
      mc1m: priceAt1M ? priceAt1M * supply * solPrice : 0,
      mc2m: priceAt2M ? priceAt2M * supply * solPrice : 0,
      mc3m: priceAt3M ? priceAt3M * supply * solPrice : 0,
      mc5m: priceAt5M ? priceAt5M * supply * solPrice : 0,
      mc10m: priceAt10M ? priceAt10M * supply * solPrice : 0,
      mc15m: priceAt15M ? priceAt15M * supply * solPrice : 0,
      mc30m: priceAt30M ? priceAt30M * supply * solPrice : 0,
    };
  };

  return (
    <div className="space-y-4 text-sm text-left">
        <div className='border-b'>
          <span className='inline-block w-[80px]'>时间</span>
          <span className='inline-block text-green-400 w-[70px]'>涨幅</span>
          <span className='inline-block w-[70px]'>市值</span>
          <span className='text-orange-600 inline-block w-[70px]'>1m</span>
          <span className='text-orange-600 inline-block w-[70px]'>2m</span>
          <span className='text-orange-600 inline-block w-[70px]'>3m</span>
          <span className='text-purple-600 inline-block w-[70px]'>5m</span>
          <span className='text-pink-600 inline-block w-[70px]'>10m</span>
          <span className='text-teal-700 inline-block w-[70px]'>15m</span>
          <span className='text-fuchsia-700 inline-block w-[70px]'>30m</span>
        </div>
      {surges.sort((a: any, b: any) => new Date(b.surgeData.detectedAt).getTime() - new Date(a.surgeData.detectedAt).getTime()).map(token => {
        const priceChange = (token.maxPrice / token.surgeData.surgedPrice);
        const marketCaps = calculateMarketCaps(token);
        return (
          <div key={token.surgeData.detectedAt} className="border-b last:border-b-0">
            <div className=''>
              <span className='inline-block w-[80px]'>{new Date(token.surgeData.detectedAt).toLocaleTimeString()}</span>
              <span className='inline-block text-green-400 w-[70px]'>{priceChange ? `${priceChange.toFixed(2)}x` : 'N/A'}</span>
              <span className='inline-block w-[70px]'>{formatNumber(marketCaps.surged)}</span>
              <span className='text-orange-600 inline-block w-[70px]'>{marketCaps.mc1m ? formatNumber(marketCaps.mc1m) : '-'}</span>
              <span className='text-orange-600 inline-block  w-[70px]'>{marketCaps.mc2m ? formatNumber(marketCaps.mc2m) : '-'}</span>
              <span className='text-orange-600 inline-block  w-[70px]'>{marketCaps.mc3m ? formatNumber(marketCaps.mc3m) : '-'}</span>
              <span className='text-purple-600 inline-block  w-[70px]'>{marketCaps.mc5m ? formatNumber(marketCaps.mc5m) : '-'}</span>
              <span className='text-pink-600 inline-block  w-[70px]'>{marketCaps.mc10m ? formatNumber(marketCaps.mc10m) : '-'}</span>
              <span className='text-teal-700 inline-block  w-[70px]'>{marketCaps.mc15m ? formatNumber(marketCaps.mc15m) : '-'}</span>
              <span className='text-fuchsia-700 inline-block  w-[70px]'>{marketCaps.mc30m ? formatNumber(marketCaps.mc30m) : '-'}</span>
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default TokenHistoryHoverCard;
