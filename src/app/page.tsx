'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useExtension } from '@/components/ExtensionProvider';
import TokenTable from '@/components/TokenTable';
import StrategyManager from '@/components/StrategyManager';
import FilterForm from '@/components/FilterForm';
import { SaveStrategyModal } from '@/components/SaveStrategyModal';
import { useFilteredTokens } from '@/hooks/useFilteredTokens';
import { FilterState, Strategy } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { exportToJsonFile } from '@/lib/exportDB';

const Home: React.FC = () => {
  const { solPrice } = useStore();
  const { isAxiomTabOpen } = useExtension();
  const { filteredTokens, highMultiplierCount } = useFilteredTokens();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [strategy, setStrategy] = useState({});
  // const [filtersToSave, setFiltersToSave] = useState<FilterState | null>(null);

  const handleOpenSaveModal = (currentFilters: FilterState) => {
    setStrategy({ filters: currentFilters });
    setIsModalOpen(true);
  };

  const handleEditModal = (value: Strategy) => {
    setStrategy(value);
    setIsModalOpen(true);
  };

  const download = () => {
    exportToJsonFile();
  }

  return (
    <div className="space-y-4">
      {/* Top Info Bar */}
      {/* Top Section: Strategies and Filters */}
      <div className="p-3 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
        <div className="space-y-4">
          <div className='flex justify-between items-center'>
            <div className='flex items-center space-x-8'>
              <h2 className="text-lg font-semibold">Dashboard</h2>
              <div className="font-mono text-sm flex space-x-6">
                <span>
                  总:{' '}
                  <span className="font-bold text-blue-600">
                    {filteredTokens.length}
                  </span>
                  条
                </span>
                <span>
                  高倍:{' '}
                  <span className="font-bold text-yellow-600">
                    {highMultiplierCount}<span className='text-xs'>({(highMultiplierCount / filteredTokens.length).toFixed(2)})</span>
                  </span>
                </span>
                <span>
                  SOL:{' '}
                  <span className="font-bold text-green-600">
                    ${solPrice.toFixed(2)}
                  </span>
                </span>
                <span>
                  最近更新:{' '}
                  <span className="font-bold text-gray-700">
                    {filteredTokens[0]?.surgeData.detectedAt
                      ? new Date(
                          filteredTokens[0].surgeData.detectedAt
                        ).toLocaleString()
                      : 'N/A'}
                  </span>
                </span>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
            <div
              className={`px-5 py-2 text-sm text-white font-bold rounded-lg shadow-md ${
                isAxiomTabOpen ? 'bg-green-500' : 'bg-gray-500' // Use a neutral color when not open, as it's not clickable
              }`}
            >
              {isAxiomTabOpen ? 'Axiom Tab is Open' : 'Axiom Tab Closed'}
            </div>
            <Button style={{ display: 'none' }} variant="destructive" size="sm" onClick={() => useStore.getState().clearTokens()}>清除Tokens</Button>
            <Button style={{ display: 'none' }} variant="destructive" size="sm" onClick={() => useStore.getState().updateData()}>更新数据</Button>
            <Button variant="destructive" size="sm" onClick={() => download()}>下载</Button>
            <Button style={{ display: 'none' }} size="sm" variant="outline" asChild>
              <a href="/test.zip" download>下载插件</a>
            </Button>
            </div>
          </div>
        </div>
      </div>
      <StrategyManager onEditModal={handleEditModal} />
      <FilterForm onSaveStrategy={handleOpenSaveModal} />
      {/* Bottom Section: Token Table */}
      <div className="w-full">
        <TokenTable tokens={filteredTokens} />
      </div>
      {/* Modal for Saving Strategy */}
      <SaveStrategyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        strategy={strategy}
      />
    </div>
  );
};

export default Home;
