'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { formatNumber } from '@/lib/filterUtils';

const HistoryPage: React.FC = () => {
  const history = useStore((state) => state.history);

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Notification History</h2>
      <div className="space-y-4">
        {history.length === 0 ? (
          <p className="text-gray-500">No notifications sent yet.</p>
        ) : (
          history.map((log) => (
            <div key={log.id} className="p-3 border rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-gray-800">{log.tokenTicker}</p>
                <p className="text-xs font-mono text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-600">命中策略: <span className="font-semibold">{log.strategyName}</span></p>
              <p className="text-sm text-gray-600">市值: <span className="font-mono">${formatNumber(log.marketCapAtTrigger)} / ${formatNumber(log.estimateAtTrigger)}</span></p>
              <p className="text-xs text-gray-500 font-mono mt-2">CA: {log.tokenAddress}</p>
              <p className="text-xs text-gray-500 font-mono mt-2">{log.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;