'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { FilterState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { checkRangeTime } from '@/lib/filterUtils';
import { formatFilter, formatRangeOutput, parseRangeInput } from '@/lib/utils';
import { Switch } from './ui/switch';

interface FilterFormProps {
  onSaveStrategy: (currentFilters: FilterState) => void;
}

const FilterForm: React.FC<FilterFormProps> = ({ onSaveStrategy }) => {
  const { filters, setFilters, resetFilters } = useStore();

  // Local state to manage form inputs before applying to global filters
  const [formState, setFormState] = useState<{
    ticker?: string;
    marketCap: string; // Raw string input for range
    marketCap1M: string;
    marketCap2M: string;
    marketCap3M: string;
    marketCap5M: string;
    marketCap10M: string;
    marketCap15M: string;
    marketCap30M: string;
    highMultiple?: number;
    priceChange?: number;
    singal?: number;
    volumeK: string; // Raw string input for range
    totalTx: string; // Raw string input for range
    platform?: string;
    bundled: string; // Raw string input for range
    social?: string;
    top10?: number;
    devHolding?: number;
    ranges?: string;
    onlyRise: boolean;
  }>({
    ticker: '',
    marketCap: '',
    marketCap1M: '',
    marketCap2M: '',
    marketCap3M: '',
    marketCap5M: '',
    marketCap10M: '',
    marketCap15M: '',
    marketCap30M: '',
    highMultiple: 3,
    priceChange: undefined,
    singal: undefined,
    volumeK: '',
    totalTx: '',
    platform: 'pump',
    bundled: '40',
    social: '',
    top10: 40,
    devHolding: 10,
    ranges: '',
    onlyRise: false,
  });

  // Sync formState with global filters when global filters change (e.g., from strategy load)
  useEffect(() => {
    setFormState(prevFormState => ({
      ...prevFormState,
      ticker: filters.ticker || '',
      highMultiple: filters.highMultiple || 3,
      priceChange: filters.priceChange,
      singal: filters.singal,
      platform: filters.platform || '',
      social: filters.social || '',
      top10: filters.top10 || undefined,
      devHolding: filters.devHolding || undefined,
      ranges: filters.ranges || undefined,
      onlyRise: filters.onlyRise || false,
      // Convert range numbers back to string for local input display
      marketCap: formatRangeOutput(filters.marketCapMin, filters.marketCapMax, 1000),
      marketCap1M: formatRangeOutput(filters.marketCap1MMin, filters.marketCap1MMax, 1000),
      marketCap2M: formatRangeOutput(filters.marketCap2MMin, filters.marketCap2MMax, 1000),
      marketCap3M: formatRangeOutput(filters.marketCap3MMin, filters.marketCap3MMax, 1000),
      marketCap5M: formatRangeOutput(filters.marketCap5MMin, filters.marketCap5MMax, 1000),
      marketCap10M: formatRangeOutput(filters.marketCap10MMin, filters.marketCap10MMax, 1000),
      marketCap15M: formatRangeOutput(filters.marketCap15MMin, filters.marketCap15MMax, 1000),
      marketCap30M: formatRangeOutput(filters.marketCap30MMin, filters.marketCap30MMax, 1000),
      volumeK: formatRangeOutput(filters.volumeKMin, filters.volumeKMax, 1),
      totalTx: formatRangeOutput(filters.totalTxMin, filters.totalTxMax, 1),
      bundled: formatRangeOutput(filters.bundledMin, filters.bundledMax, 1),
    }));
  }, [filters]);

  const handleLocalInputChange = (key: keyof typeof formState, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    const newFilters: FilterState = formatFilter(formState)
    if(formState.ranges && checkRangeTime(formState.ranges) || !formState.ranges) {
      setFilters(newFilters);
    }
  };
  
  const handleReset = () => {
    setFormState({
      ranges: '',
      ticker: '',
      marketCap: '',
      marketCap1M: '',
      marketCap2M: '',
      marketCap3M: '',
      marketCap5M: '',
      marketCap10M: '',
      marketCap15M: '',
      marketCap30M: '',
      highMultiple: 3,
      priceChange: undefined,
      singal: undefined,
      volumeK: '',
      totalTx: '',
      platform: 'pump',
      bundled: '40',
      social: '',
      top10: 40,
      devHolding: 10,
      onlyRise: false,
    });
    resetFilters();
  };

  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 items-start">
        {/* --- Input Fields --- */}
        <InputField label="高倍(仅高亮)" type="number" value={formState.highMultiple || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('highMultiple', Number(e.target.value))} />
        <InputField label="信号重复(次数)" type="number" placeholder="> 1" value={formState.singal || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('singal', Number(e.target.value))} />
        <InputField label="涨幅(倍数)" type="number" placeholder="> 1" value={formState.priceChange || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('priceChange', Number(e.target.value))} />
        <InputField label="Token Ticker" value={formState.ticker || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('ticker', e.target.value)} />
        <InputField label="市值(K)" placeholder="10 or 10,20" value={formState.marketCap} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap', e.target.value)} />
        <InputField label="市值(1M)" placeholder="10 or 10,20" value={formState.marketCap1M} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap1M', e.target.value)} />
        <InputField label="市值(2M)" placeholder="10 or 10,20" value={formState.marketCap2M} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap2M', e.target.value)} />
        <InputField label="市值(3M)" placeholder="10 or 10,20" value={formState.marketCap3M} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap3M', e.target.value)} />
        <InputField label="市值(5M)" placeholder="10 or 10,20" value={formState.marketCap5M} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap5M', e.target.value)} />
        <InputField className='hidden' label="市值(10M)" placeholder="10 or 10,20" value={formState.marketCap10M} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap10M', e.target.value)} />
        <InputField className='hidden' label="市值(15M)" placeholder="10 or 10,20" value={formState.marketCap15M} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap15M', e.target.value)} />
        <InputField className='hidden' label="市值(30M)" placeholder="10 or 10,20" value={formState.marketCap30M} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap30M', e.target.value)} />
        <InputField label="交易量(K)" placeholder="10 or 10,20" value={formState.volumeK} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('volumeK', e.target.value)} />
        <InputField label="交易总数" placeholder="10 or 10,20" value={formState.totalTx} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('totalTx', e.target.value)} />
        <InputField label="平台" placeholder="pump,bonk" value={formState.platform || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('platform', e.target.value)} />
        <InputField label="捆绑" placeholder="1 or 1,10" value={formState.bundled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('bundled', e.target.value)} />
        <InputField label="Dev" type="number" placeholder="10" value={formState.devHolding || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('devHolding', Number(e.target.value))} />
        <InputField label="Top10" type="number" placeholder="10" value={formState.top10 || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('top10', Number(e.target.value))} />
        <InputField label="社交" placeholder="twitter,telegram" value={formState.social || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('social', e.target.value)} />
        <InputField label="时间范围" placeholder="00:30-14:00,14:30-15:00" value={formState.ranges || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('ranges', e.target.value)} />
        <div>
          <label className="block text-xs font-medium text-gray-800 mb-1">追涨</label>
          <div className='mt-1 block w-full px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm text-sm'>
            <Switch 
              checked={formState.onlyRise}
              onCheckedChange={(enabled) => handleLocalInputChange('onlyRise', enabled)}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2 mt-4">
          <Button size="sm" variant="outline" onClick={handleSearch}>查询</Button>
          <Button size="sm" variant="destructive" onClick={handleReset}>重置</Button>
          <Button size="sm" onClick={() => onSaveStrategy(formState)}>保存策略</Button>
      </div>
    </div>
  );
};

// Helper component for consistent input fields
const InputField: React.FC<{ label: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, className, ...props }) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-800 mb-1">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" />
  </div>
);

export default FilterForm;