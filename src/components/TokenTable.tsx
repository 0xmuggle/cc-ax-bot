'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Token } from '@/lib/types';
import { formatNumber } from '@/lib/filterUtils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import TokenHistoryHoverCard from './TokenHistoryHoverCard';

const TokenTable: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
  const { solPrice } = useStore();

  return (
    <div className="relative w-full max-h-[90vh] overflow-y-auto border rounded-lg shadow-sm">
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
            <th scope="col" className="px-2 py-4">前10</th>
            <th scope="col" className="px-2 py-4">买卖比</th>
            <th scope="col" className="px-2 py-4">平台</th>
            <th scope="col" className="px-2 py-4">付费</th>
            <th scope="col" className="px-2 py-4">买入</th>
            <th scope="col" className="px-2 py-4">发现时间</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tokenInfo: Token) => {
            const { surges = [], ...token } = tokenInfo;
            const { surgeData, surgePrice, priceAt1M, priceAt2M, priceAt5M, priceAt10M, priceAt15M, priceAt30M, priceAt3M, buyPrice, isHighMultiple }: any = token;
            const currentMarketCapUSD = surgePrice.currentPriceSol * surgeData.supply * solPrice;
            const surgedMarketCapUSD = surgeData.surgedPrice * surgeData.supply * solPrice;
            const priceAt1mMc = priceAt1M ? priceAt1M * surgeData.supply * solPrice : 0;
            const priceAt2mMc = priceAt2M ? priceAt2M * surgeData.supply * solPrice : 0;
            const priceAt3mMc = priceAt3M ? priceAt3M * surgeData.supply * solPrice : 0;
            const priceAt5mMc = priceAt5M ? priceAt5M * surgeData.supply * solPrice : 0;
            const priceAt10mMc = priceAt10M ? priceAt10M * surgeData.supply * solPrice : 0;
            const priceAt15mMc = priceAt15M ? priceAt15M * surgeData.supply * solPrice : 0;
            const priceAt30mMc = priceAt30M ? priceAt30M * surgeData.supply * solPrice : 0;
            const volumeUSD = surgeData.volumeSol * solPrice;
            const liquidityUSD = surgeData.liquiditySol * solPrice;
            const buySellRatio = (surgeData.buyCount / (surgeData.sellCount || 1)).toFixed(2);

            const rowClass = isHighMultiple ? 'bg-yellow-100' : 'bg-white';

            return (
              <tr key={surgeData.tokenAddress+surgeData.detectedAt} className={`${rowClass} border-b hover:border-amber-600`}>
                <td className="px-2 py-1 font-medium text-gray-900 whitespace-nowrap">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <a 
                        href={`https://axiom.trade/t/${surgeData.tokenAddress}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        {surgeData.tokenTicker}
                        {surges?.length > 0 && <span className='text-xs text-yellow-600'>({surges.length+1})</span>}
                        <br />
                        <span className='text-xs text-gray-500'>{surgeData.tokenAddress.slice(0, 8)}</span>
                      </a>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-h-96 overflow-y-auto">
                      <TokenHistoryHoverCard surges={[...surges, token]} />
                    </HoverCardContent>
                  </HoverCard>
                </td>
                <td className="px-2 py-1 font-mono text-green-500">{surgeData.priceChange ? `${surgeData.priceChange.toFixed(2)}x` : 'N/A'}</td>
                <td className="px-2 py-1 font-mono">
                  <div className='space-y-1'>
                    <div>{formatNumber(surgedMarketCapUSD)}/{formatNumber(currentMarketCapUSD)}</div>
                    <div className='text-xs flex space-x-3'>
                      <span className='w-[80px] text-orange-600'>1m:{priceAt1mMc ? formatNumber(priceAt1mMc) : '-'}</span>
                      <span className='w-[80px] text-orange-600'>2m:{priceAt2mMc ? formatNumber(priceAt2mMc) : '-'}</span>
                      <span className='w-[80px] text-orange-600'>3m:{priceAt3mMc ? formatNumber(priceAt3mMc) : '-'}</span>
                      <span className='w-[80px] text-purple-600'>5m:{priceAt5mMc ? formatNumber(priceAt5mMc) : '-'}</span>
                      <span className='w-[80px] text-pink-600'>10m:{priceAt10mMc ? formatNumber(priceAt10mMc) : '-'}</span>
                      <span className='w-[80px] text-teal-700'>15m:{priceAt15mMc ? formatNumber(priceAt15mMc) : '-'}</span>
                      <span className='w-[80px] text-fuchsia-700'>30m:{priceAt30mMc ? formatNumber(priceAt30mMc) : '-'}</span>
                    </div>
                  </div>
                </td>
                <td className="px-2 py-1 font-mono">{formatNumber(volumeUSD)}</td>
                <td className="px-2 py-1 font-mono">{formatNumber(liquidityUSD)}</td>
                <td className="px-2 py-1 font-mono">{surgeData.bundlersHoldPercent?.toFixed(1)}</td>
                <td className="px-2 py-1 font-mono">{surgeData.devHoldsPercent?.toFixed(1)}</td>
                <td className="px-2 py-1 font-mono">{surgeData.top10Holders?.toFixed(1)}</td>
                <td className="px-2 py-1 font-mono">{buySellRatio}({surgeData.transactionCount})</td>
                <td className="px-2 py-1">{surgeData.protocol}</td>
                <td className="px-2 py-1">{surgeData.dexPaid ? <span className='text-green-600'>是</span> : "否"}</td>
                <td className="px-2 py-1">{buyPrice ? <span className='text-green-600'>是<span className='text-xs'>({formatNumber(buyPrice * surgeData.supply * solPrice)})</span></span> : "否"}</td>
                <td className="px-2 py-1 font-mono">
                  {new Date(surgeData.detectedAt).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TokenTable;