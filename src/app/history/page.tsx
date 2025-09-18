"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatNumber } from "@/lib/filterUtils";
import { HistoryLog } from "@/lib/types";

const HistoryPage: React.FC = () => {
  const { history, strategies } = useStore();

  // 筛选状态
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");

  // 过滤数据
  const filteredHistory = useMemo(() => {
    return history.filter((log) => {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      const dateMatch = selectedDate ? logDate === selectedDate : true;
      const strategyMatch =
        selectedStrategy === "all" || log.strategyName === selectedStrategy;
      return dateMatch && strategyMatch;
    });
  }, [history, selectedDate, selectedStrategy]);

  // 计算统计数据
  const stats = useMemo(() => {
    const result = {
      noCount: 0,
      buyCount: 0,
      sellCount: 0,
      totalProfit: 0,
    };

    filteredHistory.forEach((log: HistoryLog) => {
      if (log.status === "no") result.noCount++;
      else if (log.status === "buy") result.buyCount++;
      else if (log.status === "sell") {
        result.sellCount++;
        // 查找同一 tokenAddress 的 buy 记录
        const buyLog: any = history.find((h) => h.tokenAddress === log.tokenAddress && h.status === "buy");
        if (buyLog) {
          const profit = log.amount * buyLog.amount - buyLog.amount;
          result.totalProfit += profit;
        }
      }
    });

    return result;
  }, [filteredHistory, history]);

  // 计算每条记录的金额和盈亏
  const getRowData = (log: HistoryLog) => {
    if (log.status === "no") {
      return { amount: "-", profit: "-" };
    }
    if (log.status === "buy") {
      return { amount: log.amount, profit: "-" };
    }
    // sell
    const buyLog: any = history.find((h) => h.tokenAddress === log.tokenAddress && h.status === "buy");
    const amount = buyLog ? log.amount * buyLog.amount : 0;
    const profit = buyLog ? amount - buyLog.amount : "-";
    return { amount, profit };
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">通知历史</h2>

      {/* 统计信息 */}
      <div className="mb-4 p-3 bg-gray-100 rounded-md">
        <div className="text-sm flex space-x-6">
          <div>无操作记录<span className="ml-2 font-bold">{stats.noCount}</span></div>
          <div>买入记录<span className="ml-2 text-green-500 font-bold">{stats.buyCount}</span></div>
          <div>卖出记录<span className="ml-2 text-purple-500 font-bold">{stats.sellCount}</span></div>
          <div>总盈亏<span className="ml-2 text-orange-400 font-bold">{stats.totalProfit.toFixed(2)}SOL</span></div>
        </div>
      </div>

      {/* 筛选控件 */}
      <div className="flex space-x-4 mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded-md p-2"
        />
        <select
          value={selectedStrategy}
          onChange={(e) => setSelectedStrategy(e.target.value)}
          className="border rounded-md p-2"
        >
          <option value="all">所有策略</option>
          {strategies.map((strategy) => (
            <option key={strategy.id} value={strategy.name}>
              {strategy.name}
            </option>
          ))}
        </select>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">代币</th>
              <th className="p-2 text-left">类型</th>
              <th className="p-2 text-left">数量</th>
              <th className="p-2 text-left">盈亏</th>
              <th className="p-2 text-left">时间</th>
              <th className="p-2 text-left">日志</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-2 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => {
                const { amount, profit } = getRowData(log);
                return (
                  <tr key={log.id} className="border-b">
                    <td className="p-2">
                      <a
                        href={`https://axiom.trade/t/${log.tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {log.tokenTicker}
                      </a>
                    </td>
                    <td className="p-2">
                      {log.status === 'buy' && <span className="text-green-500">买入</span>}
                      {log.status === 'sell' && <span className="text-purple-500">卖出</span>}
                      {log.status === 'no' && <span>未买入</span>}
                    </td>
                    <td className="p-2">{amount}</td>
                    <td className="p-2">{profit}</td>
                    <td className="p-2">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-2">{log.description}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryPage;