'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Strategy } from '@/lib/types';
import { formatFilter, parseRangeInput } from '@/lib/utils';
const StrategyManager: React.FC<{ onEditModal: (strategy: Strategy) => void }> = ({ onEditModal }) => {
  const { strategies, bots, updateStrategy, deleteStrategy, setFilters } = useStore();

  const getBotName = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    return bot ? bot.name : 'N/A';
  };

  const editFilters = (strategy: Strategy) => {
    onEditModal(strategy);
  }

  const handleFilters = (filters: any) => {
    setFilters(formatFilter(filters));
  }

  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">策略列表</h3>
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-3">启用</th>
              <th scope="col" className="px-4 py-3">名称</th>
              <th scope="col" className="px-4 py-3">优先级</th>
              <th scope="col" className="px-4 py-3">金额</th>
              <th scope="col" className="px-4 py-3">Bot名称</th>
              <th scope="col" className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {strategies.length === 0 && (
              <tr>
                <td colSpan={6} className='text-center text-sm text-gray-500 py-4'>No strategies saved yet.</td>
              </tr>
            )}
            {strategies.sort((a, b) => b.priority - a.priority).map(strategy => (
              <tr key={strategy.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Switch 
                    checked={strategy.enabled}
                    onCheckedChange={(enabled) => updateStrategy({ ...strategy, enabled })}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{strategy.name}</td>
                <td className="px-4 py-3">{strategy.priority}</td>
                <td className="px-4 py-3">{strategy.amount}</td>
                <td className="px-4 py-3">{getBotName(strategy.botId)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleFilters(strategy.filters)}>查看</Button>
                    <Button size="sm" variant="destructive" onClick={() => editFilters(strategy)}>编辑</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteStrategy(strategy.id)}>删除</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StrategyManager;
