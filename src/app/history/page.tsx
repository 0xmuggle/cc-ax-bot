"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { HistoryLog } from "@/lib/types";
import { Button } from "@/components/ui/button";

const formatTime = (diff: any) => {
  if (typeof diff !== "number") return "-";
  if (diff / 60 > 0) return (diff / 60).toFixed(0) + " 分钟";
  return diff.toFixed(0) + " 秒";
};
const HistoryPage: React.FC = () => {
  const { history, strategies, clearHistory, delHistory } = useStore();
  // 筛选状态
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState<string>("buy-sell");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");

  // 过滤数据
  const filteredHistory = useMemo(() => {
    let date = selectedDate ? new Date(selectedDate).toLocaleString().split(" ")[0] : '';
    return history.filter((log) => {
      const logDate = log.timestamp.split(" ")[0];
      const dateMatch = date ? logDate === date : true;
      const strategyMatch =
        selectedStrategy === "all" || log.strategyName === selectedStrategy;
      const statusMatch = status === "all" || status.includes(log.status);
      return dateMatch && strategyMatch && statusMatch;
    });
  }, [history, selectedDate, selectedStrategy, status]);

  // 计算统计数据
  const stats = useMemo(() => {
    const result = {
      noCount: 0,
      buyCount: 0,
      sellCount: 0,
      buyAmount: 0,
      sellAmount: 0,
      totalProfit: 0,
    };

    filteredHistory.forEach((log: HistoryLog) => {
      if (log.status === "no") result.noCount++;
      else if (log.status === "buy") {
        result.buyCount++;
        result.buyAmount += log.amount;
      } else if (log.status === "sell") {
        result.sellCount++;
        // 查找同一 tokenAddress 的 buy 记录
        const buyLog: any = history.find(
          (h) => h.tokenAddress === log.tokenAddress && h.status === "buy"
        );
        if (buyLog) {
          const sellAmount = log.amount * buyLog.amount;
          result.sellAmount += sellAmount;
          const profit = sellAmount - buyLog.amount;
          result.totalProfit += profit;
        }
      }
    });

    return result;
  }, [filteredHistory, history]);

  // 计算每条记录的金额和盈亏
  const getRowData = (log: HistoryLog) => {
    if (log.status === "no") {
      return { amount: "-", profit: "-", diff: "-" };
    }
    if (log.status === "buy") {
      return { amount: log.amount, profit: "-", diff: "-" };
    }
    // sell
    const buyLog: any = history.find(
      (h) => h.tokenAddress === log.tokenAddress && h.status === "buy"
    );
    const amount = buyLog ? log.amount * buyLog.amount : 0;
    const profit = buyLog ? amount - buyLog.amount : "-";
    const diff = buyLog
      ? (new Date(log.timestamp).getTime() -
          new Date(buyLog.timestamp).getTime()) /
        1000
      : "-";
    return { amount, profit, diff };
  };

  const download = () => {
    try {
    const data = filteredHistory.filter(item => item.status !== "sell").map((raw => ({
      address: raw.tokenAddress,
      symbol: raw.tokenTicker,
      name: raw.tokenTicker,
      trigger_at: Math.floor(new Date(raw.timestamp).getTime() / 1000),
      trigger_mc: raw.marketCapAtTrigger
    })));
    // 转换为 JSON 字符串
    const jsonString = JSON.stringify(data, null, 2);
    
    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'download.json'; // 下载文件名
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('数据导出成功！');
  } catch (error) {
    console.error('导出失败：', error);
  }
  }

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">通知历史</h2>

      {/* 统计信息 */}
      <div className="mb-4 p-3 bg-gray-100 rounded-md">
        <div className="text-sm flex space-x-6">
          <div>
            无操作记录<span className="ml-2 font-bold">{stats.noCount}</span>
          </div>
          <div>
            买入记录
            <span className="ml-2 text-green-500 font-bold">
              {stats.buyCount}
            </span>
          </div>
          <div>
            卖出记录
            <span className="ml-2 text-purple-500 font-bold">
              {stats.sellCount}
            </span>
          </div>
          <div>
            总盈亏
            <span className="ml-2 text-orange-400 font-bold">
              {stats.sellAmount.toFixed(2)} - {stats.buyAmount.toFixed(2)} ={" "}
              {stats.totalProfit.toFixed(2)}SOL
            </span>
          </div>
        </div>
      </div>

      {/* 筛选控件 */}
      <div className="flex justify-between">
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
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-md p-2"
          >
            <option value="all">所有状态</option>
            <option value="buy-sell">买卖</option>
            <option value="no">未买入</option>
          </select>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={clearHistory}>
            清楚历史记录
          </Button>
          <Button variant="outline" onClick={download}>
            下载数据
          </Button>
        </div>
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
              <th className="p-2 text-left">持仓时长</th>
              <th className="p-2 text-left">时间</th>
              <th className="p-2 text-left">日志</th>
              <th className="p-2"></th>
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
              filteredHistory
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )
                .map((log) => {
                  const { amount, profit, diff } = getRowData(log);
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
                        {log.status === "buy" && (
                          <span className="text-green-500">买入</span>
                        )}
                        {log.status === "sell" && (
                          <span className="text-purple-500">卖出</span>
                        )}
                        {log.status === "no" && <span>未买入</span>}
                      </td>
                      <td className="p-2">{amount}</td>
                      <td className="p-2">{profit}</td>
                      <td className="p-2">{formatTime(diff)}</td>
                      <td className="p-2">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2">{log.description}</td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => delHistory(log.id)}
                        >
                          删除
                        </Button>
                      </td>
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
