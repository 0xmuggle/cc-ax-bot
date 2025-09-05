"use client";

import React from "react";
import { useStore, formatProto } from "@/lib/store";
import { Token } from "@/lib/types";
import { formatNumber } from "@/lib/filterUtils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import TokenHistoryHoverCard from "./TokenHistoryHoverCard";

const TokenTable: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
  const { solPrice } = useStore();

  return (
    <div className="relative w-full max-h-[90vh] overflow-y-auto border rounded-lg shadow-sm">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="text-xs text-gray-700 capitalize bg-gray-50 sticky top-0 z-10">
          <tr>
            <th scope="col" className="px-2 py-4">
              Token
            </th>
            <th scope="col" className="px-2 py-4">
              涨幅
            </th>
            <th scope="col" className="px-2 py-4">
              市值
            </th>
            <th scope="col" className="px-2 py-4">
              交易量
            </th>
            <th scope="col" className="px-2 py-4">
              流动性
            </th>
            <th scope="col" className="px-2 py-4">
              捆绑
            </th>
            <th scope="col" className="px-2 py-4">
              Dev持有
            </th>
            <th scope="col" className="px-2 py-4">
              前10
            </th>
            <th scope="col" className="px-2 py-4">
              买卖比
            </th>
            <th scope="col" className="px-2 py-4">
              平台
            </th>
            <th scope="col" className="px-2 py-4">
              付费
            </th>
            <th scope="col" className="px-2 py-4">
              买入
            </th>
            <th scope="col" className="px-2 py-4">
              发现时间
            </th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((tokenInfo: Token) => {
            const { surges = [], ...token } = tokenInfo;
            const { surgeData, buyPrice, isHighMultiple, moreInfo = {} }: any = token;
            
            const volumeUSD = surgeData.volumeSol * solPrice;
            const liquidityUSD = surgeData.liquiditySol * solPrice;
            const buySellRatio = (
              surgeData.buyCount / (surgeData.sellCount || 1)
            ).toFixed(2);
            const rowClass = isHighMultiple ? "bg-yellow-100" : "bg-white";

            return (
              <tr
                key={surgeData.tokenAddress + surgeData.detectedAt}
                className={`${rowClass} border-b hover:border-amber-600`}
              >
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
                        {surges?.length > 0 && (
                          <span className="text-xs text-yellow-600">
                            ({surges.length + 1})
                          </span>
                        )}
                        <br />
                        <span className="text-xs text-gray-500">
                          {surgeData.tokenAddress.slice(0, 8)}
                        </span>
                      </a>
                    </HoverCardTrigger>
                    <HoverCardContent className="max-h-96 overflow-y-auto">
                      <TokenHistoryHoverCard surges={[...surges, token]} />
                    </HoverCardContent>
                  </HoverCard>
                </td>
                <td className="px-2 py-1 font-mono">
                    <div className="space-y-2">
                      {
                        moreInfo.buyMc > 0 && <div className="space-x-2 text-gray-500">[
                          <span className="text-green-500">{moreInfo.pChange.toFixed(2)}x</span>
                          <span className="text-purple-600">{formatNumber(moreInfo.buyMc)}</span>]
                        </div>
                      }
                      <div className="space-y-2">{
                          surgeData.priceChange
                          ? `${surgeData.priceChange.toFixed(2)}x`
                          : "N/A"}
                      </div>
                    </div>
                </td>
                <td className="px-2 py-1 font-mono">
                  <div className="space-y-1">
                      <div>
                        {formatNumber(moreInfo.surgedMarketCapUSD)}/
                        {formatNumber(moreInfo.currentMarketCapUSD)}
                      </div>
                      <div className="text-xs flex space-x-3">
                        <span className="w-[80px] text-orange-600">
                          1m:{formatNumber(moreInfo.priceAt1mMc)}
                        </span>
                        <span className="w-[80px] text-orange-600">
                          2m:{formatNumber(moreInfo.priceAt2mMc)}
                        </span>
                        <span className="w-[80px] text-orange-600">
                          3m:{formatNumber(moreInfo.priceAt3mMc)}
                        </span>
                        <span className="w-[80px] text-purple-600">
                          5m:{formatNumber(moreInfo.priceAt5mMc)}
                        </span>
                        <span className="w-[80px] text-pink-600">
                          10m:{formatNumber(moreInfo.priceAt10mMc)}
                        </span>
                        <span className="w-[80px] text-teal-700">
                          15m:{formatNumber(moreInfo.priceAt15mMc)}
                        </span>
                        <span className="w-[80px] text-fuchsia-700">
                          30m:{formatNumber(moreInfo.priceAt30mMc)}
                        </span>
                      </div>
                    </div>
                </td>
                <td className="px-2 py-1 font-mono">
                  {formatNumber(volumeUSD)}
                </td>
                <td className="px-2 py-1 font-mono">
                  {formatNumber(liquidityUSD)}
                </td>
                <td className="px-2 py-1 font-mono">
                  {surgeData.bundlersHoldPercent?.toFixed(1)}
                </td>
                <td className="px-2 py-1 font-mono">
                  {surgeData.devHoldsPercent?.toFixed(1)}
                </td>
                <td className="px-2 py-1 font-mono">
                  {surgeData.top10HoldersPercent?.toFixed(1)}
                </td>
                <td className="px-2 py-1 font-mono">
                  {buySellRatio}({surgeData.transactionCount})({formatNumber(liquidityUSD / surgeData.transactionCount)})
                </td>
                <td className="px-2 py-1">{formatProto(surgeData.tokenAddress)} / {surgeData.protocol}</td>
                <td className="px-2 py-1">
                  {surgeData.dexPaid ? (
                    <span className="text-green-600">是</span>
                  ) : (
                    "否"
                  )}
                </td>
                <td className="px-2 py-1">
                  {buyPrice ? (
                    <span className="text-green-600">
                      是
                      <span className="text-xs">
                        ({formatNumber(buyPrice * surgeData.supply * solPrice)})
                      </span>
                    </span>
                  ) : (
                    "否"
                  )}
                </td>
                <td className="px-2 py-1 font-mono whitespace-nowrap ">
                  <div className="flex space-x-2 items-center">
                    {new Date(surgeData.detectedAt).toLocaleString().slice(5)}
                  </div>
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
