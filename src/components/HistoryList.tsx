
// cc-axiom-trader/src/components/HistoryList.tsx
'use client';

import React from 'react';
import { useStore } from '@/lib/store';

const HistoryList = () => {
  const history = useStore(state => state.history);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4">History Logs</h3>
      
      {history.length === 0 ? (
        <p className="text-gray-400">No notification history yet.</p>
      ) : (
        <div className="space-y-2">
          {/* We will map over history logs and display them here */}
          <p>Found {history.length} log entries. UI coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
