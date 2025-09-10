"use client";

import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { HistoryLog } from "@/lib/types";
import { Button } from "@/components/ui/button";

const formatTime = (diff: any) => {
  if (typeof diff !== "number") return "-";
  if (diff / 60 >= 1) return (diff / 60).toFixed(0) + " 分钟";
  return diff.toFixed(0) + " 秒";
};

const HistoryPage: React.FC = () => {
  const { history, strategies, clearHistory, delHistory } = useStore();
  // 筛选状态
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<string>("buy-sell");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("all");

  // 合并买入和卖出记录
  const filteredHistory = useMemo(() => {
    let date = selectedDate ? new Date(selectedDate).toLocaleString().split(" ")[0] : "";
    // 创建一个对象来按 to  kenAddress 合并记录
    const groupedByToken: { [key: string]: { buy?: HistoryLog; sell?: HistoryLog } } = {};

    history.forEach((log) => {
      const logDate = log.timestamp.split(" ")[0];
      const dateMatch = date ? logDate === date : true;
      const strategyMatch = selectedStrategy === "all" || log.strategyName === selectedStrategy;
      const statusMatch = status === "all" || status.includes(log.status);

      if (dateMatch && strategyMatch && statusMatch) {
        if (!groupedByToken[log.tokenAddress]) {
          groupedByToken[log.tokenAddress] = {};
        }
        if (log.status === "buy") {
          groupedByToken[log.tokenAddress].buy = log;
        } else if (log.status === "sell") {
          groupedByToken[log.tokenAddress].sell = log;
        } else if (log.status === "no") {
          groupedByToken[log.tokenAddress] = { buy: log };
        }
      }
    });

    // 转换为数组格式，优先显示有卖出的记录
    const combinedLogs: (HistoryLog | { buy: HistoryLog; sell?: HistoryLog })[] = [];
    Object.entries(groupedByToken).forEach(([_, logs]) => {
      if (logs.sell && logs.buy) {
        combinedLogs.push({ buy: logs.buy, sell: logs.sell });
      } else if (logs.buy) {
        combinedLogs.push(logs.buy);
      }
    });

    return combinedLogs;
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

    filteredHistory.forEach((log) => {
      if ("buy" in log && !log.sell && log.buy.status === "no") {
        result.noCount++;
      } else if ("buy" in log) {
        if (log.buy.status === "buy") {
          result.buyCount++;
          result.buyAmount += log.buy.amount;
        }
        if (log.sell) {
          result.sellCount++;
          const sellAmount = log.sell.amount * log.buy.amount;
          result.sellAmount += sellAmount;
          const profit = sellAmount - log.buy.amount;
          result.totalProfit += profit;
        }
      } else if (log.status === "no") {
        result.noCount++;
      } else if (log.status === "buy") {
        result.buyCount++;
        result.buyAmount += log.amount;
      }
    });

    return result;
  }, [filteredHistory]);

  // 计算每条记录的金额和盈亏
  const getRowData = (log: HistoryLog | { buy: HistoryLog; sell?: HistoryLog }) => {
    if ("buy" in log) {
      if (log.buy.status === "no") {
        return { amount: "-", profit: "-", diff: "-", description: log.buy.description };
      }
      if (log.sell) {
        const amount = log.sell.amount * log.buy.amount;
        const profit = amount - log.buy.amount;
        const diff =
          (new Date(log.sell.timestamp).getTime() -
            new Date(log.buy.timestamp).getTime()) /
          1000;
        const description = `${log.sell.description}<br />${log.buy.description}`.replace("止盈", "<span class='text-green-600 font-bold'>止盈</span>").replace("止损", "<span class='text-red-500 font-bold'>止损</span>");
        return { amount: amount.toFixed(2), profit: profit.toFixed(2), diff, description };
      }
      return { amount: log.buy.amount, profit: "-", diff: "-", description: log.buy.description };
    }
    if (log.status === "no") {
      return { amount: "-", profit: "-", diff: "-", description: log.description };
    }
    return { amount: log.amount, profit: "-", diff: "-", description: log.description };
  };

  const download = () => {
    try {
      const data = filteredHistory.map((log) => {
        if ("buy" in log) {
          return {
            address: log.buy.tokenAddress,
            symbol: log.buy.tokenTicker,
            name: log.buy.tokenTicker,
            trigger_at: Math.floor(new Date(log.buy.timestamp).getTime() / 1000),
            trigger_mc: log.buy.marketCapAtTrigger,
            status: "buy",
          };
        }
        return {
          address: log.tokenAddress,
          symbol: log.tokenTicker,
          name: log.tokenTicker,
          trigger_at: Math.floor(new Date(log.timestamp).getTime() / 1000),
          trigger_mc: log.marketCapAtTrigger,
          status: log.status,
        };
      });
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "download.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("数据导出成功！");
    } catch (error) {
      console.error("导出失败：", error);
    }
  };

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
            <span className="ml-2 text-green-500 font-bold">{stats.buyCount}</span>
          </div>
          <div>
            卖出记录
            <span className="ml-2 text-purple-500 font-bold">{stats.sellCount}</span>
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
            清除历史记录
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
                <td colSpan={8} className="p-2 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredHistory
                .sort((a, b) => {
                  const aTime = "buy" in a ? a.buy.timestamp : a.timestamp;
                  const bTime = "buy" in b ? b.buy.timestamp : b.timestamp;
                  return (
                    new Date(bTime).getTime() - new Date(aTime).getTime()
                  );
                })
                .map((log: any, index) => {
                  const { amount, profit, diff, description } = getRowData(log);
                  const mainLog = "buy" in log ? log.buy : log;
                  return (
                    <tr key={mainLog.id || index} className="border-b">
                      <td className="p-2">
                        <a
                          href={`https://axiom.trade/t/${mainLog.tokenAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {mainLog.tokenTicker}
                        </a>
                      </td>
                      <td className="p-2">
                        {"buy" in log && log.sell ? (
                          <span className="text-blue-500">买入+卖出</span>
                        ) : mainLog.status === "buy" ? (
                          <span className="text-green-500">买入</span>
                        ) : (
                          <span>未买入</span>
                        )}
                      </td>
                      <td className="p-2">{amount}{log.buy?.amount ? ` - ${log.buy?.amount} = ` : ''}</td>
                      <td className="p-2">{profit}</td>
                      <td className="p-2">{formatTime(diff)}</td>
                      <td className="p-2">
                        {new Date(mainLog.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2" dangerouslySetInnerHTML={{__html: description}}></td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            delHistory(mainLog.id);
                            if ("buy" in log && log.sell) {
                              delHistory(log.sell.id);
                            }
                          }}
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