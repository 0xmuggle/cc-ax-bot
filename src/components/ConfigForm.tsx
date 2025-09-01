
// cc-axiom-trader/src/components/ConfigForm.tsx
'use client';

import React from 'react';
import { useStore } from '@/lib/store';

const ConfigForm = () => {
  const bots = useStore(state => state.bots);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4">Saved Bots</h3>
      <div className="mb-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Bot
        </button>
      </div>
      
      {bots.length === 0 ? (
        <p className="text-gray-400">No bot configurations saved yet.</p>
      ) : (
        <div className="space-y-2">
          {/* We will map over bot configs and display them here */}
          <p>Found {bots.length} bot configs. UI coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default ConfigForm;
