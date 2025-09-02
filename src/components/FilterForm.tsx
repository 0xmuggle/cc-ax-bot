'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { FilterState } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface FilterFormProps {
  onSaveStrategy: (currentFilters: FilterState) => void;
}

// Helper to parse range inputs like "10" (min only) or "10,20" (min,max)
export const parseRangeInput = (value: string, multiplier: number = 1): [number | undefined, number | undefined] => {
  if (!value) return [undefined, undefined];
  const parts = value.split(',').map(p => p.trim());
  if (parts.length === 1 && parts[0]) {
    const num = parseFloat(parts[0]);
    return [undefined, num * multiplier]; // Only min value provided
  }
  if (parts.length === 2) {
    const min = parts[0] ? parseFloat(parts[0]) * multiplier : undefined;
    const max = parts[1] ? parseFloat(parts[1]) * multiplier : undefined;
    return [min, max];
  }
  return [undefined, undefined];
};

// Helper to format range values back to string for display
export const formatRangeOutput = (min: number | undefined, max: number | undefined, divisor: number = 1): string => {
  if (min === undefined && max === undefined) return '';
  if (min !== undefined && max === undefined) return `${min / divisor},`;
  if (min === undefined && max !== undefined) return `${max / divisor}`;
  return `${min !== undefined ? min / divisor : ''},${max !== undefined ? max / divisor : ''}`;
};

const FilterForm: React.FC<FilterFormProps> = ({ onSaveStrategy }) => {
  const { filters, setFilters, resetFilters } = useStore();

  // Local state to manage form inputs before applying to global filters
  const [formState, setFormState] = useState<{
    ticker?: string;
    marketCap: string; // Raw string input for range
    highMultiple?: number;
    priceChange?: number;
    volumeK: string; // Raw string input for range
    totalTx: string; // Raw string input for range
    platform?: string;
    bundled: string; // Raw string input for range
    social?: string;
    useHistoricalData?: boolean;
  }>({
    ticker: '',
    marketCap: '',
    highMultiple: 3,
    priceChange: undefined,
    volumeK: '',
    totalTx: '',
    platform: '',
    bundled: '',
    social: '',
    useHistoricalData: false,
  });

  // Sync formState with global filters when global filters change (e.g., from strategy load)
  useEffect(() => {
    setFormState(prevFormState => ({
      ...prevFormState,
      ticker: filters.ticker || '',
      highMultiple: filters.highMultiple || 3,
      priceChange: filters.priceChange,
      platform: filters.platform || '',
      social: filters.social || '',
      useHistoricalData: filters.useHistoricalData || false,
      // Convert range numbers back to string for local input display
      marketCap: formatRangeOutput(filters.marketCapMin, filters.marketCapMax, 1000),
      volumeK: formatRangeOutput(filters.volumeKMin, filters.volumeKMax, 1),
      totalTx: formatRangeOutput(filters.totalTxMin, filters.totalTxMax, 1),
      bundled: formatRangeOutput(filters.bundledMin, filters.bundledMax, 1),
    }));
  }, [filters]);

  const handleLocalInputChange = (key: keyof typeof formState, value: any) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    const newFilters: FilterState = {
      ticker: formState.ticker || undefined,
      highMultiple: formState.highMultiple || 3,
      priceChange: formState.priceChange || undefined,
      platform: formState.platform || undefined,
      social: formState.social || undefined,
      useHistoricalData: formState.useHistoricalData || false,
      
      // Parse range inputs from string to numbers
      marketCapMin: parseRangeInput(formState.marketCap, 1000)[0],
      marketCapMax: parseRangeInput(formState.marketCap, 1000)[1],
      volumeKMin: parseRangeInput(formState.volumeK, 1)[0],
      volumeKMax: parseRangeInput(formState.volumeK, 1)[1],
      totalTxMin: parseRangeInput(formState.totalTx, 1)[0],
      totalTxMax: parseRangeInput(formState.totalTx, 1)[1],
      bundledMin: parseRangeInput(formState.bundled, 1)[0],
      bundledMax: parseRangeInput(formState.bundled, 1)[1],
    };
    setFilters(newFilters);
  };
  
  const handleReset = () => {
    setFormState({
      ticker: '',
      marketCap: '',
      highMultiple: 3,
      priceChange: undefined,
      volumeK: '',
      totalTx: '',
      platform: '',
      bundled: '',
      social: '',
      useHistoricalData: false,
    });
    resetFilters();
  };

  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-start">
        {/* --- Input Fields --- */}
        <InputField label="Token Ticker" value={formState.ticker || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('ticker', e.target.value)} />
        <InputField label="市值(K)" placeholder="10 or 10,20" value={formState.marketCap} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('marketCap', e.target.value)} />
        <InputField label="高倍(仅高亮)" type="number" value={formState.highMultiple || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('highMultiple', Number(e.target.value))} />
        <InputField label="涨幅(倍数)" type="number" placeholder="> 1" value={formState.priceChange || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('priceChange', Number(e.target.value))} />
        <InputField label="交易量(K)" placeholder="10 or 10,20" value={formState.volumeK} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('volumeK', e.target.value)} />
        <InputField label="交易总数" placeholder="10 or 10,20" value={formState.totalTx} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('totalTx', e.target.value)} />
        <InputField label="平台" placeholder="pump,bonk" value={formState.platform || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('platform', e.target.value)} />
        <InputField label="捆绑" placeholder="1 or 1,10" value={formState.bundled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('bundled', e.target.value)} />
        <InputField label="社交" placeholder="twitter,telegram" value={formState.social || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalInputChange('social', e.target.value)} />

        <div className="flex items-center space-x-2 pt-6">
          <Switch id="historical-data" checked={formState.useHistoricalData} onCheckedChange={checked => handleLocalInputChange('useHistoricalData', checked)} />
          <label htmlFor="historical-data" className="text-sm font-medium whitespace-pre">使用历史数据</label>
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
const InputField: React.FC<{ label: string } & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-800 mb-1">{label}</label>
    <input {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" />
  </div>
);

export default FilterForm;