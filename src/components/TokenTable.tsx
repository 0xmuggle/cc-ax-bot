'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Token } from '@/lib/types';

// Helper to format large numbers into K (thousands) or M (millions)
const formatNumber = (num: number) => {
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num ? `${(num / 1_000).toFixed(2)}K` : 'N/A';
};

const TokenTable: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
  const solPrice = useStore((state) => state.solPrice);

  return (
    <div className="relative w-full max-h-[70vh] overflow-y-auto border rounded-lg shadow-sm">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="text-xs text-gray-700 capitalize bg-gray-50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="px-2 py-4">Token</th>
            <th scope="col" className="px-2 py-4">涨幅</th>
            <th scope="col" className="px-2 py-4">市值</th>
            <th scope="col" className="px-2 py-4">交易量</th>
            <th scope="col" className="px-2 py-4">流动性</th>
            <th scope="col" className="px-2 py-4">捆绑</th>
            <th scope="col" className="px-2 py-4">Dev持有</th>
            <th scope="col" className="px-2 py-4">买卖比</th>
            <th scope="col" className="px-2 py-4">平台</th>
            <th scope="col" className="px-2 py-4">发现时间</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => {
            const { surgeData, surgePrice, isHighMultiple } = token;
            const currentMarketCapUSD = surgePrice.currentPriceSol * surgeData.supply * solPrice;
            const surgedMarketCapUSD = surgeData.surgedPrice * surgeData.supply * solPrice;
            const volumeUSD = surgeData.volumeSol * solPrice;
            const liquidityUSD = surgeData.liquiditySol * solPrice;
            const buySellRatio = (surgeData.buyCount / (surgeData.sellCount || 1)).toFixed(2);

            const rowClass = isHighMultiple ? 'bg-yellow-100' : 'bg-white';

            return (
              <tr key={surgeData.tokenAddress+surgeData.detectedAt} className={`${rowClass} border-b hover:border-amber-600`}>
                <td className="px-2 py-1 font-medium text-gray-900 whitespace-nowrap">
                  <a 
                    href={`https://axiom.trade/t/${surgeData.tokenAddress}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {surgeData.tokenTicker}<br />
                    <span className='text-xs text-gray-500'>{surgeData.tokenAddress.slice(0, 8)}</span>
                  </a>
                </td>
                <td className="px-2 py-1 font-mono text-green-500">{surgeData.priceChange ? `${surgeData.priceChange.toFixed(2)}x` : 'N/A'}</td>
                <td className="px-2 py-1 font-mono">{`${formatNumber(surgedMarketCapUSD)}/${formatNumber(currentMarketCapUSD)}`}</td>
                <td className="px-2 py-1 font-mono">{formatNumber(volumeUSD)}</td>
                <td className="px-2 py-1 font-mono">{formatNumber(liquidityUSD)}</td>
                <td className="px-2 py-1 font-mono">{(surgeData.bundlersHoldPercent).toFixed(1)}</td>
                <td className="px-2 py-1 font-mono">{(surgeData.bundlersHoldPercent).toFixed(1)}</td>
                <td className="px-2 py-1 font-mono">{buySellRatio}({surgeData.transactionCount})</td>
                <td className="px-2 py-1">{surgeData.protocol}</td>
                <td className="px-2 py-1 font-mono">{new Date(surgeData.detectedAt).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTable;